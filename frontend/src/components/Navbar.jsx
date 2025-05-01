import { useNavigate, Link, NavLink, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { X } from 'lucide-react';
import { FiCheck, FiTruck, FiPackage } from 'react-icons/fi';
import NotificationSystem from './NotificationSystem';
import {
  Home,
  ShoppingBasket,
  Users,
  Info,
  LogIn,
  UserPlus,
  User,
  ShoppingCart,
  Settings,
  LogOut,
  Bell,
  ChevronDown
} from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  // Get user data and cart from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserData(user);
      
      // Redirect to the appropriate dashboard if on homepage or login-related pages
      const nonRedirectPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
      if (location.pathname === '/' || nonRedirectPaths.includes(location.pathname)) {
        redirectToDashboard(user.role);
      }
    }
    
    // Get cart count from localStorage
    const cart = localStorage.getItem("cart");
    if (cart) {
      try {
        const cartItems = JSON.parse(cart);
        const itemCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
        setCartCount(itemCount);
      } catch (error) {
        console.error("Error parsing cart data:", error);
      }
    }
  }, [location.pathname]);
  
  // Redirect user to their dashboard based on role
  const redirectToDashboard = (role) => {
    switch(role) {
        case "farmer":
            navigate("/farmer");
            break;
        case "admin":
            navigate("/admin");
            break;
        case "consumer":
            navigate("/consumer");
            break;
        default:
            navigate("/login");
    }
  };
  
  // Listen for cart changes
  useEffect(() => {
    const handleStorageChange = () => {
      const cart = localStorage.getItem("cart");
      if (cart) {
        try {
          const cartItems = JSON.parse(cart);
          const itemCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
          setCartCount(itemCount);
        } catch (error) {
          console.error("Error parsing cart data:", error);
        }
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const navItems = [
    { name: "Home", path: "/", icon: <Home size={18} /> },
    { name: "Marketplace", path: "/marketplace", icon: <ShoppingBasket size={18} /> },
    { name: "Verified Farmers", path: "/farmers", icon: <Users size={18} /> },
    { name: "About", path: "/about", icon: <Info size={18} /> },
  ];

  const toggleProfileDropdown = () => setProfileDropdownOpen(!isProfileDropdownOpen);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
    setUserData(null);
    setCartCount(0);
    
    // Redirect to home page
    navigate("/");
  };

  // Determine profile path based on user role
  const getProfilePath = () => {
    if (!userData) return "/login";
    
    return userData.role === "farmer" 
      ? "/farmer/profile" 
      : userData.role === "consumer"
      ? "/consumer/profile":"/admin/profile";
  };
  
  // Get cart path from localStorage or use default
  const getCartPath = () => {
    return localStorage.getItem("cartPath") || "/consumer/cart";
  };

  const isLoggedIn = !!userData;
  const role = userData?.role || "guest";

  return (
    <header className="bg-gray-900 py-4 px-6 sm:px-10 flex justify-between items-center fixed w-full z-[100] border-b border-gray-700 shadow-lg">
      <div className="text-white text-2xl font-bold flex items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-xl">A</span>
          </div>
          <span className="text-teal-400 font-bold">AgroSync</span>
        </Link>
      </div>

      {/* Desktop navigation */}
      <nav className="flex items-center space-x-8">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `relative flex items-center space-x-1 px-1 py-2 overflow-hidden group ${
                isActive 
                  ? "text-teal-400" 
                  : "text-gray-300 hover:text-teal-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`${
                    isActive ? "text-teal-400" : "text-gray-400 group-hover:text-teal-400"
                  } transition-colors duration-300`}
                >
                  {item.icon}
                </span>
                <span>{item.name}</span>
                <span
                  className={`absolute bottom-0 left-0 w-full h-0.5 transition-all duration-300 ease-in-out transform ${
                    isActive
                      ? "bg-teal-400 scale-x-100"
                      : "bg-teal-500 scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Desktop buttons/user menu */}
      <div className="flex items-center space-x-4">
        {isLoggedIn ? (
          <>
            {/* Cart icon for consumers */}
            {role === "consumer" && (
              <NavLink
                to={getCartPath()}
                className={({ isActive }) =>
                  `relative p-2 rounded-full hover:bg-teal-500/20 ${
                    isActive ? "text-teal-400" : "text-gray-300 hover:text-teal-400"
                  }`
                }
              >
                <div className="relative">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-teal-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
              </NavLink>
            )}
            
            {/* Notification icon */}
            <div className="relative">
              {isLoggedIn && (
                <NotificationSystem 
                  role={userData?.role || 'consumer'} 
                />
              )}
            </div>
            
            {/* User profile dropdown */}
            <div className="relative">
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center space-x-2 text-white bg-black/40 border border-teal-500/50 px-3 py-2 rounded-md hover:bg-teal-500/20 hover:border-teal-400 transition-all duration-300"
              >
                <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-black font-medium text-sm">
                  {userData?.name?.charAt(0) || userData?.email?.charAt(0) || 'U'}
                </div>
                <span className="max-w-[120px] truncate">{userData?.name || userData?.email || "User"}</span>
                <ChevronDown size={16} className={`transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isProfileDropdownOpen && (
                <div className="fixed top-0 right-0 h-full w-80 bg-gray-900 shadow-2xl transform z-[999] border-l border-gray-700"
                    style={{ animation: 'slideIn 0.3s ease-out' }}
                >
                    <div className="p-6">
                        {/* Profile Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white">Profile</h3>
                            <button 
                                onClick={() => setProfileDropdownOpen(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-700">
                            <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-black font-bold text-xl">
                                {userData?.name?.charAt(0) || userData?.email?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <p className="text-white font-medium">{userData?.name || "User"}</p>
                                <p className="text-sm text-gray-400">{userData?.email}</p>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <nav className="space-y-1">
                            <Link
                                to={role === "farmer" ? "/farmer" : role === "admin" ? "/admin" : "/consumer"}
                                className="flex items-center space-x-3 text-gray-300 hover:bg-gray-800 rounded-lg px-4 py-3"
                                onClick={() => setProfileDropdownOpen(false)}
                            >
                                <Home size={20} />
                                <span>Dashboard</span>
                            </Link>
                            <Link
                                to={getProfilePath()}
                                className="flex items-center space-x-3 text-gray-300 hover:bg-gray-800 rounded-lg px-4 py-3"
                                onClick={() => setProfileDropdownOpen(false)}
                            >
                                <User size={20} />
                                <span>My Profile</span>
                            </Link>
                            <Link
                                to={role === "farmer" ? "/farmer/settings" : "/consumer/settings"}
                                className="flex items-center space-x-3 text-gray-300 hover:bg-gray-800 rounded-lg px-4 py-3"
                                onClick={() => setProfileDropdownOpen(false)}
                            >
                                <Settings size={20} />
                                <span>Settings</span>
                            </Link>
                        </nav>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg"
                        >
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              className="text-white border border-teal-500 px-4 py-2 rounded-md hover:bg-teal-500/20 hover:border-teal-400 transition-all duration-300 flex items-center space-x-2"
              onClick={() => navigate("/login")}
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
            <button
              className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-500 transition-all duration-300 flex items-center space-x-2"
              onClick={() => navigate("/register")}
            >
              <UserPlus size={16} />
              <span>Register</span>
            </button>
          </>
        )}
      </div>

      {/* Add overlay when dropdown is open */}
      {isProfileDropdownOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[998]"
          onClick={() => setProfileDropdownOpen(false)}
        />
      )}
    </header>
  );
}

export default Navbar;