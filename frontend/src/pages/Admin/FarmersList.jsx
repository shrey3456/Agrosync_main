import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaArrowLeft } from 'react-icons/fa';

const FarmersList = () => {
    const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:5000";
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
            <div className="min-h-screen bg-gray-900 p-8">
                <div className="max-w-7xl mx-auto">
                    <button 
                        onClick={() => setSelectedFarmer(null)}
                        className="flex items-center text-teal-500 hover:text-teal-400 mb-6"
                    >
                        <FaArrowLeft className="mr-2" /> Back to Farmers List
                    </button>
                    
                    <div className="bg-gray-800 rounded-lg p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {selectedFarmer.name}'s Products
                            </h2>
                            <span className="bg-teal-500/20 text-teal-500 px-4 py-2 rounded-full">
                                {farmerProducts.length} Products
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {farmerProducts.map((product) => (
                                <div key={product._id} className="bg-gray-700 rounded-lg overflow-hidden">
                                    <div className="aspect-w-16 aspect-h-9">
                                        {product.image_url ? (
                                            <img 
                                                src={`${API_BASE_URL}${product.image_url}`}
                                                alt={product.name}
                                                className="w-full h-48 object-cover"
                                                onError={(e) => {
                                                    console.log('Image load error:', product.image_url);
                                                    e.target.src = '/placeholder-image.png';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-48 bg-gray-600 flex items-center justify-center">
                                                <span className="text-gray-400">No image</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-semibold text-white">
                                                {product.name}
                                            </h3>
                                            <span className="bg-teal-500/20 text-teal-500 px-2 py-1 rounded text-sm">
                                                ₹{product.price}/{product.unit}
                                            </span>
                                        </div>
                                        <div className="text-gray-300 space-y-2">
                                            <p>Category: {product.category}</p>
                                            <p>Available: {product.available_quantity} {product.unit}</p>
                                            {product.discount > 0 && (
                                                <p className="text-green-500">Discount: {product.discount}%</p>
                                            )}
                                            {product.traceability && (
                                                <div className="mt-2 pt-2 border-t border-gray-600">
                                                    <p className="text-sm text-gray-400">Harvest Method: {product.traceability.harvest_method}</p>
                                                    <p className="text-sm text-gray-400">
                                                        Harvest Date: {new Date(product.traceability.harvest_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                            <p className="text-sm text-gray-400">
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

    return (
        <div className="min-h-screen bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                <button 
                    onClick={() => navigate('/admin')}
                    className="flex items-center text-teal-500 hover:text-teal-400 mb-6"
                >
                    <FaArrowLeft className="mr-2" /> Back to Dashboard
                </button>
                
                <h1 className="text-3xl font-bold text-white mb-8 text-center">
                    Farmers Directory
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {farmers.map((farmer) => (
                        <div 
                            key={farmer._id} 
                            className="bg-gray-800 rounded-lg p-6 shadow-lg hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                            onClick={() => handleFarmerClick(farmer._id)}
                        >
                            <h2 className="text-xl font-bold text-white mb-4">{farmer.name}</h2>
                            <div className="space-y-3">
                                <div className="flex items-center text-gray-300">
                                    <FaEnvelope className="text-teal-500 mr-2" />
                                    {farmer.email}
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <FaPhone className="text-teal-500 mr-2" />
                                    {farmer.phoneNumber || 'N/A'}
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <FaMapMarkerAlt className="text-teal-500 mr-2" />
                                    {farmer.location?.city || 'N/A'}
                                </div>
                                <div className="mt-4 bg-teal-500/20 text-teal-500 px-3 py-1 rounded-full text-center">
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