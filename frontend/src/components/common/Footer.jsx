import React from 'react';
import { ShoppingBag, Zap, ShieldCheck, Tag, HeartHandshake, MapPin, Phone, Mail, ArrowRight } from 'lucide-react';

export default function Footer({ onCategoryClick }) {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 4 Core Value Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">30-Minute Express Delivery</h4>
              <p className="text-slate-400 text-xs mt-1">Superfast delivery straight from local farms and trusted vendors.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center flex-shrink-0">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Best Prices & Mega Offers</h4>
              <p className="text-slate-400 text-xs mt-1">Direct from source pricing with special coupons and flash discounts.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">100% Quality & Hygiene Checked</h4>
              <p className="text-slate-400 text-xs mt-1">Hand-picked fresh produce, verified expiry dates, and zero adulteration.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-12 h-12 rounded-xl bg-purple-950 text-purple-400 border border-purple-800 flex items-center justify-center flex-shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Easy Returns & Instant Refunds</h4>
              <p className="text-slate-400 text-xs mt-1">Hassle-free doorstep returns with instant in-app wallet refund credit.</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Green<span className="text-emerald-400">Zet</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's premier hyperlocal multi-vendor marketplace connecting you with fresh local farmers, premium grocers, and instant delivery partners.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>+91 98765 43210 (Toll Free)</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Categories</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><button onClick={() => onCategoryClick?.('fruits-vegetables')} className="hover:text-emerald-400 transition-colors">🥬 Fresh Fruits & Vegetables</button></li>
              <li><button onClick={() => onCategoryClick?.('dairy-bakery')} className="hover:text-emerald-400 transition-colors">🥛 Dairy, Milk & Fresh Eggs</button></li>
              <li><button onClick={() => onCategoryClick?.('atta-rice-dals')} className="hover:text-emerald-400 transition-colors">🍚 Atta, Basmati Rice & Dals</button></li>
              <li><button onClick={() => onCategoryClick?.('snacks-munchies')} className="hover:text-emerald-400 transition-colors">🍪 Namkeen, Biscuits & Snacks</button></li>
              <li><button onClick={() => onCategoryClick?.('beverages')} className="hover:text-emerald-400 transition-colors">☕ Tea, Coffee & Cold Drinks</button></li>
            </ul>
          </div>

          {/* Serviceable Hubs */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Delivery Hubs</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> Malda Town (732101)</li>
              <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> Old Malda & Mangalbari (732102)</li>
              <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> Kolkata Central (700001)</li>
              <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-emerald-400" /> New Delhi & Bangalore Hubs</li>
            </ul>
          </div>

          {/* Newsletter / Get Offers */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Stay Updated</h4>
            <p className="text-xs text-slate-400 mb-3">Get exclusive discount promo codes and seasonal harvest alerts.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs border border-slate-800 focus:border-emerald-500 focus:outline-none flex-1"
              />
              <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-semibold">
                Join
              </button>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 GreenZet Multi-Vendor Platform. 100% Custom Source Code Architecture.</p>
          <div className="flex items-center gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Seller Agreement</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
