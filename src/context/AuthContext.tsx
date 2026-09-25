import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, AuthUser, AppRole } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  role: AppRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getUser());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsub = authService.onAuthStateChange((newUser) => {
      setUser(newUser);
    });

    return unsub;
  }, []);

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await authService.signIn(email, pass);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
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
