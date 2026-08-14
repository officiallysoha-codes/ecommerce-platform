import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderApi } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  X,
  MapPin,
  Clock,
  CreditCard,
  QrCode,
  Banknote,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, onOrderPlaced }) {
  const {
    cartItems,
    subtotal,
    couponDiscount,
    deliveryFee,
    totalAmount,
    appliedCoupon,
    deliveryPincode,
    pincodeInfo,
    clearCart
  } = useCart();

  const { user, updateWallet, triggerNotification } = useAuth();

  // Form State
  const [address, setAddress] = useState({
    fullName: user?.name || 'Amit Sharma',
    phone: user?.phone || '9876543214',
    street: 'Flat 302, Green Valley Apartments, Station Road',
    city: pincodeInfo.city || 'Malda (English Bazar)',
    state: 'West Bengal',
    pincode: deliveryPincode || '732101'
  });

  const [deliverySlot, setDeliverySlot] = useState('Express (30-45 mins)');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'cod', 'card', 'wallet'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Post Order Success State
  const [placedOrderInfo, setPlacedOrderInfo] = useState(null);

  if (!isOpen) return null;

  const handlePlaceOrder = async () => {
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const orderPayload = {
        items: cartItems.map(item => ({
          productId: item.productId,
          unit: item.unit,
          price: item.price,
          quantity: item.quantity
        })),
        deliveryAddress: address,
        deliveryPincode: address.pincode,
        deliveryTimeSlot: deliverySlot,
        paymentMethod,
        couponCode: appliedCoupon?.code || null
      };

      const res = await orderApi.createOrder(orderPayload);

      if (res.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        // If wallet was used, deduct local balance
        if (paymentMethod === 'wallet') {
          updateWallet((user.wallet_balance || 0) - totalAmount);
        }

        setPlacedOrderInfo(res);
        clearCart();
        triggerNotification('Order Placed Successfully!', `Order #${res.orderNumber} is being processed.`, 'success');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-scaleUp my-8">
        
        {/* Success View */}
        {placedOrderInfo ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                ⚡ Order Confirmed
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Thank You for Your Order!</h3>
              <p className="text-sm text-slate-500 mt-1">
                Order <strong className="text-slate-800 font-mono">#{placedOrderInfo.orderNumber}</strong> has been received by the vendor.
              </p>
            </div>

            {/* 4-Digit Delivery OTP Highlight */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-lg max-w-md mx-auto">
              <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider block">
                🔐 Your Secret Delivery OTP
              </span>
              <div className="text-4xl font-mono font-black tracking-widest my-1 text-amber-300">
                {placedOrderInfo.deliveryOtp}
              </div>
              <p className="text-[11px] text-emerald-100">
                Share this 4-digit OTP with the delivery partner when they arrive at your door.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOrderPlaced(placedOrderInfo.orderNumber);
                }}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 text-sm transition-all"
              >
                <span>Track Live Order Status</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3.5 rounded-2xl text-sm transition-all"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* Main Checkout Form */
          <div>
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Secure Checkout</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="m-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Step 1: Delivery Address */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" /> 1. Delivery Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Receiver Name</label>
                    <input
                      type="text"
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Mobile Phone</label>
                    <input
                      type="text"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600">Street / Flat / Landmark</label>
                    <input
                      type="text"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">City / District</label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Pincode</label>
                    <input
                      type="text"
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Time Slot */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" /> 2. Delivery Time Window
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'Express (30-45 mins)', label: '⚡ 30-Min Express', sub: 'Instant delivery rider' },
                    { id: 'Morning Slot (7 AM - 9 AM)', label: '🌅 Morning Slot', sub: '7:00 AM - 9:00 AM' },
                    { id: 'Evening Slot (5 PM - 8 PM)', label: '🌆 Evening Slot', sub: '5:00 PM - 8:00 PM' },
                  ].map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setDeliverySlot(slot.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        deliverySlot === slot.id
                          ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-xs font-bold">{slot.label}</span>
                      <span className="text-[10px] text-slate-500 font-normal">{slot.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Payment Method */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" /> 3. Select Payment Mode
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* UPI */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      paymentMethod === 'upi'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <span className="block text-xs font-bold">UPI / QR</span>
                  </button>

                  {/* COD */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <span className="block text-xs font-bold">Cash on Delivery</span>
                  </button>

                  {/* Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      paymentMethod === 'card'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <span className="block text-xs font-bold">Cards / Razorpay</span>
                  </button>

                  {/* In-App Wallet */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      paymentMethod === 'wallet'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <span className="block text-xs font-bold">Wallet (₹{user?.wallet_balance?.toFixed(0) || 0})</span>
                  </button>
                </div>

                {/* UPI Interactive Box */}
                {paymentMethod === 'upi' && (
                  <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-xs">
                    <div className="bg-white p-2 rounded-xl">
                      {/* Interactive QR Simulation */}
                      <div className="w-24 h-24 bg-slate-950 rounded-lg flex items-center justify-center p-1">
                        <img
                          src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=greenzet@okaxis&pn=GreenZet&am=100"
                          alt="UPI QR Code"
                          className="w-full h-full rounded"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 text-center sm:text-left flex-1">
                      <span className="text-emerald-400 font-bold">Scan & Pay via GPay / PhonePe / Paytm</span>
                      <p className="text-slate-300 text-[11px]">VPA: <strong className="font-mono text-white">greenzet@okaxis</strong></p>
                      <p className="text-slate-400 text-[10px]">Instant 100% automated payment confirmation upon placing order.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer Summary & Order Button */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500">Total Payable Amount:</span>
                <div className="text-2xl font-black text-slate-900">
                  ₹{totalAmount.toFixed(2)}
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm transition-all hover:scale-105 active:scale-95"
              >
                {isSubmitting ? (
                  <span>Securing Order...</span>
                ) : (
                  <>
                    <span>Place Order & Generate OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
