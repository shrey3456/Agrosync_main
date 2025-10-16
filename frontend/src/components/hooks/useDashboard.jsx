import { useState, useEffect } from 'react';
import { DashboardService } from '../api/dashboardService';

export const useDashboardData = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await DashboardService.getStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard stats. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { stats, loading, error };
};

export const useRecentOrders = (limit = 5) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await DashboardService.getRecentOrders(limit);
        setOrders(data);
        setError(null);
      } catch (err) {
        setError('Failed to load recent orders. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [limit]);

  return { orders, loading, error };
};

export const useRecommendedProducts = (limit = 3) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await DashboardService.getRecommendedProducts(limit);
        setProducts(data);
        setError(null);
      } catch (err) {
        setError('Failed to load recommended products. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [limit]);

  return { products, loading, error };
};

export const useSavedFarms = () => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        setLoading(true);
        const data = await DashboardService.getSavedFarms();
        setFarms(data);
        setError(null);
      } catch (err) {
        setError('Failed to load saved farms. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, []);

  return { farms, loading, error };
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const data = await DashboardService.getNotifications();
        setNotifications(data);
        setError(null);
      } catch (err) {
        setError('Failed to load notifications. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return { notifications, loading, error };
};

export const useAddToCart = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      await DashboardService.addToCart(productId, quantity);
      setSuccess(true);
    } catch (err) {
      setError('Failed to add product to cart. Please try again.');
      console.error(err);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return { addToCart, loading, error, success };
};