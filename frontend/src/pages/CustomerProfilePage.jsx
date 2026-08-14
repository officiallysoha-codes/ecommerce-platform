import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../services/api';
import {
  User,
  Package,
  Wallet,
  MapPin,
  Clock,
  ArrowRight,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function CustomerProfilePage({ onTrackOrder }) {
  const { user, updateWallet, triggerNotification } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'wallet', 'addresses'
  const [isAddingMoney, setIsAddingMoney] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await orderApi.getMyOrders();
        if (res.success) {
          setOrders(res.orders);
        }
      } catch (err) {
        console.error('Failed to load user orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const handleAddTestWalletMoney = () => {
    setIsAddingMoney(true);
    setTimeout(() => {
      const newBal = (user?.wallet_balance || 0) + 500;
      updateWallet(newBal);
      triggerNotification('Wallet Recharged!', '₹500 added to your GreenZet In-App Wallet for testing.', 'success');
      setIsAddingMoney(false);
    }, 600);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* User Header Profile Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 p-1">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-2xl font-black">{user?.name || 'Customer'}</h2>
              <span className="bg-emerald-500/30 text-emerald-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border border-emerald-400/40">
                Verified Member
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email} • {user?.phone || '+91 9876543214'}</p>
            <p className="text-[11px] text-slate-400 mt-1">Default Delivery: Malda Town (732101)</p>
          </div>
        </div>

        {/* Quick Wallet Info */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center sm:text-right min-w-[200px]">
          <span className="text-xs text-emerald-300 font-semibold block">GreenZet Wallet</span>
          <div className="text-3xl font-black font-mono text-white my-1">
            ₹{user?.wallet_balance?.toFixed(0) || 0}
          </div>
          <button
            onClick={handleAddTestWalletMoney}
            disabled={isAddingMoney}
            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 mx-auto sm:ml-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isAddingMoney ? 'Adding...' : '+ Add ₹500 (Free Test)'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        {[
          { id: 'orders', label: `My Orders (${orders.length})`, icon: Package },
          { id: 'wallet', label: 'Wallet & Cashbacks', icon: Wallet },
          { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-white hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Orders History */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loading ? (
            <div className="h-40 rounded-3xl skeleton-shimmer" />
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800">No Orders Yet</h4>
              <p className="text-xs text-slate-500">Your placed orders will show up here with live delivery status.</p>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      #{ord.order_number}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        ord.order_status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.order_status === 'cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-900 animate-pulse'
                      }`}
                    >
                      {ord.order_status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      • {new Date(ord.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Items snapshot */}
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {ord.items?.map((it) => (
                      <div key={it.id} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border flex-shrink-0 text-xs">
                        <img src={it.product_image} alt="" className="w-7 h-7 rounded-lg object-cover" />
                        <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[120px]">{it.product_title}</span>
                        <span className="text-[10px] text-slate-400">×{it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500">
                    Store: <strong className="text-slate-800">{ord.store_name}</strong> • Payment: <strong className="uppercase">{ord.payment_method}</strong> ({ord.payment_status})
                  </p>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto md:flex-col md:items-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Total Paid</span>
                    <span className="text-lg font-black text-slate-900">₹{ord.final_amount}</span>
                  </div>

                  <button
                    onClick={() => onTrackOrder(ord.order_number)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition-all"
                  >
                    <span>Track Live</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Wallet */}
      {activeTab === 'wallet' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Available Balance</span>
              <div className="text-4xl font-black text-emerald-950 font-mono my-1">
                ₹{user?.wallet_balance?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-emerald-700">Use wallet balance for instant 1-tap zero OTP checkout!</p>
            </div>
            <button
              onClick={handleAddTestWalletMoney}
              disabled={isAddingMoney}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-md transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add ₹500 Free Test Cash</span>
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Wallet Benefits</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">✅ Instant 1-second refunds on order cancellations</li>
              <li className="flex items-center gap-2">✅ 100% Secure automated checkout with zero bank gateway dropouts</li>
              <li className="flex items-center gap-2">✅ Exclusive 5% cashback on weekly vegetable baskets</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: Saved Addresses */}
      {activeTab === 'addresses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500 shadow-sm space-y-2 relative">
            <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              DEFAULT
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Home (Malda Flat)</h4>
            <p className="text-xs text-slate-600">
              Flat 302, Green Valley Apartments, Station Road, English Bazar, Malda - 732101
            </p>
            <p className="text-xs text-slate-500">Phone: +91 98765 43214</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
            <h4 className="font-bold text-slate-900 text-sm">Office (English Bazar)</h4>
            <p className="text-xs text-slate-600">
              Tech Hub Office 4, Commercial Complex, Rathbari More, Malda - 732101
            </p>
            <p className="text-xs text-slate-500">Phone: +91 98765 43214</p>
          </div>
        </div>
      )}

    </div>
  );
}
