import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { ShoppingBag, Store, Bike, ShieldCheck, MapPin, Sparkles, Check } from 'lucide-react';

export default function RoleSwitcher({ activeTab, setActiveTab }) {
  const { user, switchRole } = useAuth();
  const { deliveryPincode, pincodeInfo, updatePincode } = useCart();
  const [showPincodeInput, setShowPincodeInput] = useState(false);
  const [customPin, setCustomPin] = useState(deliveryPincode);

  const roles = [
    { id: 'customer', label: '🛍️ Customer Storefront', icon: ShoppingBag, color: 'bg-emerald-500' },
    { id: 'seller', label: '🏬 Seller / Vendor Panel', icon: Store, color: 'bg-amber-500' },
    { id: 'delivery', label: '🛵 Delivery Partner App', icon: Bike, color: 'bg-blue-600' },
    { id: 'admin', label: '👑 Super Admin Control', icon: ShieldCheck, color: 'bg-purple-600' },
  ];

  const handleRoleClick = async (roleId) => {
    setActiveTab(roleId);
    if (user?.role !== roleId) {
      await switchRole(roleId);
    }
  };

  const handlePincodeSubmit = async (e) => {
    e.preventDefault();
    if (customPin) {
      await updatePincode(customPin);
      setShowPincodeInput(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white text-xs py-2 px-4 shadow-md sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* Left: Role Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          <span className="hidden sm:flex items-center gap-1 text-slate-400 font-medium mr-1.5 uppercase tracking-wider text-[10px]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Switch View:
          </span>
          {roles.map((r) => {
            const isActive = activeTab === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleRoleClick(r.id)}
                className={`px-3 py-1.5 rounded-full font-medium transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? `${r.color} text-white shadow-sm ring-2 ring-white/20 font-semibold scale-[1.02]`
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span>{r.label}</span>
                {isActive && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* Right: Quick Delivery Location & Wallet Info */}
        <div className="flex items-center gap-3">
          {/* Quick Pincode Location */}
          <div className="relative">
            {showPincodeInput ? (
              <form onSubmit={handlePincodeSubmit} className="flex items-center gap-1">
                <input
                  type="text"
                  maxLength={6}
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value)}
                  placeholder="6-digit PIN"
                  className="bg-slate-800 text-white px-2 py-0.5 rounded border border-emerald-500 text-xs w-24 outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[11px] font-medium hover:bg-emerald-600"
                >
                  Set
                </button>
                <button
                  type="button"
                  onClick={() => setShowPincodeInput(false)}
                  className="text-slate-400 hover:text-white px-1 text-xs"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowPincodeInput(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-full text-slate-200 border border-slate-700 hover:border-emerald-500/50 transition-colors"
                title="Click to change delivery pincode"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>
                  Delivering to: <strong className="text-emerald-400 font-semibold">{deliveryPincode}</strong> ({pincodeInfo.city})
                </span>
                <span className="text-[10px] text-slate-400 underline ml-0.5">Edit</span>
              </button>
            )}
          </div>

          {/* User profile & wallet badge */}
          {user && (
            <div className="hidden md:flex items-center gap-2 border-l border-slate-700 pl-3">
              <span className="text-slate-300">
                Logged in as: <strong className="text-white">{user.name}</strong>
              </span>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                Wallet: ₹{user.wallet_balance?.toFixed(0) || 0}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
