import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Models } from 'appwrite';
import { authService } from '../lib/appwrite';
import { ParticleBackground } from '../components/ParticleBackground';
import { LoadingScreen } from '../components/LoadingScreen';

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
      
      // Clear only authentication-related data from localStorage
      // Google Calendar tokens
      localStorage.removeItem('google_calendar_token');
      localStorage.removeItem('google_calendar_refresh_token');
      localStorage.removeItem('google_calendar_token_expiry');
      localStorage.removeItem('needs_calendar_oauth');
      localStorage.removeItem('google_auth_return_path');
      localStorage.removeItem('auto_calendar_connect');
      
      // Clear any cached auth flags
      localStorage.removeItem('oauth_flow_started');
      localStorage.removeItem('oauth_start_time');
      
      // DO NOT clear user data:
      // - Notes are now in Appwrite (AppwriteNotesContext)
      // - Pomodoro sessions remain in localStorage ('ff/pomodoro') - user-specific
      // - Tasks are in Appwrite (AppwriteTasksContext)
      // The data is user-specific and will be loaded correctly on next login
      
      setState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
      
      // Force reload to clear all React state
      window.location.href = '/';
    } catch (error) {
      // Force logout on client side even if server request fails
      localStorage.clear(); // Clear everything on error
      setState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
      window.location.href = '/';
    }
  }, []);

  // Initialize auth state on mount and handle OAuth callbacks
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get('userId');
      const secret = urlParams.get('secret');
      
      // Check if we have OAuth callback parameters (token-based OAuth) - PRIORITY #1
      if (userId && secret) {
        // Prevent duplicate processing (React StrictMode calls useEffect twice in dev)
        const tokenKey = `oauth_processed_${userId}_${secret.substring(0, 8)}`;
        const alreadyProcessed = sessionStorage.getItem(tokenKey);
        
        if (alreadyProcessed) {
          // Session was already created, just load it and continue with calendar check
          try {
            const user = await authService.getCurrentUser();
            if (user) {
              setState({
                user,
                isAuthenticated: true,
                loading: false,
              });
              
              // Check calendar and redirect
              const { googleCalendarService } = await import('../lib/googleCalendar');
              const hasCalendarTokens = await googleCalendarService.hasValidTokens();
              
              if (!hasCalendarTokens) {
                localStorage.setItem('google_auth_return_path', '/');
                localStorage.setItem('auto_calendar_connect', 'true');
                window.location.href = googleCalendarService.getAuthUrl();
                return;
              }
              
              window.location.href = '/';
              return;
            }
          } catch (error) {
            // Session not found, will create new one
          }
        }
        
        // Clear the OAuth flow flags
        localStorage.removeItem('oauth_flow_started');
        localStorage.removeItem('oauth_start_time');
        
        try {
          setState(prev => ({ ...prev, loading: true }));
          
          // Use the handleOAuthTokenCallback to create the session
          const user = await authService.handleOAuthTokenCallback(userId, secret);
          
          // Mark as processed ONLY after successful session creation
          sessionStorage.setItem(tokenKey, 'true');
          
          if (user) {
            setState({
              user,
              isAuthenticated: true,
              loading: false,
            });
            
            // Check if this is a first-time login (no calendar connected yet)
            // Import dynamically to avoid circular dependencies
            const { googleCalendarService } = await import('../lib/googleCalendar');
            const hasCalendarTokens = await googleCalendarService.hasValidTokens();
            
            if (!hasCalendarTokens) {
              // Save current state and automatically redirect to Calendar OAuth
              localStorage.setItem('google_auth_return_path', '/');
              localStorage.setItem('auto_calendar_connect', 'true');
              
              // Redirect immediately to Google Calendar OAuth
              window.location.href = googleCalendarService.getAuthUrl();
              return;
            }
            
            // Clean up URL parameters and redirect to home
            window.location.href = '/';
            
            return;
          } else {
            console.error('OAuth token callback: handleOAuthTokenCallback returned null user');
            throw new Error('Failed to create user session from OAuth token');
          }
        } catch (error: any) {
          console.error('OAuth TOKEN authentication failed:', error);
          
          // Check if it's a rate limit error
          if (error.message?.includes('Rate limit') || error.code === 429) {
            // Wait a bit and try to get the current user (session might have been created)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            try {
              const user = await authService.getCurrentUser();
              if (user) {
                setState({
                  user,
                  isAuthenticated: true,
                  loading: false,
                });
                window.location.href = '/';
                return;
              }
            } catch (userError) {
              // Could not retrieve user after rate limit
            }
          }
          
          setState(prev => ({ ...prev, loading: false }));
          localStorage.removeItem('oauth_flow_started');
          localStorage.removeItem('oauth_start_time');
          
          // Only show error if not rate limit
          if (!error.message?.includes('Rate limit')) {
            alert('Google Sign-In failed.\n\nError: ' + error.message + '\n\nPlease try again.');
          }
          
          // Redirect to home
          window.location.href = '/';
          return;
        }
      }
      
      // Check if we're returning from OAuth (session-based OAuth - Appwrite sets cookies automatically)
      const oauthStartTime = localStorage.getItem('oauth_start_time');
      const isOAuthCallback = 
        (localStorage.getItem('oauth_flow_started') === 'true' && oauthStartTime) ||
        document.referrer.includes('accounts.google.com') ||
        document.referrer.includes('cloud.appwrite.io') ||
        document.referrer.includes('fra.cloud.appwrite.io');
      
      // Only treat as OAuth callback if it happened recently (within last 2 minutes)
      const isRecentOAuth = oauthStartTime && (Date.now() - parseInt(oauthStartTime)) < 120000;
      
      if (isOAuthCallback && isRecentOAuth) {
        // Clear the OAuth flow flags
        localStorage.removeItem('oauth_flow_started');
        localStorage.removeItem('oauth_start_time');
        
        // Clean up URL parameters
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        setState(prev => ({ ...prev, loading: true }));
        
        // Appwrite sets session cookies automatically after OAuth
        // We need to wait a bit and then try to get the current user
        const maxAttempts = 10;
        let attempts = 0;
        
        const tryGetUser = async () => {
          attempts++;
          
          try {
            // First check if there's an active session
            const session = await authService.checkActiveSession();
            
            if (session) {
              // Now get the user
              const user = await authService.getCurrentUser();
              
              if (user) {
                // Create default settings if needed
                try {
                  await authService.handleOAuthCallback();
                } catch (settingsError) {
                  // Settings handling completed
                }
                
                setState({
                  user,
                  isAuthenticated: true,
                  loading: false,
                });
                
                return true;
              }
            }
          } catch (error: any) {
            // Retry on error
          }
          
          // Retry if we haven't reached max attempts
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 800));
            return tryGetUser();
          } else {
            console.error('❌ OAuth session creation failed after', maxAttempts, 'attempts');
            console.error('❌ This means Appwrite did NOT create a session after OAuth redirect');
            console.error('❌ Possible causes:');
            console.error('   1. Redirect URL in Google Console does NOT match: ' + window.location.origin + '/');
            console.error('   2. Google OAuth Client ID/Secret in Appwrite Console is incorrect');
            console.error('   3. Google OAuth provider not enabled in Appwrite Console');
            console.error('   4. Missing Appwrite callback URL in Google Console');
            
            setState(prev => ({ ...prev, loading: false }));
            
            alert('Google Sign-In Failed\n\n' +
                  'Appwrite did not create a session after Google authentication.\n\n' +
                  'Required Google Console Redirect URIs:\n' +
                  '1. ' + window.location.origin + '/\n' +
                  '2. https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/68d833cd002390a93c4c\n\n' +
                  'Please verify both URLs are added in Google Cloud Console.');
            
            return false;
          }
        };
        
        // Start trying to get the user after a short delay
        await new Promise(resolve => setTimeout(resolve, 500));
        await tryGetUser();
        return;
      }
      
      // Normal app initialization
      await refreshUser();
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
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return fallback || <LoginPage />;
  }

  return <>{children}</>;
};

// Quotes Section Component
const QuotesSection: React.FC = () => {
  const quotes = [
    { text: "Time is what we want most, but what we use worst.", author: "William Penn" },
    { text: "Lost time is never found again.", author: "Benjamin Franklin" },
    { text: "Time is the most valuable thing a man can spend.", author: "Theophrastus" },
    { text: "The key is in not spending time, but in investing it.", author: "Stephen R. Covey" },
    { text: "Time flies over us, but leaves its shadow behind.", author: "Nathaniel Hawthorne" },
    { text: "You may delay, but time will not.", author: "Benjamin Franklin" },
    { text: "Time management is life management.", author: "Robin Sharma" },
    { text: "The bad news is time flies. The good news is you're the pilot.", author: "Michael Altshuler" }
  ];

  const [currentQuote, setCurrentQuote] = React.useState(0);
  const [fade, setFade] = React.useState(true);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentQuote((prev) => (prev + 1) % quotes.length);
        setFade(true);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [quotes.length]);

  return (
    <div style={{
      padding: '2rem',
      animation: 'slideInLeft 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }}>
      <div style={{
        opacity: fade ? 1 : 0,
        transform: fade ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '2rem', opacity: 0.3 }}>
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="var(--accent)" opacity="0.2"/>
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="var(--accent)" opacity="0.2"/>
        </svg>
        
        <blockquote style={{
          margin: 0,
          padding: 0,
          border: 'none'
        }}>
          <p style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: 'var(--text)',
            lineHeight: '1.3',
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em'
          }}>
            "{quotes[currentQuote].text}"
          </p>
          <footer style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--accent)',
            fontStyle: 'normal'
          }}>
            — {quotes[currentQuote].author}
          </footer>
        </blockquote>

        {/* Quote indicator dots */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '2rem'
        }}>
          {quotes.map((_, index) => (
            <div
              key={index}
              style={{
                width: currentQuote === index ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: currentQuote === index ? 'var(--accent)' : 'var(--border)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => {
                setFade(false);
                setTimeout(() => {
                  setCurrentQuote(index);
                  setFade(true);
                }, 300);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
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
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Gradient Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4rem',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Left Side - Quotes */}
        <QuotesSection />
        
        {/* Right Side - Login Card */}
        <div style={{ 
          maxWidth: '26rem', 
          width: '100%', 
          padding: '2rem',
          background: 'var(--surface)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md), 0 0 0 1px rgba(59, 130, 246, 0.1)',
          animation: 'slideInRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transition: 'transform 0.3s ease',
          marginLeft: 'auto'
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.2)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md), 0 0 0 1px rgba(59, 130, 246, 0.1)';
        }}>
          {/* Logo Text */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '2rem'
          }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem',
              letterSpacing: '-0.03em',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              BobbyFlow
            </h1>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: 'var(--text)',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em'
            }}>
              {isLogin ? 'Welcome Back' : 'Join BobbyFlow'}
            </h2>
            <p style={{ 
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {isLogin 
                ? 'Sign in to continue your productivity journey' 
                : 'Start boosting your productivity today'
              }
            </p>
          </div>
        
                
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isLogin && (
            <div style={{ animation: 'fadeInLeft 0.5s ease-out' }}>
              <label htmlFor="name" style={{ 
                display: 'block', 
                fontSize: '0.813rem', 
                fontWeight: '600', 
                color: 'var(--text)',
                marginBottom: '0.5rem'
              }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <div 
                  id="name-icon"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                    transition: 'color 0.2s ease'
                  }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={!isLogin}
                  value={formData.name}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 42px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none'
                  }}
                  placeholder="Enter your full name"
                  onFocus={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = 'var(--accent)';
                    (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    const icon = document.getElementById('name-icon');
                    if (icon) icon.style.color = '#667eea';
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
                    (e.target as HTMLInputElement).style.boxShadow = 'none';
                    const icon = document.getElementById('name-icon');
                    if (icon) icon.style.color = 'var(--text-muted)';
                  }}
                />
              </div>
            </div>
          )}
          
          <div style={{ animation: 'fadeInLeft 0.6s ease-out' }}>
            <label htmlFor="email" style={{ 
              display: 'block', 
              fontSize: '0.813rem', 
              fontWeight: '600', 
              color: 'var(--text)',
              marginBottom: '0.5rem'
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <div 
                id="email-icon"
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                  transition: 'color 0.2s ease'
                }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 42px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none'
                }}
                placeholder="Enter your email"
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = 'var(--accent)';
                  (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  const icon = document.getElementById('email-icon');
                  if (icon) icon.style.color = '#667eea';
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
                  (e.target as HTMLInputElement).style.boxShadow = 'none';
                  const icon = document.getElementById('email-icon');
                  if (icon) icon.style.color = 'var(--text-muted)';
                }}
              />
            </div>
          </div>
          
          <div style={{ animation: 'fadeInLeft 0.7s ease-out' }}>
            <label htmlFor="password" style={{ 
              display: 'block', 
              fontSize: '0.813rem', 
              fontWeight: '600', 
              color: 'var(--text)',
              marginBottom: '0.5rem'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div 
                id="password-icon"
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                  transition: 'color 0.2s ease'
                }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 42px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none'
                }}
                placeholder="Enter your password"
                minLength={8}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = 'var(--accent)';
                  (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  const icon = document.getElementById('password-icon');
                  if (icon) icon.style.color = '#667eea';
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
                  (e.target as HTMLInputElement).style.boxShadow = 'none';
                  const icon = document.getElementById('password-icon');
                  if (icon) icon.style.color = 'var(--text-muted)';
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              color: 'var(--danger)',
              fontSize: '0.813rem',
              textAlign: 'center',
              background: 'color-mix(in srgb, var(--danger) 8%, transparent)',
              padding: '0.875rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)',
              animation: 'shake 0.4s cubic-bezier(.36,.07,.19,.97)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
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
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1rem',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#ffffff',
              background: loading ? 'var(--text-muted)' : 'linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: loading ? 0.6 : 1,
              boxShadow: loading ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
              transform: 'scale(1)',
              animation: 'fadeInUp 0.8s ease-out'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.target as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.02)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                (e.target as HTMLButtonElement).style.transform = 'translateY(0) scale(1)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }
            }}
            onMouseDown={(e) => {
              if (!loading) {
                (e.target as HTMLButtonElement).style.transform = 'scale(0.98)';
              }
            }}
            onMouseUp={(e) => {
              if (!loading) {
                (e.target as HTMLButtonElement).style.transform = 'scale(1)';
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #ffffff',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }} />
                Processing...
              </>
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>

          {isLogin && (
            <>
              <div style={{ position: 'relative', margin: '0.5rem 0' }}>
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
                  fontSize: '0.75rem' 
                }}>
                  <span style={{ 
                    padding: '0 0.75rem', 
                    background: 'var(--surface)', 
                    color: 'var(--text-muted)',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Or
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    setLoading(true);
                    setError(''); // Clear any previous errors
                    await loginWithGoogle();
                  } catch (error) {
                    console.error('Google sign-in error:', error);
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
                  gap: '0.5rem',
                  padding: '0.875rem 1rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text)',
                  background: 'var(--bg)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: loading ? 0.6 : 1,
                  boxShadow: 'var(--shadow-sm)',
                  animation: 'fadeInUp 0.9s ease-out'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    (e.target as HTMLButtonElement).style.background = 'var(--bg-alt)';
                    (e.target as HTMLButtonElement).style.borderColor = 'var(--accent)';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    (e.target as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    (e.target as HTMLButtonElement).style.background = 'var(--bg)';
                    (e.target as HTMLButtonElement).style.borderColor = 'var(--border)';
                    (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                    (e.target as HTMLButtonElement).style.boxShadow = 'var(--shadow-sm)';
                  }
                }}
                onMouseDown={(e) => {
                  if (!loading) {
                    (e.target as HTMLButtonElement).style.transform = 'scale(0.98)';
                  }
                }}
                onMouseUp={(e) => {
                  if (!loading) {
                    (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                  }
                }}
              >
                <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
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
                Continue with Google
              </button>
            </>
          )}
          
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              style={{
                color: 'var(--accent)',
                fontSize: '0.875rem',
                fontWeight: '600',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                padding: '0.5rem'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.textDecoration = 'none';
              }}
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
    </div>
  );
};

export default LoginPage;