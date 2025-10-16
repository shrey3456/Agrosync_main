import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  LogOut, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Home, 
  Edit, 
  Save, 
  X,
  Globe,
  Map,
  FileText,
  Camera,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Use VITE_API_URL (set in your .env file) as the base URL for API calls.
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const initialFormData = {
  name: "",
  email: "",
  bio: "",
  phoneNumber: "",
  pincode: "",
  country: "",
  state: "",
  district: "",
  city: "",
  profileImage: "",
};

const ProfilePage = ({ onLogout }) => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }
      console.log("Fetching profile with token:", token);
      console.log("API Base URL:", API_BASE_URL);
      const { data } = await axios.get(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Profile data:", data);
      
      if (data.success && data.user) {
        const userData = {
          ...data.user,
          // Extract nested location fields
          country: data.user.location?.country || "",
          state: data.user.location?.state || "",
          district: data.user.location?.district || "",
          city: data.user.location?.city || ""
        };
        setFormData(userData);
      } else {
        toast.error("Could not load profile data");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError(error.response?.data?.message || "Failed to load profile");
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // File size validation (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }
    
    // Only allow image file types
    if (!file.type.match('image.*')) {
      toast.error("Please select an image file");
      return;
    }
    
    const formDataImage = new FormData();
    formDataImage.append("profileImage", file);

    try {
      setUploadingImage(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Authentication required");
        return;
      }
      
      const { data } = await axios.put(
        `${API_BASE_URL}/api/users/profile`, 
        formDataImage, 
        {
          headers: { 
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${token}`
          },
        }
      );
      
      if (data.success && data.user) {
        setFormData(prevData => ({ 
          ...prevData, 
          profileImage: data.user.profileImage 
        }));
        toast.success("Profile image updated successfully");
      } else {
        toast.error("Failed to update profile image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(error.response?.data?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Authentication required");
        return;
      }
      
      // Prepare data for submission - email is intentionally excluded (not editable)
      const submissionData = {
        name: formData.name,
        bio: formData.bio,
        phoneNumber: formData.phoneNumber,
        pincode: formData.pincode,
        country: formData.country,
        state: formData.state,
        district: formData.district,
        city: formData.city
      };
      
      console.log("Submitting profile data:", submissionData);
      
      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        submissionData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Profile update response:", response.data);
      
      if (response.data.success && response.data.user) {
        const updatedUser = response.data.user;
        setFormData({
          ...updatedUser,
          // Extract nested location fields
          country: updatedUser.location?.country || "",
          state: updatedUser.location?.state || "",
          district: updatedUser.location?.district || "",
          city: updatedUser.location?.city || ""
        });
        
        toast.success("Profile updated successfully");
        setEditing(false);
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
    navigate("/");
  };

  const goToDashboard = () => {
    const userRole = JSON.parse(localStorage.getItem("user"))?.role || 'consumer';
    switch(userRole) {
      case 'farmer':
        navigate('/farmer');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/consumer');
    }
  };

  const backgroundStyle = {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #0c1816, #0b1f1a)",
     // Account for navbar
    paddingBottom: "40px" // Add bottom padding
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-t-4 border-teal-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-300">Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto bg-red-900/20 backdrop-blur-sm border border-red-500/30 text-white p-8 rounded-xl shadow-lg text-center"
      >
        <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
        <h2 className="text-2xl font-bold mb-4">Error Loading Profile</h2>
        <p className="text-gray-300 mb-6">{error}</p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={fetchUserProfile}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg flex items-center justify-center"
          >
            Try Again
          </button>
          <button
            onClick={onLogout}
            className="bg-red-600/50 hover:bg-red-700/50 text-white px-6 py-3 rounded-lg flex items-center justify-center"
          >
            <LogOut className="mr-2" size={18} />
            Sign Out
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={backgroundStyle} className="px-6">
      <div className="max-w-4xl mx-auto mb-6">
        <button
          onClick={goToDashboard}
          className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <motion.div
        className="max-w-4xl mx-auto bg-gray-900/50 backdrop-blur-sm text-white p-8 rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Profile Header */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-teal-600/10 h-32 rounded-t-xl -mx-8 top-0"></div>
          
          <div className="relative pt-4 flex flex-col md:flex-row items-center">
            <div className="relative group">
              <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-gray-800 shadow-lg ${uploadingImage ? 'opacity-60' : ''}`}>
                <img
                  src={
                    formData.profileImage
                      ? `${API_BASE_URL}${formData.profileImage}`
                      : `https://ui-avatars.com/api/?name=${formData.name || "User"}&size=128&background=1e3a8a&color=ffffff`
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${formData.name || "User"}&size=128&background=1e3a8a&color=ffffff`;
                  }}
                />
                {uploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border-t-2 border-teal-500 border-solid rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <label htmlFor="profileImageUpload" className="absolute bottom-0 right-0 bg-teal-500 hover:bg-teal-600 p-2 rounded-full cursor-pointer shadow-lg transition-all">
                <Camera size={18} />
                <input type="file" id="profileImageUpload" className="hidden" onChange={handleImageUpload} accept="image/*" />
              </label>
            </div>
            
            <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
              <h2 className="text-3xl font-bold">{formData.name || "User"}</h2>
              <p className="text-gray-400 flex items-center justify-center md:justify-start mt-1">
                <Mail size={16} className="mr-2" /> {formData.email}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Member since {formData.createdAt ? new Date(formData.createdAt).toLocaleDateString("en-US", {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        {editing ? (
          <motion.form 
            onSubmit={handleSave} 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/40 border border-gray-600 rounded-lg focus:outline-none cursor-not-allowed"
                    placeholder="Your email address"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact support to update your email.</p>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Your phone number"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">City / Village</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="city"
                    value={formData.city || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Your city or village"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">District</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="district"
                    value={formData.district || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Your district"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">Pincode</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Your pincode"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">State</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Map size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="state"
                    value={formData.state || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Your state"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">Country</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="country"
                    value={formData.country || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Your country"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Bio</label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                  <FileText size={18} className="text-gray-500" />
                </div>
                <textarea
                  name="bio"
                  value={formData.bio || ""}
                  onChange={handleChange}
                  rows={4}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Tell us about yourself"
                ></textarea>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    Save Profile
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <X size={18} className="mr-2" />
                Cancel
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-teal-400">Bio</h3>
              <p className="text-gray-300 whitespace-pre-line">
                {formData.bio || "No bio information available."}
              </p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-teal-400">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Phone size={18} className="text-teal-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-sm">Phone Number</p>
                    <p className="text-white">{formData.phoneNumber || "Not provided"}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail size={18} className="text-teal-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-sm">Email Address</p>
                    <p className="text-white">{formData.email}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-teal-400">Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Home size={18} className="text-teal-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-sm">City / Village</p>
                    <p className="text-white">{formData.city || "Not provided"}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin size={18} className="text-teal-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-sm">District</p>
                    <p className="text-white">{formData.district || "Not provided"}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Map size={18} className="text-teal-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-sm">State</p>
                    <p className="text-white">{formData.state || "Not provided"}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Globe size={18} className="text-teal-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-sm">Country</p>
                    <p className="text-white">{formData.country || "Not provided"}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin size={18} className="text-teal-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-sm">Pincode</p>
                    <p className="text-white">{formData.pincode || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setEditing(true)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg flex items-center justify-center mt-6"
            >
              <Edit size={18} className="mr-2" />
              Edit Profile
            </button>
          </motion.div>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full bg-red-900/50 hover:bg-red-900/70 text-white px-6 py-3 rounded-lg flex items-center justify-center mt-6"
        >
          <LogOut size={18} className="mr-2" />
          Sign Out
        </button>
        
        <ToastContainer 
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </motion.div>
    </div>
  );
};

export default ProfilePage;