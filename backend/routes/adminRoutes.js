import express from 'express';
import db from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Apply super-admin authorization to all routes in this file
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

/**
 * GET /api/admin/dashboard
 * Super Admin Master Analytics Dashboard
 */
router.get('/dashboard', (req, res) => {
  try {
    const totalRevenue = db.prepare(`SELECT SUM(final_amount) as total FROM orders WHERE order_status = 'delivered'`).get().total || 0;
    const totalOrders = db.prepare('SELECT COUNT(id) as total FROM orders').get().total;
    const totalCustomers = db.prepare(`SELECT COUNT(id) as total FROM users WHERE role = 'customer'`).get().total;
    const totalSellers = db.prepare('SELECT COUNT(id) as total FROM sellers').get().total;
    const totalDeliveryPartners = db.prepare('SELECT COUNT(id) as total FROM delivery_partners').get().total;
    const totalProducts = db.prepare('SELECT COUNT(id) as total FROM products').get().total;

    // Platform Commission Earned (Calculated across delivered orders)
    const commissionStats = db.prepare(`
      SELECT SUM((o.total_amount * s.commission_rate) / 100.0) as platform_commission
      FROM orders o
      JOIN sellers s ON o.seller_id = s.id
      WHERE o.order_status = 'delivered'
    `).get().platform_commission || 0;

    // Orders status distribution
    const orderStatusCounts = db.prepare(`
      SELECT order_status, COUNT(id) as count
      FROM orders
      GROUP BY order_status
    `).all();

    // Recent platform orders
    const recentOrders = db.prepare(`
      SELECT o.*, u.name as customer_name, s.store_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN sellers s ON o.seller_id = s.id
      ORDER BY o.id DESC
      LIMIT 8
    `).all();

    res.json({
      success: true,
      stats: {
        totalRevenue: Math.round(totalRevenue),
        platformCommission: Math.round(commissionStats),
        totalOrders,
        totalCustomers,
        totalSellers,
        totalDeliveryPartners,
        totalProducts
      },
      orderStatusCounts,
      recentOrders: recentOrders.map(o => ({
        ...o,
        delivery_address: JSON.parse(o.delivery_address || '{}'),
        items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id)
      }))
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
});

/**
 * GET /api/admin/sellers
 * List all sellers with status and sales performance
 */
router.get('/sellers', (req, res) => {
  try {
    const sellers = db.prepare(`
      SELECT s.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
             COUNT(p.id) as product_count
      FROM sellers s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN products p ON s.id = p.seller_id
      GROUP BY s.id
      ORDER BY s.id DESC
    `).all();

    res.json({ success: true, sellers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sellers.' });
  }
});

/**
 * POST /api/admin/sellers/:id/status
 * Approve, Reject, or Suspend a seller
 */
router.post('/sellers/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved', 'pending', 'suspended'

    db.prepare('UPDATE sellers SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true, message: `Seller status updated to "${status}".` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update seller status.' });
  }
});

/**
 * POST /api/admin/sellers/:id/commission
 * Update seller platform commission percentage
 */
router.post('/sellers/:id/commission', (req, res) => {
  try {
    const { id } = req.params;
    const { commissionRate } = req.body;

    if (commissionRate === undefined || isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      return res.status(400).json({ success: false, message: 'Commission rate must be between 0% and 100%.' });
    }

    db.prepare('UPDATE sellers SET commission_rate = ? WHERE id = ?').run(Number(commissionRate), id);
    res.json({ success: true, message: `Seller commission set to ${commissionRate}%!` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update commission rate.' });
  }
});

/**
 * GET /api/admin/delivery-partners
 * List all delivery riders
 */
router.get('/delivery-partners', (req, res) => {
  try {
    const partners = db.prepare(`
      SELECT dp.*, u.name, u.email, u.phone, u.avatar
      FROM delivery_partners dp
      JOIN users u ON dp.user_id = u.id
      ORDER BY dp.id DESC
    `).all();

    res.json({ success: true, partners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch delivery partners.' });
  }
});

/**
 * GET /api/admin/pincodes
 * List delivery zones & pincodes
 */
router.get('/pincodes', (req, res) => {
  try {
    const pincodes = db.prepare('SELECT * FROM pincodes ORDER BY id DESC').all();
    res.json({ success: true, pincodes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pincodes.' });
  }
});

/**
 * POST /api/admin/pincodes
 * Add new delivery pincode zone
 */
router.post('/pincodes', (req, res) => {
  try {
    const { pincode, city, state = 'West Bengal', deliveryFee = 30.0, freeDeliveryAbove = 399.0, estimatedTimeMins = 35 } = req.body;

    if (!pincode || !city) {
      return res.status(400).json({ success: false, message: 'Pincode and City name are required.' });
    }

    const insert = db.prepare(`
      INSERT INTO pincodes (pincode, city, state, delivery_fee, min_order_free_delivery, is_serviceable, estimated_time_mins)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run(pincode, city, state, Number(deliveryFee), Number(freeDeliveryAbove), Number(estimatedTimeMins));

    res.status(201).json({ success: true, message: `Pincode ${pincode} (${city}) added successfully!`, pincodeId: insert.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add pincode.', error: error.message });
  }
});

/**
 * DELETE /api/admin/pincodes/:id
 * Remove delivery pincode
 */
router.delete('/pincodes/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM pincodes WHERE id = ?').run(id);
    res.json({ success: true, message: 'Pincode deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete pincode.' });
  }
});

/**
 * GET /api/admin/coupons
 * List all coupons
 */
router.get('/coupons', (req, res) => {
  try {
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY id DESC').all();
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch coupons.' });
  }
});

/**
 * POST /api/admin/coupons
 * Create new promo coupon
 */
router.post('/coupons', (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderValue, maxDiscount } = req.body;

    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ success: false, message: 'Code, discount type, and discount value are required.' });
    }

    db.prepare(`
      INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, max_discount, is_active, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?, 1, '2027-12-31')
    `).run(code.toUpperCase().trim(), description || '', discountType, Number(discountValue), Number(minOrderValue || 0), Number(maxDiscount || 500));

    res.status(201).json({ success: true, message: `Coupon ${code.toUpperCase()} created successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create coupon.', error: error.message });
  }
});

export default router;
