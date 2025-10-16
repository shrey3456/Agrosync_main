import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../firebase";
import Navbar from "../components/Navbar";

// Define API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Email validation function
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Password validation function: Minimum 8 characters, 1 uppercase, 1 lowercase, 1 digit, 1 special character.
// const validatePassword = (password) => {
//   const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
//   return pattern.test(password);
// };

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const navigate = useNavigate();

  // Update time every minute for logging purposes
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);
      setCurrentTime(formattedDate);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Log user activity
  const logUserActivity = async (userId, action) => {
    try {
      console.log(`[${currentTime}] User ${userId || 'unknown'}: ${action}`);
      // Optionally implement an API call to log the activity
    } catch (error) {
      console.error("Error logging user activity:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate email format
    // if (!validateEmail(email)) {
    //   setError("Please enter a valid email address.");
    //   return;
    // }
    // // Validate password strength
    // if (!validatePassword(password)) {
    //   setError("Password must be at least 8 characters long and include at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character (@$!%*?&#).");
    //   return;
    // }

    setLoading(true);
    try {
      console.log(`[${currentTime}] Login attempt with email: ${email}`);
      console.log("API Base URL:", API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          timestamp: currentTime
        }),
        credentials: "same-origin"
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (!response.ok) throw new Error(data.message || "Login failed");

      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("User data stored:", data.user);
      }

      const userRole = data.user?.role;
      console.log("User role:", userRole);

      await logUserActivity(data.user?.id, "Logged in successfully");

      if (userRole) {
        switch (userRole.toLowerCase()) {
          case 'admin':
            console.log("Redirecting to admin panel");
            navigate("/admin");
            break;
          case 'farmer':
            console.log("Redirecting to farmer dashboard");
            navigate("/farmer");
            break;
          case 'consumer':
            console.log("Redirecting to consumer page");
            navigate("/consumer");
            break;
          default:
            console.log("No specific role, redirecting to home");
            navigate("/");
            break;
        }
      } else {
        console.log("No role found, redirecting to home");
        navigate("/");
      }
    } catch (err) {
      console.error(`[${currentTime}] Login error:`, err);
      await logUserActivity(null, `Login failed: ${err.message}`);

      if (err.message === "Failed to fetch") {
        setError("Cannot connect to server. Please check if the backend is running.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log(`[${currentTime}] Attempting Google Sign-In`);
      const result = await signInWithGoogle();
      const idToken = await result.user.getIdToken();

      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          idToken,
          timestamp: currentTime
        }),
        credentials: "same-origin"
      });

      const data = await res.json();
      console.log("Google Sign-In response:", data);

      if (!res.ok) throw new Error(data.message || "Google Sign-In failed");

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      await logUserActivity(data.user?.id || result.user.uid, "Logged in with Google");

      const userRole = data.user?.role;
      console.log("User role from Google Sign-In:", userRole);

      if (userRole) {
        switch (userRole.toLowerCase()) {
          case 'admin':
            navigate("/admin");
            break;
          case 'farmer':
            navigate("/farmer");
            break;
          case 'consumer':
            navigate("/consumer");
            break;
          default:
            navigate("/");
            break;
        }
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(`[${currentTime}] Google Sign-In error:`, err);
      await logUserActivity(null, `Google Sign-In failed: ${err.message}`);

      if (err.message === "Failed to fetch") {
        setError("Cannot connect to server. Please check if the backend is running.");
      } else {
        setError(err.message || "Google Sign-In failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a332e]">
      <Navbar />

      {error === "Cannot connect to server. Please check if the backend is running." && (
        <div className="bg-red-700 text-white p-2 text-center">
          ⚠️ Cannot connect to the backend server. Please make sure it's running at {API_BASE_URL}
        </div>
      )}

      <div className="min-h-screen bg-[#003333] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#00FFCC] rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#00FFCC] rounded-full opacity-10 blur-3xl"></div>
        </div>

        <Link
          to="/"
          className="text-[#00FFCC] flex items-center mb-8 hover:text-[#00e6b8] transition-colors relative z-10 group"
        >
          <span className="mr-2 transform group-hover:-translate-x-1 transition-transform">←</span>
          Back to Home
        </Link>

        <div className="w-full max-w-md relative z-10">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 bg-[#00FFCC] bg-opacity-20 rounded-full flex items-center justify-center">
              <div className="w-12 h-12 bg-[#00FFCC] rounded-lg transform rotate-45">
                <div className="w-full h-full bg-[#003333] rounded-lg transform -rotate-45 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#00FFCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white text-center mb-2 tracking-tight">Login</h1>
          <p className="text-gray-400 text-center mb-8">Sign in to your account</p>

          <div className="bg-[#1a2626] rounded-2xl p-8 shadow-xl backdrop-blur-sm bg-opacity-95 border border-gray-800">
            {error && (
              <div className="bg-red-900 bg-opacity-50 text-white p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-white mb-2 font-medium" htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#141919] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFCC] focus:ring-1 focus:ring-[#00FFCC] transition-colors"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-2 font-medium" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#141919] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFCC] focus:ring-1 focus:ring-[#00FFCC] transition-colors"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#00FFCC] transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#00FFCC] text-[#003333] rounded-lg hover:bg-[#00e6b8] transition-all transform hover:scale-105 font-medium flex items-center justify-center group"
              >
                {loading ? "Signing in..." : (
                  <>
                    Sign in
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 mb-4">or continue with</p>
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 bg-[#4285F4] text-white rounded-lg hover:bg-[#357ae8] transition-all flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="mt-8 text-center">
              <span className="text-gray-400">Don't have an account? </span>
              <Link to="/register" className="text-[#00FFCC] hover:text-[#00e6b8] transition-colors font-medium">
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}