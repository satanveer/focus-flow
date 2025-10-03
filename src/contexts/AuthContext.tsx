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
      
      // Enhanced OAuth callback detection
      const isOAuthCallback = 
        urlParams.has('state') || 
        urlParams.has('code') ||
        urlParams.has('userId') ||
        urlParams.has('secret') ||
        hash.includes('access_token') || 
        hash.includes('oauth') ||
        document.referrer.includes('accounts.google.com') ||
        document.referrer.includes('cloud.appwrite.io') ||
        window.location.href.includes('oauth') ||
        window.location.href.includes('callback') ||
        localStorage.getItem('oauth_flow_started') === 'true';
      
      if (isOAuthCallback) {
        // Clear the OAuth flow flag
        localStorage.removeItem('oauth_flow_started');
        
        // Check if we have OAuth token parameters (userId and secret)
        const userId = urlParams.get('userId');
        const secret = urlParams.get('secret');
        
        if (userId && secret) {
          try {
            // Handle OAuth token directly
            const user = await authService.handleOAuthTokenCallback(userId, secret);
            if (user) {
              console.log('🔍 OAuth token session created successfully');
              setState(prev => ({
                ...prev,
                user,
                isAuthenticated: true,
                loading: false,
              }));
              
              // Clean up URL parameters
              const cleanUrl = window.location.origin + window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
              return;
            }
          } catch (error) {
            // OAuth token session creation failed, fall back to regular OAuth
          }
        }
        
        // Clean up URL parameters first
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          // Try to get the current user directly
          const user = await authService.getCurrentUser();
          
          if (user) {
            // Check if user settings exist, create if not
            try {
              await authService.handleOAuthCallback();
              // OAuth callback handled successfully
            } catch (settingsError) {
              // Settings creation/check failed, but user exists
            }
            
            setState(prev => ({
              ...prev,
              user,
              isAuthenticated: true,
              loading: false,
            }));
            return;
          }
        } catch (error) {
          console.error('OAuth user retrieval failed:', error);
        }
        
        // Fallback: retry a few times
        let retries = 0;
        const maxRetries = 5;
        
        const retryAuth = async () => {
          try {
            const user = await authService.getCurrentUser();
            if (user) {
              console.log('OAuth retry successful:', user);
              setState(prev => ({
                ...prev,
                user,
                isAuthenticated: true,
                loading: false,
              }));
              return;
            }
          } catch (error) {
            console.log(`OAuth retry ${retries + 1} failed:`, error);
          }
          
          retries++;
          if (retries < maxRetries) {
            setTimeout(retryAuth, 2000);
          } else {
            console.log('OAuth retries exhausted, falling back to normal flow');
            await refreshUser();
          }
        };
        
        setTimeout(retryAuth, 1000);
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
      // Set a flag to help detect OAuth callback
      localStorage.setItem('oauth_flow_started', 'true');
      await authService.loginWithGoogle();
      // Note: This won't execute as the page will redirect to Google
    } catch (error) {
      console.error('Google login error:', error);
      localStorage.removeItem('oauth_flow_started');
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
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '2px solid var(--border)',
            borderTop: '2px solid var(--accent)',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
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
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg)',
      padding: '1rem'
    }}>
      <div style={{ 
        maxWidth: '28rem', 
        width: '100%', 
        padding: '2rem',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ 
            fontSize: '1.875rem', 
            fontWeight: 'bold', 
            color: 'var(--text)',
            marginBottom: '0.5rem'
          }}>
            {isLogin ? 'Sign in to FocusFlow' : 'Create your account'}
          </h2>
          <p style={{ 
            color: 'var(--text-muted)',
            fontSize: '0.875rem'
          }}>
            {isLogin 
              ? 'Welcome back! Please sign in to continue.' 
              : 'Join FocusFlow to boost your productivity.'
            }
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!isLogin && (
            <div>
              <label htmlFor="name" style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: 'var(--text)',
                marginBottom: '0.25rem'
              }}>
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required={!isLogin}
                value={formData.name}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.875rem',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                placeholder="Enter your full name"
                onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'}
                onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'}
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: 'var(--text)',
              marginBottom: '0.25rem'
            }}>
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.875rem',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              placeholder="Enter your email"
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'}
              onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'}
            />
          </div>
          
          <div>
            <label htmlFor="password" style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: 'var(--text)',
              marginBottom: '0.25rem'
            }}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.875rem',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              placeholder="Enter your password"
              minLength={8}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'}
              onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'}
            />
          </div>

          {error && (
            <div style={{
              color: 'var(--danger)',
              fontSize: '0.875rem',
              textAlign: 'center',
              background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--accent-foreground)',
              background: loading ? 'var(--text-muted)' : 'var(--accent)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              opacity: loading ? 0.5 : 1
            }}
            onMouseOver={(e) => !loading && ((e.target as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--accent) 90%, black)')}
            onMouseOut={(e) => !loading && ((e.target as HTMLButtonElement).style.background = 'var(--accent)')}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          {isLogin && (
            <>
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <div style={{ 
                    width: '100%', 
                    borderTop: '1px solid var(--border)' 
                  }} />
                </div>
                <div style={{ 
                  position: 'relative', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  fontSize: '0.875rem' 
                }}>
                  <span style={{ 
                    padding: '0 0.5rem', 
                    background: 'var(--surface)', 
                    color: 'var(--text-muted)' 
                  }}>
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    console.log('🔍 Google sign-in button clicked');
                    setLoading(true);
                    setError(''); // Clear any previous errors
                    console.log('🔍 Calling loginWithGoogle...');
                    await loginWithGoogle();
                    console.log('🔍 loginWithGoogle completed');
                  } catch (error) {
                    console.error('🔍 Google sign-in error:', error);
                    setError('Google sign-in failed. Please try again.');
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--text)',
                  background: 'var(--bg)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                  opacity: loading ? 0.5 : 1
                }}
                onMouseOver={(e) => !loading && ((e.target as HTMLButtonElement).style.background = 'var(--surface-2)')}
                onMouseOut={(e) => !loading && ((e.target as HTMLButtonElement).style.background = 'var(--bg)')}
              >
                <svg style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} viewBox="0 0 24 24">
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
          
          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{
                color: 'var(--accent)',
                fontSize: '0.875rem',
                fontWeight: '500',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.color = 'color-mix(in srgb, var(--accent) 80%, black)'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.color = 'var(--accent)'}
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