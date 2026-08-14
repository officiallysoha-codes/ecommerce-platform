import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productApi } from '../services/api';
import ProductCard from '../components/customer/ProductCard';
import {
  Star,
  Plus,
  Minus,
  Heart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Store,
  ChevronRight,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Tag
} from 'lucide-react';

export default function ProductDetailPage({ productSlugOrId, onBack, onSelectProduct }) {
  const { cartItems, addToCart, updateQuantity, toggleWishlist, isWishlisted, deliveryPincode, pincodeInfo } = useCart();
  const { user, triggerNotification } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      try {
        const res = await productApi.getProductByIdOrSlug(productSlugOrId);
        if (res.success) {
          setProduct(res.product);
          setActiveImage(res.product.image);
          if (res.product.variants && res.product.variants.length > 0) {
            setSelectedVariant(res.product.variants[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productSlugOrId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 rounded-3xl skeleton-shimmer" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded-xl skeleton-shimmer" />
            <div className="h-6 w-1/4 rounded-xl skeleton-shimmer" />
            <div className="h-24 w-full rounded-2xl skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Product not found</h3>
        <button
          onClick={onBack}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold text-xs"
        >
          Return to Storefront
        </button>
      </div>
    );
  }

  const isFavorite = isWishlisted(product.id);
  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayOriginalPrice = selectedVariant ? selectedVariant.original_price : product.original_price;
  const displayUnit = selectedVariant ? selectedVariant.unit : product.unit;
  const savings = Math.max(0, displayOriginalPrice - displayPrice);

  const itemKey = selectedVariant ? `${product.id}-${selectedVariant.id}` : `${product.id}`;
  const cartItem = cartItems.find((item) => item.itemKey === itemKey);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const res = await productApi.submitReview(product.id, {
        rating: newRating,
        comment: newComment
      });
      if (res.success) {
        triggerNotification('Review Posted', 'Thank you for your feedback!', 'success');
        setNewComment('');
        // Reload detail to update reviews list
        const reloadRes = await productApi.getProductByIdOrSlug(product.id);
        if (reloadRes.success) setProduct(reloadRes.product);
      }
    } catch (err) {
      triggerNotification('Review Failed', err.message, 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 animate-fadeIn">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <button onClick={onBack} className="hover:text-emerald-600">Home</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="capitalize">{product.category_name}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-bold truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        
        {/* Left: Image Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative pt-[90%] rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden shadow-inner">
            <img
              src={activeImage}
              alt={product.title}
              className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-300"
            />
            {product.discount_percent > 0 && (
              <div className="absolute top-4 left-4 bg-emerald-600 text-white text-xs font-black px-3 py-1 rounded-xl shadow-md uppercase">
                {product.discount_percent}% OFF
              </div>
            )}
            <button
              onClick={() => toggleWishlist(product)}
              className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-all ${
                isFavorite ? 'bg-rose-500 text-white scale-110' : 'bg-white/80 hover:bg-white text-slate-700'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* Thumbnails */}
          {product.gallery && product.gallery.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {product.gallery.map((imgUrl, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`w-16 h-16 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    activeImage === imgUrl ? 'border-emerald-600 shadow-md scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Buy Box & Specs (7 cols) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          <div>
            
            {/* Brand & Seller Info */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                {product.brand || 'GreenZet Farm Direct'}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Store className="w-4 h-4 text-slate-400" />
                <span>Sold by: <strong className="text-slate-800">{product.store_name}</strong></span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 leading-tight">
              {product.title}
            </h1>

            {/* Rating summary */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-lg border border-emerald-200">
                <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                <span>{product.rating?.toFixed(1) || '4.8'}</span>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {product.review_count || 12} Verified Customer Ratings
              </span>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Quality Inspected
              </span>
            </div>

            {/* Price section */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">₹{displayPrice}</span>
              {displayOriginalPrice > displayPrice && (
                <span className="text-base text-slate-400 line-through font-medium">₹{displayOriginalPrice}</span>
              )}
              {savings > 0 && (
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  You Save ₹{savings} ({product.discount_percent}% OFF)
                </span>
              )}
              <span className="text-xs text-slate-400 ml-auto font-medium">Inclusive of all taxes</span>
            </div>

            {/* Pack Size / Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="mt-5 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Pack Size / Quantity:
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 ${
                        selectedVariant?.id === v.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                          : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <span>{v.title}</span>
                      <span className={`font-mono text-[11px] ${selectedVariant?.id === v.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                        ₹{v.price}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Product Description</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Specifications Table */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="mt-5 border border-slate-100 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, val], idx) => (
                      <tr key={key} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="px-4 py-2.5 font-bold text-slate-600 w-1/3 border-r border-slate-100">{key}</td>
                        <td className="px-4 py-2.5 text-slate-800 font-medium">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Express Delivery Callout */}
            <div className="mt-5 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-950">
              <Truck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span>Delivering to pincode <strong>{deliveryPincode}</strong> ({pincodeInfo.city})</span>
                <p className="text-[11px] text-emerald-700 font-bold">⚡ Guaranteed arrival in ~{pincodeInfo.estimatedTimeMins} minutes!</p>
              </div>
            </div>

          </div>

          {/* Action Buy Buttons */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
            {quantityInCart > 0 ? (
              <div className="w-full sm:w-auto flex items-center justify-between bg-emerald-600 text-white rounded-2xl shadow-lg px-4 py-3 gap-6">
                <span className="text-xs font-bold">In Shopping Bag:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(itemKey, -1)}
                    className="p-1 hover:bg-emerald-700 rounded-lg transition-colors"
                  >
                    <Minus className="w-4 h-4 stroke-[3]" />
                  </button>
                  <span className="font-mono font-black text-base">{quantityInCart}</span>
                  <button
                    onClick={() => updateQuantity(itemKey, 1)}
                    className="p-1 hover:bg-emerald-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => addToCart(product, quantity, selectedVariant)}
                className="w-full sm:flex-1 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>Add {displayUnit} to Bag • ₹{displayPrice}</span>
              </button>
            )}

            <button
              onClick={onBack}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-4 rounded-2xl text-xs transition-colors"
            >
              Continue Shopping
            </button>
          </div>

        </div>

      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Customer Ratings & Reviews</h3>
            <p className="text-xs text-slate-500">Real feedback from verified purchasers in Malda & nearby hubs</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
            <span className="text-sm font-black text-emerald-900">{product.rating?.toFixed(1)} / 5</span>
          </div>
        </div>

        {/* Existing Reviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{rev.user_name}</span>
                  <div className="flex items-center text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                <span className="text-[10px] text-slate-400 block">{new Date(rev.created_at).toLocaleDateString()}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">Be the first to review this product!</p>
          )}
        </div>

        {/* Write a Review Form */}
        <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Write a Customer Review</h4>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Your Rating:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRating(star)}
                  className="p-1 text-slate-300 hover:text-amber-400"
                >
                  <Star className={`w-5 h-5 ${star <= newRating ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="How was the quality, freshness, and packaging?"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={isSubmittingReview || !newComment.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Post
            </button>
          </div>
        </form>
      </div>

      {/* Related Products */}
      {product.related && product.related.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Frequently Bought Together</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {product.related.map((rel) => (
              <ProductCard key={rel.id} product={rel} onSelectProduct={onSelectProduct} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
