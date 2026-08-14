import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, onProceedToCheckout }) {
  const {
    cartItems,
    subtotal,
    originalSubtotal,
    couponDiscount,
    deliveryFee,
    totalAmount,
    totalSavings,
    appliedCoupon,
    pincodeInfo,
    isFreeDelivery,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    removeCoupon,
    clearCart
  } = useCart();

  const { user } = useAuth();
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  if (!isOpen) return null;

  const handleApplyCoupon = async (codeToApply) => {
    const code = codeToApply || couponInput;
    if (!code) return;
    setIsApplyingCoupon(true);
    await applyCoupon(code);
    setIsApplyingCoupon(false);
    setCouponInput('');
  };

  const freeDeliveryThreshold = pincodeInfo.freeDeliveryAbove || 399;
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - (subtotal - couponDiscount));
  const freeDeliveryProgress = Math.min(100, Math.round(((subtotal - couponDiscount) / freeDeliveryThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-slideLeft">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">My Shopping Bag</h3>
                <p className="text-xs text-slate-500">{cartItems.length} unique items</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Delivery Meter */}
          <div className="px-5 py-3 bg-emerald-50/80 border-b border-emerald-100">
            {isFreeDelivery ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>🎉 Yay! You have unlocked FREE Express Delivery!</span>
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs font-semibold text-emerald-950 mb-1.5">
                  <span>Add ₹{Math.round(amountNeededForFreeDelivery)} more for <strong>FREE Delivery</strong></span>
                  <span className="text-emerald-700 font-bold">{freeDeliveryProgress}%</span>
                </div>
                <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${freeDeliveryProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h4 className="font-bold text-slate-800 text-lg">Your bag is empty</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Looks like you haven't added anything to your cart yet. Explore fresh fruits, vegetables, and groceries!
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.itemKey}
                  className="flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-slate-900 text-xs truncate">{item.title}</h5>
                    <span className="text-[11px] text-slate-500 font-medium block mt-0.5">{item.unit}</span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-black text-slate-900 text-sm">₹{item.price * item.quantity}</span>
                      {item.originalPrice > item.price && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ₹{item.originalPrice * item.quantity}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.itemKey, -1)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs font-bold text-slate-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.itemKey, 1)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.itemKey)}
                    className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}

            {/* Coupons Section */}
            {cartItems.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span>Coupons & Offers</span>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950">
                    <div>
                      <span className="font-black text-emerald-700 uppercase tracking-wider">{appliedCoupon.code}</span>
                      <p className="text-[11px] text-emerald-600 font-medium">₹{appliedCoupon.discount} discount applied!</p>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-rose-600 hover:text-rose-700 font-bold text-xs underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter Promo Code (e.g. SAVE20)"
                        className="bg-slate-100 border border-slate-200 text-slate-900 text-xs px-3 py-2 rounded-xl flex-1 outline-none uppercase font-mono font-bold focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleApplyCoupon()}
                        disabled={isApplyingCoupon || !couponInput}
                        className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['WELCOME50', 'SAVE20', 'GREENZET100'].map((code) => (
                        <button
                          key={code}
                          onClick={() => handleApplyCoupon(code)}
                          className="text-[10px] font-mono font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg transition-colors"
                        >
                          + {code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Bill & Checkout */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
              {/* Bill Details */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>To Pay</span>
                  <span className="text-base text-emerald-700">₹{totalAmount.toFixed(2)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 text-center py-1 rounded-lg">
                    🎉 Total Savings: ₹{Math.round(totalSavings)} on this order!
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 hover:gap-3 transition-all text-sm active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Safe & Secure Multi-Vendor Checkout</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
