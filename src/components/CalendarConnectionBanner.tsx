import React, { useEffect, useState } from 'react';
import { GoogleCalendarTokenManager } from '../lib/googleCalendarTokens';
import { googleCalendarService } from '../lib/googleCalendar';

export const CalendarConnectionBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const checkCalendarConnection = async () => {
      // Check if we need to prompt for calendar OAuth
      const needsOAuth = localStorage.getItem('needs_calendar_oauth');
      
      if (needsOAuth === 'true') {
        // Double-check tokens aren't already there
        const hasTokens = await GoogleCalendarTokenManager.hasValidTokens();
        if (!hasTokens) {
          setShowBanner(true);
        } else {
          localStorage.removeItem('needs_calendar_oauth');
        }
      }
    };

    checkCalendarConnection();
  }, []);

  const handleConnect = () => {
    setIsConnecting(true);
    // Trigger Google Calendar OAuth
    localStorage.setItem('google_auth_return_path', window.location.pathname);
    window.location.href = googleCalendarService.getAuthUrl();
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.removeItem('needs_calendar_oauth');
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: 'var(--radius-lg)',
      margin: '1rem 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: 'var(--shadow-md)',
      animation: 'slideDown 0.3s ease-out'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
            Connect Your Google Calendar
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
          Sync your FocusFlow calendar with Google Calendar to manage all your events in one place.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginLeft: '1rem' }}>
        <button
          onClick={handleDismiss}
          disabled={isConnecting}
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            transition: 'all 0.2s',
            opacity: isConnecting ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!isConnecting) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          Maybe Later
        </button>
        
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          style={{
            padding: '0.5rem 1.5rem',
            background: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: '#667eea',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'all 0.2s',
            opacity: isConnecting ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => {
            if (!isConnecting) e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {isConnecting ? (
            <>
              <span style={{
                display: 'inline-block',
                width: '14px',
                height: '14px',
                border: '2px solid #667eea',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite'
              }}></span>
              Connecting...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Connect Now
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};
