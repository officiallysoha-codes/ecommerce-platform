/**
 * API Service Client for GreenZet REST API
 * (Analogy: Java HttpClient/Retrofit or Python requests/httpx wrapper)
 */

const BASE_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('greenzet_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Network request failed');
  }
  return data;
}

// Authentication APIs
export const authApi = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  otpLogin: (phone, otp) => request('/auth/otp-login', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
  demoSwitch: (role) => request('/auth/demo-switch', { method: 'POST', body: JSON.stringify({ role }) }),
  getProfile: () => request('/auth/me'),
};

// Customer & Product APIs
export const productApi = {
  getCategories: () => request('/categories'),
  getBanners: () => request('/banners'),
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  getProductByIdOrSlug: (idOrSlug) => request(`/products/${idOrSlug}`),
  submitReview: (productId, reviewData) => request(`/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewData)
  }),
};

// Order & Checkout APIs
export const orderApi = {
  checkPincode: (pincode) => request(`/pincodes/check/${pincode}`),
  validateCoupon: (code, subtotal) => request('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code, subtotal })
  }),
  createOrder: (orderData) => request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  }),
  getMyOrders: () => request('/orders/my-orders'),
  trackOrder: (orderNumber) => request(`/orders/track/${orderNumber}`),
  cancelOrder: (orderId, reason) => request(`/orders/${orderId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),
};

// Seller APIs
export const sellerApi = {
  getDashboard: () => request('/seller/dashboard'),
  getProducts: () => request('/seller/products'),
  createProduct: (productData) => request('/seller/products', {
    method: 'POST',
    body: JSON.stringify(productData)
  }),
  updateProduct: (id, productData) => request(`/seller/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData)
  }),
  deleteProduct: (id) => request(`/seller/products/${id}`, { method: 'DELETE' }),
  getOrders: () => request('/seller/orders'),
  updateOrderStatus: (id, newStatus) => request(`/seller/orders/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ newStatus })
  }),
  requestPayout: (amount) => request('/seller/payout-request', {
    method: 'POST',
    body: JSON.stringify({ amount })
  }),
};

// Delivery Partner APIs
export const deliveryApi = {
  getDashboard: () => request('/delivery/dashboard'),
  toggleStatus: () => request('/delivery/toggle-status', { method: 'POST' }),
  pickupOrder: (id) => request(`/delivery/orders/${id}/pickup`, { method: 'POST' }),
  completeDelivery: (id, otp) => request(`/delivery/orders/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ otp })
  }),
};

// Super Admin APIs
export const adminApi = {
  getDashboard: () => request('/admin/dashboard'),
  getSellers: () => request('/admin/sellers'),
  updateSellerStatus: (id, status) => request(`/admin/sellers/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status })
  }),
  updateSellerCommission: (id, commissionRate) => request(`/admin/sellers/${id}/commission`, {
    method: 'POST',
    body: JSON.stringify({ commissionRate })
  }),
  getDeliveryPartners: () => request('/admin/delivery-partners'),
  getPincodes: () => request('/admin/pincodes'),
  addPincode: (pincodeData) => request('/admin/pincodes', {
    method: 'POST',
    body: JSON.stringify(pincodeData)
  }),
  deletePincode: (id) => request(`/admin/pincodes/${id}`, { method: 'DELETE' }),
  getCoupons: () => request('/admin/coupons'),
  createCoupon: (couponData) => request('/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(couponData)
  }),
};
