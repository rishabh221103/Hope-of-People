import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, AuthResponse, RegisterPayload, LoginPayload } from '../services/authService';

interface User {
  userId: number;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hop_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('hop_token');
      if (storedToken) {
        try {
          const current = await authService.getCurrentUser();
          setUser({
            userId: current.id,
            email: current.email,
            firstName: current.firstName,
            lastName: current.lastName,
            fullName: `${current.firstName} ${current.lastName}`.trim(),
            roles: current.roles,
          });
        } catch (err) {
          console.error('Session expired or invalid token:', err);
          localStorage.removeItem('hop_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    const res: AuthResponse = await authService.login(payload);
    localStorage.setItem('hop_token', res.token);
    setToken(res.token);
    setUser({
      userId: res.userId,
      email: res.email,
      firstName: res.firstName,
      lastName: res.lastName,
      fullName: `${res.firstName} ${res.lastName}`.trim(),
      roles: res.roles,
    });
    return res;
  };

  const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res: AuthResponse = await authService.register(payload);
    localStorage.setItem('hop_token', res.token);
    setToken(res.token);
    setUser({
      userId: res.userId,
      email: res.email,
      firstName: res.firstName,
      lastName: res.lastName,
      fullName: `${res.firstName} ${res.lastName}`.trim(),
      roles: res.roles,
    });
    return res;
  };

  const logout = () => {
    localStorage.removeItem('hop_token');
    setToken(null);
    setUser(null);
  };

  const hasRole = (role: string) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
