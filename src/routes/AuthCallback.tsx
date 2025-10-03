import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../lib/appwrite';

const AuthCallback: React.FC = () => {
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait longer for OAuth session to be established
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if there are any URL parameters that might help
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        
        if (error) {
          // OAuth failed at Google level
          window.location.href = `/?error=${error}`;
          return;
        }
        
        // Try to get the current user after OAuth callback
        const user = await authService.getCurrentUser();
        
        if (user) {
          // OAuth was successful, refresh the user state
          await refreshUser();
          // Redirect to the main app
          window.location.href = '/';
        } else {
          // Try to handle OAuth callback if no user yet
          try {
            const callbackUser = await authService.handleOAuthCallback();
            if (callbackUser) {
              await refreshUser();
              window.location.href = '/';
            } else {
              window.location.href = '/?error=oauth_failed';
            }
          } catch (callbackError) {
            console.error('OAuth callback handling failed:', callbackError);
            window.location.href = '/?error=oauth_failed';
          }
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
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