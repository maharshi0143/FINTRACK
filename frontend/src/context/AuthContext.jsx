import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));

  useEffect(() => {
    const onAuthExpired = () => {
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:expired', onAuthExpired);
    return () => window.removeEventListener('auth:expired', onAuthExpired);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (!storedToken) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const { data } = await authService.getMe();
        if (cancelled) return;
        setUser(data.data ?? data);
        setIsAuthenticated(true);
      } catch {
        if (cancelled) return;
        try {
          const { data: refreshData } = await authService.refresh();
          if (cancelled) return;
          const newToken = refreshData.accessToken;
          const userData = refreshData.data?.user ?? refreshData.user;

          if (newToken) {
            localStorage.setItem('accessToken', newToken);
            setToken(newToken);
          }
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            const { data: meData } = await authService.getMe();
            if (cancelled) return;
            setUser(meData.data ?? meData);
            setIsAuthenticated(true);
          }
        } catch {
          if (cancelled) return;
          localStorage.removeItem('accessToken');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login({ email, password });

    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      setToken(data.accessToken);
    }

    setUser(data.data ?? data);
    setIsAuthenticated(true);
    toast.success('Logged in successfully');
    return data.data ?? data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    await authService.register({ name, email, password });
    return true;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Even if the server call fails, clear local state
    } finally {
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out');
    }
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    const { data } = await authService.googleLogin(idToken);

    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      setToken(data.accessToken);
    }

    setUser(data.data ?? data);
    setIsAuthenticated(true);
    toast.success('Logged in with Google');
    return data.data ?? data;
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    token,
    login,
    register,
    logout,
    updateUser,
    googleLogin,
  }), [user, loading, isAuthenticated, token, login, register, logout, updateUser, googleLogin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
