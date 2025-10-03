import React, { useState } from 'react';
import { useCalendar } from '../../../contexts/CalendarContext';
import type { CalendarEvent } from '../../../domain/models';
import EventTooltip from '../../EventTooltip';

const MonthView: React.FC = () => {
  const { state, showEventModal } = useCalendar();
  const [tooltipState, setTooltipState] = useState<{
    isVisible: boolean;
    events: CalendarEvent[];
    position: { x: number; y: number };
  }>({
    isVisible: false,
    events: [],
    position: { x: 0, y: 0 }
  });

  // Get calendar month data
  const getMonthData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first Sunday before or on the first day
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // End on the last Saturday after or on the last day
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const monthDays = getMonthData(state.selectedDate);
  const today = new Date().toDateString();
  const selectedMonth = state.selectedDate.getMonth();

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return state.events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventColorClasses = (eventType: string) => {
    switch (eventType) {
      case 'focus': return 'bg-blue-500';
      case 'break': return 'bg-green-500';
      case 'task': return 'bg-purple-500';
      case 'meeting': return 'bg-red-500';
      case 'personal': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const handleMoreEventsHover = (
    events: CalendarEvent[], 
    mouseEvent: React.MouseEvent
  ) => {
    const rect = mouseEvent.currentTarget.getBoundingClientRect();
    setTooltipState({
      isVisible: true,
      events,
      position: {
        x: rect.left - 200, // Position tooltip to the left of the indicator
        y: rect.top
      }
    });
  };

  const handleMoreEventsLeave = () => {
    setTooltipState(prev => ({ ...prev, isVisible: false }));
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <div className="flex-1 flex flex-col">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {weekdays.map(day => (
          <div key={day} className="p-4 text-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid or empty state */}
      {state.events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No events this month</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start a focus session or connect Google Calendar to see your events here.
            </p>
            <button
              onClick={() => showEventModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Event
            </button>
          </div>
        </div>
      ) : (
        /* Calendar grid */
        <div className="flex-1 grid grid-cols-7 grid-rows-6">
          {monthDays.map((day, index) => {
            const isToday = day.toDateString() === today;
            const isCurrentMonth = day.getMonth() === selectedMonth;
            const events = getEventsForDay(day);

            return (
              <div
                key={index}
                className={`border-r border-b border-gray-200 dark:border-gray-700 p-2 min-h-24 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-800'
                }`}
                onClick={() => {
                  const newEventTime = new Date(day);
                  newEventTime.setHours(9, 0, 0, 0); // Default to 9 AM
                }}
              >
                {/* Day number */}
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm ${
                    isToday 
                      ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-medium'
                      : isCurrentMonth
                        ? 'text-gray-900 dark:text-gray-100 font-medium'
                        : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {day.getDate()}
                  </span>
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {events.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded truncate cursor-pointer text-white flex items-center justify-center ${getEventColorClasses(event.type)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        showEventModal(event);
                      }}
                    >
                      <span className="text-center font-medium">{event.title}</span>
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div 
                      className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      onMouseEnter={(e) => handleMoreEventsHover(events.slice(2), e)}
                      onMouseLeave={handleMoreEventsLeave}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Show first remaining event when clicking "+X more"
                        if (events[2]) {
                          showEventModal(events[2]);
                        }
                      }}
                    >
                      +{events.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Event Tooltip */}
      <EventTooltip
        events={tooltipState.events}
        isVisible={tooltipState.isVisible}
        position={tooltipState.position}
      />
    </div>
    </>
  );
};

export default MonthView;