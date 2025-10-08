import React, { useState } from 'react';
import { useCalendar } from '../../../contexts/CalendarContext';
import type { CalendarEvent } from '../../../domain/models';
import EventTooltip from '../../EventTooltip';

const WeekView: React.FC = () => {
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

  // Get the start of the week
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(state.selectedDate);
  const fullWeekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });

  // On mobile, show only 3 days (yesterday, today, tomorrow)
  const [showMobileView, setShowMobileView] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setShowMobileView(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // For mobile: show today and 2 days around it
  const todayIndex = fullWeekDays.findIndex(d => d.toDateString() === new Date().toDateString());
  const mobileDayIndices = todayIndex >= 0 
    ? [Math.max(0, todayIndex - 1), todayIndex, Math.min(6, todayIndex + 1)]
    : [0, 1, 2];
  
  const weekDays = showMobileView 
    ? mobileDayIndices.map(i => fullWeekDays[i])
    : fullWeekDays;

  // Hours for the time grid (showing work hours 6 AM to 11 PM)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  // Get events for a specific day and hour
  const getEventsForSlot = (date: Date, hour: number): CalendarEvent[] => {
    return state.events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventDay = eventStart.toDateString();
      const eventHour = eventStart.getHours();
      
      return eventDay === date.toDateString() && eventHour === hour;
    });
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const getEventColorClasses = (event: CalendarEvent) => {
    if (event.color) return 'bg-blue-500 text-white';
    
    switch (event.type) {
      case 'focus': return 'bg-blue-500 text-white';
      case 'break': return 'bg-green-500 text-white';
      case 'task': return 'bg-purple-500 text-white';
      case 'meeting': return 'bg-red-500 text-white';
      case 'personal': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const today = new Date().toDateString();

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

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Week header with days */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="w-12 sm:w-20 min-w-12 sm:min-w-20 bg-gray-50 dark:bg-gray-800" /> {/* Time column */}
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={`flex-1 p-2 sm:p-4 text-center border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${
                day.toDateString() === today ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5 sm:mb-1">
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
              <div className={`text-sm sm:text-base font-semibold w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full mx-auto ${
                day.toDateString() === today 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto relative">
        {state.events.length === 0 ? (
          /* Empty state - properly contained */
          <div className="flex items-center justify-center h-full min-h-96">
            <div className="text-center">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No events this week</h3>
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
          /* Time grid with events */
          <div className="flex min-h-full">
            {/* Time column */}
            <div className="w-12 sm:w-20 min-w-12 sm:min-w-20 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {hours.map(hour => (
                <div key={hour} className="h-12 sm:h-16 border-b border-gray-100 dark:border-gray-700 flex items-start justify-end px-1 sm:px-2 py-1">
                  <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium leading-none">
                    {formatHour(hour)}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="flex flex-1">
              {weekDays.map((day, dayIndex) => (
                <div key={dayIndex} className="flex-1 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {hours.map(hour => {
                  const events = getEventsForSlot(day, hour);
                  return (
                    <div
                      key={hour}
                      className="h-12 sm:h-16 border-b border-gray-100 dark:border-gray-700 p-0.5 sm:p-1 relative hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors overflow-hidden"
                      onClick={() => {
                        // Create new event at this time slot
                        const newEventTime = new Date(day);
                        newEventTime.setHours(hour, 0, 0, 0);
                      }}
                    >
                      {events.length > 0 && (
                        <div className="flex flex-col gap-0.5 h-full justify-start">
                          {events.slice(0, showMobileView ? 1 : 2).map((event) => (
                            <div
                              key={event.id}
                              className={`text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate cursor-pointer flex-shrink-0 shadow-sm hover:shadow-md transition-shadow flex items-center justify-center ${getEventColorClasses(event)}`}
                              style={{ 
                                height: events.length === 1 ? 'auto' : showMobileView ? '14px' : '16px',
                                minHeight: showMobileView ? '14px' : '16px',
                                maxHeight: showMobileView ? '18px' : '20px'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                showEventModal(event);
                              }}
                            >
                              <div className="font-medium truncate leading-tight text-center">{event.title}</div>
                            </div>
                          ))}
                          {events.length > (showMobileView ? 1 : 2) && (
                            <div 
                              className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded px-0.5 sm:px-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0 shadow-sm flex items-center justify-center"
                              style={{ height: showMobileView ? '14px' : '16px', minHeight: showMobileView ? '14px' : '16px', maxHeight: showMobileView ? '18px' : '20px' }}
                              onMouseEnter={(e) => handleMoreEventsHover(events.slice(showMobileView ? 1 : 2), e)}
                              onMouseLeave={handleMoreEventsLeave}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Show first remaining event when clicking "+X more"
                                const nextEventIndex = showMobileView ? 1 : 2;
                                if (events[nextEventIndex]) {
                                  showEventModal(events[nextEventIndex]);
                                }
                              }}
                            >
                              <div className="leading-tight font-medium text-center">+{events.length - (showMobileView ? 1 : 2)}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            </div>
          </div>
        )}
      </div>
      
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

export default WeekView;