import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/pincodes/check/:pincode
 * Check if the customer's delivery pincode is serviceable
 */
router.get('/pincodes/check/:pincode', (req, res) => {
  try {
    const { pincode } = req.params;
    const zone = db.prepare('SELECT * FROM pincodes WHERE pincode = ?').get(pincode);

    if (!zone || !zone.is_serviceable) {
      return res.json({
        success: false,
        serviceable: false,
        message: `Currently not serviceable for pincode ${pincode}. We are expanding soon!`
      });
    }

    res.json({
      success: true,
      serviceable: true,
      city: zone.city,
      state: zone.state,
      deliveryFee: zone.delivery_fee,
      freeDeliveryAbove: zone.min_order_free_delivery,
      estimatedTimeMins: zone.estimated_time_mins,
      message: `⚡ Express 30-45 min delivery available in ${zone.city}!`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Pincode lookup failed.' });
  }
});

/**
 * POST /api/coupons/validate
 * Validate coupon code and return discount amount
 */
router.post('/coupons/validate', (req, res) => {
  try {
    const { code, subtotal = 0 } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const coupon = db.prepare('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(code.trim());

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    if (subtotal < coupon.min_order_value) {
      return res.status(400).json({
        success: false,
        message: `Cart total must be at least ₹${coupon.min_order_value} to use coupon ${coupon.code}.`
      });
    }

    let discount = 0;
    if (coupon.discount_type === 'percent') {
      discount = (subtotal * coupon.discount_value) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = Math.min(coupon.discount_value, subtotal);
    }

    res.json({
      success: true,
      code: coupon.code,
      discount: Math.round(discount),
      description: coupon.description,
      message: `Coupon ${coupon.code} applied successfully! You saved ₹${Math.round(discount)}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Coupon validation failed.' });
  }
});

/**
 * POST /api/orders
 * Create new customer order with multi-item checkout, delivery fee calculation, and OTP generation
 */
router.post('/orders', authenticateToken, (req, res) => {
  try {
    const {
      items,
      deliveryAddress,
      deliveryPincode,
      deliveryTimeSlot = 'Express (30-45 mins)',
      paymentMethod = 'cod', // 'cod', 'upi', 'card', 'wallet'
      couponCode
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    if (!deliveryAddress || !deliveryPincode) {
      return res.status(400).json({ success: false, message: 'Delivery address and pincode are required.' });
    }

    // Check pincode serviceability
    const zone = db.prepare('SELECT * FROM pincodes WHERE pincode = ?').get(deliveryPincode);
    const deliveryFeeStandard = zone ? zone.delivery_fee : 30.0;
    const freeDeliveryThreshold = zone ? zone.min_order_free_delivery : 399.0;

    // Calculate subtotal & verify stock
    let subtotal = 0;
    const verifiedItems = [];
    let defaultSellerId = 1;

    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found for item ${item.productId}` });
      }

      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.title}". Only ${product.stock_quantity} remaining.`
        });
      }

      defaultSellerId = product.seller_id;
      const unitPrice = item.price || product.price;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      verifiedItems.push({
        productId: product.id,
        title: product.title,
        image: product.image,
        unit: item.unit || product.unit,
        unitPrice,
        quantity: item.quantity,
        totalPrice: lineTotal,
        sellerId: product.seller_id
      });
    }

    // Calculate coupon discount
    let discountAmount = 0;
    if (couponCode) {
      const coupon = db.prepare('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(couponCode.trim());
      if (coupon && subtotal >= coupon.min_order_value) {
        if (coupon.discount_type === 'percent') {
          discountAmount = (subtotal * coupon.discount_value) / 100;
          if (coupon.max_discount && discountAmount > coupon.max_discount) {
            discountAmount = coupon.max_discount;
          }
        } else {
          discountAmount = Math.min(coupon.discount_value, subtotal);
        }
      }
    }

    const deliveryFee = (subtotal - discountAmount) >= freeDeliveryThreshold ? 0.0 : deliveryFeeStandard;
    const finalAmount = Math.max(0, subtotal - discountAmount + deliveryFee);

    // If wallet payment, check wallet balance
    if (paymentMethod === 'wallet') {
      if (req.user.wallet_balance < finalAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. You have ₹${req.user.wallet_balance.toFixed(2)}, need ₹${finalAmount.toFixed(2)}.`
        });
      }
      // Deduct wallet
      db.prepare('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?').run(finalAmount, req.user.id);
    }

    // Auto assign active delivery partner in the zone
    const deliveryPartner = db.prepare(`
      SELECT id FROM delivery_partners
      WHERE assigned_pincode = ? AND is_online = 1 AND status = 'approved'
      LIMIT 1
    `).get(deliveryPincode) || db.prepare(`
      SELECT id FROM delivery_partners WHERE is_online = 1 AND status = 'approved' LIMIT 1
    `).get();

    const deliveryPartnerId = deliveryPartner ? deliveryPartner.id : null;

    // Generate Order Number and 4-Digit OTP
    const orderNumber = `GZ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Initial timeline
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const timeline = [
      {
        status: 'placed',
        title: 'Order Placed',
        time: nowTime,
        description: `Order received successfully. Payment mode: ${paymentMethod.toUpperCase()}.`
      }
    ];

    const paymentStatus = paymentMethod === 'cod' ? 'pending' : 'paid';

    // Insert Order Transactionally
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        order_number, user_id, seller_id, delivery_partner_id, total_amount, discount_amount,
        delivery_fee, final_amount, payment_method, payment_status, order_status,
        delivery_address, delivery_pincode, delivery_time_slot, delivery_otp, tracking_timeline
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'placed', ?, ?, ?, ?, ?)
    `);

    const orderResult = insertOrder.run(
      orderNumber,
      req.user.id,
      defaultSellerId,
      deliveryPartnerId,
      subtotal,
      discountAmount,
      deliveryFee,
      finalAmount,
      paymentMethod,
      paymentStatus,
      JSON.stringify(deliveryAddress),
      deliveryPincode,
      deliveryTimeSlot,
      deliveryOtp,
      JSON.stringify(timeline)
    );

    const orderId = orderResult.lastInsertRowid;

    // Insert Order Items and decrement inventory
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_title, product_image, unit, unit_price, quantity, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updateStock = db.prepare(`
      UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?
    `);

    for (const item of verifiedItems) {
      insertItem.run(orderId, item.productId, item.title, item.image, item.unit, item.unitPrice, item.quantity, item.totalPrice);
      updateStock.run(item.quantity, item.productId);
    }

    res.status(201).json({
      success: true,
      message: '🎉 Order placed successfully!',
      orderNumber,
      orderId,
      finalAmount,
      deliveryOtp,
      estimatedDelivery: '30-45 minutes'
    });
  } catch (error) {
    console.error('Order placement error:', error);
    res.status(500).json({ success: false, message: 'Failed to place order.', error: error.message });
  }
});

/**
 * GET /api/orders/my-orders
 * Fetch all orders for current logged-in customer
 */
router.get('/orders/my-orders', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, s.store_name
      FROM orders o
      JOIN sellers s ON o.seller_id = s.id
      WHERE o.user_id = ?
      ORDER BY o.id DESC
    `).all(req.user.id);

    const fullOrders = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return {
        ...order,
        delivery_address: JSON.parse(order.delivery_address || '{}'),
        tracking_timeline: JSON.parse(order.tracking_timeline || '[]'),
        items
      };
    });

    res.json({ success: true, orders: fullOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

/**
 * GET /api/orders/track/:orderNumber
 * Fetch live order tracking details & timeline by Order Number
 */
router.get('/orders/track/:orderNumber', (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = db.prepare(`
      SELECT o.*, s.store_name, s.pickup_pincode as store_pincode,
             dp.vehicle_type, dp.vehicle_number, u.name as delivery_partner_name, u.phone as delivery_partner_phone
      FROM orders o
      JOIN sellers s ON o.seller_id = s.id
      LEFT JOIN delivery_partners dp ON o.delivery_partner_id = dp.id
      LEFT JOIN users u ON dp.user_id = u.id
      WHERE o.order_number = ?
    `).get(orderNumber);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    res.json({
      success: true,
      order: {
        ...order,
        delivery_address: JSON.parse(order.delivery_address || '{}'),
        tracking_timeline: JSON.parse(order.tracking_timeline || '[]'),
        items
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Tracking error.', error: error.message });
  }
});

/**
 * POST /api/orders/:id/cancel
 * Cancel order if not yet shipped
 */
router.post('/orders/:id/cancel', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by customer' } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (['out_for_delivery', 'delivered', 'cancelled'].includes(order.order_status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.order_status.replace(/_/g, ' ')}.`
      });
    }

    // Refund to wallet if paid
    if (order.payment_status === 'paid') {
      db.prepare('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?').run(order.final_amount, req.user.id);
    }

    // Restock items
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    for (const item of items) {
      db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?').run(item.quantity, item.product_id);
    }

    const timeline = JSON.parse(order.tracking_timeline || '[]');
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    timeline.push({
      status: 'cancelled',
      title: 'Order Cancelled',
      time: nowTime,
      description: `Reason: ${reason}. ${order.payment_status === 'paid' ? 'Refund credited to your GreenZet Wallet.' : ''}`
    });

    db.prepare(`
      UPDATE orders
      SET order_status = 'cancelled', payment_status = ?, tracking_timeline = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(order.payment_status === 'paid' ? 'refunded' : 'pending', JSON.stringify(timeline), order.id);

    res.json({
      success: true,
      message: 'Order cancelled successfully. If prepaid, refund has been added to your in-app wallet.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel order.' });
  }
});

export default router;
