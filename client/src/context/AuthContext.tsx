import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, DemoAccount } from '../types/auth';
import {
  getMeApi,
  loginApi,
  registerApi,
  logoutApi,
  forgotPasswordApi,
  getDemoAccountsApi,
} from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  demoAccounts: DemoAccount[];
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  switchDemoRole: (role: UserRole) => Promise<User>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('rentora_auth_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);

  // Fetch demo accounts for fast evaluative testing
  useEffect(() => {
    const fetchDemos = async () => {
      try {
        const res = await getDemoAccountsApi();
        if (res.success) {
          setDemoAccounts(res.data);
        }
      } catch (err) {
        console.warn('Could not load demo accounts:', err);
      }
    };
    fetchDemos();
  }, []);

  // Check auth session on startup via backend API (supports both httpOnly cookie and Bearer token)
  const refreshProfile = async () => {
    try {
      setLoading(true);
      const res = await getMeApi();
      if (res.success && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      // Unauthenticated session
      setUser(null);
      localStorage.removeItem('rentora_auth_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    setLoading(true);
    try {
      const res = await loginApi({ email, password, rememberMe });
      if (res.success && res.data) {
        if (res.data.token) {
          localStorage.setItem('rentora_auth_token', res.data.token);
          setToken(res.data.token);
        }
        setUser(res.data.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      const res = await registerApi(userData);
      if (res.success && res.data) {
        if (res.data.token) {
          localStorage.setItem('rentora_auth_token', res.data.token);
          setToken(res.data.token);
        }
        setUser(res.data.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.warn('Logout API call finished with:', err);
    } finally {
      localStorage.removeItem('rentora_auth_token');
      setToken(null);
      setUser(null);
    }
  };

  const forgotPassword = async (email: string): Promise<string> => {
    const res = await forgotPasswordApi(email);
    return res.message;
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    const targetDemo = demoAccounts.find((d) => d.role === targetRole);
    if (!targetDemo) {
      throw new Error(`Demo account for role ${targetRole} not found`);
    }
    await login(targetDemo.email, targetDemo.password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        demoAccounts,
        login,
        register,
        logout,
        forgotPassword,
        switchDemoRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
