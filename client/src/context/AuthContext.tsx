import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, DemoAccount } from '../types/auth';
import { getMeApi, loginApi, registerApi, getDemoAccountsApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  demoAccounts: DemoAccount[];
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('rentora_auth_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);

  // Fetch demo accounts for one-click demo login in hackathon
  useEffect(() => {
    const fetchDemos = async () => {
      try {
        const res = await getDemoAccountsApi();
        if (res.success) {
          setDemoAccounts(res.data);
        }
      } catch (err) {
        console.warn('Could not load demo accounts yet (server may be offline):', err);
      }
    };
    fetchDemos();
  }, []);

  // Check auth session on startup via backend API
  const refreshProfile = async () => {
    const storedToken = localStorage.getItem('rentora_auth_token');
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await getMeApi();
      if (res.success && res.data.user) {
        setUser(res.data.user);
        setToken(storedToken);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to authenticate session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await loginApi({ email, password });
      if (res.success && res.data.token) {
        localStorage.setItem('rentora_auth_token', res.data.token);
        setToken(res.data.token);
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
      if (res.success && res.data.token) {
        localStorage.setItem('rentora_auth_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('rentora_auth_token');
    setToken(null);
    setUser(null);
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
