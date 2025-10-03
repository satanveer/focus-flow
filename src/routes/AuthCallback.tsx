import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../lib/appwrite';

const AuthCallback: React.FC = () => {
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract userId and secret from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        const secret = urlParams.get('secret');

        if (userId && secret) {
          // Handle the OAuth token callback
          const user = await authService.handleOAuthTokenCallback(userId, secret);
          
          if (user) {
            // Refresh the user state in the app
            await refreshUser();
            // Redirect to the main app
            window.location.href = '/';
          } else {
            window.location.href = '/?error=oauth_failed';
          }
        } else {
          // Missing OAuth parameters, redirect to login
          window.location.href = '/?error=missing_params';
        }
      } catch (error) {
        window.location.href = '/?error=oauth_error';
      }
    };

    handleCallback();
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