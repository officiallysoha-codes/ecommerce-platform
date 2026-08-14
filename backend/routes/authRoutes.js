import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * User registration for Customer, Seller, or Delivery Partner
 */
router.post('/register', (req, res) => {
  try {
    const { name, email, phone, password, role = 'customer', storeName, vehicleType, vehicleNumber, pincode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    // Check existing email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email is already registered. Please login.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, phone, password, role, wallet_balance)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insertUser.run(name, email, phone || '', hashedPassword, role, 100.0);
    const userId = result.lastInsertRowid;

    // Role-specific profile initialization
    if (role === 'seller') {
      db.prepare(`
        INSERT INTO sellers (user_id, store_name, pickup_pincode, status, commission_rate)
        VALUES (?, ?, ?, 'pending', 8.0)
      `).run(userId, storeName || `${name}'s Store`, pincode || '732101');
    } else if (role === 'delivery') {
      db.prepare(`
        INSERT INTO delivery_partners (user_id, vehicle_type, vehicle_number, assigned_pincode, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).run(userId, vehicleType || 'Bike', vehicleNumber || 'NA', pincode || '732101');
    }

    const newUser = db.prepare('SELECT id, name, email, phone, role, wallet_balance, avatar FROM users WHERE id = ?').get(userId);
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.', error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Standard email & password login
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Role specific details
    let sellerInfo = null;
    let deliveryInfo = null;

    if (user.role === 'seller') {
      sellerInfo = db.prepare('SELECT * FROM sellers WHERE user_id = ?').get(user.id);
    } else if (user.role === 'delivery') {
      deliveryInfo = db.prepare('SELECT * FROM delivery_partners WHERE user_id = ?').get(user.id);
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      wallet_balance: user.wallet_balance,
      avatar: user.avatar,
      seller: sellerInfo,
      delivery: deliveryInfo
    };

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

/**
 * POST /api/auth/otp-login
 * Mock Mobile OTP Login (Send OTP & Verify instantly for seamless testing)
 */
router.post('/otp-login', (req, res) => {
  try {
    const { phone, otp = '1234' } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    // Lookup user by phone or create new fast guest customer
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) {
      const passwordHash = bcrypt.hashSync('otp1234', 10);
      const insert = db.prepare(`
        INSERT INTO users (name, email, phone, password, role, wallet_balance)
        VALUES (?, ?, ?, ?, 'customer', 150.0)
      `).run(`Customer ${phone.slice(-4)}`, `${phone}@greenzet.user`, phone, passwordHash);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(insert.lastInsertRowid);
    }

    const token = generateToken(user);
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      wallet_balance: user.wallet_balance,
      avatar: user.avatar
    };

    res.json({
      success: true,
      message: 'OTP verified successfully!',
      token,
      user: safeUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'OTP Login failed.' });
  }
});

/**
 * POST /api/auth/demo-switch
 * Instant demo login switcher for Customer, Seller, Delivery Partner, and Super Admin
 */
router.post('/demo-switch', (req, res) => {
  try {
    const { role = 'customer' } = req.body;
    let targetEmail = 'customer@greenzet.com';

    if (role === 'seller') targetEmail = 'seller@freshfarm.com';
    else if (role === 'delivery') targetEmail = 'rider@greenzet.com';
    else if (role === 'admin') targetEmail = 'admin@greenzet.com';

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(targetEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: `Demo user for role ${role} not found.` });
    }

    let sellerInfo = null;
    let deliveryInfo = null;
    if (user.role === 'seller') {
      sellerInfo = db.prepare('SELECT * FROM sellers WHERE user_id = ?').get(user.id);
    } else if (user.role === 'delivery') {
      deliveryInfo = db.prepare('SELECT * FROM delivery_partners WHERE user_id = ?').get(user.id);
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      wallet_balance: user.wallet_balance,
      avatar: user.avatar,
      seller: sellerInfo,
      delivery: deliveryInfo
    };

    const token = generateToken(user);
    res.json({
      success: true,
      message: `Switched active role to ${role.toUpperCase()}`,
      token,
      user: safeUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Demo switch failed.' });
  }
});

/**
 * GET /api/auth/me
 * Fetch current authenticated user profile
 */
router.get('/me', authenticateToken, (req, res) => {
  let sellerInfo = null;
  let deliveryInfo = null;

  if (req.user.role === 'seller') {
    sellerInfo = db.prepare('SELECT * FROM sellers WHERE user_id = ?').get(req.user.id);
  } else if (req.user.role === 'delivery') {
    deliveryInfo = db.prepare('SELECT * FROM delivery_partners WHERE user_id = ?').get(req.user.id);
  }

  res.json({
    success: true,
    user: {
      ...req.user,
      seller: sellerInfo,
      delivery: deliveryInfo
    }
  });
});

export default router;
