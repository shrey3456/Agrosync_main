const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:5000';

export const registerUser = async (email, password, role) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, role }),
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: "Network error. Please try again." };
    }
};

export const loginUser = async (email, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (data.success) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
        }
        return data;
    } catch (error) {
        return { success: false, message: "Network error. Please try again." };
    }
};

export const getCurrentUser = () => {
    const userString = localStorage.getItem("user");
    if (userString) {
        return JSON.parse(userString);
    }
    return null;
};


export const getUsernameFromEmail = () => {
    const userEmail = localStorage.getItem("userEmail"); // Retrieve stored email
    if (!userEmail) return null;
  
    const username = userEmail.split("@")[0]; // Extract username before '@'
    return username;
  };
  