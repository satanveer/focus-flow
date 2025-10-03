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
    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Left side - Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={navigateToToday}
          className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Today
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={navigatePrevious}
            className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            ‹
          </button>
          
          <button
            onClick={navigateNext}
            className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            ›
          </button>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {formatHeaderTitle()}
        </h2>
      </div>

      {/* Right side - View switcher */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-1">
        {viewButtons.map((button) => (
          <button
            key={button.type}
            onClick={() => setView({ 
              type: button.type, 
              date: state.selectedDate.toISOString().split('T')[0] 
            })}
            className={`px-3 py-2 rounded-sm text-sm font-medium transition-all ${
              state.view.type === button.type
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalendarHeader;