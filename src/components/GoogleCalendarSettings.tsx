import React, { useState, useEffect } from 'react';
import { useCalendar } from '../contexts/CalendarContext';

export const GoogleCalendarSettings: React.FC = () => {
  const { googleCalendar } = useCalendar();
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check for OAuth success/error messages
  useEffect(() => {
    const handleAuthMessage = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const googleAuth = urlParams.get('google_auth');
      const errorMessage = urlParams.get('message');

      if (googleAuth === 'success') {
        setAuthMessage({ type: 'success', message: 'Google Calendar connected successfully!' });
        
        // Refresh the Google Calendar connection state
        await googleCalendar.refreshConnectionState();
        
        // Clear the URL parameter
        window.history.replaceState({}, '', window.location.pathname);
        
        // Clear message after 5 seconds
        setTimeout(() => setAuthMessage(null), 5000);
      } else if (googleAuth === 'error') {
        setAuthMessage({ 
          type: 'error', 
          message: errorMessage ? decodeURIComponent(errorMessage) : 'Failed to connect Google Calendar' 
        });
        // Clear the URL parameter
        window.history.replaceState({}, '', window.location.pathname);
        
        // Clear message after 10 seconds
        setTimeout(() => setAuthMessage(null), 10000);
      }
    };
    
    handleAuthMessage();
  }, [googleCalendar]);

  const handleConnect = async () => {
    try {
      await googleCalendar.connect();
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
    }
  };

  const handleDisconnect = () => {
    googleCalendar.disconnect();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Google Calendar Integration
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Connect Google Calendar to automatically log your completed focus sessions. Each focus session will appear as an event in your Google Calendar with details about the task and duration.
        </p>
      </div>

      {/* OAuth Success/Error Message */}
      {authMessage && (
        <div className={`rounded-lg p-4 mb-6 ${
          authMessage.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {authMessage.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="text-sm font-medium">
              {authMessage.message}
            </span>
            <button
              onClick={() => setAuthMessage(null)}
              className="ml-auto text-sm opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${
              googleCalendar.isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {googleCalendar.isConnected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
        </div>
        
        {!googleCalendar.isConnected ? (
          <div className="space-y-4">
            <button
              onClick={handleConnect}
              disabled={googleCalendar.isConnecting}
              className="w-full px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {googleCalendar.isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click the button above to connect your Google Calendar account.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ✓ Google Calendar is connected and syncing automatically.
            </p>
            
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      {!googleCalendar.isConnected && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Setup Instructions</h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Click "Connect Google Calendar" above</li>
            <li>Sign in with your Google account</li>
            <li>Grant permissions for Focus Flow to access your calendar</li>
            <li>Your focus sessions will automatically appear in Google Calendar!</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarSettings;