import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  ShoppingBag,
  Search,
  MapPin,
  Heart,
  User,
  ChevronDown,
  Sparkles,
  Zap,
  Clock,
  LogOut,
  Package,
  Wallet,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({
  searchTerm,
  setSearchTerm,
  onOpenCart,
  onNavigate,
  activePage,
  categories = []
}) {
  const { user, logout } = useAuth();
  const { totalItemsCount, subtotal, wishlist, deliveryPincode, pincodeInfo } = useCart();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-10 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Delivery Tag */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 bg-clip-text text-transparent">
                  Green<span className="text-slate-900">Zet</span>
                </span>
                <span className="block text-[11px] font-semibold text-emerald-600 tracking-wider uppercase -mt-1">
                  ⚡ 30-Min Fresh Grocery
                </span>
              </div>
            </button>

            {/* Delivery Location Pill */}
            <div className="hidden lg:flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-full text-xs text-emerald-950 font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
              <span>
                Delivery in <strong>{pincodeInfo.estimatedTimeMins} mins</strong> to <strong>{deliveryPincode}</strong>
              </span>
            </div>
          </div>

          {/* Search Bar with Voice Search */}
          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Search fresh mangoes, milk, atta, oil, tea, snacks..."
                className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 pl-11 pr-16 py-2.5 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm outline-none transition-all placeholder:text-slate-400 shadow-inner"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              
              {/* Voice Search Button */}
              <button
                type="button"
                onClick={() => {
                  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                  if (SpeechRecognition) {
                    const recognition = new SpeechRecognition();
                    recognition.onstart = () => {
                      setSearchTerm('Listening...');
                    };
                    recognition.onresult = (event) => {
                      const transcript = event.results[0][0].transcript;
                      setSearchTerm(transcript);
                    };
                    recognition.onerror = () => {
                      setSearchTerm('');
                    };
                    recognition.start();
                  } else {
                    alert('Voice search is supported on Chrome, Edge, and Safari.');
                  }
                }}
                className="absolute right-9 text-slate-400 hover:text-emerald-600 p-1 transition-colors"
                title="Search with Voice"
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </button>

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Wishlist Button */}
            <button
              onClick={() => onNavigate('wishlist')}
              className={`p-2.5 rounded-xl border transition-all duration-200 relative ${
                activePage === 'wishlist'
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="Saved Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2.5 rounded-2xl font-semibold shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {totalItemsCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:block text-left text-xs leading-tight">
                <span className="block text-[10px] text-emerald-100 font-medium">My Cart</span>
                <span className="font-bold text-sm">₹{subtotal.toFixed(0)}</span>
              </div>
            </button>

            {/* User Account Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-300">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user?.name?.charAt(0) || 'U'
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500 hidden sm:block" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{user?.name || 'Customer'}</p>
                    <p className="text-xs text-slate-500">{user?.email || 'customer@greenzet.com'}</p>
                    <div className="mt-2 flex items-center justify-between bg-emerald-50 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 border border-emerald-200/60">
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-emerald-600" /> Wallet Balance
                      </span>
                      <span>₹{user?.wallet_balance?.toFixed(0) || 0}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                    >
                      <User className="w-4 h-4 text-slate-400" /> My Profile & Addresses
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('orders');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                    >
                      <Package className="w-4 h-4 text-slate-400" /> My Orders & Live Tracking
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" /> Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Mobile Search input */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search groceries & daily essentials..."
              className="w-full bg-slate-100 text-slate-900 pl-10 pr-4 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

      </div>
    </header>
  );
}
