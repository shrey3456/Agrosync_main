import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import NotificationSystem from '../../components/NotificationSystem';
import {
  Package,
  ShoppingCart,
  Clock,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

// Vibrant colors for charts
const COLORS = [
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Sage
  '#FFEEAD', // Yellow
  '#FF6B6B', // Red
  '#D4A5A5', // Pink
  '#9DC8C8', // Mint
  '#58B19F', // Green
];

function Analytics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    orderDistribution: {},
    monthlyData: [],
    topProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('monthly');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Fetching farmer stats...');
        const response = await axios.get('http://localhost:5000/api/farmer/stats', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          // Log received data for debugging
          console.log('Stats Data:', {
            totalProducts: response.data.stats.totalProducts,
            totalOrders: response.data.stats.totalOrders,
            pendingOrders: response.data.stats.pendingOrders,
            totalRevenue: response.data.stats.totalRevenue,
            orderDistribution: response.data.stats.orderDistribution,
            monthlyData: response.data.stats.monthlyData,
            topProducts: response.data.stats.topProducts
          });

          setStats(response.data.stats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatSalesData = () => {
    if (!stats.monthlyData?.length) return [];
    
    if (timeFrame === 'yearly') {
      return stats.monthlyData.reduce((acc, data) => {
        const year = data.period.split(' ')[1];
        const existingYear = acc.find(item => item.period === year);
        
        if (existingYear) {
          existingYear.orders += data.orders;
        } else {
          acc.push({ period: year, orders: data.orders });
        }
        return acc;
      }, []).sort((a, b) => a.period - b.period);
    }
    
    return stats.monthlyData;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900/90 backdrop-blur-sm p-4 rounded-lg border border-gray-700 shadow-xl">
          <p className="text-lg font-semibold text-teal-400">
            {data.name || data.period}
          </p>
          <p className="text-lg font-semibold text-teal-400">
            {data.quantity ? 
              `Quantity: ${data.quantity}` : 
              data.revenue ? 
                `Revenue: ₹${data.revenue.toLocaleString('en-IN')}` :
                `Orders: ${data.value || data.orders}`
            }
          </p>
        </div>
      );
    }
    return null;
  };

  const StatCard = ({ icon: Icon, label, value }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-teal-800/20"
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-teal-400" />
        <span className="text-gray-300">{label}</span>
      </div>
      {loading ? (
        <div className="w-6 h-6 border-t-2 border-teal-500 rounded-full animate-spin" />
      ) : (
        <p className="text-2xl font-bold text-teal-50">
          {value}
        </p>
      )}
    </motion.div>
  );

  // Prepare chart data with null checks
  const orderStatusData = stats.orderDistribution ? 
    Object.entries(stats.orderDistribution).map(([status, data]) => ({
      name: status,
      value: data.count,
      percentage: data.percentage
    })) : [];

  const topProductsData = stats.topProducts || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] flex items-center justify-center">
        <div className="w-16 h-16 border-t-4 border-teal-500 border-solid rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] pb-20">
      <Navbar />
      <NotificationSystem role="farmer" />
      <div className="pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/farmer')}
            className="mb-8 flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="font-serif text-4xl font-bold tracking-tighter text-teal-50 mb-4">
              Analytics Dashboard
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Track your farm's performance and sales analytics
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              icon={Package}
              label="Total Products"
              value={stats.totalProducts}
            />
            <StatCard 
              icon={ShoppingCart}
              label="Total Orders"
              value={stats.totalOrders}
            />
            <StatCard 
              icon={Clock}
              label="Pending Orders"
              value={stats.pendingOrders}
            />
            <StatCard 
              icon={DollarSign}
              label="Total Revenue"
              value={`₹${stats.totalRevenue?.toFixed(2) || '0.00'}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Most Sold Products Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-teal-800/20"
            >
              <h3 className="text-xl font-bold text-teal-50 mb-6">Most Sold Products</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  {topProductsData.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={topProductsData}
                        dataKey="quantity"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        fill="#8884d8"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                      >
                        {topProductsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      No product data available
                    </div>
                  )}
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Order Status Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-teal-800/20"
            >
              <h3 className="text-xl font-bold text-teal-50 mb-6">Order Status Distribution</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  {orderStatusData.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        fill="#8884d8"
                        labelLine={true}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      No order status data available
                    </div>
                  )}
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Sales Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-teal-800/20 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-teal-50">Sales Trend</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setTimeFrame('monthly')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    timeFrame === 'monthly'
                      ? 'bg-teal-500 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setTimeFrame('yearly')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    timeFrame === 'yearly'
                      ? 'bg-teal-500 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                {formatSalesData().length > 0 ? (
                  <LineChart data={formatSalesData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="period" 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#2DD4BF" 
                      strokeWidth={3}
                      dot={{ fill: '#2DD4BF', strokeWidth: 2 }}
                      activeDot={{ 
                        r: 8, 
                        fill: '#2DD4BF', 
                        stroke: '#fff'
                      }}
                    />
                  </LineChart>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No sales data available
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;