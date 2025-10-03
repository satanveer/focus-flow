import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleCalendarService } from '../lib/googleCalendar';

export const GoogleCalendarCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting to Google Calendar...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('processing');
        setMessage('Processing authorization...');

        // Get the authorization code from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        console.log('OAuth callback - Code:', code ? 'received' : 'missing', 'Error:', error);

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        setMessage('Exchanging authorization code for token...');

        // Exchange code for access token
        await googleCalendarService.exchangeCodeForToken(code);

        console.log('Google Calendar OAuth successful, token stored');

        setMessage('Token stored successfully!');

        setStatus('success');
        setMessage('Google Calendar connected successfully!');

        // Small delay to show success message
        setTimeout(() => {
          // Get the return path or default to calendar page
          const returnPath = localStorage.getItem('google_auth_return_path') || '/calendar';
          localStorage.removeItem('google_auth_return_path');

          // Navigate back to the original page with success indicator
          navigate(returnPath + '?google_auth=success', { replace: true });
        }, 1500);

      } catch (error) {
        console.error('Google Calendar OAuth callback error:', error);
        
        setStatus('error');
        setMessage((error as Error).message || 'Failed to connect Google Calendar');

        // Small delay before redirecting on error
        setTimeout(() => {
          // Get the return path or default to settings
          const returnPath = localStorage.getItem('google_auth_return_path') || '/settings';
          localStorage.removeItem('google_auth_return_path');

          // Navigate back with error
          navigate(returnPath + '?google_auth=error&message=' + encodeURIComponent((error as Error).message), { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        {status === 'processing' && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        )}
        {status === 'success' && (
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        )}
        {status === 'error' && (
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        )}
        
        <h2 className={`text-xl font-semibold mb-2 ${
          status === 'success' ? 'text-green-800 dark:text-green-200' :
          status === 'error' ? 'text-red-800 dark:text-red-200' :
          'text-gray-900 dark:text-gray-100'
        }`}>
          {status === 'success' ? 'Connection Successful!' :
           status === 'error' ? 'Connection Failed' :
           'Connecting Google Calendar'}
        </h2>
        
        <p className={`${
          status === 'success' ? 'text-green-600 dark:text-green-400' :
          status === 'error' ? 'text-red-600 dark:text-red-400' :
          'text-gray-600 dark:text-gray-400'
        }`}>
          {message}
        </p>
        
        {status === 'success' && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Redirecting you back...
          </p>
        )}
        
        {status === 'error' && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Redirecting you back in a few seconds...
          </p>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarCallback;