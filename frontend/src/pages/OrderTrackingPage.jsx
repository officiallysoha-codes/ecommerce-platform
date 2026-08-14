import React, { useState, useEffect } from 'react';
import { orderApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import InvoiceModal from '../components/common/InvoiceModal';
import {
  Package,
  CheckCircle2,
  Clock,
  Bike,
  MapPin,
  Phone,
  AlertCircle,
  XCircle,
  ArrowLeft,
  Store,
  ShieldCheck,
  Navigation,
  Sparkles,
  Printer
} from 'lucide-react';

const ORDER_STEPS = [
  { key: 'placed', label: 'Order Placed', desc: 'Order received & sent to vendor' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Vendor accepted & is prepping items' },
  { key: 'packed', label: 'Packed & Ready', desc: 'Quality checked & packed in eco-bag' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider is en route to your location' },
  { key: 'delivered', label: 'Delivered', desc: 'Package handed over safely with OTP' }
];

export default function OrderTrackingPage({ orderNumber, onBack }) {
  const { user, triggerNotification, updateWallet } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await orderApi.trackOrder(orderNumber);
      if (res.success) {
        setOrder(res.order);
      }
    } catch (err) {
      setError(err.message || 'Could not find order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 6000); // Polling every 6s for live timeline progression
    return () => clearInterval(interval);
  }, [orderNumber]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? If prepaid, refund will be credited to your GreenZet Wallet immediately.')) {
      return;
    }

    setIsCancelling(true);
    try {
      const res = await orderApi.cancelOrder(order.id, 'Customer requested cancellation.');
      if (res.success) {
        triggerNotification('Order Cancelled', res.message, 'info');
        if (order.payment_status === 'paid') {
          updateWallet((user.wallet_balance || 0) + order.final_amount);
        }
        await fetchOrder();
      }
    } catch (err) {
      triggerNotification('Cancellation Failed', err.message, 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="h-8 w-1/3 rounded-xl skeleton-shimmer" />
        <div className="h-64 rounded-3xl skeleton-shimmer" />
        <div className="h-48 rounded-3xl skeleton-shimmer" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-800">Order Not Found</h3>
        <p className="text-xs text-slate-500">{error || `No tracking data found for #${orderNumber}`}</p>
        <button
          onClick={onBack}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Determine current step index in the 5-stage lifecycle
  const currentStepIdx = ORDER_STEPS.findIndex(s => s.key === order.order_status);
  const isCancelled = order.order_status === 'cancelled';
  const isDelivered = order.order_status === 'delivered';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fadeIn">
      
      {/* Header & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">Order Tracking</h2>
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                #{order.order_number}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Tax Invoice Button */}
          <button
            onClick={() => setIsInvoiceOpen(true)}
            className="text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Tax Invoice</span>
          </button>

          {/* Cancel Button if eligible */}
          {!isCancelled && !isDelivered && (
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl transition-colors"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel'}
            </button>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        order={order}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
      />

      {/* Hero Tracking Banner & Delivery OTP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Status Highlight (2 cols) */}
        <div className="md:col-span-2 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1 rounded-full text-emerald-200">
              <Clock className="w-3.5 h-3.5 animate-spin-slow" /> Estimated Arrival: 25-35 mins
            </span>
            <h3 className="text-2xl sm:text-3xl font-black mt-3 leading-tight">
              {isCancelled
                ? 'Order Has Been Cancelled'
                : isDelivered
                ? '🎉 Package Delivered Safely!'
                : order.order_status === 'out_for_delivery'
                ? '🚀 Rider is On the Way to Your Door!'
                : '👨‍🍳 Preparing Your Fresh Grocery Items'}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-md">
              {isCancelled
                ? 'If this was prepaid, the amount was credited to your in-app wallet.'
                : isDelivered
                ? 'Thank you for shopping with GreenZet! Please enjoy your fresh groceries.'
                : 'Our delivery partner is tracking your route for guaranteed fastest arrival.'}
            </p>
          </div>

          {/* Delivery Address Pill */}
          <div className="mt-6 pt-4 border-t border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-50">
            <MapPin className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">Delivering to:</span>
              <p className="text-emerald-100 text-[11px]">{order.delivery_address?.street}, {order.delivery_address?.city} - {order.delivery_pincode}</p>
            </div>
          </div>
        </div>

        {/* 4-Digit Customer OTP Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between text-center">
          <div>
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-emerald-500/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Customer Delivery OTP
            </span>
            <div className="text-4xl font-black font-mono tracking-widest text-amber-400 my-2">
              {order.delivery_otp}
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Share this secret 4-digit code with the delivery partner upon arrival to verify handover.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
            Payment: <strong className="text-slate-300 uppercase">{order.payment_method}</strong> ({order.payment_status})
          </div>
        </div>

      </div>

      {/* 5-Stage Visual Progress Stepper */}
      {!isCancelled && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-6 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" /> Order Status Journey
          </h3>

          <div className="relative">
            {/* Connecting Bar */}
            <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-slate-100 -z-0">
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(0, (currentStepIdx / (ORDER_STEPS.length - 1)) * 100))}%`
                }}
              />
            </div>

            {/* Stepper Nodes */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2 relative z-10">
              {ORDER_STEPS.map((step, idx) => {
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;

                return (
                  <div key={step.key} className="flex sm:flex-col items-center gap-3 sm:text-center">
                    {/* Node Circle */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> : idx + 1}
                    </div>

                    <div>
                      <h5 className={`text-xs font-bold ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.label}
                      </h5>
                      <p className="text-[10px] text-slate-500 sm:max-w-[120px] sm:mx-auto mt-0.5 hidden sm:block">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Simulated Live Route Map & Delivery Partner Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Simulated GPS Navigation Widget (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-600" /> Live Route Navigation
            </h4>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
              ⚡ Speed: 28 km/h • 1.8 km away
            </span>
          </div>

          {/* Interactive Simulated Map Canvas */}
          <div className="h-60 rounded-2xl bg-slate-900 relative overflow-hidden flex items-center justify-center p-4 border border-slate-800 shadow-inner">
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

            {/* Simulated Road Route Vector */}
            <div className="absolute inset-x-12 top-1/2 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                style={{
                  width: order.order_status === 'delivered' ? '100%' : order.order_status === 'out_for_delivery' ? '70%' : '20%'
                }}
              />
            </div>

            {/* Store Origin Pin */}
            <div className="absolute left-10 top-1/2 -translate-y-1/2 text-center">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg mx-auto">
                <Store className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-slate-300 font-bold block mt-1">Vendor Store</span>
            </div>

            {/* Moving Delivery Partner Bike */}
            {order.order_status !== 'cancelled' && (
              <div
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 text-center"
                style={{
                  left: order.order_status === 'delivered' ? '85%' : order.order_status === 'out_for_delivery' ? '60%' : '22%'
                }}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 animate-pulse">
                  <Bike className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-emerald-300 font-bold block mt-1">Rider Rahul</span>
              </div>
            )}

            {/* Customer Dropoff Pin */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 text-center">
              <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg mx-auto">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-slate-300 font-bold block mt-1">Your Home</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic text-center">
            Simulated hyperlocal GPS telemetry tracking for Malda delivery zone.
          </p>
        </div>

        {/* Order Items & Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" /> Order Summary ({order.items?.length} items)
          </h4>

          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-xs">
                <img src={item.product_image} alt={item.product_title} className="w-10 h-10 rounded-lg object-cover border" />
                <div className="flex-1 truncate">
                  <span className="font-bold text-slate-800 block truncate">{item.product_title}</span>
                  <span className="text-slate-400 text-[10px]">{item.unit} × {item.quantity}</span>
                </div>
                <span className="font-bold text-slate-900">₹{item.total_price}</span>
              </div>
            ))}
          </div>

          {/* Pricing breakdown */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{order.total_amount?.toFixed(2)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Coupon Discount</span>
                <span>-₹{order.discount_amount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>{order.delivery_fee === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${order.delivery_fee}`}</span>
            </div>
            <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-200">
              <span>Total Paid</span>
              <span className="text-emerald-700">₹{order.final_amount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Event Logs History */}
      {order.tracking_timeline && order.tracking_timeline.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Event Audit Log</h4>
          <div className="space-y-3">
            {order.tracking_timeline.map((event, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <span className="font-mono text-slate-400 text-[11px] w-20 flex-shrink-0 pt-0.5">{event.time}</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <div>
                  <strong className="text-slate-900 font-bold">{event.title}</strong>
                  <p className="text-slate-500 text-[11px] mt-0.5">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
