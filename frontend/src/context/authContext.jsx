import { createContext, useState, useEffect, useContext } from "react";
import { loginUser, getCurrentUser } from "../api/authApi";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    // ✅ NEW: Track login time and activity
    const [loginTime, setLoginTime] = useState(null);
    const [lastActivity, setLastActivity] = useState(Date.now());

    // ✅ NEW: Auto logout function
    const autoLogout = (reason = "Session expired") => {
        console.log(`Auto logout triggered: ${reason}`);
        localStorage.removeItem("token");
        localStorage.removeItem("loginTime");
        setUser(null);
        setIsAuthenticated(false);
        setLoginTime(null);
        
        // Show notification to user
        if (window.confirm(`${reason}. You will be redirected to login page.`)) {
            window.location.href = '/login';
        } else {
            window.location.href = '/login';
        }
    };

    // ✅ NEW: Check for token expiration and auto logout
    useEffect(() => {
        if (!isAuthenticated) return;

        const checkTokenExpiration = () => {
            const token = localStorage.getItem("token");
            const storedLoginTime = localStorage.getItem("loginTime");
            
            if (!token || !storedLoginTime) {
                autoLogout("Session not found");
                return;
            }

            const now = Date.now();
            const loginTimestamp = parseInt(storedLoginTime);
            const timeElapsed = now - loginTimestamp;
            
            // 24 hours = 24 * 60 * 60 * 1000 milliseconds
            const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
            
            if (timeElapsed > TWENTY_FOUR_HOURS) {
                autoLogout("Your session has expired after 24 hours");
                return;
            }

            // ✅ Optional: Check for inactivity (uncomment if needed)
            // const inactiveTime = now - lastActivity;
            // const INACTIVITY_LIMIT = 2 * 60 * 60 * 1000; // 2 hours of inactivity
            // if (inactiveTime > INACTIVITY_LIMIT) {
            //     autoLogout("You have been logged out due to inactivity");
            //     return;
            // }

            // Show warning 30 minutes before expiration
            const timeRemaining = TWENTY_FOUR_HOURS - timeElapsed;
            const THIRTY_MINUTES = 30 * 60 * 1000;
            
            if (timeRemaining <= THIRTY_MINUTES && timeRemaining > (THIRTY_MINUTES - 60000)) {
                console.warn("Session will expire in 30 minutes");
                // Optional: Show toast notification
            }
        };

        // Check immediately
        checkTokenExpiration();

        // Check every minute
        const tokenCheckInterval = setInterval(checkTokenExpiration, 60000);

        return () => clearInterval(tokenCheckInterval);
    }, [isAuthenticated, lastActivity]);

    // ✅ NEW: Track user activity for inactivity-based logout (optional)
    useEffect(() => {
        if (!isAuthenticated) return;

        const handleActivity = () => {
            setLastActivity(Date.now());
        };

        // Track various user activities
        const events = ['mousedown', 'keydown', 'scroll', 'mousemove', 'click'];
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [isAuthenticated]);

    // Check if the user is already logged in when the app loads
    useEffect(() => {
        const verifyUser = async () => {
            const token = localStorage.getItem("token");
            const storedLoginTime = localStorage.getItem("loginTime");
            
            if (token) {
                // ✅ Check if 24 hours have passed since login
                if (storedLoginTime) {
                    const now = Date.now();
                    const loginTimestamp = parseInt(storedLoginTime);
                    const timeElapsed = now - loginTimestamp;
                    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
                    
                    if (timeElapsed > TWENTY_FOUR_HOURS) {
                        console.log("Token expired (24 hours passed)");
                        localStorage.removeItem("token");
                        localStorage.removeItem("loginTime");
                        setLoading(false);
                        return;
                    }
                }

                try {
                    const userData = await getCurrentUser(token);
                    if (userData.success) {
                        setUser(userData.user);
                        setIsAuthenticated(true);
                        setLoginTime(storedLoginTime ? parseInt(storedLoginTime) : Date.now());
                        setLastActivity(Date.now());
                        
                        // ✅ Store login time if not already stored
                        if (!storedLoginTime) {
                            localStorage.setItem("loginTime", Date.now().toString());
                        }
                    } else {
                        // Token is invalid or expired
                        localStorage.removeItem("token");
                        localStorage.removeItem("loginTime");
                    }
                } catch (err) {
                    console.error("Authentication verification failed:", err);
                    localStorage.removeItem("token");
                    localStorage.removeItem("loginTime");
                }
            }
            setLoading(false);
        };

        verifyUser();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await loginUser(email, password);
            if (response.success) {
                const currentTime = Date.now();
                
                // ✅ Store token and login time
                localStorage.setItem("token", response.token);
                localStorage.setItem("loginTime", currentTime.toString());
                
                setUser(response.user);
                setIsAuthenticated(true);
                setLoginTime(currentTime);
                setLastActivity(currentTime);
                
                console.log("User logged in successfully. Session will expire in 24 hours.");
                
                return { success: true, role: response.user?.role };
            } else {
                setError(response.message);
                return { success: false, message: response.message };
            }
        } catch (err) {
            const errorMessage = err.message || "Login failed. Please try again.";
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("loginTime");
        setUser(null);
        setIsAuthenticated(false);
        setLoginTime(null);
        console.log("User logged out successfully");
    };

    // ✅ NEW: Function to get remaining session time
    const getRemainingSessionTime = () => {
        if (!loginTime) return 0;
        
        const now = Date.now();
        const timeElapsed = now - loginTime;
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        const remaining = TWENTY_FOUR_HOURS - timeElapsed;
        
        return Math.max(0, remaining);
    };

    // ✅ NEW: Function to format remaining time
    const formatRemainingTime = () => {
        const remaining = getRemainingSessionTime();
        if (remaining <= 0) return "Expired";
        
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        
        return `${hours}h ${minutes}m`;
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout,
            loading, 
            error, 
            isAuthenticated,
            useAuth,
            // ✅ NEW: Expose session utilities
            getRemainingSessionTime,
            formatRemainingTime,
            loginTime,
            autoLogout
        }}>
            {children}
        </AuthContext.Provider>
    );
};