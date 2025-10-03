import React from 'react';
import { useCalendar } from '../../contexts/CalendarContext';

interface CalendarSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { state, showEventModal, getDailyGoal } = useCalendar();

  const today = new Date();
  const todayGoal = getDailyGoal(today);
  
  // Get events for today
  const todayEvents = state.events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === today.toDateString();
  });

  // Focus time today
  const focusTimeToday = todayEvents
    .filter(event => event.type === 'focus' && event.status === 'completed')
    .reduce((total, event) => total + (event.actualFocusTime || 0), 0);

  const focusMinutesToday = Math.floor(focusTimeToday / 60);
  const goalMinutes = todayGoal?.targetMinutes || 120;
  const progressPercentage = Math.min((focusMinutesToday / goalMinutes) * 100, 100);

  if (collapsed) {
    return (
      <div className="w-12 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col">
        <button
          onClick={onToggleCollapse}
          className="w-full p-3 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Today's Progress</h3>
        <button
          onClick={onToggleCollapse}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          ←
        </button>
      </div>

      {/* Progress */}
      <div className="p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Focus Time</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {focusMinutesToday}m / {goalMinutes}m
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Today's Events */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Today's Events</h4>
          {todayEvents.length > 0 ? (
            <div className="space-y-2">
              {todayEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => showEventModal(event)}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{event.title}</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {new Date(event.startTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))}
              {todayEvents.length > 5 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  +{todayEvents.length - 5} more events
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
              No events today
            </div>
          )}
        </div>

        {/* Quick Action */}
        <button
          onClick={() => showEventModal()}
          className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Event
        </button>
      </div>

      {/* Mini Calendar */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">October 2025</h4>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={`weekday-${index}`} className="text-center text-gray-500 dark:text-gray-400 font-medium py-1">
              {day}
            </div>
          ))}
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
            const isToday = day === today.getDate();
            return (
              <div
                key={day}
                className={`text-center py-1 cursor-pointer rounded ${
                  isToday 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarSidebar;