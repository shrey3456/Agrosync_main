import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaArrowLeft, FaUsers, FaBoxOpen } from 'react-icons/fa';

const   FarmersList = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [farmerProducts, setFarmerProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFarmers = async () => {
            try {
                const token = localStorage.getItem('token');
                console.log('Token:', token); // Debug token

                if (!token) {
                    setError('No authentication token found');
                    setLoading(false);
                    return;
                }

                console.log('Making API request to:', `${API_BASE_URL}/api/admin/farmers`);
                
                const response = await axios.get(
                    `${API_BASE_URL}/api/admin/farmers`,
                    { 
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        } 
                    }
                );

                console.log('API Response:', response.data); // Debug response

                if (response.data.success) {
                    setFarmers(response.data.farmers);
                    console.log('Farmers set:', response.data.farmers);
                } else {
                    setError('Failed to fetch farmers data');
                }
                setLoading(false);
            } catch (error) {
                console.error('Error details:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
                setError(error.response?.data?.message || 'Failed to fetch farmers');
                setLoading(false);
            }
        };

        fetchFarmers();
    }, [API_BASE_URL]);

    const handleFarmerClick = async (farmerId) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_BASE_URL}/api/admin/farmers/${farmerId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Farmer products response:', response.data); // Debug response

            if (response.data.success) {
                const farmer = farmers.find(f => f._id === farmerId);
                setSelectedFarmer(farmer);
                setFarmerProducts(response.data.products);
            }
        } catch (error) {
            console.error('Error fetching farmer products:', error);
            setError('Failed to fetch farmer products');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading farmers...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
                <div className="text-red-500 text-xl mb-4">{error}</div>
                <button 
                    onClick={() => navigate('/admin')}
                    className="text-teal-500 hover:text-teal-400"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!farmers || farmers.length === 0) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
                <div className="text-white text-xl mb-4">No farmers found</div>
                <button 
                    onClick={() => navigate('/admin')}
                    className="text-teal-500 hover:text-teal-400"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

        if (selectedFarmer) {
            return (
                <div className="min-h-screen bg-[#0d2321] p-8">
                    <div className="max-w-7xl mx-auto">
                        <button
                            onClick={() => setSelectedFarmer(null)}
                            className="flex items-center text-[#00FFCC] hover:text-[#00e6b8] mb-6"
                        >
                            <FaArrowLeft className="mr-2" /> Back to Farmers List
                        </button>

                        <div className="bg-[#142c29] rounded-2xl p-8 shadow-xl border border-[#1e4742]">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{selectedFarmer.name}</h2>
                                    <div className="flex flex-wrap gap-4 text-gray-300 mb-2">
                                        <span className="flex items-center"><FaEnvelope className="text-[#00FFCC] mr-2" />{selectedFarmer.email}</span>
                                        <span className="flex items-center"><FaPhone className="text-[#00FFCC] mr-2" />{selectedFarmer.phoneNumber || 'N/A'}</span>
                                        <span className="flex items-center"><FaMapMarkerAlt className="text-[#00FFCC] mr-2" />{selectedFarmer.location?.city || 'N/A'}</span>
                                    </div>
                                </div>
                                <span className="bg-[#00FFCC] bg-opacity-10 text-[#00FFCC] px-6 py-3 rounded-xl text-lg font-semibold text-black">
                                    {farmerProducts.length} Products
                                </span>
                            </div>

                            <h3 className="text-2xl font-semibold text-white mb-6">Products by {selectedFarmer.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {farmerProducts.map((product) => (
                                    <div key={product._id} className="bg-[#18312e] rounded-xl overflow-hidden shadow-md border border-[#1e4742]">
                                        <div className="w-full h-48 bg-[#1a3a36] flex items-center justify-center">
                                            {product.image_url ? (
                                                <img
                                                    src={`${API_BASE_URL}${product.image_url}`}
                                                    alt={product.name}
                                                    className="w-full h-48 object-cover rounded-t-xl"
                                                    onError={(e) => {
                                                        e.target.src = '/placeholder-image.png';
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-gray-400">No image</span>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-lg font-semibold text-white">{product.name}</h4>
                                                <span className="bg-[#00FFCC] bg-opacity-10 text-[#00FFCC] px-2 py-1 rounded text-sm font-medium text-black">
                                                    ₹{product.price}/{product.unit}
                                                </span>
                                            </div>
                                            <div className="text-gray-300 space-y-1 text-sm">
                                                <p>Category: {product.category}</p>
                                                <p>Available: {product.available_quantity} {product.unit}</p>
                                                {product.discount > 0 && (
                                                    <p className="text-green-500">Discount: {product.discount}%</p>
                                                )}
                                                {product.traceability && (
                                                    <div className="mt-2 pt-2 border-t border-[#1e4742]">
                                                        <p className="text-xs text-gray-400">Harvest Method: {product.traceability.harvest_method}</p>
                                                        <p className="text-xs text-gray-400">
                                                            Harvest Date: {new Date(product.traceability.harvest_date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                                <p className="text-xs text-gray-400">
                                                    Added: {new Date(product.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
    }

        // Dashboard-style layout
        return (
            <div className="min-h-screen bg-[#0d2321] p-8">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center text-[#00FFCC] hover:text-[#00e6b8] mb-6"
                    >
                        <FaArrowLeft className="mr-2" /> Back to Dashboard
                    </button>

                    <h1 className="text-4xl font-bold text-white mb-2 text-center tracking-tight">Farmers Overview</h1>
                    <p className="text-gray-400 text-center mb-10">Platform Farmers & Product Summary</p>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <div className="bg-[#142c29] rounded-xl p-6 flex flex-col items-center shadow-md">
                            <span className="text-gray-400 text-lg mb-2 flex items-center gap-2">Total Farmers <FaUsers className="inline ml-1 text-[#00FFCC]" /></span>
                            <span className="text-3xl font-bold text-white">{farmers.length}</span>
                        </div>
                        <div className="bg-[#142c29] rounded-xl p-6 flex flex-col items-center shadow-md">
                            <span className="text-gray-400 text-lg mb-2 flex items-center gap-2">Total Products <FaBoxOpen className="inline ml-1 text-[#00FFCC]" /></span>
                            <span className="text-3xl font-bold text-white">{farmers.reduce((acc, f) => acc + (f.totalProducts || 0), 0)}</span>
                        </div>
                        {/* Add more summary cards if needed */}
                    </div>

                    <h2 className="text-2xl font-semibold text-white mb-6">Farmers Directory</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {farmers.map((farmer) => (
                            <div
                                key={farmer._id}
                                className="bg-[#18312e] rounded-2xl p-6 shadow-lg hover:bg-[#1a3a36] cursor-pointer transition-colors duration-200 border border-[#1e4742]"
                                onClick={() => handleFarmerClick(farmer._id)}
                            >
                                <h2 className="text-xl font-bold text-white mb-4">{farmer.name}</h2>
                                <div className="space-y-3">
                                    <div className="flex items-center text-gray-300">
                                        <FaEnvelope className="text-[#00FFCC] mr-2" />
                                        {farmer.email}
                                    </div>
                                    <div className="flex items-center text-gray-300">
                                        <FaPhone className="text-[#00FFCC] mr-2" />
                                        {farmer.phoneNumber || 'N/A'}
                                    </div>
                                    <div className="flex items-center text-gray-300">
                                        <FaMapMarkerAlt className="text-[#00FFCC] mr-2" />
                                        {farmer.location?.city || 'N/A'}
                                    </div>
                                    <div className="mt-4 bg-[#00FFCC] bg-opacity-10 text-[#00FFCC] px-3 py-1 rounded-full text-center text-black">
                                        Total Products: {farmer.totalProducts || 0}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
};

export default FarmersList;