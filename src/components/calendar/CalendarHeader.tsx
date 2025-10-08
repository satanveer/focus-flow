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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 gap-3 sm:gap-4">
      {/* Left side - Navigation */}
      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <button
          onClick={navigateToToday}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Today
        </button>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={navigatePrevious}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center text-lg"
          >
            ‹
          </button>
          
          <button
            onClick={navigateNext}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center text-lg"
          >
            ›
          </button>
        </div>
        
        <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate flex-1">
          {formatHeaderTitle()}
        </h2>
      </div>

      {/* Right side - View switcher */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-0.5 sm:p-1 w-full sm:w-auto overflow-x-auto">
        {viewButtons.map((button) => (
          <button
            key={button.type}
            onClick={() => setView({ 
              type: button.type, 
              date: state.selectedDate.toISOString().split('T')[0] 
            })}
            className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-sm text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-initial whitespace-nowrap ${
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