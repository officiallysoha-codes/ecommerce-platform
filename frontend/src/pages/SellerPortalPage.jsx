import React, { useState, useEffect } from 'react';
import { sellerApi, productApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Store,
  Package,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building,
  DollarSign
} from 'lucide-react';

export default function SellerPortalPage() {
  const { user, triggerNotification } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'products', 'payouts', 'settings'

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    categoryId: '1',
    brand: '',
    description: '',
    price: '',
    originalPrice: '',
    unit: '1 kg',
    stockQuantity: 50,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
    isFlashSale: 0
  });

  // Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');

  const loadSellerData = async () => {
    try {
      const [dashRes, prodRes, catRes] = await Promise.all([
        sellerApi.getDashboard(),
        sellerApi.getProducts(),
        productApi.getCategories()
      ]);

      if (dashRes.success) setDashboardData(dashRes);
      if (prodRes.success) setProducts(prodRes.products);
      if (catRes.success) setCategories(catRes.categories);
    } catch (err) {
      console.error('Failed to load seller portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerData();
  }, []);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await sellerApi.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        triggerNotification('Order Updated', `Order status changed to "${newStatus}".`, 'success');
        loadSellerData();
      }
    } catch (err) {
      triggerNotification('Update Failed', err.message, 'error');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await sellerApi.createProduct(newProduct);
      if (res.success) {
        triggerNotification('Product Added', 'Your product is now listed live on GreenZet!', 'success');
        setIsAddModalOpen(false);
        setNewProduct({
          title: '',
          categoryId: '1',
          brand: '',
          description: '',
          price: '',
          originalPrice: '',
          unit: '1 kg',
          stockQuantity: 50,
          image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
          isFlashSale: 0
        });
        loadSellerData();
      }
    } catch (err) {
      triggerNotification('Creation Failed', err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to remove this product?')) return;
    try {
      const res = await sellerApi.deleteProduct(id);
      if (res.success) {
        triggerNotification('Product Deleted', 'Item removed from catalog.', 'info');
        loadSellerData();
      }
    } catch (err) {
      triggerNotification('Delete Failed', err.message, 'error');
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    try {
      const res = await sellerApi.requestPayout(Number(payoutAmount));
      if (res.success) {
        triggerNotification('Payout Transferred!', res.message, 'success');
        setIsPayoutModalOpen(false);
        setPayoutAmount('');
        loadSellerData();
      }
    } catch (err) {
      triggerNotification('Payout Failed', err.message, 'error');
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

  const seller = dashboardData?.seller;
  const stats = dashboardData?.stats;
  const recentOrders = dashboardData?.recentOrders || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Seller Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md flex-shrink-0">
            <img
              src={seller?.store_logo || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80'}
              alt={seller?.store_name}
              className="w-full h-full rounded-xl object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-2xl font-black">{seller?.store_name || "Seller Store"}</h2>
              <span className="bg-white/20 text-white text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full backdrop-blur">
                ⭐ {seller?.rating || '4.9'} Vendor Rating
              </span>
            </div>
            <p className="text-xs text-amber-100 mt-1">
              Pickup Hub: {seller?.business_address} (PIN {seller?.pickup_pincode})
            </p>
            <p className="text-[11px] text-amber-200 mt-0.5">
              Platform Commission: <strong className="text-white">{seller?.commission_rate}%</strong> • GST: {seller?.gst_number || '19ABCDE1234F1Z5'}
            </p>
          </div>
        </div>

        {/* Available Wallet & Withdrawal */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-center sm:text-right min-w-[220px]">
          <span className="text-xs text-amber-200 font-semibold block">Available Seller Earnings</span>
          <div className="text-3xl font-black font-mono text-white my-1">
            ₹{stats?.totalRevenue?.toFixed(0) || 0}
          </div>
          <button
            onClick={() => setIsPayoutModalOpen(true)}
            className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold px-4 py-2 rounded-xl shadow transition-all"
          >
            Bank Withdrawal
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Total Sales Volume</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-mono">₹{stats?.totalSalesVolume || 0}</span>
          <span className="text-[10px] text-emerald-600 block mt-1 font-bold">Lifetime processed</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Pending Orders</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600 font-mono">{stats?.pendingOrders || 0}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Requires confirmation</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Processing / Packed</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-black text-blue-600 font-mono">{stats?.processingOrders || 0}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Ready for pickup</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
            <span>Active Products</span>
            <Store className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-mono">{stats?.totalProducts || 0}</span>
          <span className="text-[10px] text-slate-400 block mt-1">{stats?.lowStockCount || 0} low stock items</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {[
            { id: 'orders', label: `Fulfillment Pipeline (${recentOrders.length})`, icon: Package },
            { id: 'products', label: `Product Catalog (${products.length})`, icon: Store },
            { id: 'settings', label: 'Store KYC & Banking', icon: Building },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-white hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'products' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Tab 1: Orders Pipeline */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {recentOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800">No Orders in Queue</h4>
              <p className="text-xs text-slate-500">When customers place orders from your store, they will show up here.</p>
            </div>
          ) : (
            recentOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      #{ord.order_number}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        ord.order_status === 'placed'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : ord.order_status === 'confirmed'
                          ? 'bg-blue-100 text-blue-800'
                          : ord.order_status === 'packed'
                          ? 'bg-purple-100 text-purple-800'
                          : ord.order_status === 'out_for_delivery'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      Status: {ord.order_status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      • Customer: <strong className="text-slate-700">{ord.customer_name}</strong> ({ord.customer_phone})
                    </span>
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5 pt-1">
                    {ord.items?.map((it) => (
                      <div key={it.id} className="flex items-center gap-2 text-xs text-slate-700">
                        <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center font-bold text-[10px]">
                          {it.quantity}×
                        </span>
                        <span className="font-semibold">{it.product_title}</span>
                        <span className="text-slate-400">({it.unit})</span>
                        <span className="ml-auto font-mono font-bold">₹{it.total_price}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 pt-1">
                    Destination: {ord.delivery_address?.street}, {ord.delivery_address?.city} - PIN {ord.delivery_pincode}
                  </p>
                </div>

                {/* Pipeline Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                  {ord.order_status === 'placed' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, 'confirmed')}
                      className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Order</span>
                    </button>
                  )}

                  {ord.order_status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateOrderStatus(ord.id, 'packed')}
                      className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                    >
                      <Package className="w-4 h-4" />
                      <span>Mark as Packed & Ready</span>
                    </button>
                  )}

                  {ord.order_status === 'packed' && (
                    <div className="text-xs font-bold text-purple-700 bg-purple-50 px-4 py-2.5 rounded-xl border border-purple-200">
                      ⚡ Waiting for Delivery Partner Pickup
                    </div>
                  )}

                  {ord.order_status === 'out_for_delivery' && (
                    <div className="text-xs font-bold text-teal-700 bg-teal-50 px-4 py-2.5 rounded-xl border border-teal-200">
                      🚀 Out for Delivery with Rider
                    </div>
                  )}

                  {ord.order_status === 'delivered' && (
                    <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Delivered & Settled
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Products Catalog */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Product</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Stock</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 flex items-center gap-3">
                    <img src={p.image} alt="" className="w-10 h-10 rounded-xl object-cover border" />
                    <div>
                      <span className="font-bold text-slate-900 block truncate max-w-[200px]">{p.title}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{p.sku || 'SKU-GEN'} • {p.unit}</span>
                    </div>
                  </td>
                  <td className="py-3 text-slate-600 font-medium">{p.category_name}</td>
                  <td className="py-3">
                    <span className="font-bold text-slate-900 font-mono">₹{p.price}</span>
                    {p.original_price > p.price && (
                      <span className="text-[10px] text-slate-400 line-through ml-1.5">₹{p.original_price}</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className={`font-bold font-mono ${p.stock_quantity <= 10 ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {p.stock_quantity} units
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Product"
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

      {/* Tab 3: Store Settings & KYC */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900">Seller KYC & Business Credentials</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border">
              <span className="text-slate-400 font-semibold block">Store Name</span>
              <strong className="text-slate-900 text-sm">{seller?.store_name}</strong>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border">
              <span className="text-slate-400 font-semibold block">Pickup Pincode</span>
              <strong className="text-slate-900 text-sm">{seller?.pickup_pincode} (Malda Hub)</strong>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border">
              <span className="text-slate-400 font-semibold block">GST Registration</span>
              <strong className="text-slate-900 text-sm font-mono">{seller?.gst_number || '19ABCDE1234F1Z5'} (Verified)</strong>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border">
              <span className="text-slate-400 font-semibold block">Settlement Bank Account</span>
              <strong className="text-slate-900 text-sm font-mono">{seller?.bank_account_number || 'A/C 918237461234'} ({seller?.bank_ifsc || 'SBIN0001234'})</strong>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add New Product to Catalog</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  placeholder="e.g. Organic Farm Cucumbers"
                  className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none focus:border-emerald-500 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    placeholder="e.g. GreenZet Fresh"
                    className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="45"
                    className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    value={newProduct.originalPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
                    placeholder="60"
                    className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pack Unit *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    placeholder="1 kg / 500 g"
                    className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={newProduct.stockQuantity}
                  onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: Number(e.target.value) })}
                  className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL (Unsplash or direct image)</label>
                <input
                  type="url"
                  required
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Description</label>
                <textarea
                  rows="2"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Freshly harvested, organic quality..."
                  className="w-full bg-slate-50 border rounded-xl p-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs"
              >
                Publish to Live Marketplace
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payout Withdrawal Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Request Bank Withdrawal</h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500">Available Withdrawable Balance:</span>
                <div className="text-2xl font-black text-emerald-700 font-mono">
                  ₹{stats?.totalRevenue?.toFixed(2) || '0.00'}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Withdrawal Amount (₹) *</label>
                <input
                  type="number"
                  required
                  max={stats?.totalRevenue}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-slate-50 border rounded-xl p-3 outline-none focus:border-emerald-500 font-mono font-bold text-sm"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600">
                Destination: <strong>{seller?.bank_account_number || 'A/C 918237461234'} ({seller?.bank_ifsc || 'SBIN0001234'})</strong>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow transition-all text-xs"
              >
                Confirm Instant Bank Payout
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
