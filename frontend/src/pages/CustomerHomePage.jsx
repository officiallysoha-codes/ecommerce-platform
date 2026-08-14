import React, { useState, useEffect } from 'react';
import HeroBanner from '../components/customer/HeroBanner';
import CategoryBar from '../components/customer/CategoryBar';
import ProductCard from '../components/customer/ProductCard';
import FilterSidebar from '../components/customer/FilterSidebar';
import { productApi } from '../services/api';
import { Sparkles, Zap, Flame, PackageSearch } from 'lucide-react';

export default function CustomerHomePage({
  searchTerm,
  onSelectProduct,
  onCategoryClick,
  categories = [],
  banners = []
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [maxPrice, setMaxPrice] = useState(1200);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [flashOnly, setFlashOnly] = useState(false);

  // Fetch filtered products
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params = {
          sort: sortBy,
          maxPrice: maxPrice < 1200 ? maxPrice : undefined,
          minRating: minRating > 0 ? minRating : undefined,
          inStock: inStockOnly ? 'true' : undefined,
          flashSale: flashOnly ? 'true' : undefined,
          search: searchTerm || undefined,
          category: selectedCategory || undefined
        };
        const res = await productApi.getProducts(params);
        if (res.success) {
          setProducts(res.products);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadProducts();
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchTerm, sortBy, maxPrice, minRating, inStockOnly, flashOnly]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSortBy('newest');
    setMaxPrice(1200);
    setMinRating(0);
    setInStockOnly(false);
    setFlashOnly(false);
  };

  const flashSaleItems = products.filter((p) => p.is_flash_sale === 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fadeIn">
      
      {/* 1. Hero Carousel Banner */}
      {!searchTerm && !selectedCategory && (
        <HeroBanner banners={banners} onBannerClick={(link) => setSelectedCategory('fruits-vegetables')} />
      )}

      {/* 2. Category Filter Bar */}
      <CategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* 3. Flash Sale Section (If active and not filtering) */}
      {!searchTerm && !selectedCategory && flashSaleItems.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white text-orange-600 flex items-center justify-center font-black shadow">
                <Flame className="w-5 h-5 fill-orange-600 text-orange-600 animate-bounce" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Today's Flash Deals</h3>
                <p className="text-xs text-amber-100 font-medium">Extra discounts for next 2 hours only!</p>
              </div>
            </div>
            <span className="hidden sm:inline-block bg-black/30 backdrop-blur px-3 py-1 rounded-full text-xs font-mono font-bold text-amber-200">
              ⚡ LIVE DISCOUNT
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {flashSaleItems.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} onSelectProduct={onSelectProduct} />
            ))}
          </div>
        </div>
      )}

      {/* 4. Main Product Catalog Section */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Filter Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="sticky top-32">
            <FilterSidebar
              sortBy={sortBy}
              setSortBy={setSortBy}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              minRating={minRating}
              setMinRating={setMinRating}
              inStockOnly={inStockOnly}
              setInStockOnly={setInStockOnly}
              flashOnly={flashOnly}
              setFlashOnly={setFlashOnly}
              onResetFilters={handleResetFilters}
              totalResults={products.length}
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{selectedCategory ? selectedCategory.replace(/-/g, ' ').toUpperCase() : 'All Fresh Products'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {searchTerm ? `Search results for "${searchTerm}"` : 'Fresh groceries, dairy & farm staples'}
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              {products.length} items found
            </span>
          </div>

          {loading ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-4 border border-slate-100 space-y-3">
                  <div className="h-48 rounded-2xl skeleton-shimmer" />
                  <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                  <div className="h-4 w-1/2 rounded skeleton-shimmer" />
                  <div className="h-8 rounded-xl skeleton-shimmer" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <PackageSearch className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No matching products found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing your search term or adjusting your price and category filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={onSelectProduct}
                />
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
