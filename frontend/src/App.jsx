import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import RoleSwitcher from './components/common/RoleSwitcher';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import NotificationToast from './components/common/NotificationToast';
import SupportChatModal from './components/common/SupportChatModal';
import CartDrawer from './components/customer/CartDrawer';
import CheckoutModal from './components/customer/CheckoutModal';

import CustomerHomePage from './pages/CustomerHomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import SellerPortalPage from './pages/SellerPortalPage';
import DeliveryPortalPage from './pages/DeliveryPortalPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

import { productApi } from './services/api';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import ProductCard from './components/customer/ProductCard';

function MainAppContent() {
  const { user } = useAuth();
  const { wishlist } = useCart();

  // Active portal tab: 'customer', 'seller', 'delivery', 'admin'
  const [activePortal, setActivePortal] = useState('customer');

  // Customer sub-pages: 'home', 'product-detail', 'track-order', 'profile', 'orders', 'wishlist'
  const [activePage, setActivePage] = useState('home');
  const [selectedProductSlug, setSelectedProductSlug] = useState(null);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState(null);

  // Global search & catalog state
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    async function loadGlobals() {
      try {
        const [catRes, banRes] = await Promise.all([
          productApi.getCategories(),
          productApi.getBanners()
        ]);
        if (catRes.success) setCategories(catRes.categories);
        if (banRes.success) setBanners(banRes.banners);
      } catch (err) {
        console.error('Failed to load global categories/banners:', err);
      }
    }
    loadGlobals();
  }, []);

  const handleSelectProduct = (product) => {
    setSelectedProductSlug(product.slug || product.id);
    setActivePage('product-detail');
  };

  const handleTrackOrder = (orderNum) => {
    setTrackingOrderNumber(orderNum);
    setActivePage('track-order');
  };

  const handleOrderPlaced = (orderNum) => {
    setTrackingOrderNumber(orderNum);
    setActivePage('track-order');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* 1. Global Sticky Role Switcher (Customer / Seller / Delivery / Super Admin) */}
      <RoleSwitcher activeTab={activePortal} setActiveTab={setActivePortal} />

      {/* 2. Customer Portal View */}
      {activePortal === 'customer' && (
        <div className="flex-1 flex flex-col justify-between">
          <Navbar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onOpenCart={() => setIsCartOpen(true)}
            onNavigate={(page) => {
              setActivePage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            activePage={activePage}
            categories={categories}
          />

          <main className="flex-1">
            {/* Page: Home Storefront */}
            {activePage === 'home' && (
              <CustomerHomePage
                searchTerm={searchTerm}
                onSelectProduct={handleSelectProduct}
                categories={categories}
                banners={banners}
              />
            )}

            {/* Page: Product Detail */}
            {activePage === 'product-detail' && (
              <ProductDetailPage
                productSlugOrId={selectedProductSlug}
                onBack={() => setActivePage('home')}
                onSelectProduct={handleSelectProduct}
              />
            )}

            {/* Page: Live Order Tracking */}
            {activePage === 'track-order' && (
              <OrderTrackingPage
                orderNumber={trackingOrderNumber || 'GZ-2026-89412'}
                onBack={() => setActivePage('orders')}
              />
            )}

            {/* Page: Profile & Orders History */}
            {(activePage === 'profile' || activePage === 'orders') && (
              <CustomerProfilePage onTrackOrder={handleTrackOrder} />
            )}

            {/* Page: Wishlist */}
            {activePage === 'wishlist' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                  <button
                    onClick={() => setActivePage('home')}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                    <span>My Saved Wishlist ({wishlist.length})</span>
                  </h2>
                </div>

                {wishlist.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                    <Heart className="w-12 h-12 text-slate-300 mx-auto" />
                    <h4 className="font-bold text-slate-800">Your Wishlist is Empty</h4>
                    <p className="text-xs text-slate-500">Click the heart icon on any product to save items for later.</p>
                    <button
                      onClick={() => setActivePage('home')}
                      className="bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow mt-2"
                    >
                      Browse Catalog
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {wishlist.map((p) => (
                      <ProductCard key={p.id} product={p} onSelectProduct={handleSelectProduct} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>

          <Footer onCategoryClick={() => setActivePage('home')} />

          {/* Customer Cart Drawer */}
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            onProceedToCheckout={() => setIsCheckoutOpen(true)}
          />

          {/* Customer Checkout Modal */}
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            onOrderPlaced={handleOrderPlaced}
          />
        </div>
      )}

      {/* 3. Seller / Vendor Portal View */}
      {activePortal === 'seller' && (
        <main className="flex-1">
          <SellerPortalPage />
        </main>
      )}

      {/* 4. Delivery Partner App View */}
      {activePortal === 'delivery' && (
        <main className="flex-1">
          <DeliveryPortalPage />
        </main>
      )}

      {/* 5. Super Admin Command Center View */}
      {activePortal === 'admin' && (
        <main className="flex-1">
          <AdminDashboardPage />
        </main>
      )}

      {/* Live Global Notification Toast & 24/7 Support */}
      <NotificationToast />
      <SupportChatModal />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainAppContent />
      </CartProvider>
    </AuthProvider>
  );
}
