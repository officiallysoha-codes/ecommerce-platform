import db, { initDB } from '../db.js';
import bcrypt from 'bcryptjs';

export function runSeed() {
  initDB();

  console.log('🌱 Clearing old data...');
  db.exec(`
    DELETE FROM reviews;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM product_variants;
    DELETE FROM products;
    DELETE FROM categories;
    DELETE FROM coupons;
    DELETE FROM pincodes;
    DELETE FROM banners;
    DELETE FROM payout_requests;
    DELETE FROM delivery_partners;
    DELETE FROM sellers;
    DELETE FROM users;
    DELETE FROM system_settings;
  `);

  console.log('👤 Seeding Users & Roles...');
  const passwordHash = bcrypt.hashSync('password123', 10);

  // 1. Super Admin
  const adminStmt = db.prepare(`
    INSERT INTO users (name, email, phone, password, role, wallet_balance, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  adminStmt.run('Super Admin', 'admin@greenzet.com', '9876543210', passwordHash, 'admin', 5000.0, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  // 2. Sellers
  const seller1Result = adminStmt.run('Rajesh Ghosh (Fresh Farm Organics)', 'seller@freshfarm.com', '9876543211', passwordHash, 'seller', 12450.0, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
  const seller2Result = adminStmt.run('Sunil Saha (Malda Daily Essentials)', 'seller@maldafruits.com', '9876543212', passwordHash, 'seller', 8320.0, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80');

  // 3. Delivery Partner
  const deliveryUserResult = adminStmt.run('Rahul Kumar (Express Rider)', 'rider@greenzet.com', '9876543213', passwordHash, 'delivery', 1250.0, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80');

  // 4. Customer
  const customerResult = adminStmt.run('Amit Sharma', 'customer@greenzet.com', '9876543214', passwordHash, 'customer', 350.0, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80');

  // Seller Details
  const sellerStmt = db.prepare(`
    INSERT INTO sellers (user_id, store_name, store_logo, store_banner, business_address, pickup_pincode, gst_number, pan_number, bank_account_number, bank_ifsc, status, commission_rate, wallet_balance, total_sales, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const seller1Id = sellerStmt.run(
    seller1Result.lastInsertRowid,
    'Fresh Farm Organics & Groceries',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop&q=80',
    'Shop No. 12, Station Road Market, Malda, West Bengal',
    '732101',
    '19ABCDE1234F1Z5',
    'ABCDE1234F',
    '918237461234',
    'SBIN0001234',
    'approved',
    8.0,
    12450.0,
    148900.0,
    4.9
  ).lastInsertRowid;

  const seller2Id = sellerStmt.run(
    seller2Result.lastInsertRowid,
    'Malda Daily Essentials & Fruits',
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506484381205-f7945653044d?w=800&auto=format&fit=crop&q=80',
    'Near Rathbari More, English Bazar, Malda, West Bengal',
    '732101',
    '19XYZWV9876G1Z2',
    'XYZWV9876G',
    '501004567890',
    'HDFC0000456',
    'approved',
    7.5,
    8320.0,
    94200.0,
    4.7
  ).lastInsertRowid;

  // Delivery Partner Details
  const deliveryStmt = db.prepare(`
    INSERT INTO delivery_partners (user_id, vehicle_type, vehicle_number, driving_license, assigned_pincode, is_online, total_deliveries, today_earnings, wallet_balance, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const deliveryPartnerId = deliveryStmt.run(
    deliveryUserResult.lastInsertRowid,
    'Hero Splendor Bike',
    'WB-66-AB-4321',
    'WB6620210009845',
    '732101',
    1,
    184,
    420.0,
    1250.0,
    'approved'
  ).lastInsertRowid;

  console.log('📍 Seeding Pincodes...');
  const pincodeStmt = db.prepare(`
    INSERT INTO pincodes (pincode, city, state, delivery_fee, min_order_free_delivery, is_serviceable, estimated_time_mins)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  pincodeStmt.run('732101', 'Malda (English Bazar)', 'West Bengal', 25.0, 399.0, 1, 30);
  pincodeStmt.run('732102', 'Old Malda', 'West Bengal', 35.0, 499.0, 1, 45);
  pincodeStmt.run('732103', 'Mangalbari / Malda', 'West Bengal', 30.0, 399.0, 1, 35);
  pincodeStmt.run('700001', 'Kolkata Central', 'West Bengal', 30.0, 499.0, 1, 40);
  pincodeStmt.run('110001', 'New Delhi Connaught', 'Delhi', 30.0, 499.0, 1, 30);
  pincodeStmt.run('560001', 'Bangalore Central', 'Karnataka', 25.0, 399.0, 1, 25);

  console.log('🏷️ Seeding Coupons...');
  const couponStmt = db.prepare(`
    INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, max_discount, is_active, expiry_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  couponStmt.run('WELCOME50', 'Flat ₹50 OFF on your first grocery order', 'fixed', 50.0, 199.0, 50.0, 1, '2027-12-31');
  couponStmt.run('SAVE20', '20% OFF on all fresh fruits & veggies above ₹399', 'percent', 20.0, 399.0, 120.0, 1, '2027-12-31');
  couponStmt.run('GREENZET100', 'Super Saver ₹100 OFF on orders above ₹799', 'fixed', 100.0, 799.0, 100.0, 1, '2027-12-31');
  couponStmt.run('FREEDEL', 'Free Delivery on any order above ₹149', 'fixed', 25.0, 149.0, 35.0, 1, '2027-12-31');

  console.log('🖼️ Seeding Hero Banners...');
  const bannerStmt = db.prepare(`
    INSERT INTO banners (title, subtitle, badge, image, link, bg_gradient, is_active, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  bannerStmt.run(
    'Farm Fresh & Organic Groceries',
    'Get farm-picked fresh fruits & green vegetables delivered to your kitchen in 30 minutes.',
    '⚡ 30 MIN EXPRESS DELIVERY',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000&auto=format&fit=crop&q=80',
    '/category/fruits-vegetables',
    'from-emerald-700 via-emerald-600 to-teal-800',
    1,
    1
  );
  bannerStmt.run(
    'Mega Grocery Savings Festival',
    'Up to 40% OFF on Cooking Oils, Atta, Dals & Daily Essentials. Use code SAVE20.',
    '🔥 FLASH DISCOUNT',
    'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=1000&auto=format&fit=crop&q=80',
    '/category/atta-rice-dals',
    'from-amber-600 via-orange-600 to-red-700',
    1,
    2
  );
  bannerStmt.run(
    'Dairy, Farm Eggs & Bakery Freshness',
    'Pure Cow Milk, Soft Paneer, Brown Eggs and Freshly Baked Breads delivered every morning.',
    '🥛 MORNING ESSENTIALS',
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=1000&auto=format&fit=crop&q=80',
    '/category/dairy-bakery',
    'from-blue-600 via-indigo-600 to-cyan-700',
    1,
    3
  );

  console.log('📂 Seeding Categories...');
  const categoryStmt = db.prepare(`
    INSERT INTO categories (name, slug, icon, image, item_count)
    VALUES (?, ?, ?, ?, ?)
  `);
  const catFruits = categoryStmt.run('Fruits & Vegetables', 'fruits-vegetables', 'Apple', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&auto=format&fit=crop&q=80', 24).lastInsertRowid;
  const catDairy = categoryStmt.run('Dairy, Bread & Eggs', 'dairy-bakery', 'Milk', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80', 18).lastInsertRowid;
  const catStaples = categoryStmt.run('Atta, Rice & Dals', 'atta-rice-dals', 'Wheat', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80', 32).lastInsertRowid;
  const catSnacks = categoryStmt.run('Snacks & Munchies', 'snacks-munchies', 'Cookie', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=80', 20).lastInsertRowid;
  const catBeverages = categoryStmt.run('Tea, Coffee & Drinks', 'beverages', 'Coffee', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80', 15).lastInsertRowid;
  const catPersonal = categoryStmt.run('Personal Care & Hygiene', 'personal-care', 'Sparkles', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80', 16).lastInsertRowid;

  console.log('📦 Seeding Products & Variants...');
  const productStmt = db.prepare(`
    INSERT INTO products (
      seller_id, category_id, title, slug, brand, description, specifications, image, gallery,
      price, original_price, discount_percent, unit, stock_quantity, sku, is_flash_sale, is_featured, is_trending, status, rating, review_count
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const variantStmt = db.prepare(`
    INSERT INTO product_variants (product_id, title, unit, price, original_price, stock_quantity)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const p1 = productStmt.run(
    seller2Id,
    catFruits,
    'Fresh Malda Fazli & Himsagar Mangoes',
    'fresh-malda-mangoes',
    'Malda Orchards',
    'Juicy, authentic sweet Malda GI-tagged mangoes handpicked straight from local orchards. Naturally ripened with zero carbide chemical treatment.',
    JSON.stringify({ "Origin": "Malda, West Bengal", "Grade": "A+ Premium", "Shelf Life": "4-5 Days", "Ripening": "100% Natural Carb-free" }),
    'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80',
    JSON.stringify([
      'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&auto=format&fit=crop&q=80'
    ]),
    180.0,
    240.0,
    25,
    '1 kg',
    80,
    'MLD-MNG-001',
    1, 1, 1, 'approved', 4.9, 48
  ).lastInsertRowid;
  variantStmt.run(p1, '1 kg Box', '1 kg', 180.0, 240.0, 40);
  variantStmt.run(p1, '3 kg Family Pack', '3 kg', 510.0, 720.0, 25);
  variantStmt.run(p1, '5 kg Bulk Box', '5 kg', 820.0, 1200.0, 15);

  const p2 = productStmt.run(
    seller1Id,
    catFruits,
    'Farm Fresh Organic Red Tomatoes',
    'farm-fresh-organic-red-tomatoes',
    'GreenZet Fresh',
    'Plump, vine-ripened organic tomatoes grown without synthetic pesticides. Perfect for curries, salads, and rich gravies.',
    JSON.stringify({ "Storage": "Store at room temp or crisper drawer", "Source": "Local organic farms", "Diet Type": "Vegetarian, Vegan" }),
    'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    JSON.stringify([
      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80'
    ]),
    38.0,
    55.0,
    30,
    '1 kg',
    120,
    'VEG-TOM-002',
    1, 1, 1, 'approved', 4.7, 34
  ).lastInsertRowid;
  variantStmt.run(p2, '500 g', '500 g', 20.0, 28.0, 60);
  variantStmt.run(p2, '1 kg', '1 kg', 38.0, 55.0, 40);
  variantStmt.run(p2, '2 kg Value Pack', '2 kg', 72.0, 110.0, 20);

  const p3 = productStmt.run(
    seller1Id,
    catDairy,
    'Amul Taaza Homogenised Toned Milk',
    'amul-taaza-toned-milk',
    'Amul',
    'Pasteurised toned milk with 3.0% milk fat and 8.5% milk SNF. Delicious, wholesome, and rich in calcium and vitamin D.',
    JSON.stringify({ "Brand": "Amul", "Fat Content": "3.0%", "Packaging": "Poly Pack Pouch", "Vegetarian": "Yes" }),
    'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80',
    JSON.stringify(['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80']),
    56.0,
    58.0,
    3,
    '1 L Pouch',
    95,
    'AMUL-MLK-003',
    0, 1, 1, 'approved', 4.9, 112
  ).lastInsertRowid;
  variantStmt.run(p3, '500 ml Pouch', '500 ml', 29.0, 30.0, 50);
  variantStmt.run(p3, '1 L Pouch', '1 L', 56.0, 58.0, 45);

  const p4 = productStmt.run(
    seller1Id,
    catDairy,
    'Farm Fresh Country Brown Eggs',
    'farm-fresh-country-brown-eggs',
    'Nature Farm',
    'Free-range brown eggs packed with high protein and essential minerals. Sourced directly from local poultry farms every morning.',
    JSON.stringify({ "Quantity": "6 / 12 pieces", "Egg Type": "Brown Country", "Protein": "6g per egg" }),
    'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80',
    JSON.stringify(['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80']),
    54.0,
    70.0,
    22,
    'Pack of 6',
    60,
    'EGG-BRN-004',
    1, 0, 1, 'approved', 4.8, 67
  ).lastInsertRowid;
  variantStmt.run(p4, 'Pack of 6', '6 pcs', 54.0, 70.0, 30);
  variantStmt.run(p4, 'Pack of 12 (Tray)', '12 pcs', 102.0, 140.0, 30);

  const p5 = productStmt.run(
    seller1Id,
    catStaples,
    'Aashirvaad Superior MP Sharbati Whole Wheat Atta',
    'aashirvaad-sharbati-atta',
    'Aashirvaad',
    '100% pure whole wheat grain sourced directly from Madhya Pradesh fields. Delivers soft, fluffy, golden rotis rich in fiber.',
    JSON.stringify({ "Brand": "Aashirvaad", "Grain Type": "MP Sharbati Whole Wheat", "Weight": "5 kg" }),
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    JSON.stringify(['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80']),
    265.0,
    315.0,
    16,
    '5 kg Bag',
    45,
    'ASH-ATT-005',
    0, 1, 1, 'approved', 4.8, 89
  ).lastInsertRowid;
  variantStmt.run(p5, '1 kg Pack', '1 kg', 58.0, 68.0, 20);
  variantStmt.run(p5, '5 kg Bag', '5 kg', 265.0, 315.0, 15);
  variantStmt.run(p5, '10 kg Mega Saver', '10 kg', 510.0, 620.0, 10);

  const p6 = productStmt.run(
    seller1Id,
    catStaples,
    'Fortune Sunlite Refined Sunflower Oil',
    'fortune-sunflower-oil',
    'Fortune',
    'Light and healthy sunflower cooking oil enriched with Vitamins A, D, and E. Great for deep frying, sautéing and everyday cooking.',
    JSON.stringify({ "Type": "Refined Sunflower Oil", "Volume": "1 Litre", "Enriched": "Vitamin A, D & E" }),
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    JSON.stringify(['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80']),
    142.0,
    175.0,
    19,
    '1 L Pouch',
    75,
    'FTN-OIL-006',
    1, 1, 1, 'approved', 4.6, 52
  ).lastInsertRowid;

  const p7 = productStmt.run(
    seller2Id,
    catBeverages,
    'Tata Tea Gold Premium Black Tea',
    'tata-tea-gold-premium',
    'Tata Tea',
    'A delightful blend of fine Assam tea leaves with 15% gently rolled long leaves for superior aroma and rich authentic taste.',
    JSON.stringify({ "Brand": "Tata Tea", "Flavor": "Rich Assam Blend", "Weight": "500 g" }),
    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    JSON.stringify(['https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80']),
    285.0,
    340.0,
    16,
    '500 g Pack',
    40,
    'TAT-TEA-007',
    0, 1, 0, 'approved', 4.7, 43
  ).lastInsertRowid;

  const p8 = productStmt.run(
    seller2Id,
    catSnacks,
    'Haldiram’s Nagpur Aloo Bhujia Namkeen',
    'haldirams-aloo-bhujia',
    'Haldiram',
    'Crispy and spicy potato noodle namkeen seasoned with traditional Indian spices, mint, and chili. The ultimate tea-time snack.',
    JSON.stringify({ "Weight": "400 g", "Dietary": "100% Vegetarian", "Brand": "Haldiram's Nagpur" }),
    'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=600&auto=format&fit=crop&q=80',
    JSON.stringify(['https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=600&auto=format&fit=crop&q=80']),
    95.0,
    120.0,
    21,
    '400 g Pouch',
    90,
    'HLD-ALU-008',
    1, 0, 1, 'approved', 4.8, 76
  ).lastInsertRowid;

  const p9 = productStmt.run(
    seller2Id,
    catPersonal,
    'Dettol Original Germ Protection Bathing Soap (Buy 4 Get 1 Free)',
    'dettol-original-soap-pack',
    'Dettol',
    'Trusted germ protection soap with 100% better defense against illness-causing germs. Leaves skin feeling refreshed and hygienic.',
    JSON.stringify({ "Brand": "Dettol", "Pack": "5 Bars x 125g", "Feature": "Antibacterial" }),
    'https://images.unsplash.com/photo-1607006311600-31421242323f?w=600&auto=format&fit=crop&q=80',
    JSON.stringify(['https://images.unsplash.com/photo-1607006311600-31421242323f?w=600&auto=format&fit=crop&q=80']),
    199.0,
    265.0,
    25,
    'Pack of 5 (125g each)',
    50,
    'DTL-SOP-009',
    0, 1, 0, 'approved', 4.9, 130
  ).lastInsertRowid;

  console.log('📝 Seeding Sample Reviews...');
  const reviewStmt = db.prepare(`
    INSERT INTO reviews (product_id, user_id, user_name, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `);
  reviewStmt.run(p1, customerResult.lastInsertRowid, 'Amit Sharma', 5, 'Super fresh and naturally sweet Malda mangoes! Delivered in just 25 minutes.');
  reviewStmt.run(p1, customerResult.lastInsertRowid, 'Pooja Verma', 5, 'Best quality mangoes I have ordered online in Malda. Crisp packaging.');
  reviewStmt.run(p2, customerResult.lastInsertRowid, 'Sneha Roy', 4, 'Very fresh tomatoes, good size and red color.');
  reviewStmt.run(p5, customerResult.lastInsertRowid, 'Debashis Sen', 5, 'Rotis turn out so soft and fluffy. Best price compared to local store.');

  console.log('🛒 Seeding Sample Order with Timeline & OTP...');
  const orderStmt = db.prepare(`
    INSERT INTO orders (
      order_number, user_id, seller_id, delivery_partner_id, total_amount, discount_amount,
      delivery_fee, final_amount, payment_method, payment_status, order_status,
      delivery_address, delivery_pincode, delivery_time_slot, delivery_otp, tracking_timeline
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const order1Address = JSON.stringify({
    fullName: 'Amit Sharma',
    phone: '9876543214',
    street: 'Flat 302, Green Valley Apartments, Station Road',
    city: 'Malda (English Bazar)',
    state: 'West Bengal',
    pincode: '732101'
  });

  const order1Timeline = JSON.stringify([
    { status: 'placed', title: 'Order Placed', time: '10:15 AM', description: 'Customer placed order with UPI payment.' },
    { status: 'confirmed', title: 'Seller Confirmed', time: '10:18 AM', description: 'Fresh Farm Organics accepted the order.' },
    { status: 'packed', title: 'Packed & Ready', time: '10:25 AM', description: 'Items verified and packed in eco-friendly bag.' },
    { status: 'out_for_delivery', title: 'Out for Delivery', time: '10:32 AM', description: 'Delivery partner Rahul Kumar picked up your package.' }
  ]);

  const orderId = orderStmt.run(
    'GZ-2026-89412',
    customerResult.lastInsertRowid,
    seller1Id,
    deliveryPartnerId,
    483.0,
    50.0,
    0.0,
    433.0,
    'upi',
    'paid',
    'out_for_delivery',
    order1Address,
    '732101',
    'Express (30 mins)',
    '4829',
    order1Timeline
  ).lastInsertRowid;

  const orderItemStmt = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_title, product_image, unit, unit_price, quantity, total_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  orderItemStmt.run(orderId, p1, 'Fresh Malda Fazli & Himsagar Mangoes', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80', '1 kg', 180.0, 1, 180.0);
  orderItemStmt.run(orderId, p2, 'Farm Fresh Organic Red Tomatoes', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80', '1 kg', 38.0, 1, 38.0);
  orderItemStmt.run(orderId, p5, 'Aashirvaad Superior MP Sharbati Whole Wheat Atta', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', '5 kg Bag', 265.0, 1, 265.0);

  console.log('✅ Seed completed successfully!');
}

if (process.argv[1].endsWith('seed.js')) {
  runSeed();
}
