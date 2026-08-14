import React from 'react';
import { Apple, Milk, Wheat, Cookie, Coffee, Sparkles, LayoutGrid } from 'lucide-react';

const iconMap = {
  'fruits-vegetables': Apple,
  'dairy-bakery': Milk,
  'atta-rice-dals': Wheat,
  'snacks-munchies': Cookie,
  'beverages': Coffee,
  'personal-care': Sparkles,
};

export default function CategoryBar({ categories = [], selectedCategory, onSelectCategory }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>Shop by Category</span>
        </h3>
        {selectedCategory && (
          <button
            onClick={() => onSelectCategory('')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
          >
            Clear Filter (Show All)
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
        {/* All Products Tab */}
        <button
          onClick={() => onSelectCategory('')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium text-xs whitespace-nowrap transition-all duration-200 shadow-sm border ${
            !selectedCategory
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20 font-bold scale-[1.02]'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>All Groceries</span>
        </button>

        {/* Dynamic Category Chips */}
        {categories.map((cat) => {
          const Icon = iconMap[cat.slug] || Sparkles;
          const isSelected = selectedCategory === cat.slug;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? '' : cat.slug)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-medium text-xs whitespace-nowrap transition-all duration-200 shadow-sm border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20 font-bold scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span>{cat.name}</span>
              {cat.product_count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {cat.product_count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
