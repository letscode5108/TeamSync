import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Try to authenticate with refresh token on page load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/refresh-token`, {}, { withCredentials: true });
        // If refresh succeeds, try to get user data from dashboard route
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/auth/dashboard`, { withCredentials: true });
        if (res.data && res.data.user) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.log('Not authenticated');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const register = async (userData) => {
    try {
      setError(null);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/register`, userData, { withCredentials: true });
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/login`, credentials, { withCredentials: true });
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/logout`, {}, { withCredentials: true });
      setUser(null);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const registerInvitedUser = async (userData) => {
    try {
      setError(null);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/register-invited`, userData, { withCredentials: true });
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const verifyInvitation = async (token) => {
    try {
      setError(null);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/auth/verify-invitation?token=${token}`);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid invitation');
      throw err;
    }
  };
  const refreshAccessToken = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/refresh-token`, {}, { withCredentials: true });
      // Optionally fetch user data again
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/auth/dashboard`, { withCredentials: true });
      if (res.data && res.data.user) {
        setUser(res.data.user);
      }
      return true;
    } catch (err) {
      console.log('Token refresh failed');
      setUser(null);
      return false;
    }
  };
  const useAuth = () => useContext(AuthContext);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      register,
      login,
      logout,
      refreshAccessToken,
      registerInvitedUser,
      verifyInvitation,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);