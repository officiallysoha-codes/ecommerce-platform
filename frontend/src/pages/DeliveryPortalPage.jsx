import React, { useState, useEffect } from 'react';
import { deliveryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bike,
  Navigation,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  Wallet,
  ShieldCheck,
  Power,
  Package,
  Store,
  AlertCircle,
  Sparkles
} from 'lucide-react';

export default function DeliveryPortalPage() {
  const { user, triggerNotification } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // OTP Verification Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  const loadDeliveryData = async () => {
    try {
      const res = await deliveryApi.getDashboard();
      if (res.success) {
        setDashboardData(res);
      }
    } catch (err) {
      console.error('Delivery portal load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryData();
    const interval = setInterval(loadDeliveryData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleOnline = async () => {
    try {
      const res = await deliveryApi.toggleStatus();
      if (res.success) {
        triggerNotification('Status Updated', res.message, 'success');
        loadDeliveryData();
      }
    } catch (err) {
      triggerNotification('Toggle Error', err.message, 'error');
    }
  };

  const handleConfirmPickup = async (orderId) => {
    try {
      const res = await deliveryApi.pickupOrder(orderId);
      if (res.success) {
        triggerNotification('Pickup Confirmed', 'Order marked Out for Delivery! Live navigation started.', 'success');
        loadDeliveryData();
      }
    } catch (err) {
      triggerNotification('Pickup Failed', err.message, 'error');
    }
  };

  const handleCompleteDelivery = async (e) => {
    e.preventDefault();
    if (!enteredOtp || enteredOtp.length !== 4) {
      setOtpError('Please enter a valid 4-digit OTP.');
      return;
    }

    setOtpError('');
    setIsVerifyingOtp(true);

    try {
      const res = await deliveryApi.completeDelivery(selectedOrderId, enteredOtp);
      if (res.success) {
        triggerNotification('Delivery Verified!', res.message, 'success');
        setIsOtpModalOpen(false);
        setEnteredOtp('');
        setSelectedOrderId(null);
        loadDeliveryData();
      }
    } catch (err) {
      setOtpError(err.message || 'OTP verification failed. Please ask the customer for their code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
        <div className="h-8 w-1/4 rounded-xl skeleton-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-3xl skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const partner = dashboardData?.partner;
  const stats = dashboardData?.stats;
  const activeOrders = dashboardData?.activeOrders || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Delivery Rider Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-white/10 p-1 backdrop-blur-md border border-white/20 flex-shrink-0 flex items-center justify-center">
            <Bike className="w-10 h-10 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-2xl font-black">{user?.name || "Rahul Kumar (Express Rider)"}</h2>
              <span className="bg-white/20 text-white text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full">
                {partner?.vehicle_type || 'Bike'} ({partner?.vehicle_number || 'WB-66-AB-4321'})
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-1">
              Zone Hub: <strong>PIN {partner?.assigned_pincode || '732101'} (Malda Town)</strong>
            </p>
            <p className="text-[11px] text-blue-200 mt-0.5">
              License: WB6620210009845 • Payout Rate: <strong className="text-amber-300">₹40 / completed delivery</strong>
            </p>
          </div>
        </div>

        {/* Online Toggle & Earnings */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleOnline}
            className={`px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
              stats?.isOnline
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{stats?.isOnline ? '🟢 Online & Ready' : '⚪ Go Online'}</span>
          </button>

          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center sm:text-right min-w-[140px]">
            <span className="text-[11px] text-blue-200 font-semibold block">Today's Earnings</span>
            <div className="text-2xl font-black font-mono text-white my-0.5">
              ₹{stats?.todayEarnings?.toFixed(0) || 0}
            </div>
            <span className="text-[10px] text-emerald-300">{stats?.totalDeliveries || 0} total drops</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Rider Wallet Balance</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-mono">₹{stats?.walletBalance || 0}</span>
          <span className="text-[10px] text-emerald-600 block mt-1 font-bold">Auto bank transfer weekly</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Active Deliveries</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-blue-600 font-mono">{stats?.activeOrdersCount || 0}</span>
          <span className="text-[10px] text-slate-400 block mt-1">In progress</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Completed Trips</span>
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-mono">{stats?.totalDeliveries || 0}</span>
          <span className="text-[10px] text-slate-400 block mt-1">100% On-time rate</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Rider Rating</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-500 font-mono">4.9 ★</span>
          <span className="text-[10px] text-slate-400 block mt-1">Top rated express partner</span>
        </div>
      </div>

      {/* Active Delivery Orders Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            <span>Assigned Delivery Route Tasks ({activeOrders.length})</span>
          </h3>
          <span className="text-xs text-slate-400">Pincode: {partner?.assigned_pincode || '732101'}</span>
        </div>

        {activeOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <Bike className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800">No Pending Pickups</h4>
            <p className="text-xs text-slate-500">
              {stats?.isOnline
                ? 'You are online! New delivery assignments in your pincode will appear here automatically.'
                : 'You are currently offline. Turn on your status above to receive delivery tasks.'}
            </p>
          </div>
        ) : (
          activeOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-6"
            >
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm bg-slate-100 px-3 py-1 rounded-xl text-slate-900">
                    #{ord.order_number}
                  </span>
                  <span
                    className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-full ${
                      ord.order_status === 'out_for_delivery'
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {ord.order_status === 'out_for_delivery' ? '🚀 En Route to Customer' : '📦 Ready for Store Pickup'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">Payment:</span>
                  <span className="font-bold uppercase text-slate-800 bg-slate-50 px-2 py-0.5 rounded border">
                    {ord.payment_method} ({ord.payment_status})
                  </span>
                  <span className="font-black text-slate-900 font-mono text-sm">₹{ord.final_amount}</span>
                </div>
              </div>

              {/* Waypoints: Pickup Store vs Customer Drop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Store Pickup Point */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                      <Store className="w-3.5 h-3.5" /> 1. Store Pickup Location
                    </span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded font-mono font-bold text-amber-800 border">
                      PIN {ord.store_pincode || '732101'}
                    </span>
                  </div>
                  <strong className="text-slate-900 text-xs block">{ord.store_name}</strong>
                  <p className="text-[11px] text-slate-600">{ord.store_address || 'Station Road Market, Malda'}</p>
                </div>

                {/* Customer Drop Point */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> 2. Customer Delivery Destination
                    </span>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded font-mono font-bold text-emerald-800 border">
                      PIN {ord.delivery_pincode}
                    </span>
                  </div>
                  <strong className="text-slate-900 text-xs block">{ord.customer_name}</strong>
                  <p className="text-[11px] text-slate-600">
                    {ord.delivery_address?.street}, {ord.delivery_address?.city}
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-700">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{ord.customer_phone}</span>
                  </div>
                </div>
              </div>

              {/* Items List Snapshot */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Items to Deliver:</span>
                {ord.items?.map((it) => (
                  <div key={it.id} className="flex justify-between text-slate-700">
                    <span>{it.quantity}× {it.product_title} ({it.unit})</span>
                    <span className="font-mono font-bold">₹{it.total_price}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                {ord.order_status !== 'out_for_delivery' ? (
                  <button
                    onClick={() => handleConfirmPickup(ord.id)}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    <span>Confirm Store Pickup & Start Navigation</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedOrderId(ord.id);
                      setEnteredOtp('');
                      setOtpError('');
                      setIsOtpModalOpen(true);
                    }}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold px-8 py-3.5 rounded-2xl text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Customer OTP & Complete Delivery</span>
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* Customer OTP Verification Modal */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-100 animate-scaleUp">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Enter Customer Delivery OTP</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Ask the customer for the 4-digit OTP shown in their GreenZet tracking screen to confirm handover.
              </p>
            </div>

            {otpError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleCompleteDelivery} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="• • • •"
                  className="w-full text-center text-3xl font-mono font-black tracking-widest bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 focus:border-emerald-500 outline-none text-slate-900"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl text-xs shadow-md"
                >
                  {isVerifyingOtp ? 'Verifying...' : 'Confirm Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
