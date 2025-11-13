import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 30% 40%, rgba(102, 126, 234, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(118, 75, 162, 0.15) 0%, transparent 50%)',
        animation: 'pulse 4s ease-in-out infinite',
      }} />
      
      {/* Main Loading Content */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
        animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Logo and Spinner Container */}
        <div style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Outer Ring */}
          <div style={{
            position: 'absolute',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: '#667eea',
            borderRightColor: '#764ba2',
            animation: 'spin 1.5s linear infinite',
            filter: 'drop-shadow(0 0 10px rgba(102, 126, 234, 0.3))'
          }} />
          
          {/* Middle Ring */}
          <div style={{
            position: 'absolute',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            border: '3px solid transparent',
            borderBottomColor: '#667eea',
            borderLeftColor: '#764ba2',
            animation: 'spinReverse 2s linear infinite',
            filter: 'drop-shadow(0 0 8px rgba(118, 75, 162, 0.3))'
          }} />
          
          {/* Inner Circle with Icon */}
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{
                animation: 'float 3s ease-in-out infinite'
              }}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>
        
        {/* BobbyFlow Text */}
        <div style={{
          textAlign: 'center',
          animation: 'fadeInUp 0.8s ease-out 0.2s backwards'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
            letterSpacing: '-0.03em',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            BobbyFlow
          </h1>
          
          {/* Loading Text with Dots */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'var(--text-muted)',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            <span>Loading</span>
            <div style={{
              display: 'flex',
              gap: '0.25rem',
              alignItems: 'center'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'dotBounce 1.4s ease-in-out infinite',
                animationDelay: '0s'
              }} />
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'dotBounce 1.4s ease-in-out infinite',
                animationDelay: '0.2s'
              }} />
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'dotBounce 1.4s ease-in-out infinite',
                animationDelay: '0.4s'
              }} />
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div style={{
          width: '200px',
          height: '4px',
          background: 'var(--border)',
          borderRadius: '2px',
          overflow: 'hidden',
          animation: 'fadeInUp 1s ease-out 0.4s backwards'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '2px',
            animation: 'progressBar 1.5s ease-in-out infinite',
            boxShadow: '0 0 10px rgba(102, 126, 234, 0.5)'
          }} />
        </div>
      </div>
    </div>
  );
};
