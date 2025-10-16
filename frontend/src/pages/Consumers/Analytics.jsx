import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Legend
} from 'recharts';
import {
  FiPackage,
  FiDollarSign,
  FiArrowLeft,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';


const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Vibrant colors for different categories
const COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Turquoise
  '#45B7D1', // Blue
  '#96CEB4', // Sage
  '#FFEEAD', // Yellow
  '#D4A5A5', // Pink
  '#9DC8C8', // Mint
  '#58B19F', // Green
];

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFrame, setTimeFrame] = useState('monthly');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalAmount: 0,
    mostBoughtProducts: [],
    spendingAnalysis: [],
    categoryDistribution: [],
    orderFrequency: []
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/orders/stats?timeFrame=${timeFrame}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError('Unable to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeFrame]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <motion.div
          initial={{ opacity: 0, y: 5, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-gray-900/90 backdrop-blur-sm p-4 rounded-lg border border-gray-700 shadow-xl"
        >
          <p className="text-lg font-semibold" style={{ color: '#2DD4BF' }}>
            {data.name || data.period}
          </p>
          <p className="text-lg font-semibold" style={{ color: '#2DD4BF' }}>
            {data.quantity ? 
              `₹${data.totalSpent?.toLocaleString('en-IN')}` : 
              data.orders ? 
                `Orders: ${data.orders}` : 
                `Amount: ₹${data.amount?.toLocaleString('en-IN')}`
            }
          </p>
        </motion.div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] pt-20 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-t-4 border-teal-500 border-solid rounded-full"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] pt-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center text-red-400 p-8 bg-red-900/20 rounded-lg border border-red-500/20"
          >
            {error}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a]">
      <div className="pt-0 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/consumer')}
            className="mb-8 flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-teal-50 mb-4">Order Analytics</h1>
            <p className="text-gray-400">Track your ordering patterns and spending history</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <StatsCard
              icon={<FiPackage className="w-6 h-6" />}
              title="Total Orders"
              value={stats.totalOrders}
            />
            <StatsCard
              icon={<FiDollarSign className="w-6 h-6" />}
              title="Total Spent"
              value={`₹${stats.totalAmount?.toLocaleString('en-IN') || '0'}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Most Bought Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-teal-200/20"
            >
              <h3 className="text-xl font-bold text-teal-50 mb-6">Most Bought Products</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.mostBoughtProducts}
                      dataKey="quantity"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      fill="#8884d8"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${percent.toFixed(1)}%)`}
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {stats.mostBoughtProducts?.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Order Frequency */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-teal-200/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-teal-50">Order Frequency</h3>
                <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-1">
                  <button
                    onClick={() => setTimeFrame('weekly')}
                    className={`px-4 py-2 rounded-md transition-all duration-300 ${
                      timeFrame === 'weekly' 
                        ? 'bg-teal-500/20 text-teal-400' 
                        : 'text-gray-400 hover:text-teal-400'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setTimeFrame('monthly')}
                    className={`px-4 py-2 rounded-md transition-all duration-300 ${
                      timeFrame === 'monthly' 
                        ? 'bg-teal-500/20 text-teal-400' 
                        : 'text-gray-400 hover:text-teal-400'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setTimeFrame('yearly')}
                    className={`px-4 py-2 rounded-md transition-all duration-300 ${
                      timeFrame === 'yearly' 
                        ? 'bg-teal-500/20 text-teal-400' 
                        : 'text-gray-400 hover:text-teal-400'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.orderFrequency || []}>
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
                    <Bar
                      dataKey="orders"
                      fill="#2DD4BF"
                      radius={[4, 4, 0, 0]}
                      animationDuration={2000}
                      animationBegin={0}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Spending Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-teal-200/20 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-teal-50">Spending Analysis</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.spendingAnalysis || []}>
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
                    dataKey="amount" 
                    stroke="#2DD4BF" 
                    strokeWidth={3}
                    dot={{ fill: '#2DD4BF', strokeWidth: 2 }}
                    activeDot={{ 
                      r: 8, 
                      fill: '#2DD4BF', 
                      stroke: '#fff',
                      className: "transform transition-all duration-300 hover:scale-150"
                    }}
                    animationDuration={2000}
                    animationBegin={0}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ icon, title, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ 
      scale: 1.05,
      rotateX: 10,
      rotateY: 10,
      translateZ: 20
    }}
    transition={{ duration: 0.3 }}
    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-teal-200/20 transform hover:shadow-2xl hover:border-teal-400/30"
  >
    <div className="flex items-center gap-3 mb-2">
      <span className="text-teal-400">{icon}</span>
      <span className="text-gray-300">{title}</span>
    </div>
    <p className="text-2xl font-bold text-teal-50">
      {value}
    </p>
  </motion.div>
);

export default Analytics;