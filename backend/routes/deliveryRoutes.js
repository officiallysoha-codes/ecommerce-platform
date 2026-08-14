import express from 'express';
import db from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

function getDeliveryPartner(userId) {
  return db.prepare('SELECT * FROM delivery_partners WHERE user_id = ?').get(userId);
}

/**
 * GET /api/delivery/dashboard
 * Delivery partner metrics, earnings, and assigned tasks
 */
router.get('/dashboard', authenticateToken, authorizeRoles('delivery', 'admin'), (req, res) => {
  try {
    const partner = getDeliveryPartner(req.user.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Delivery partner profile not found.' });

    // Active deliveries
    const activeOrders = db.prepare(`
      SELECT o.*, s.store_name, s.business_address as store_address, s.pickup_pincode as store_pincode,
             u.name as customer_name, u.phone as customer_phone
      FROM orders o
      JOIN sellers s ON o.seller_id = s.id
      JOIN users u ON o.user_id = u.id
      WHERE o.delivery_partner_id = ? AND o.order_status IN ('confirmed', 'packed', 'out_for_delivery')
      ORDER BY o.id DESC
    `).all(partner.id);

    // Available unassigned orders in the partner's pincode
    const availableOrders = db.prepare(`
      SELECT o.*, s.store_name, s.business_address as store_address,
             u.name as customer_name, u.phone as customer_phone
      FROM orders o
      JOIN sellers s ON o.seller_id = s.id
      JOIN users u ON o.user_id = u.id
      WHERE (o.delivery_partner_id IS NULL OR o.delivery_partner_id = 0)
        AND o.order_status IN ('confirmed', 'packed')
      ORDER BY o.id DESC
      LIMIT 10
    `).all();

    const formattedActive = activeOrders.map(o => ({
      ...o,
      delivery_address: JSON.parse(o.delivery_address || '{}'),
      items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id)
    }));

    const formattedAvailable = availableOrders.map(o => ({
      ...o,
      delivery_address: JSON.parse(o.delivery_address || '{}'),
      items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id)
    }));

    res.json({
      success: true,
      partner,
      stats: {
        isOnline: Boolean(partner.is_online),
        totalDeliveries: partner.total_deliveries,
        todayEarnings: partner.today_earnings,
        walletBalance: partner.wallet_balance,
        activeOrdersCount: formattedActive.length,
        availableOrdersCount: formattedAvailable.length
      },
      activeOrders: formattedActive,
      availableOrders: formattedAvailable
    });
  } catch (error) {
    console.error('Delivery dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch delivery dashboard.' });
  }
});

/**
 * POST /api/delivery/toggle-status
 * Toggle online / offline status
 */
router.post('/toggle-status', authenticateToken, authorizeRoles('delivery', 'admin'), (req, res) => {
  try {
    const partner = getDeliveryPartner(req.user.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found.' });

    const newStatus = partner.is_online ? 0 : 1;
    db.prepare('UPDATE delivery_partners SET is_online = ? WHERE id = ?').run(newStatus, partner.id);

    res.json({
      success: true,
      isOnline: Boolean(newStatus),
      message: newStatus ? '🟢 You are now ONLINE & ready to receive delivery jobs!' : '⚪ You are now OFFLINE.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Status toggle failed.' });
  }
});

/**
 * POST /api/delivery/orders/:id/pickup
 * Delivery partner confirms pickup from store -> marks 'out_for_delivery'
 */
router.post('/orders/:id/pickup', authenticateToken, authorizeRoles('delivery', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const partner = getDeliveryPartner(req.user.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found.' });

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const timeline = JSON.parse(order.tracking_timeline || '[]');
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    timeline.push({
      status: 'out_for_delivery',
      title: 'Out for Delivery',
      time: nowTime,
      description: `Package picked up by ${req.user.name} (${partner.vehicle_type} ${partner.vehicle_number || ''}). En route to your address.`
    });

    db.prepare(`
      UPDATE orders
      SET order_status = 'out_for_delivery', delivery_partner_id = ?, tracking_timeline = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(partner.id, JSON.stringify(timeline), order.id);

    res.json({ success: true, message: '🚀 Order marked Out for Delivery! Live navigation started.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Pickup update failed.' });
  }
});

/**
 * POST /api/delivery/orders/:id/complete
 * Verify customer OTP and mark order as delivered + credit rider payout
 */
router.post('/orders/:id/complete', authenticateToken, authorizeRoles('delivery', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    const partner = getDeliveryPartner(req.user.id);
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found.' });

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Validate 4-digit OTP provided by customer
    if (!otp || otp.toString().trim() !== order.delivery_otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: '❌ Invalid Delivery OTP. Please ask the customer for the 4-digit code shown in their GreenZet app.'
      });
    }

    const timeline = JSON.parse(order.tracking_timeline || '[]');
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    timeline.push({
      status: 'delivered',
      title: 'Order Delivered Successfully',
      time: nowTime,
      description: `Delivered safely to customer. Verified via OTP ${order.delivery_otp}.`
    });

    // Update order status to delivered & paid (if COD)
    db.prepare(`
      UPDATE orders
      SET order_status = 'delivered', payment_status = 'paid', tracking_timeline = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(timeline), order.id);

    // Credit delivery partner fee (₹40 per delivery)
    const riderCommission = 40.0;
    db.prepare(`
      UPDATE delivery_partners
      SET total_deliveries = total_deliveries + 1,
          today_earnings = today_earnings + ?,
          wallet_balance = wallet_balance + ?
      WHERE id = ?
    `).run(riderCommission, riderCommission, partner.id);

    // Credit seller sales after platform commission
    const seller = db.prepare('SELECT * FROM sellers WHERE id = ?').get(order.seller_id);
    if (seller) {
      const platformFee = (order.total_amount * (seller.commission_rate || 8.0)) / 100;
      const sellerEarning = Math.max(0, order.total_amount - platformFee);
      db.prepare(`
        UPDATE sellers
        SET wallet_balance = wallet_balance + ?,
            total_sales = total_sales + ?
        WHERE id = ?
      `).run(sellerEarning, order.total_amount, seller.id);
    }

    res.json({
      success: true,
      message: `🎉 Delivery completed successfully! ₹${riderCommission} credited to your rider wallet.`
    });
  } catch (error) {
    console.error('Complete delivery error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete delivery.', error: error.message });
  }
});

export default router;
