import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../lib/appwrite';

const AuthCallback: React.FC = () => {
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // For Appwrite OAuth2Session, check if user is authenticated
        const user = await authService.getCurrentUser();
        
        if (user) {
          // OAuth was successful, refresh the user state
          await refreshUser();
          // Redirect to the main app
          window.location.href = '/';
        } else {
          // No authenticated user, OAuth failed
          window.location.href = '/?error=oauth_failed';
        }
      } catch (error) {
        // OAuth callback error
        window.location.href = '/?error=oauth_error';
      }
    };

    // Small delay to ensure OAuth session is established
    setTimeout(handleCallback, 1000);
  }, [refreshUser]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '1rem'
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
        <p style={{ color: 'var(--text-muted)' }}>Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;