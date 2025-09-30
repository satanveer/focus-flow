import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Models } from 'appwrite';
import { authService } from '../lib/appwrite';

interface AuthState {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  const refreshUser = useCallback(async (retryCount = 0) => {
    try {
      // Try to get the current user
      const user = await authService.getCurrentUser();
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        loading: false,
      }));
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // For OAuth callbacks, retry a few times as session might not be ready immediately
      if (retryCount < 5 && ((error as any)?.code === 401 || (error as any)?.message?.includes('missing scopes'))) {
        setTimeout(() => refreshUser(retryCount + 1), 2000);
        return;
      }
      
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        loading: false,
      }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await authService.login(email, password);
      await refreshUser();
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, [refreshUser]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await authService.register(email, password, name);
      await refreshUser();
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on client side even if server request fails
      setState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  // Initialize auth state on mount and handle OAuth callbacks
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      
      // Check if this is an OAuth callback
      const isOAuthCallback = 
        urlParams.has('state') || 
        urlParams.has('code') ||
        urlParams.has('userId') ||
        urlParams.has('secret') ||
        hash.includes('access_token') || 
        document.referrer.includes('accounts.google.com') ||
        document.referrer.includes('cloud.appwrite.io');
      
      if (isOAuthCallback) {
        // Check if OAuth created a session
        try {
          const session = await authService.checkActiveSession();
          if (session) {
            // OAuth session found, refresh user data
          }
        } catch (error) {
          console.error('No active session found after OAuth:', error);
        }
        
        // Clean up URL parameters
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Wait a bit longer for OAuth session to establish
        setTimeout(async () => {
          await refreshUser();
        }, 2000);
      } else {
        // Normal app initialization
        await refreshUser();
      }
    };

    handleOAuthCallback();
  }, [refreshUser]);

  const loginWithGoogle = useCallback(async () => {
    try {
      // Set loading state before OAuth redirect
      setState(prev => ({ ...prev, loading: true }));
      await authService.loginWithGoogle();
      // Note: This won't execute as the page will redirect to Google
    } catch (error) {
      console.error('Google login error:', error);
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    loginWithGoogle,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Protected Route Component
export const ProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || <LoginPage />;
  }

  return <>{children}</>;
};

// Simple Login/Register Component
const LoginPage: React.FC = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.name);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {isLogin ? 'Sign in to FocusFlow' : 'Create your account'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isLogin 
              ? 'Welcome back! Please sign in to continue.' 
              : 'Join FocusFlow to boost your productivity.'
            }
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required={!isLogin}
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
              minLength={8}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          {isLogin && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loginWithGoogle()}
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285f4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34a853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fbbc05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#ea4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>
            </>
          )}
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;