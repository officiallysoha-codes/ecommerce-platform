import React, { createContext, useContext, useState, useEffect } from 'react';
import { orderApi } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { triggerNotification } = useAuth();

  // Cart state persisted to localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('greenzet_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist state persisted to localStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('greenzet_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Delivery zone pincode (Default: Malda 732101)
  const [deliveryPincode, setDeliveryPincode] = useState('732101');
  const [pincodeInfo, setPincodeInfo] = useState({
    serviceable: true,
    city: 'Malda (English Bazar)',
    deliveryFee: 25.0,
    freeDeliveryAbove: 399.0,
    estimatedTimeMins: 30
  });

  // Applied Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('greenzet_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('greenzet_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Add Item to Cart
  const addToCart = (product, qty = 1, selectedVariant = null) => {
    setCartItems(prev => {
      const itemKey = selectedVariant ? `${product.id}-${selectedVariant.id}` : `${product.id}`;
      const existingIndex = prev.findIndex(item => item.itemKey === itemKey);

      const unitPrice = selectedVariant ? selectedVariant.price : product.price;
      const originalPrice = selectedVariant ? selectedVariant.original_price : product.original_price;
      const unit = selectedVariant ? selectedVariant.unit : product.unit;

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + qty;
        if (newQty > product.stock_quantity) {
          triggerNotification('Stock Limit Reached', `Only ${product.stock_quantity} available in stock.`, 'warning');
          return prev;
        }
        updated[existingIndex].quantity = newQty;
        return updated;
      } else {
        return [
          ...prev,
          {
            itemKey,
            productId: product.id,
            variantId: selectedVariant?.id || null,
            title: product.title,
            image: product.image,
            price: unitPrice,
            originalPrice,
            unit,
            sellerId: product.seller_id,
            quantity: qty,
            maxStock: product.stock_quantity
          }
        ];
      }
    });

    triggerNotification('Added to Bag', `${product.title} added to your cart.`, 'success');
  };

  // Update item quantity (+1 / -1)
  const updateQuantity = (itemKey, delta) => {
    setCartItems(prev => {
      return prev
        .map(item => {
          if (item.itemKey === itemKey) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (itemKey) => {
    setCartItems(prev => prev.filter(item => item.itemKey !== itemKey));
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
  };

  // Check pincode serviceability
  const updatePincode = async (pincode) => {
    try {
      const res = await orderApi.checkPincode(pincode);
      if (res.success && res.serviceable) {
        setDeliveryPincode(pincode);
        setPincodeInfo({
          serviceable: true,
          city: res.city,
          deliveryFee: res.deliveryFee,
          freeDeliveryAbove: res.freeDeliveryAbove,
          estimatedTimeMins: res.estimatedTimeMins
        });
        triggerNotification('Location Updated', `Delivering to ${res.city} (${pincode}) in ~${res.estimatedTimeMins} mins.`, 'success');
        return { success: true };
      } else {
        triggerNotification('Unavailable Area', res.message || 'Pincode not serviceable.', 'warning');
        return { success: false, message: res.message };
      }
    } catch (err) {
      triggerNotification('Error', 'Failed to check pincode.', 'error');
      return { success: false, message: err.message };
    }
  };

  // Apply discount coupon
  const applyCoupon = async (code) => {
    try {
      const res = await orderApi.validateCoupon(code, subtotal);
      if (res.success) {
        setAppliedCoupon({
          code: res.code,
          discount: res.discount,
          description: res.description
        });
        triggerNotification('Coupon Applied!', res.message, 'success');
        return { success: true, message: res.message };
      }
    } catch (err) {
      triggerNotification('Invalid Coupon', err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    triggerNotification('Coupon Removed', 'Coupon code has been removed.', 'info');
  };

  // Wishlist actions
  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        triggerNotification('Removed from Wishlist', `${product.title} removed.`, 'info');
        return prev.filter(item => item.id !== product.id);
      } else {
        triggerNotification('Saved to Wishlist', `${product.title} added to wishlist.`, 'success');
        return [...prev, product];
      }
    });
  };

  const isWishlisted = (productId) => wishlist.some(item => item.id === productId);

  // Financial Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const originalSubtotal = cartItems.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
  const productDiscountSavings = Math.max(0, originalSubtotal - subtotal);

  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const isFreeDelivery = (subtotal - couponDiscount) >= (pincodeInfo.freeDeliveryAbove || 399);
  const deliveryFee = cartItems.length === 0 ? 0 : (isFreeDelivery ? 0 : (pincodeInfo.deliveryFee || 25));
  const totalAmount = Math.max(0, subtotal - couponDiscount + deliveryFee);
  const totalSavings = productDiscountSavings + couponDiscount + (isFreeDelivery && cartItems.length > 0 ? (pincodeInfo.deliveryFee || 25) : 0);
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlist,
        deliveryPincode,
        pincodeInfo,
        appliedCoupon,
        isCartDrawerOpen,
        isCheckoutModalOpen,
        subtotal,
        originalSubtotal,
        productDiscountSavings,
        couponDiscount,
        deliveryFee,
        totalAmount,
        totalSavings,
        totalItemsCount,
        isFreeDelivery,
        setIsCartDrawerOpen,
        setIsCheckoutModalOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        updatePincode,
        applyCoupon,
        removeCoupon,
        toggleWishlist,
        isWishlisted,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
