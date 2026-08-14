import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Users,
  Store,
  Bike,
  Package,
  MapPin,
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Percent,
  Sliders,
  Sparkles
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, triggerNotification } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [pincodes, setPincodes] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'sellers', 'pincodes', 'coupons'

  // New Pincode Modal
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [newPin, setNewPin] = useState({
    pincode: '',
    city: '',
    state: 'West Bengal',
    deliveryFee: 30,
    freeDeliveryAbove: 399,
    estimatedTimeMins: 35
  });

  // New Coupon Modal
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    discountType: 'fixed',
    discountValue: 50,
    minOrderValue: 199,
    maxDiscount: 200
  });

  const loadAdminData = async () => {
    try {
      const [dashRes, sellerRes, pinRes, coupRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getSellers(),
        adminApi.getPincodes(),
        adminApi.getCoupons()
      ]);

      if (dashRes.success) setDashboardData(dashRes);
      if (sellerRes.success) setSellers(sellerRes.sellers);
      if (pinRes.success) setPincodes(pinRes.pincodes);
      if (coupRes.success) setCoupons(coupRes.coupons);
    } catch (err) {
      console.error('Admin portal data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateSellerStatus = async (id, status) => {
    try {
      const res = await adminApi.updateSellerStatus(id, status);
      if (res.success) {
        triggerNotification('Seller Status Updated', res.message, 'success');
        loadAdminData();
      }
    } catch (err) {
      triggerNotification('Update Failed', err.message, 'error');
    }
  };

  const handleUpdateCommission = async (id, currentRate) => {
    const newRate = prompt('Enter new platform commission percentage (0 - 100%):', currentRate);
    if (newRate === null || isNaN(newRate)) return;

    try {
      const res = await adminApi.updateSellerCommission(id, Number(newRate));
      if (res.success) {
        triggerNotification('Commission Updated', res.message, 'success');
        loadAdminData();
      }
    } catch (err) {
      triggerNotification('Update Failed', err.message, 'error');
    }
  };

  const handleAddPincode = async (e) => {
    e.preventDefault();
    try {
      const res = await adminApi.addPincode(newPin);
      if (res.success) {
        triggerNotification('Delivery Zone Added', res.message, 'success');
        setIsPincodeModalOpen(false);
        setNewPin({
          pincode: '',
          city: '',
          state: 'West Bengal',
          deliveryFee: 30,
          freeDeliveryAbove: 399,
          estimatedTimeMins: 35
        });
        loadAdminData();
      }
    } catch (err) {
      triggerNotification('Failed to add pincode', err.message, 'error');
    }
  };

  const handleDeletePincode = async (id) => {
    if (!window.confirm('Delete this delivery pincode?')) return;
    try {
      const res = await adminApi.deletePincode(id);
      if (res.success) {
        triggerNotification('Pincode Removed', 'Pincode deleted from delivery zones.', 'info');
        loadAdminData();
      }
    } catch (err) {
      triggerNotification('Failed', err.message, 'error');
    }
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    try {
      const res = await adminApi.createCoupon(newCoupon);
      if (res.success) {
        triggerNotification('Coupon Created', res.message, 'success');
        setIsCouponModalOpen(false);
        setNewCoupon({
          code: '',
          description: '',
          discountType: 'fixed',
          discountValue: 50,
          minOrderValue: 199,
          maxDiscount: 200
        });
        loadAdminData();
      }
    } catch (err) {
      triggerNotification('Failed', err.message, 'error');
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

  const stats = dashboardData?.stats;
  const recentOrders = dashboardData?.recentOrders || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Super Admin Header Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-white/10 p-1 backdrop-blur border border-white/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-10 h-10 text-purple-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-2xl font-black">Super Admin Command Center</h2>
              <span className="bg-white/20 text-white text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full">
                👑 Master Access
              </span>
            </div>
            <p className="text-xs text-purple-200 mt-1">
              GreenZet Hyperlocal Multi-Vendor Engine • Version 1.0 (2026 Production Ready)
            </p>
            <p className="text-[11px] text-purple-300 mt-0.5">
              Logged in: <strong>{user?.email}</strong> • Full DB & Commission Control
            </p>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center sm:text-right min-w-[220px]">
          <span className="text-xs text-purple-200 font-semibold block">Platform Commission Earned</span>
          <div className="text-3xl font-black font-mono text-emerald-300 my-1">
            ₹{stats?.platformCommission || 0}
          </div>
          <span className="text-[10px] text-purple-200">Across ₹{stats?.totalRevenue || 0} GMV volume</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Total Delivered GMV</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-mono">₹{stats?.totalRevenue || 0}</span>
          <span className="text-[10px] text-emerald-600 block mt-1 font-bold">{stats?.totalOrders || 0} total orders</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Active Sellers</span>
            <Store className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600 font-mono">{stats?.totalSellers || 0}</span>
          <span className="text-[10px] text-slate-400 block mt-1">{stats?.totalProducts || 0} listed products</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Delivery Partners</span>
            <Bike className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-blue-600 font-mono">{stats?.totalDeliveryPartners || 0}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Hyperlocal fleet</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Registered Customers</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black text-purple-600 font-mono">{stats?.totalCustomers || 0}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Active users</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {[
            { id: 'overview', label: `Live Orders Feed (${recentOrders.length})`, icon: Package },
            { id: 'sellers', label: `Vendor Moderation (${sellers.length})`, icon: Store },
            { id: 'pincodes', label: `Delivery Zones (${pincodes.length})`, icon: MapPin },
            { id: 'coupons', label: `Discount Coupons (${coupons.length})`, icon: Tag },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                    : 'bg-white hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'pincodes' && (
          <button
            onClick={() => setIsPincodeModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Serviceable Pincode</span>
          </button>
        )}

        {activeTab === 'coupons' && (
          <button
            onClick={() => setIsCouponModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Coupon</span>
          </button>
        )}
      </div>

      {/* Tab 1: Live Orders Feed */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Platform Recent Orders</h3>
          <div className="space-y-3">
            {recentOrders.map((ord) => (
              <div key={ord.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">#{ord.order_number}</span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase text-[10px]">
                      {ord.order_status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-400">• {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-600">
                    Customer: <strong className="text-slate-900">{ord.customer_name}</strong> • Vendor: <strong>{ord.store_name}</strong> • PIN: <strong>{ord.delivery_pincode}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 font-mono text-base block">₹{ord.final_amount}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">{ord.payment_method} ({ord.payment_status})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Sellers Moderation & Commission Control */}
      {activeTab === 'sellers' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Store Name</th>
                <th className="pb-3">Owner Info</th>
                <th className="pb-3">Pickup Pincode</th>
                <th className="pb-3">Platform Commission</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sellers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3">
                    <strong className="text-slate-900 block text-xs">{s.store_name}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">GST: {s.gst_number || 'NA'} • {s.product_count || 0} products</span>
                  </td>
                  <td className="py-3 text-slate-600">
                    <div>{s.owner_name}</div>
                    <div className="text-[10px] text-slate-400">{s.owner_email}</div>
                  </td>
                  <td className="py-3 font-mono font-bold text-slate-700">{s.pickup_pincode}</td>
                  <td className="py-3">
                    <button
                      onClick={() => handleUpdateCommission(s.id, s.commission_rate)}
                      className="flex items-center gap-1 font-mono font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg border border-purple-200 transition-colors"
                      title="Click to edit commission"
                    >
                      <span>{s.commission_rate}%</span>
                      <Sliders className="w-3 h-3" />
                    </button>
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        s.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-1.5">
                    {s.status === 'approved' ? (
                      <button
                        onClick={() => handleUpdateSellerStatus(s.id, 'suspended')}
                        className="text-rose-600 hover:text-rose-700 text-[11px] font-bold underline"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateSellerStatus(s.id, 'approved')}
                        className="text-emerald-600 hover:text-emerald-700 text-[11px] font-bold underline"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Pincodes Manager */}
      {activeTab === 'pincodes' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Pincode</th>
                <th className="pb-3">City / Hub</th>
                <th className="pb-3">Delivery Fee</th>
                <th className="pb-3">Free Delivery Min</th>
                <th className="pb-3">Avg Arrival</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pincodes.map((pin) => (
                <tr key={pin.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 font-mono font-bold text-slate-900">{pin.pincode}</td>
                  <td className="py-3 text-slate-700 font-medium">{pin.city}, {pin.state}</td>
                  <td className="py-3 font-mono font-bold text-slate-800">₹{pin.delivery_fee}</td>
                  <td className="py-3 font-mono text-emerald-700 font-bold">Above ₹{pin.min_order_free_delivery}</td>
                  <td className="py-3 text-slate-500 font-medium">{pin.estimated_time_mins} mins</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDeletePincode(pin.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Discount Coupons */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <div key={c.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-sm text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200">
                  {c.code}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `₹${c.discount_value} FLAT OFF`}
                </span>
              </div>
              <p className="text-xs text-slate-600">{c.description}</p>
              <p className="text-[11px] text-slate-400">
                Min Order: ₹{c.min_order_value} • Max Cap: ₹{c.max_discount}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Pincode Modal */}
      {isPincodeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add Serviceable Delivery Pincode</h3>
              <button onClick={() => setIsPincodeModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleAddPincode} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">6-Digit Pincode *</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={newPin.pincode}
                  onChange={(e) => setNewPin({ ...newPin, pincode: e.target.value })}
                  placeholder="e.g. 732104"
                  className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none focus:border-purple-500 font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">City / Area Name *</label>
                <input
                  type="text"
                  required
                  value={newPin.city}
                  onChange={(e) => setNewPin({ ...newPin, city: e.target.value })}
                  placeholder="e.g. Malda Town Extension"
                  className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Standard Delivery Fee (₹)</label>
                  <input
                    type="number"
                    value={newPin.deliveryFee}
                    onChange={(e) => setNewPin({ ...newPin, deliveryFee: Number(e.target.value) })}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Free Delivery Min (₹)</label>
                  <input
                    type="number"
                    value={newPin.freeDeliveryAbove}
                    onChange={(e) => setNewPin({ ...newPin, freeDeliveryAbove: Number(e.target.value) })}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 rounded-xl shadow transition-all text-xs"
              >
                Add Delivery Zone
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Create Discount Coupon</h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleAddCoupon} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Code (Uppercase) *</label>
                <input
                  type="text"
                  required
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. FESTIVAL30"
                  className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none uppercase font-mono font-bold focus:border-purple-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  placeholder="30% discount on fresh groceries"
                  className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type</label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none"
                  >
                    <option value="fixed">Fixed Flat ₹</option>
                    <option value="percent">Percentage %</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Value ({newCoupon.discountType === 'percent' ? '%' : '₹'})</label>
                  <input
                    type="number"
                    required
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none font-mono font-bold"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 rounded-xl shadow transition-all text-xs"
              >
                Publish Coupon Code
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
