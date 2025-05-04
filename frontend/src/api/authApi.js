const API_URL = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:5000/api/auth";

export const registerUser = async (email, password, role) => {
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ email, password, role }),
            credentials: "same-origin"
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registration failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

export const loginUser = async (email, password) => {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ email, password }),
            credentials: "same-origin"
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
        } else {
            throw new Error(data.message || 'Login failed');
        }
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
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
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) return null;
  
    const username = userEmail.split("@")[0];
    return username;
};
