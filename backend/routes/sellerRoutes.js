import express from 'express';
import db from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Helper to verify user is a registered seller
function getSeller(userId) {
  return db.prepare('SELECT * FROM sellers WHERE user_id = ?').get(userId);
}

/**
 * GET /api/seller/dashboard
 * Seller Analytics & Stats overview
 */
router.get('/dashboard', authenticateToken, authorizeRoles('seller', 'admin'), (req, res) => {
  try {
    const seller = getSeller(req.user.id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller profile not found.' });
    }

    // Orders stats for this seller
    const orderStats = db.prepare(`
      SELECT 
        COUNT(id) as total_orders,
        SUM(CASE WHEN order_status = 'placed' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN order_status IN ('confirmed', 'packed') THEN 1 ELSE 0 END) as processing_orders,
        SUM(CASE WHEN order_status = 'out_for_delivery' THEN 1 ELSE 0 END) as out_for_delivery_orders,
        SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN order_status != 'cancelled' THEN total_amount ELSE 0 END) as total_sales_volume
      FROM orders
      WHERE seller_id = ?
    `).get(seller.id);

    // Products stats
    const productStats = db.prepare(`
      SELECT 
        COUNT(id) as total_products,
        SUM(CASE WHEN stock_quantity <= 10 AND stock_quantity > 0 THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_count
      FROM products
      WHERE seller_id = ?
    `).get(seller.id);

    // Recent orders
    const recentOrders = db.prepare(`
      SELECT o.*, u.name as customer_name, u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.seller_id = ?
      ORDER BY o.id DESC
      LIMIT 6
    `).all(seller.id);

    const formattedOrders = recentOrders.map(o => ({
      ...o,
      delivery_address: JSON.parse(o.delivery_address || '{}'),
      items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id)
    }));

    res.json({
      success: true,
      seller,
      stats: {
        totalRevenue: seller.wallet_balance,
        totalSalesVolume: orderStats.total_sales_volume || 0,
        totalOrders: orderStats.total_orders || 0,
        pendingOrders: orderStats.pending_orders || 0,
        processingOrders: orderStats.processing_orders || 0,
        deliveredOrders: orderStats.delivered_orders || 0,
        cancelledOrders: orderStats.cancelled_orders || 0,
        totalProducts: productStats.total_products || 0,
        lowStockCount: productStats.low_stock_count || 0,
        outOfStockCount: productStats.out_of_stock_count || 0
      },
      recentOrders: formattedOrders
    });
  } catch (error) {
    console.error('Seller dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch seller analytics.' });
  }
});

/**
 * GET /api/seller/products
 * Fetch all products listed by this seller
 */
router.get('/products', authenticateToken, authorizeRoles('seller', 'admin'), (req, res) => {
  try {
    const seller = getSeller(req.user.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

    const products = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = ?
      ORDER BY p.id DESC
    `).all(seller.id);

    const formatted = products.map(p => ({
      ...p,
      specifications: p.specifications ? JSON.parse(p.specifications) : {},
      variants: db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(p.id)
    }));

    res.json({ success: true, count: formatted.length, products: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch seller products.' });
  }
});

/**
 * POST /api/seller/products
 * Create a new product in the vendor's catalog
 */
router.post('/products', authenticateToken, authorizeRoles('seller', 'admin'), (req, res) => {
  try {
    const seller = getSeller(req.user.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

    const {
      title,
      categoryId,
      brand,
      description,
      price,
      originalPrice,
      unit,
      stockQuantity = 50,
      image,
      gallery = [],
      specifications = {},
      isFlashSale = 0,
      isFeatured = 0
    } = req.body;

    if (!title || !categoryId || !price || !unit || !image) {
      return res.status(400).json({ success: false, message: 'Title, category, price, unit, and image URL are required.' });
    }

    const origPrice = originalPrice || price;
    const discountPercent = origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    const sku = `SKU-${Date.now().toString().slice(-6)}`;

    const insert = db.prepare(`
      INSERT INTO products (
        seller_id, category_id, title, slug, brand, description, specifications,
        image, gallery, price, original_price, discount_percent, unit,
        stock_quantity, sku, is_flash_sale, is_featured, is_trending, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'approved')
    `);

    const result = insert.run(
      seller.id,
      Number(categoryId),
      title,
      slug,
      brand || 'Generic',
      description || '',
      JSON.stringify(specifications),
      image,
      JSON.stringify(gallery.length > 0 ? gallery : [image]),
      Number(price),
      Number(origPrice),
      discountPercent,
      unit,
      Number(stockQuantity),
      sku,
      isFlashSale ? 1 : 0,
      isFeatured ? 1 : 0
    );

    res.status(201).json({
      success: true,
      message: 'Product created and approved for live store!',
      productId: result.lastInsertRowid,
      slug
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Failed to create product.', error: error.message });
  }
});

/**
 * PUT /api/seller/products/:id
 * Edit product details & stock inventory
 */
router.put('/products/:id', authenticateToken, authorizeRoles('seller', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const seller = getSeller(req.user.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

    const product = db.prepare('SELECT * FROM products WHERE id = ? AND seller_id = ?').get(id, seller.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const {
      title = product.title,
      price = product.price,
      originalPrice = product.original_price,
      stockQuantity = product.stock_quantity,
      unit = product.unit,
      description = product.description,
      brand = product.brand,
      image = product.image,
      isFlashSale = product.is_flash_sale
    } = req.body;

    const discountPercent = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    db.prepare(`
      UPDATE products
      SET title = ?, price = ?, original_price = ?, discount_percent = ?,
          stock_quantity = ?, unit = ?, description = ?, brand = ?, image = ?,
          is_flash_sale = ?
      WHERE id = ?
    `).run(
      title,
      Number(price),
      Number(originalPrice),
      discountPercent,
      Number(stockQuantity),
      unit,
      description,
      brand,
      image,
      isFlashSale ? 1 : 0,
      id
    );

    res.json({ success: true, message: 'Product updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
});

/**
 * DELETE /api/seller/products/:id
 * Remove product from catalog
 */
router.delete('/products/:id', authenticateToken, authorizeRoles('seller', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const seller = getSeller(req.user.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

    db.prepare('DELETE FROM products WHERE id = ? AND seller_id = ?').run(id, seller.id);
    res.json({ success: true, message: 'Product removed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

/**
 * GET /api/seller/orders
 * List orders for this seller
 */
router.get('/orders', authenticateToken, authorizeRoles('seller', 'admin'), (req, res) => {
  try {
    const seller = getSeller(req.user.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

    const orders = db.prepare(`
      SELECT o.*, u.name as customer_name, u.phone as customer_phone
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.seller_id = ?
      ORDER BY o.id DESC
    `).all(seller.id);

    const formatted = orders.map(o => ({
      ...o,
      delivery_address: JSON.parse(o.delivery_address || '{}'),
      tracking_timeline: JSON.parse(o.tracking_timeline || '[]'),
      items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id)
    }));

    res.json({ success: true, count: formatted.length, orders: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch seller orders.' });
  }
});

/**
 * POST /api/seller/orders/:id/status
 * Seller updates order pipeline: 'confirmed' -> 'packed'
 */
router.post('/orders/:id/status', authenticateToken, authorizeRoles('seller', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body; // 'confirmed', 'packed'
    const seller = getSeller(req.user.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND seller_id = ?').get(id, seller.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const timeline = JSON.parse(order.tracking_timeline || '[]');
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let title = 'Order Confirmed';
    let description = `${seller.store_name} has accepted and started processing your order.`;

    if (newStatus === 'packed') {
      title = 'Items Packed & Ready';
      description = 'All grocery items have been quality checked, packed, and are ready for pickup.';
    }

    timeline.push({ status: newStatus, title, time: nowTime, description });

    db.prepare(`
      UPDATE orders
      SET order_status = ?, tracking_timeline = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, JSON.stringify(timeline), order.id);

    res.json({ success: true, message: `Order status updated to "${newStatus}".`, newStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Status update failed.' });
  }
});

/**
 * POST /api/seller/payout-request
 * Request bank payout of available seller earnings
 */
router.post('/payout-request', authenticateToken, authorizeRoles('seller', 'admin'), (req, res) => {
  try {
    const seller = getSeller(req.user.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

    const { amount } = req.body;
    if (!amount || amount <= 0 || amount > seller.wallet_balance) {
      return res.status(400).json({
        success: false,
        message: `Invalid withdrawal amount. Maximum withdrawable: ₹${seller.wallet_balance.toFixed(2)}`
      });
    }

    // Deduct from seller wallet & create payout record
    db.prepare('UPDATE sellers SET wallet_balance = wallet_balance - ? WHERE id = ?').run(amount, seller.id);
    const insert = db.prepare(`
      INSERT INTO payout_requests (seller_id, amount, bank_account, status)
      VALUES (?, ?, ?, 'transferred')
    `).run(seller.id, amount, `${seller.bank_account_number || 'A/C 918237461234'} (${seller.bank_ifsc || 'SBIN0001234'})`);

    res.json({
      success: true,
      message: `₹${amount} withdrawal processed to your bank account!`,
      payoutId: insert.lastInsertRowid,
      remainingBalance: seller.wallet_balance - amount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Payout request failed.' });
  }
});

export default router;
