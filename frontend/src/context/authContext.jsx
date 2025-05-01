import { createContext, useState, useEffect } from "react";
import { loginUser, getCurrentUser } from "../api/authApi";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check if the user is already logged in when the app loads
    useEffect(() => {
        const verifyUser = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    const userData = await getCurrentUser(token);
                    if (userData.success) {
                        setUser(userData.user);
                        setIsAuthenticated(true);
                    } else {
                        // Token is invalid or expired
                        localStorage.removeItem("token");
                    }
                } catch (err) {
                    console.error("Authentication verification failed:", err);
                    localStorage.removeItem("token");
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
                localStorage.setItem("token", response.token);
                setUser(response.user);
                setIsAuthenticated(true);
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
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout,
            loading, 
            error, 
            isAuthenticated,
            useAuth 
        }}>
            {children}
        </AuthContext.Provider>
    );
};