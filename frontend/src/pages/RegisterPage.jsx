import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/authApi";
import { signInWithGoogle } from "../firebase";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("consumer");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Validate Email Format
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Validate password requirements and matching.
  const validatePassword = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return false;
    }
    // Pattern: Minimum 8 characters, 1 uppercase, 1 lowercase, 1 digit, 1 special character.
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!pattern.test(password)) {
      setPasswordError(
        "Password must be at least 8 characters long and include at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character (@$!%*?&#)."
      );
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // if (!validateEmail(email)) {
    //   setPasswordError("Please enter a valid email address.");
    //   return;
    // }

    // if (!validatePassword()) {
    //   return;
    // }

    if (!agreed) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);
    try {
      const response = await registerUser(email, password, role);
      console.log("API Response:", response);

      if (response.message === "User registered successfully") {
        toast.success("Registration Successful!");
        navigate("/login");
      } else if (response.message === "User already exists") {
        toast.error("You're already registered! Please log in.");
        navigate("/login");
      } else {
        toast.error(response.message || "Registration failed");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const idToken = await result.user.getIdToken();
      const email = result.user.email;

      console.log(`Attempting Google Sign-In for ${email}`);

      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          idToken,
          role: role,
          agreed: agreed
        }),
        credentials: "same-origin"
      });

      const data = await res.json();
      console.log("Google Sign-In Response:", data);

      if (data.isExistingUser || data.message === "User already authenticated") {
        toast.success("You are already registered with Google. Please log in.");
        navigate("/login");
        return;
      }

      if (data.message === "User registered successfully" ||
        data.message === "User authenticated successfully") {
        toast.success("Google Sign-In Successful!");
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        navigate("/");
      } else {
        toast.error(data.message || "Google Sign-In failed");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("Google Sign-In error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a332e]">
      <Navbar />
      <div className="min-h-screen bg-[#003333] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
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

        <div className="w-full max-w-3xl relative z-10">
          {/* Logo/Icon */}
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

          <h1 className="text-4xl font-bold text-white text-center mb-2 tracking-tight">Register Account</h1>
          <p className="text-gray-400 text-center mb-8">Create your account to start with your Workshop</p>

          <div className="bg-[#1a2626] rounded-2xl p-8 shadow-xl backdrop-blur-sm bg-opacity-95 border border-gray-800">
            <h2 className="text-2xl text-white font-semibold mb-6 flex items-center">
              <span className="w-8 h-8 bg-[#00FFCC] bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-[#00FFCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              Personal Information
            </h2>

            {passwordError && (
              <div className="bg-red-900 bg-opacity-50 text-white p-3 rounded-lg mb-6 text-sm">
                {passwordError}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-white mb-2 font-medium" htmlFor="role">Account Type</label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-3 bg-[#141919] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#00FFCC] focus:ring-1 focus:ring-[#00FFCC] transition-colors"
                      required
                    >
                      <option value="consumer">Consumer</option>
                      <option value="farmer">Farmer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-medium" htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-[#141919] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFCC] focus:ring-1 focus:ring-[#00FFCC] transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-6">
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

                  <div>
                    <label className="block text-white mb-2 font-medium" htmlFor="confirmPassword">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="confirmPassword"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-[#141919] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00FFCC] focus:ring-1 focus:ring-[#00FFCC] transition-colors"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center mt-8 p-4 bg-[#141919] rounded-lg border border-gray-700">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-5 h-5 border-gray-700 rounded bg-[#141919] text-[#00FFCC] focus:ring-[#00FFCC] focus:ring-offset-0 transition-colors"
                  required
                />
                <label className="ml-3 text-gray-400 text-sm" htmlFor="terms">
                  I agree to the{' '}
                  <a href="#" className="text-[#00FFCC] hover:text-[#00e6b8] transition-colors">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-[#00FFCC] hover:text-[#00e6b8] transition-colors">Privacy Policy</a>
                </label>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-[#00FFCC] text-[#003333] rounded-lg hover:bg-[#00e6b8] transition-all transform hover:scale-105 font-medium flex items-center group"
                >
                  {loading ? "Creating account..." : "Create account"}
                  <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 mb-2">or continue with</p>
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
          </div>

          <div className="mt-8 text-center">
            <span className="text-gray-400">Already have an account? </span>
            <Link to="/login" className="text-[#00FFCC] hover:text-[#00e6b8] transition-colors font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;