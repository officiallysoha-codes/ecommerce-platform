import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/categories
 * List all product categories
 */
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'approved'
      GROUP BY c.id
      ORDER BY c.id ASC
    `).all();

    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.', error: error.message });
  }
});

/**
 * GET /api/banners
 * List active hero & promotional banners
 */
router.get('/banners', (req, res) => {
  try {
    const banners = db.prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY display_order ASC').all();
    res.json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch banners.' });
  }
});

/**
 * GET /api/products
 * Fetch products with dynamic search, category, rating, price filtering, and sorting
 */
router.get('/products', (req, res) => {
  try {
    const {
      category,
      search,
      brand,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      flashSale,
      featured,
      sort = 'newest',
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug, s.store_name, s.rating as seller_rating
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN sellers s ON p.seller_id = s.id
      WHERE p.status = 'approved'
    `;
    const params = [];

    if (category) {
      query += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category, isNaN(category) ? -1 : Number(category));
    }

    if (search) {
      query += ` AND (p.title LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (brand) {
      query += ` AND p.brand = ?`;
      params.push(brand);
    }

    if (minPrice) {
      query += ` AND p.price >= ?`;
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      query += ` AND p.price <= ?`;
      params.push(Number(maxPrice));
    }

    if (minRating) {
      query += ` AND p.rating >= ?`;
      params.push(Number(minRating));
    }

    if (inStock === 'true' || inStock === '1') {
      query += ` AND p.stock_quantity > 0`;
    }

    if (flashSale === 'true' || flashSale === '1') {
      query += ` AND p.is_flash_sale = 1`;
    }

    if (featured === 'true' || featured === '1') {
      query += ` AND p.is_featured = 1`;
    }

    // Sorting
    switch (sort) {
      case 'price-asc':
        query += ` ORDER BY p.price ASC`;
        break;
      case 'price-desc':
        query += ` ORDER BY p.price DESC`;
        break;
      case 'rating':
        query += ` ORDER BY p.rating DESC`;
        break;
      case 'discount':
        query += ` ORDER BY p.discount_percent DESC`;
        break;
      case 'popular':
        query += ` ORDER BY p.review_count DESC`;
        break;
      case 'newest':
      default:
        query += ` ORDER BY p.id DESC`;
        break;
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const products = db.prepare(query).all(...params);

    // Parse JSON specs & gallery for each item
    const formatted = products.map(p => ({
      ...p,
      specifications: p.specifications ? JSON.parse(p.specifications) : {},
      gallery: p.gallery ? JSON.parse(p.gallery) : [p.image]
    }));

    res.json({ success: true, count: formatted.length, products: formatted });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products.', error: error.message });
  }
});

/**
 * GET /api/products/:slugOrId
 * Fetch single product details with variants, seller info, and reviews
 */
router.get('/products/:slugOrId', (req, res) => {
  try {
    const { slugOrId } = req.params;

    let product = db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             s.store_name, s.rating as seller_rating, s.pickup_pincode as seller_pincode, s.store_logo
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN sellers s ON p.seller_id = s.id
      WHERE (p.slug = ? OR p.id = ?)
    `).get(slugOrId, isNaN(slugOrId) ? -1 : Number(slugOrId));

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Fetch product variants
    const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC').all(product.id);

    // Fetch reviews
    const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(product.id);

    // Fetch related products from same category
    const related = db.prepare(`
      SELECT id, title, slug, price, original_price, discount_percent, unit, image, rating, review_count, stock_quantity
      FROM products
      WHERE category_id = ? AND id != ? AND status = 'approved'
      LIMIT 4
    `).all(product.category_id, product.id);

    const formatted = {
      ...product,
      specifications: product.specifications ? JSON.parse(product.specifications) : {},
      gallery: product.gallery ? JSON.parse(product.gallery) : [product.image],
      variants,
      reviews,
      related
    };

    res.json({ success: true, product: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving product.', error: error.message });
  }
});

/**
 * POST /api/products/:id/reviews
 * Add a customer review for a product
 */
router.post('/products/:id/reviews', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars.' });
    }

    const insert = db.prepare(`
      INSERT INTO reviews (product_id, user_id, user_name, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(Number(id), req.user.id, req.user.name, Number(rating), comment || '');

    // Recalculate product rating & count
    const stats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(id) as count
      FROM reviews
      WHERE product_id = ?
    `).get(Number(id));

    db.prepare(`
      UPDATE products
      SET rating = ?, review_count = ?
      WHERE id = ?
    `).run(Number(stats.avg_rating.toFixed(1)), stats.count, Number(id));

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      reviewId: insert.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit review.', error: error.message });
  }
});

export default router;
