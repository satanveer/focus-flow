import React from 'react';
import { useCalendar } from '../../contexts/CalendarContext';

const CalendarHeader: React.FC = () => {
  const { 
    state, 
    setView, 
    navigateToToday, 
    navigateNext, 
    navigatePrevious 
  } = useCalendar();

  const formatHeaderTitle = () => {
    const date = new Date(state.selectedDate);
    
    switch (state.view.type) {
      case 'month':
        return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${weekStart.toLocaleDateString(undefined, { month: 'long' })} ${weekStart.getDate()}-${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
        } else {
          return `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${weekStart.getFullYear()}`;
        }
      case 'day':
        return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  };

  const viewButtons = [
    { type: 'month' as const, label: 'Month' },
    { type: 'week' as const, label: 'Week' },
    { type: 'day' as const, label: 'Day' },
    { type: 'agenda' as const, label: 'Agenda' }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Left side - Navigation */}
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
        <button
          onClick={navigateToToday}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105"
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)'
          }}
        >
          Today
        </button>
        
        <div className="flex items-center gap-1.5">
          <button
            onClick={navigatePrevious}
            className="w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110 flex items-center justify-center"
            style={{ 
              background: 'var(--bg-alt)',
              border: '1px solid var(--border)',
              color: 'var(--text)'
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={navigateNext}
            className="w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110 flex items-center justify-center"
            style={{ 
              background: 'var(--bg-alt)',
              border: '1px solid var(--border)',
              color: 'var(--text)'
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <h2 className="text-base sm:text-lg font-bold truncate flex-1" style={{ color: 'var(--text)' }}>
          {formatHeaderTitle()}
        </h2>
      </div>

      {/* Right side - View switcher */}
      <div className="flex rounded-lg p-0.5 w-full sm:w-auto overflow-x-auto" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
        {viewButtons.map((button) => (
          <button
            key={button.type}
            onClick={() => setView({ 
              type: button.type, 
              date: state.selectedDate.toISOString().split('T')[0] 
            })}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 flex-1 sm:flex-initial whitespace-nowrap ${
              state.view.type === button.type ? 'shadow-md' : ''
            }`}
            style={state.view.type === button.type ? {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            } : {
              color: 'var(--text-muted)'
            }}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalendarHeader;