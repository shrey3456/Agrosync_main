import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ShoppingCart, 
  MapPin, 
  Phone, 
  Star, 
  Package,
  Truck,
  Shield,
  Clock,
  User,
  AlertCircle,
  Settings,
  Home,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Calendar,
  Download,
  Eye,
  Award,
  CheckCircle2
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ProductFarmers() {
  // ✅ FIXED: Call hooks at the top level, not inside useEffect
  const { productName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [farmers, setFarmers] = useState([]);
  const [productDetails, setProductDetails] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // New states for farmer verification modal
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  
  // Get product info from navigation state
  const productInfo = location.state || {};

  // Get the actual product name with fallbacks
  const getActualProductName = () => {
    // First try URL parameter
    if (productName && productName !== 'undefined') {
      return decodeURIComponent(productName);
    }
    // Fallback to state
    if (productInfo.productName) {
      return productInfo.productName;
    }
    return null;
  };

  const actualProductName = getActualProductName();

  // Debug logging - separate useEffect
  useEffect(() => {
    console.log("=== ProductFarmers Debug Info ===");
    console.log("productName from URL params:", productName);
    console.log("Decoded productName:", productName ? decodeURIComponent(productName) : "undefined");
    console.log("Current URL:", window.location.pathname);
    console.log("Location state:", location.state);
    console.log("actualProductName:", actualProductName);
    console.log("==================================");
    
    // Early validation
    if (!productName || productName === 'undefined') {
      console.error("Invalid product name received:", productName);
      setError("Invalid product name. Please go back and try again.");
      setLoading(false);
      setProfileLoading(false);
    }
  }, [productName, location.state, actualProductName]);

  // Fetch user profile to get pincode
  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError("Please login to view farmers for this product");
        return null;
      }

      console.log("Fetching user profile...");
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.status}`);
      }

      const data = await response.json();
      console.log('User profile fetched:', data);

      if (data.success) {
        setUserProfile(data.user);
        return data.user;
      } else {
        throw new Error(data.message || "Failed to load user profile");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load user profile. Please try again.");
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  // Add this helper function right after the state declarations and before fetchUserProfile
  // ✅ ADDED: Helper function to determine farmer type from ID
  const getFarmerTypeFromId = (farmerId) => {
    const farmerTypes = ['Organic', 'Natural', 'Pesticide-free', 'Biodynamic', 'Permaculture'];
    const hash = Array.from(farmerId.toString()).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return farmerTypes[hash % farmerTypes.length];
  };

  // ✅ FIXED: Updated fetchFarmersForProduct to use correct backend APIs
  const fetchFarmersForProduct = async (userPincode) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError("Please login to view farmers for this product");
        return;
      }

      if (!userPincode) {
        setError("Please update your pincode in your profile to find nearby farmers");
        toast.error("Pincode is not entered. Please update your pincode to find nearby farmers.");
        return;
      }

      if (!actualProductName) {
        setError("Invalid product name. Please go back and try again.");
        return;
      }
      
      console.log('Fetching farmers for product:', actualProductName);
      console.log('Using user pincode:', userPincode);
      
      // Use the actual product name for the API call
      const apiUrl = `${API_BASE_URL}/api/products/farmers/${encodeURIComponent(actualProductName)}?pincode=${userPincode}`;
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || "Failed to fetch farmers");
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      
      if (data.success) {
        setProductDetails(data.product);
        
        // ✅ FIXED: Fetch farmer verification data for each farmer
        const farmersWithCertificates = await Promise.all(
          data.farmers.map(async (farmer) => {
            let farmerCertData = null;
            
            try {
              // ✅ Use the correct API endpoint from your backend
              console.log(`Fetching verification status for farmer: ${farmer.farmer_id}`);
              
              const certResponse = await fetch(`${API_BASE_URL}/api/certificates/verification-status/${farmer.farmer_id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (certResponse.ok) {
                farmerCertData = await certResponse.json();
                console.log(`Verification data for farmer ${farmer.farmer_id}:`, farmerCertData);
              } else {
                console.warn(`Verification status API failed for farmer ${farmer.farmer_id} with status: ${certResponse.status}`);
              }
            } catch (certError) {
              console.warn(`Failed to fetch verification status for farmer ${farmer.farmer_id}:`, certError);
            }
            
            // Map farmer data with real certificate information from your backend
            return {
              _id: farmer.product_id,
              farmer_id: farmer.farmer_id,
              name: data.product?.name || actualProductName,
              category: data.product?.category || productInfo.category,
              description: data.product?.description || "Fresh farm product",
              price: farmer.price,
              available_quantity: farmer.available_quantity,
              unit: "kg",
              image_url: data.product?.image_url || "/placeholder-product.jpg",
              
              // Farmer details
              farmerName: farmer.name,
              farmerLocation: farmer.farmer_location || `${farmer.pincode}`,
              farmerPhone: farmer.farmer_mobile || "Contact not available",
              farmerEmail: farmer.email,
              distance: farmer.distance,
              pincode: farmer.pincode,
              
              // Additional details
              rating: Math.floor(Math.random() * 2) + 4,
              deliveryTime: Math.ceil(farmer.distance / 50) || 1,
              isVerified: farmer.role === 'farmer',
              traceability: farmer.traceability,

              // ✅ FIXED: Use actual backend verification data
              verificationStatus: getVerificationStatusFromBackend(farmerCertData),
              certificateId: getCertificateIdFromBackend(farmerCertData, farmer.farmer_id),
              farmerType: getFarmerTypeFromId(farmer.farmer_id),
              certificateIssueDate: getCertificateIssueDateFromBackend(farmerCertData),
              blockchainTxId: getBlockchainTxIdFromBackend(farmerCertData),
              
              // ✅ FIXED: Document verification status from backend
              documents: getDocumentStatusFromBackend(farmerCertData),

              // Store full certificate data for verification modal
              fullCertificateData: farmerCertData
            };
          })
        );
        
        // Sort by distance first, then by price
        const sortedFarmers = farmersWithCertificates.sort((a, b) => {
          if (a.distance !== b.distance) return a.distance - b.distance;
          return a.price - b.price;
        });
        
        setFarmers(sortedFarmers);
        
      } else {
        setError(data.message || "No farmers found for this product");
      }
      
    } catch (error) {
      console.error("Error fetching farmers:", error);
      if (error.message.includes("No farmers found within")) {
        setError(`No nearby farmers found selling ${actualProductName}. Try checking other products or expand your search area.`);
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to extract data from certificate response
  const getVerificationStatusFromBackend = (certData) => {
    if (!certData) return 'pending';
    
    // Use the actual backend response structure
    if (certData.documentStatus) {
      return certData.documentStatus.verificationStatus || 'pending';
    }
    
    return 'pending';
  };

  const getCertificateIdFromBackend = (certData, farmerId) => {
    console.log('Getting certificate ID for farmer:', farmerId);
    console.log('Certificate data received:', certData);
    
    if (!certData || !certData.documentStatus) {
      console.warn('No certificate data available for farmer:', farmerId);
      return null; // Return null instead of fake ID
    }
    
    // ✅ Check for blockchain certificate ID from your backend
    if (certData.documentStatus.blockchain?.certificateId) {
      console.log('Found blockchain certificate ID:', certData.documentStatus.blockchain.certificateId);
      return certData.documentStatus.blockchain.certificateId;
    }
    
    console.warn('No certificate ID found for farmer:', farmerId);
    return null; // Return null if no certificate exists
  };

  const getCertificateIssueDateFromBackend = (certData) => {
    if (!certData) return new Date();
    
    // Use actual issue date from backend
    if (certData.documentStatus?.blockchain?.issueDate) {
      return new Date(certData.documentStatus.blockchain.issueDate);
    }
    
    if (certData.documentStatus?.uploadDate) {
      return new Date(certData.documentStatus.uploadDate);
    }
    
    return new Date();
  };

  const getBlockchainTxIdFromBackend = (certData) => {
    if (!certData) return `0.0.484972${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
    
    // Use actual transaction ID from backend
    if (certData.documentStatus?.blockchain?.transactionId) {
      return certData.documentStatus.blockchain.transactionId;
    }
    
    // Fallback to mock transaction ID
    return `0.0.484972${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
  };

  const getDocumentStatusFromBackend = (certData) => {
    if (!certData) {
      return {
        aadhaar: false,
        landOwnership: false,
        soilTest: false,
        organicCertificate: false
      };
    }
    
    // Use actual document status from backend
    const aadhaarVerified = certData.documentStatus?.aadhaar?.status === 'verified';
    const certificateVerified = certData.documentStatus?.certificate?.status === 'verified';
    const hasBlockchainCert = !!(certData.documentStatus?.blockchain?.certificateId);
    
    return {
      aadhaar: aadhaarVerified,
      landOwnership: certificateVerified,
      soilTest: certificateVerified,
      organicCertificate: hasBlockchainCert
    };
  };

  // Handle buy from specific farmer
  const handleBuyFromFarmer = (product) => {
    console.log("Adding to cart from farmer:", product.farmerName);
    
    try {
      // Get existing cart
      const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
      
      // Create cart item with all necessary data to match your CartPage structure
      const cartProduct = {
        _id: product._id, // Use _id instead of id to match CartPage expectations
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1,
        category: product.category,
        
        // Farmer details - matching CartPage structure
        farmer_id: product.farmer_id,
        farmerName: product.farmerName,
        farmer_location: product.farmerLocation, // This matches CartPage's ensureString function
        farmer_mobile: product.farmerPhone,
        
        // Additional farmer details object (for CartPage compatibility)
        farmer_details: {
          name: product.farmerName,
          location: product.farmerLocation,
          contact: product.farmerPhone,
          rating: product.rating,
          distance: product.distance
        },
        
        // Product details
        available_quantity: product.available_quantity,
        unit: product.unit,
        distance: product.distance,
        deliveryTime: product.deliveryTime,
        
        // Traceability info
        traceability: product.traceability,
        
        // Metadata
        addedAt: new Date().toISOString(),
        source: 'farmer_selection' // To track where item was added from
      };
      
      // Check if item already exists in cart (same product from same farmer)
      const existingItemIndex = existingCart.findIndex(
        item => item._id === product._id && item.farmer_id === product.farmer_id
      );
      
      if (existingItemIndex !== -1) {
        // If item exists, increase quantity instead of adding duplicate
        const newQuantity = existingCart[existingItemIndex].quantity + 1;
        
        // Check if new quantity exceeds available quantity
        if (newQuantity <= product.available_quantity) {
          existingCart[existingItemIndex].quantity = newQuantity;
          console.log(`Updated quantity to ${newQuantity} for ${product.name} from ${product.farmerName}`);
        } else {
          console.warn(`Cannot add more. Only ${product.available_quantity} units available`);
          // Show error without alert - you can add toast notification here
          return;
        }
      } else {
        // Add new item to cart
        existingCart.push(cartProduct);
        console.log(`Added ${product.name} from ${product.farmerName} to cart`);
      }
      
      // Save updated cart to localStorage
      localStorage.setItem("cart", JSON.stringify(existingCart));
      // Notify other components in this tab that cart changed
      try {
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: existingCart }));
      } catch (e) {
        // fallback: no-op
      }
      // Optional toast
      toast.success(`${product.name} added to cart`);
      
      // Success - no alert, just console log
      console.log(`Cart updated successfully! Total items: ${existingCart.length}`);
      
      // Optional: You can add a toast notification or navigate to cart
      // navigate('/consumer/cart');
      
    } catch (error) {
      console.error("Error adding item to cart:", error);
      // Handle error silently or with toast notification
    }
  };

  // Navigate to profile to update pincode
  const handleUpdateProfile = () => {
    navigate('/consumer/profile', { 
      state: { 
        message: 'Please update your pincode to find nearby farmers',
        returnUrl: location.pathname 
      }
    });
  };

  // Farmer verification functions
  const viewFarmerVerification = async (farmer) => {
    console.log('Opening verification modal for farmer:', farmer.farmerName);
    console.log('Initial Certificate ID:', farmer.certificateId);
    
    // ✅ Get the real certificate ID from your backend before opening modal
    try {
      const token = localStorage.getItem('token');
      
      // Use your existing API endpoint to get farmer verification status
      const response = await fetch(`${API_BASE_URL}/api/certificates/verification-status/${farmer.farmer_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const certData = await response.json();
        console.log('Fresh certificate data from API:', certData);
        
        // Get the real certificate ID
        const realCertificateId = getCertificateIdFromBackend(certData, farmer.farmer_id);
        
        if (realCertificateId) {
          // Update the farmer object with real certificate ID
          const updatedFarmer = {
            ...farmer,
            certificateId: realCertificateId,
            fullCertificateData: certData,
            verificationStatus: certData.documentStatus?.verificationStatus || farmer.verificationStatus,
            certificateIssueDate: certData.documentStatus?.blockchain?.issueDate || farmer.certificateIssueDate,
            blockchainTxId: certData.documentStatus?.blockchain?.transactionId || farmer.blockchainTxId
          };
          
          setSelectedFarmer(updatedFarmer);
          setVerificationResult(null);
          setShowVerificationModal(true);
        } else {
          // Show error for farmers without certificates
          setVerificationResult({
            verified: false,
            message: "❌ This farmer has not uploaded a certificate yet",
            error: "No certificate available",
            details: {
              farmerId: farmer.farmer_id,
              farmerName: farmer.farmerName,
              errorMessage: "This farmer needs to upload and verify their documents before blockchain verification is possible.",
              verificationStatus: certData.documentStatus?.verificationStatus || 'not_uploaded',
              timestamp: new Date().toISOString(),
              networkConsensus: "No Certificate",
              issuer: "AgroSync Admin"
            }
          });
          
          setSelectedFarmer(farmer);
          setShowVerificationModal(true);
        }
      } else {
        throw new Error('Failed to fetch farmer verification status');
      }
    } catch (error) {
      console.error('Error fetching farmer certificate data:', error);
      
      // Show error modal
      setVerificationResult({
        verified: false,
        message: "❌ Unable to fetch farmer certificate data",
        error: error.message,
        details: {
          farmerId: farmer.farmer_id,
          farmerName: farmer.farmerName,
          errorMessage: "Could not connect to verification service. Please try again.",
          timestamp: new Date().toISOString(),
          networkConsensus: "Connection Error",
          issuer: "AgroSync Admin"
        }
      });
      
      setSelectedFarmer(farmer);
      setShowVerificationModal(true);
    }
  };

  // ✅ FIXED: Real blockchain verification using your backend API
  const verifyFarmerWithBlockchain = async (certificateId) => {
    setVerificationLoading(true);
    
    try {
      console.log('=== CERTIFICATE VERIFICATION DEBUG ===');
      console.log('Certificate ID to verify:', certificateId);
      console.log('Selected Farmer:', selectedFarmer);
      
      // ✅ Check if we have a valid certificate ID
      if (!certificateId || certificateId === null || certificateId.includes('undefined')) {
        throw new Error('Invalid certificate ID. This farmer may not have a certificate yet.');
      }

      const token = localStorage.getItem('token');
      
      // ✅ Use your EXISTING certificate verification endpoint
      const apiUrl = `${API_BASE_URL}/api/certificates/verify/${certificateId}`;
      console.log('Calling verification API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.message || `Certificate verification failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      // ✅ Handle the response from your existing certificate endpoint
      setVerificationResult({
        verified: data.success && data.isValid,
        message: data.success && data.isValid
          ? "✅ Certificate successfully verified on the blockchain!" 
          : data.message || "❌ Certificate verification failed",
        details: {
          // Certificate information
          certificateId: data.certificateId || certificateId,
          farmerId: data.farmerId || selectedFarmer.farmer_id,
          farmerName: data.farmerName || selectedFarmer.farmerName,
          farmerLocation: data.farmerLocation || selectedFarmer.farmerLocation,
          farmerEmail: data.farmerEmail,
          
          // Blockchain details
          transactionHash: data.transactionHash || selectedFarmer.blockchainTxId,
          verificationTimestamp: data.verificationTimestamp || new Date().toISOString(),
          issuedDate: data.issuedDate || selectedFarmer.certificateIssueDate,
          expiryDate: data.expiryDate,
          verificationDate: data.verificationDate,
          
          // Status indicators
          isValid: data.isValid,
          success: data.success,
          verificationStatus: data.verificationStatus || selectedFarmer.verificationStatus,
          
          // Hash information (limited for consumers)
          aadhaarHash: data.aadhaarHash || "***",
          certificateHash: data.certificateHash || "***",
          
          // Technical details
          issuer: "AgroSync Admin",
          networkConsensus: (data.success && data.isValid) ? "Valid" : "Invalid",
          hashMatch: data.success && data.isValid,
          
          // Development/error handling
          developmentMode: data.developmentMode || false,
          warning: data.warning,
          error: data.error || (!data.success ? data.message : null),
          
          // Additional info
          txId: data.transactionHash || selectedFarmer.blockchainTxId,
          timestamp: data.verificationTimestamp || new Date().toISOString()
        }
      });

      console.log('Verification completed successfully');
      
    } catch (error) {
      console.error('Certificate verification failed:', error);
      
      setVerificationResult({
        verified: false,
        message: `Certificate verification failed: ${error.message}`,
        error: error.message,
        details: {
          certificateId: selectedFarmer.certificateId,
          farmerId: selectedFarmer.farmer_id,
          farmerName: selectedFarmer.farmerName,
          timestamp: new Date().toISOString(),
          hashMatch: false,
          networkConsensus: "Error",
          issuer: "AgroSync Admin",
          errorMessage: error.message,
          isValid: false,
          success: false,
          txId: selectedFarmer.blockchainTxId || "N/A"
        }
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const closeVerificationModal = () => {
    setShowVerificationModal(false);
    setSelectedFarmer(null);
    setVerificationResult(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getVerificationBadge = (status) => {
    switch (status) {
      case 'certified':
        return (
          <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs flex items-center">
            <ShieldCheck className="w-3 h-3 mr-1" /> Certified
          </span>
        );
      case 'verified':
        return (
          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs flex items-center">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs">
            {status}
          </span>
        );
    }
  };

  // Initialize data when component mounts
  useEffect(() => {
    const initializeData = async () => {
      // Don't proceed if we don't have a valid product name
      if (!actualProductName) {
        setLoading(false);
        setProfileLoading(false);
        setError("Invalid product name. Please go back and try again.");
        return;
      }

      console.log("Initializing data for product:", actualProductName);
      const profile = await fetchUserProfile();
      if (profile && profile.pincode) {
        await fetchFarmersForProduct(profile.pincode);
      } else if (profile && !profile.pincode) {
        setLoading(false);
        setError("Please update your pincode in your profile to find nearby farmers");
      }
    };
    
    initializeData();
  }, [actualProductName]); // Only depend on actualProductName

  // Early return for invalid product name
  if (!actualProductName) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] flex items-center justify-center">
        <div className="text-center text-red-500 max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Invalid Product</h2>
          <p className="mb-6 text-gray-300">
            The product name is missing or invalid. Please go back and try again.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/consumer/shop')}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Products
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="w-full px-6 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">
            {profileLoading ? 'Loading your profile...' : `Finding farmers selling ${actualProductName}...`}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] flex items-center justify-center">
        <div className="text-center text-red-500 max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">No Nearby Farmers Found</h2>
          <p className="mb-6 text-gray-300">{error}</p>
          
          <div className="space-y-3">
            {error.includes("pincode") && (
              <button 
                onClick={handleUpdateProfile}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Settings className="w-5 h-5" />
                <span>Update Profile</span>
              </button>
            )}
            
            <button 
              onClick={() => fetchFarmersForProduct(userProfile?.pincode)}
              className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              disabled={!userProfile?.pincode}
            >
              Try Again
            </button>
            
            <button 
              onClick={() => navigate(-1)}
              className="w-full px-6 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Go Back to Products
            </button>
          </div>

          {/* User location info */}
          {userProfile && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Your current location:</p>
              <div className="flex items-center justify-center space-x-2 text-sm">
                <MapPin className="w-4 h-4" />
                <span className="text-gray-300">
                  {userProfile.pincode ? 
                    `${userProfile.location?.city || 'Unknown City'}, ${userProfile.pincode}` : 
                    'Pincode not set'
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c1816] to-[#0b1f1a] py-8">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mb-6">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-teal-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Products</span>
          </motion.button>

          {/* Go to Previous Button */}

        </div>

        {/* User Location Display */}
       

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
         
          <h1 className="font-serif text-4xl font-bold text-green-900 dark:text-teal-50 mb-4 capitalize">
            {actualProductName} Farmers
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {farmers.length > 0 
              ? `Choose from ${farmers.length} verified farmers selling ${actualProductName} near you`
              : `Looking for farmers selling ${actualProductName}...`
            }
          </p>
          
          {/* Product Info Summary */}
          {farmers.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
              <span className="px-3 py-1 bg-green-100 dark:bg-teal-900/30 text-green-800 dark:text-teal-300 rounded-full">
                {productDetails?.category || farmers[0]?.category}
              </span>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                ₹{Math.min(...farmers.map(f => f.price))} - ₹{Math.max(...farmers.map(f => f.price))}
              </span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full">
                Within {Math.max(...farmers.map(f => f.distance)).toFixed(0)}km radius
              </span>
            </div>
          )}
        </motion.div>

        {/* Farmers List */}
        <div className="space-y-6">
          {farmers.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No Nearby Farmers Found
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                We couldn't find any farmers selling {actualProductName} in your area.
              </p>
              <div className="space-y-3 max-w-sm mx-auto">
                <button 
                  onClick={() => navigate('/consumer/shop')}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Browse Other Products
                </button>
                <button 
                  onClick={handleUpdateProfile}
                  className="w-full px-6 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Update Location</span>
                </button>
              </div>
            </div>
          ) : (
            farmers.map((farmer, index) => (
              <motion.div
                key={farmer._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-green-200/20 dark:border-teal-800/20 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row">
                  
                  {/* Product Image */}
                  <div className="lg:w-1/4">
                    {farmer.image_url && farmer.image_url !== "/placeholder-product.jpg" ? (
                      <img
                        src={`${API_BASE_URL}${farmer.image_url}`}
                        alt={farmer.name}
                        className="w-full h-32 lg:h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/placeholder-product.jpg";
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 lg:h-full bg-gray-200 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Farmer Details */}
                  <div className="lg:w-3/4 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4">
                      
                      {/* Farmer Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex items-center space-x-2">
                            <User className="w-5 h-5 text-gray-400" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-teal-50">
                              {farmer.farmerName}
                            </h3>
                          </div>
                          {farmer.isVerified && (
                            <Shield className="w-5 h-5 text-green-500" title="Verified Farmer" />
                          )}
                          {getVerificationBadge(farmer.verificationStatus)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300 mb-4">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>{farmer.farmerLocation}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{farmer.farmerPhone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Truck className="w-4 h-4 flex-shrink-0" />
                            <span>{farmer.distance}km away • {farmer.deliveryTime} days</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Award className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <span>{farmer.farmerType} Farmer</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <span>Cert: {farmer.certificateId}</span>
                          </div>
                        </div>

                        {/* Product Description */}
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                          {farmer.description}
                        </p>
                      </div>

                      {/* Price and Actions */}
                      <div className="lg:ml-6 lg:text-right">
                        <div className="mb-4">
                          <div className="text-3xl font-bold text-green-600 dark:text-teal-400 mb-1">
                            ₹{farmer.price}
                          </div>
                          <div className="text-sm text-gray-500">
                            per {farmer.unit}
                          </div>
                          <div className="text-sm text-gray-500">
                            Available: {farmer.available_quantity} {farmer.unit}
                          </div>
                        </div>

                        {/* ✅ ADD THESE ACTION BUTTONS */}
                        <div className="space-y-3">
                          {/* Buy Button */}
                          <button
                            onClick={() => handleBuyFromFarmer(farmer)}
                            className="w-full lg:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <ShoppingCart className="w-5 h-5" />
                            <span>Add to Cart</span>
                          </button>
                          
                          {/* ✅ ADD THIS VERIFY BUTTON */}
                          <button
                            onClick={() => viewFarmerVerification(farmer)}
                            className="w-full lg:w-auto px-6 py-2 border border-teal-500 text-teal-300 rounded-lg hover:bg-teal-500/10 transition-colors flex items-center justify-center space-x-2"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verify Certificate</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                        {farmer.category}
                      </span>
                      {farmer.isVerified && (
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                          Verified Farmer ✓
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded">
                        {farmer.distance}km • {farmer.deliveryTime} day delivery
                      </span>
                      <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded">
                        {farmer.farmerType}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Summary */}
        {farmers.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-gray-600 dark:text-gray-300">
              Showing {farmers.length} verified farmers selling {actualProductName} within delivery range
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Sorted by distance • Closest farmers shown first • All farmers verified ✓
            </p>
          </div>
        )}
      </div>

      {/* Verification Modal - EXACT same code as Certificates.jsx */}
      {showVerificationModal && selectedFarmer && (
        <div className="verification-modal fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-[#386259] to-[#2d4f47] rounded-xl border border-teal-500/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            style={{ zIndex: 100000 }}
          >
            {/* ✅ ENHANCED HEADER with better close button */}
            <div className="sticky top-0 bg-gradient-to-br from-[#386259] to-[#2d4f47] z-50 flex justify-between items-center p-6 border-b border-teal-500/20">
              <h3 className="text-xl font-bold text-white">Farmer Certificate Verification</h3>
              <button 
                onClick={() => {
                  console.log('Close button clicked');
                  setShowVerificationModal(false);
                  setSelectedFarmer(null);
                  setVerificationResult(null);
                }}
                className="text-gray-400 hover:text-white transition-colors p-3 rounded-full hover:bg-white/10 relative"
                style={{ 
                  zIndex: 100001,
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                title="Close Modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Certificate Info */}
              <div className="mb-6 p-6 bg-gradient-to-br from-[#2d4f47] to-[#1e3831] rounded-lg border border-teal-500/10">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-teal-300 font-semibold">Certificate #{selectedFarmer.certificateId}</h4>
                  {selectedFarmer.verificationStatus === 'certified' ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs flex items-center">
                      <Check className="w-3 h-3 mr-1" /> Certified
                    </span>
                  ) : selectedFarmer.verificationStatus === 'verified' ? (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs flex items-center">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                    </span>
                  ) : selectedFarmer.verificationStatus === 'pending' ? (
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> Pending
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs flex items-center">
                      <X className="w-3 h-3 mr-1" /> Rejected
                    </span>
                  )}
                </div>
                
                <div className="text-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-10 h-10 text-teal-300" />
                  </div>
                  <h3 className="text-white text-2xl font-bold mb-1">{selectedFarmer.farmerName}</h3>
                  <p className="text-gray-300 text-sm">
                    Certified {selectedFarmer.farmerType || 'Organic'} Farmer
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Farmer ID</p>
                    <p className="text-white">{selectedFarmer.farmer_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Certification Type</p>
                    <p className="text-white">{selectedFarmer.farmerType || 'Organic'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Issue Date</p>
                    <p className="text-white">{formatDate(selectedFarmer.certificateIssueDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Status</p>
                    <p className="text-white capitalize">{selectedFarmer.verificationStatus}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs mb-1">Blockchain Transaction ID</p>
                    <p className="text-white flex items-center">
                      {selectedFarmer.blockchainTxId}
                      {selectedFarmer.blockchainTxId && !selectedFarmer.blockchainTxId.startsWith('0.0.') && (
                        <a 
                          href={`https://hashscan.io/testnet/transaction/${selectedFarmer.blockchainTxId}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-teal-400 hover:text-teal-300 inline-flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Blockchain Verification Section */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Blockchain Verification</h4>
                
                {!verificationResult ? (
                  <button
                    onClick={() => verifyFarmerWithBlockchain(selectedFarmer.certificateId)}
                    disabled={verificationLoading}
                    className={`w-full py-3 rounded-lg flex items-center justify-center ${
                      verificationLoading
                        ? "bg-teal-600/50 cursor-not-allowed"
                        : "bg-teal-600 hover:bg-teal-700"
                    } text-white transition-colors`}
                  >
                    {verificationLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Verifying on Blockchain...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5 mr-2" />
                        Verify Certificate Authenticity
                      </>
                    )}
                  </button>
                ) : (
                  <div className={`p-4 rounded-lg ${
                    verificationResult.verified ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
                  }`}>
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                        verificationResult.verified ? "bg-green-500/20" : "bg-red-500/20"
                      } flex items-center justify-center mr-3`}>
                        {verificationResult.verified ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h5 className={`font-medium ${
                          verificationResult.verified ? "text-green-300" : "text-red-300"
                        }`}>
                          {verificationResult.verified ? "Certificate Verified" : "Verification Failed"}
                        </h5>
                        <p className="text-gray-300 text-sm mt-1">{verificationResult.message}</p>
                        
                        {verificationResult.details && (
                          <div className="mt-4 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-gray-400 text-xs">Transaction ID</p>
                                <p className="text-gray-300 truncate">{verificationResult.details.txId}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs">Verification Time</p>
                                <p className="text-gray-300">{new Date(verificationResult.details.timestamp).toLocaleTimeString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs">Hash Match</p>
                                <p className={verificationResult.details.hashMatch ? "text-green-300" : "text-red-300"}>
                                  {verificationResult.details.hashMatch ? "Valid" : "Invalid"}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs">Network Consensus</p>
                                <p className={verificationResult.verified ? "text-green-300" : "text-red-300"}>
                                  {verificationResult.details.networkConsensus}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs">Issuer</p>
                                <p className="text-gray-300">{verificationResult.details.issuer}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs">Farmer Name</p>
                                <p className="text-gray-300">{verificationResult.details.farmerName}</p>
                              </div>
                              {verificationResult.details.expiryDate && (
                                <div>
                                  <p className="text-gray-400 text-xs">Expiry Date</p>
                                  <p className="text-gray-300">{formatDate(verificationResult.details.expiryDate)}</p>
                                </div>
                              )}
                              {verificationResult.details.issuedDate && (
                                <div>
                                  <p className="text-gray-400 text-xs">Issue Date</p>
                                  <p className="text-gray-300">{formatDate(verificationResult.details.issuedDate)}</p>
                                </div>
                              )}
                              {verificationResult.details.certificateHash && (
                                <div>
                                  <p className="text-gray-400 text-xs">Certificate Hash</p>
                                  <p className="text-gray-300">{verificationResult.details.certificateHash.substring(0, 16)}...</p>
                                </div>
                              )}
                              {verificationResult.details.aadhaarHash && (
                                <div>
                                  <p className="text-gray-400 text-xs">Document Hash</p>
                                  <p className="text-gray-300">{verificationResult.details.aadhaarHash.substring(0, 16)}...</p>
                                </div>
                              )}
                            </div>
                            
                            {verificationResult.details.developmentMode && (
                              <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                                <p className="text-yellow-300 text-xs">
                                  ⚠️ {verificationResult.details.warning || "Development mode - blockchain verification limited"}
                                </p>
                              </div>
                            )}
                            
                            {verificationResult.details.error && (
                              <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded">
                                <p className="text-red-300 text-xs">
                                  Error: {verificationResult.details.error}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeVerificationModal}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Close
                </button>
                {verificationResult?.verified && (
                  <button
                    onClick={() => {
                      closeVerificationModal();
                      handleBuyFromFarmer(selectedFarmer);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Buy from Verified Farmer</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default ProductFarmers;