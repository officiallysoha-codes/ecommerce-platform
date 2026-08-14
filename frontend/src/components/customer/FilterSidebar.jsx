import React from 'react';
import { SlidersHorizontal, Star, Zap, Check, RotateCcw } from 'lucide-react';

export default function FilterSidebar({
  sortBy,
  setSortBy,
  maxPrice,
  setMaxPrice,
  minRating,
  setMinRating,
  inStockOnly,
  setInStockOnly,
  flashOnly,
  setFlashOnly,
  onResetFilters,
  totalResults = 0
}) {
  return (
    <aside className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-sm">Filters & Sort</h3>
        </div>
        <button
          onClick={onResetFilters}
          className="text-slate-400 hover:text-emerald-600 text-xs font-semibold flex items-center gap-1 transition-colors"
          title="Reset all filters"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium cursor-pointer"
        >
          <option value="newest">✨ Newest Arrivals</option>
          <option value="popular">🔥 Most Popular</option>
          <option value="price-asc">💵 Price: Low to High</option>
          <option value="price-desc">💎 Price: High to Low</option>
          <option value="rating">⭐ Highest Customer Rating</option>
          <option value="discount">🏷️ Biggest Discount %</option>
        </select>
      </div>

      {/* Price Range Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Max Price
          </label>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
            Up to ₹{maxPrice}
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="1200"
          step="25"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
          <span>₹50</span>
          <span>₹600</span>
          <span>₹1200+</span>
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Customer Rating
        </label>
        <div className="space-y-1.5">
          {[
            { stars: 4.5, label: '4.5 ★ & above' },
            { stars: 4.0, label: '4.0 ★ & above' },
            { stars: 3.5, label: '3.5 ★ & above' },
            { stars: 0, label: 'All Ratings' }
          ].map((r) => (
            <button
              key={r.stars}
              onClick={() => setMinRating(r.stars)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                minRating === r.stars
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Star className={`w-3.5 h-3.5 ${r.stars > 0 ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
                <span>{r.label}</span>
              </div>
              {minRating === r.stars && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Toggles */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        {/* In-Stock Only Toggle */}
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900">
            Show In-Stock Only
          </span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
          />
        </label>

        {/* Flash Sale Deals Only */}
        <label className="flex items-center justify-between cursor-pointer group">
          <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Flash Deals Only
          </span>
          <input
            type="checkbox"
            checked={flashOnly}
            onChange={(e) => setFlashOnly(e.target.checked)}
            className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
          />
        </label>
      </div>

      {/* Total match summary */}
      <div className="pt-2 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-400">
          Showing <strong className="text-slate-700">{totalResults}</strong> items
        </p>
      </div>

    </aside>
  );
}
