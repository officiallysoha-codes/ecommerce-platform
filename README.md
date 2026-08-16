# 🛒 FreshCart — Modern Multi-Vendor Hyperlocal E-Commerce Platform

A production-ready, custom-built Multi-Vendor E-Commerce and Grocery Delivery platform inspired by enterprise e-commerce specifications. Built completely from scratch with **React 18**, **Tailwind CSS**, **Node.js / Express**, and **SQLite**.

---

## 🌟 4 Integrated Portals in 1 Application

Use the top sticky **Role Switcher** to test all 4 user personas with 1 click:

### 1. 🛍️ Customer Storefront (`/`)
- **Smart Catalog & Filters**: Real-time search, category chips, price sliders, brand filter, minimum star rating, and in-stock toggles.
- **Dynamic Banners & Flash Deals**: Auto-rotating hero carousel, flash sale timers, and promotional badges.
- **Product Details & Variants**: Unit size selector (e.g. 500g, 1kg, 2kg pack), multi-image gallery, "You Save ₹X" savings calculator, and customer reviews.
- **Shopping Bag & Offers**: Free delivery progress meter, promo coupon applicator (`WELCOME50`, `SAVE20`, `GREENZET100`).
- **Checkout & Multi-Payment**:
  - Saved delivery addresses & delivery time slots (⚡ 30-min express, Morning, Evening).
  - Payment modes: **Cash on Delivery (COD)**, **UPI QR Code Simulator**, **Credit/Debit Cards**, and **In-App Wallet**.
- **Live 5-Stage Order Tracking**: `Placed` ➔ `Confirmed` ➔ `Packed` ➔ `Out for Delivery` ➔ `Delivered`.
- **4-Digit Customer Delivery OTP**: Secure code verification for delivery handover.
- **Simulated WhatsApp/SMS Alerts**: Floating notifications on every status change.

### 2. 🏬 Seller / Vendor Portal (`/seller`)
- **Vendor Analytics Dashboard**: Total sales volume, processing orders, wallet balance, and low-stock alerts.
- **Product Catalog Management**: Add new products with image URLs, prices, units, SKU, and stock; edit and delete products.
- **Order Fulfillment Pipeline**: Step-by-step workflow: `Accept Order` ➔ `Mark as Packed` ➔ `Ready for Pickup`.
- **Bank Settlement**: Instant payout withdrawal requests to registered vendor bank accounts.

### 3. 🛵 Delivery Partner App (`/delivery`)
- **Rider Dashboard**: Online/Offline availability toggle, vehicle info (Bike `WB-66-AB-4321`), today's earnings ledger (₹40 per delivery).
- **Interactive GPS Route Navigation**: Waypoint navigation between Store Pickup and Customer Delivery Address.
- **OTP Verification**: Enter customer's 4-digit OTP to complete delivery and instantly release rider payout.

### 4. 👑 Super Admin Command Center (`/admin`)
- **Executive Platform Analytics**: Gross Merchandise Value (GMV), platform commission earned, active sellers, and total orders.
- **Vendor Moderation**: Approve, reject, or suspend sellers; set custom platform commission rates (e.g. 8%, 10%).
- **Delivery Zone & Pincodes Manager**: Add/edit serviceable pincodes, base delivery charges, and free delivery thresholds.
- **Coupon Manager**: Create custom promo codes.

---

## 🧠 Architecture Guide for Java & Python Developers

| Concept | Node.js / React (Here) | Java (Spring Boot) | Python (FastAPI / Django) |
|---|---|---|---|
| **REST Endpoints** | Express `app.get()`, `app.post()` | Spring `@GetMapping`, `@PostMapping` | FastAPI `@app.get()`, `@app.post()` |
| **Data Persistence** | SQLite via `better-sqlite3` | SQLite / PostgreSQL via Spring Data JPA | SQLite / PostgreSQL via SQLAlchemy |
| **Auth & Security** | JSON Web Tokens (`jwt.verify`) | Spring Security JWT Filter | FastAPI `Depends(oauth2_scheme)` |
| **UI Components** | React JSX Functions | Thymeleaf HTML / JavaFX | Jinja2 Templates / React frontend |
| **State Management**| React `useState`, `useContext` | Class fields (`private int count`) | Class instance variables (`self.state`) |

---

## 🚀 Quick Start (Running Locally)

### 1. Backend Server
```bash
cd backend
npm install
npm run seed     # Populates SQLite database with fresh demo data
npm start        # Runs on http://localhost:5000
```

### 2. Frontend App
```bash
cd frontend
npm install
npm run dev      # Runs on http://127.0.0.1:5173
```

---

## 🐙 How to Push to GitHub

1. Create a new empty repository on [github.com](https://github.com/new) named `greenzet-ecommerce`.
2. Run these commands inside the project root folder:

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/greenzet-ecommerce.git
git branch -M main
git push -u origin main
```

---

## ☁️ 100% Free Live Deployment Guide

You do **NOT** need to pay any money to deploy this project live on the internet:

1. **Frontend (100% Free)**:
   - Push code to GitHub.
   - Import repository on [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
   - Set root directory to `frontend`. Click **Deploy** (Free automatic SSL and fast global CDN).

2. **Backend (100% Free)**:
   - Deploy the `backend` folder on [Render.com](https://render.com) or [Railway.app](https://railway.app) (Free Web Service tier).
   - Add environment variable `PORT=5000` and `JWT_SECRET=your_secret_key`.

3. **Database (100% Free)**:
   - The local SQLite database works out of the box. For cloud hosting, you can also use [Turso](https://turso.tech) (Free SQLite in the cloud) or [Supabase](https://supabase.com) (Free PostgreSQL).

4. **Payments (100% Free Test Mode)**:
   - Razorpay and Stripe provide 100% free test API keys with fake card numbers and mock UPI for development and demonstration.
