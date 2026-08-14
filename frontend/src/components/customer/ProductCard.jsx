import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { Star, Plus, Minus, Heart, Zap, Check, Eye } from 'lucide-react';

export default function ProductCard({ product, onSelectProduct }) {
  const { cartItems, addToCart, updateQuantity, toggleWishlist, isWishlisted } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Check if item is already in cart
  const itemKey = selectedVariant ? `${product.id}-${selectedVariant.id}` : `${product.id}`;
  const cartItem = cartItems.find((item) => item.itemKey === itemKey);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const isFavorite = isWishlisted(product.id);

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayOriginalPrice = selectedVariant ? selectedVariant.original_price : product.original_price;
  const displayUnit = selectedVariant ? selectedVariant.unit : product.unit;
  const discountPercent = displayOriginalPrice > displayPrice
    ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
    : product.discount_percent;

  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300/80 transition-all duration-300 flex flex-col justify-between overflow-hidden group relative">
      
      {/* Top Media & Badges */}
      <div className="relative pt-[75%] bg-slate-50 overflow-hidden cursor-pointer" onClick={() => onSelectProduct(product)}>
        <img
          src={product.image}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md uppercase tracking-wider">
            {discountPercent}% OFF
          </div>
        )}

        {/* Flash Sale Tag */}
        {product.is_flash_sale === 1 && (
          <div className="absolute top-3 right-12 bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-0.5 shadow">
            <Zap className="w-3 h-3 fill-slate-950" /> FLASH
          </div>
        )}

        {/* Wishlist Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-sm ${
            isFavorite
              ? 'bg-rose-500 text-white scale-110'
              : 'bg-white/80 hover:bg-white text-slate-600 hover:text-rose-500'
          }`}
          title="Add to wishlist"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
        </button>

        {/* Low Stock Indicator */}
        {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
          <div className="absolute bottom-2 left-3 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur">
            Only {product.stock_quantity} left!
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider shadow">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Content Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Unit */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px] truncate max-w-[120px]">
              {product.brand || 'GreenZet Fresh'}
            </span>
            <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md text-[11px]">
              {displayUnit}
            </span>
          </div>

          {/* Title */}
          <h4
            onClick={() => onSelectProduct(product)}
            className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-emerald-600 cursor-pointer transition-colors min-h-[2.5rem]"
          >
            {product.title}
          </h4>

          {/* Ratings & Seller */}
          <div className="flex items-center gap-2 mt-1.5 mb-3">
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-1.5 py-0.5 rounded border border-emerald-200/60">
              <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
              <span>{product.rating?.toFixed(1) || '4.5'}</span>
            </div>
            <span className="text-[11px] text-slate-400">({product.review_count || 12} reviews)</span>
          </div>

          {/* Variant pills if available */}
          {product.variants && product.variants.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-3 no-scrollbar">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? null : v)}
                  className={`text-[10px] px-2 py-1 rounded-lg border font-medium transition-all ${
                    (selectedVariant?.id === v.id) || (!selectedVariant && v.unit === product.unit)
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {v.unit}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          {/* Price */}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-slate-900">₹{displayPrice}</span>
              {displayOriginalPrice > displayPrice && (
                <span className="text-xs text-slate-400 line-through font-medium">₹{displayOriginalPrice}</span>
              )}
            </div>
            {displayOriginalPrice > displayPrice && (
              <span className="text-[10px] text-emerald-600 font-semibold block -mt-0.5">
                Save ₹{displayOriginalPrice - displayPrice}
              </span>
            )}
          </div>

          {/* Add / Counter Button */}
          {isOutOfStock ? (
            <button
              disabled
              className="bg-slate-100 text-slate-400 text-xs font-bold px-3 py-2 rounded-xl cursor-not-allowed"
            >
              Unavailable
            </button>
          ) : quantityInCart > 0 ? (
            <div className="flex items-center bg-emerald-600 text-white rounded-xl shadow-md overflow-hidden">
              <button
                onClick={() => updateQuantity(itemKey, -1)}
                className="p-1.5 hover:bg-emerald-700 transition-colors"
                title="Decrease"
              >
                <Minus className="w-4 h-4 stroke-[3]" />
              </button>
              <span className="px-2.5 text-xs font-extrabold">{quantityInCart}</span>
              <button
                onClick={() => updateQuantity(itemKey, 1)}
                className="p-1.5 hover:bg-emerald-700 transition-colors"
                title="Increase"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(product, 1, selectedVariant)}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 hover:border-emerald-600 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>ADD</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
