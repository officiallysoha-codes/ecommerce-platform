import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Relational SQLite database file stored locally
const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode (Write-Ahead Logging) for lightning fast concurrency & reliability
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize all database schemas
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer', -- 'customer', 'seller', 'delivery', 'admin'
      wallet_balance REAL DEFAULT 200.0,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sellers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      store_name TEXT NOT NULL,
      store_logo TEXT,
      store_banner TEXT,
      business_address TEXT,
      pickup_pincode TEXT NOT NULL,
      gst_number TEXT,
      pan_number TEXT,
      bank_account_number TEXT,
      bank_ifsc TEXT,
      status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'suspended'
      commission_rate REAL DEFAULT 8.0, -- platform percentage
      wallet_balance REAL DEFAULT 0.0,
      total_sales REAL DEFAULT 0.0,
      rating REAL DEFAULT 4.8,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS delivery_partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      vehicle_type TEXT DEFAULT 'Bike',
      vehicle_number TEXT,
      driving_license TEXT,
      assigned_pincode TEXT NOT NULL,
      is_online INTEGER DEFAULT 1,
      total_deliveries INTEGER DEFAULT 0,
      today_earnings REAL DEFAULT 0.0,
      wallet_balance REAL DEFAULT 450.0,
      status TEXT DEFAULT 'approved',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT,
      image TEXT,
      item_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      brand TEXT,
      description TEXT,
      specifications TEXT, -- JSON string
      image TEXT NOT NULL,
      gallery TEXT,        -- JSON array string
      price REAL NOT NULL,
      original_price REAL NOT NULL,
      discount_percent INTEGER DEFAULT 0,
      unit TEXT NOT NULL,  -- e.g., '1 kg', '500 g', '1 L'
      stock_quantity INTEGER NOT NULL DEFAULT 50,
      sku TEXT UNIQUE,
      is_flash_sale INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      is_trending INTEGER DEFAULT 0,
      status TEXT DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
      rating REAL DEFAULT 4.5,
      review_count INTEGER DEFAULT 12,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      title TEXT NOT NULL, -- e.g. '500 g', '1 kg', '2 kg Pack'
      unit TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL NOT NULL,
      stock_quantity INTEGER DEFAULT 50,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pincodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pincode TEXT UNIQUE NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      delivery_fee REAL DEFAULT 30.0,
      min_order_free_delivery REAL DEFAULT 499.0,
      is_serviceable INTEGER DEFAULT 1,
      estimated_time_mins INTEGER DEFAULT 45
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      discount_type TEXT NOT NULL, -- 'percent' or 'fixed'
      discount_value REAL NOT NULL,
      min_order_value REAL DEFAULT 0.0,
      max_discount REAL DEFAULT 500.0,
      is_active INTEGER DEFAULT 1,
      expiry_date TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      delivery_partner_id INTEGER,
      total_amount REAL NOT NULL,
      discount_amount REAL DEFAULT 0.0,
      delivery_fee REAL DEFAULT 0.0,
      final_amount REAL NOT NULL,
      payment_method TEXT NOT NULL, -- 'cod', 'upi', 'card', 'wallet'
      payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
      order_status TEXT NOT NULL DEFAULT 'placed',    -- 'placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'
      delivery_address TEXT NOT NULL, -- JSON string with street, city, pincode, receiver name, phone
      delivery_pincode TEXT NOT NULL,
      delivery_time_slot TEXT DEFAULT 'Express (30-45 mins)',
      delivery_otp TEXT NOT NULL,     -- 4-digit code e.g. '4921'
      tracking_timeline TEXT,         -- JSON array with event logs
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE RESTRICT,
      FOREIGN KEY (delivery_partner_id) REFERENCES delivery_partners(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_title TEXT NOT NULL,
      product_image TEXT NOT NULL,
      unit TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT,
      badge TEXT,
      image TEXT NOT NULL,
      link TEXT,
      bg_gradient TEXT DEFAULT 'from-emerald-600 to-teal-700',
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payout_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      bank_account TEXT,
      status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'transferred'
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME,
      FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export default db;
