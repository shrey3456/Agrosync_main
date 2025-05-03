import axios from 'axios';

// Base URL - adjust if needed
const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:5000";

// Helper to set auth token for requests
const setAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Get cart contents
export const getCart = async () => {
  try {
    setAuthHeader();
    const response = await axios.get(`${API_BASE_URL}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }
};

// Add item to cart
export const addToCart = async (productId, quantity = 1) => {
  try {
    setAuthHeader();
    const response = await axios.post(`${API_BASE_URL}/add`, {
      productId,
      quantity
    });
    return response.data;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

// Other cart functions (update, remove, etc.)
export const updateCartItem = async (itemId, quantity) => {
  try {
    setAuthHeader();
    const response = await axios.put(`${API_BASE_URL}/update`, {
      itemId,
      quantity
    });
    return response.data;
  } catch (error) {
    console.error('Error updating cart:', error);
    throw error;
  }
};

export const removeCartItem = async (itemId) => {
  try {
    setAuthHeader();
    const response = await axios.delete(`${API_BASE_URL}/remove/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

export const clearCart = async () => {
  try {
    setAuthHeader();
    const response = await axios.delete(`${API_BASE_URL}/clear`);
    return response.data;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

export const getCartCount = async () => {
  try {
    setAuthHeader();
    const response = await axios.get(`${API_BASE_URL}/count`);
    return response.data;
  } catch (error) {
    console.error('Error getting cart count:', error);
    throw error;
  }
};

export const applyCoupon = async (couponCode) => {
  try {
    setAuthHeader();
    const response = await axios.post(`${API_BASE_URL}/coupon`, { couponCode });
    return response.data;
  } catch (error) {
    console.error('Error applying coupon:', error);
    throw error;
  }
};