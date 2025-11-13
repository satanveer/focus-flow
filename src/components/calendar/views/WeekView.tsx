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
    if (event.color) {
      return {
        bg: event.color,
        text: '#ffffff',
        border: event.color
      };
    }
    
    switch (event.type) {
      case 'focus': 
        return {
          bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          text: '#ffffff',
          border: '#3b82f6'
        };
      case 'break': 
        return {
          bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          text: '#ffffff',
          border: '#10b981'
        };
      case 'task': 
        return {
          bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          text: '#ffffff',
          border: '#667eea'
        };
      case 'meeting': 
        return {
          bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          text: '#ffffff',
          border: '#ef4444'
        };
      case 'personal': 
        return {
          bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          text: '#ffffff',
          border: '#f59e0b'
        };
      default: 
        return {
          bg: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          text: '#ffffff',
          border: '#6b7280'
        };
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
        <div className="flex min-w-full" style={{ borderBottom: '1px solid var(--border)' }}>
          {/* Time column placeholder - fixed width */}
          <div className="w-16 sm:w-20 flex-shrink-0" style={{ background: 'var(--surface)' }} />
          
          {/* Day headers - equal width */}
          {weekDays.map((day, i) => (
            <div
              key={i}
              className="flex-1 p-3 text-center min-w-0 transition-all duration-200"
              style={{ 
                width: `calc((100% - 5rem) / ${weekDays.length})`,
                borderLeft: '1px solid var(--border)',
                background: day.toDateString() === today 
                  ? 'color-mix(in srgb, var(--accent) 8%, transparent)' 
                  : 'var(--surface)'
              }}
            >
              <div className="text-xs font-semibold uppercase tracking-wide mb-1 truncate" style={{ color: 'var(--text-muted)' }}>
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
              <div className={`text-base font-bold w-9 h-9 flex items-center justify-center rounded-full mx-auto transition-all duration-200 ${
                day.toDateString() === today ? 'shadow-md' : ''
              }`}
              style={day.toDateString() === today ? {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              } : {
                color: 'var(--text)'
              }}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

      <div className="flex-1 overflow-y-auto relative">
        {state.events.length === 0 ? (
          /* Empty state */
          <div className="flex items-center justify-center h-full min-h-96">
            <div className="text-center p-8">
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full" 
                   style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--accent)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>No events this week</h3>
              <p className="mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                Start a focus session or connect Google Calendar to see your events here.
              </p>
              <button
                onClick={() => showEventModal()}
                className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
              >
                Create Event
              </button>
            </div>
          </div>
        ) : (
          /* Time grid with events */
          <div className="flex min-w-full">
            {/* Time column - fixed width */}
            <div className="w-16 sm:w-20 flex-shrink-0" style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)' }}>
              {hours.map(hour => (
                <div key={hour} className="h-16 flex items-start justify-end px-2 py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-xs font-semibold leading-none" style={{ color: 'var(--text-muted)' }}>
                    {formatHour(hour)}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns - equal width */}
            {weekDays.map((day, dayIndex) => (
              <div 
                key={dayIndex} 
                className="flex-1 min-w-0"
                style={{ 
                  width: `calc((100% - 5rem) / ${weekDays.length})`,
                  borderLeft: '1px solid var(--border)',
                  background: 'var(--surface)'
                }}
              >
                {hours.map(hour => {
                  const events = getEventsForSlot(day, hour);
                  return (
                    <div
                      key={hour}
                      className="h-16 p-1 relative cursor-pointer transition-all duration-200"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 5%, transparent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                      onClick={() => {
                        const newEventTime = new Date(day);
                        newEventTime.setHours(hour, 0, 0, 0);
                      }}
                    >
                      {events.length > 0 && (
                        <div className="flex flex-col gap-1 h-full overflow-hidden">
                          {events.slice(0, 2).map((event) => {
                            const eventColors = getEventColorClasses(event);
                            return (
                              <div
                                key={event.id}
                                className="text-xs px-2 py-1 rounded-md cursor-pointer flex-shrink-0 transition-all duration-200 hover:scale-105 hover:shadow-md overflow-hidden font-medium"
                                style={{ 
                                  minHeight: '22px',
                                  maxHeight: '28px',
                                  background: eventColors.bg,
                                  color: eventColors.text,
                                  border: `1px solid ${eventColors.border}`
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showEventModal(event);
                                }}
                                title={event.title}
                              >
                                <div className="truncate leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                                  {event.title}
                                </div>
                              </div>
                            );
                          })}
                          {events.length > 2 && (
                            <div 
                              className="text-xs rounded-md px-2 py-1 cursor-pointer transition-all duration-200 flex-shrink-0 text-center overflow-hidden font-semibold"
                              style={{ 
                                minHeight: '20px', 
                                maxHeight: '22px',
                                color: 'var(--accent)',
                                background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                                border: '1px solid var(--accent)'
                              }}
                              onMouseEnter={(e) => {
                                handleMoreEventsHover(events.slice(2), e);
                                e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 20%, transparent)';
                              }}
                              onMouseLeave={(e) => {
                                handleMoreEventsLeave();
                                e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 10%, transparent)';
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (events[2]) {
                                  showEventModal(events[2]);
                                }
                              }}
                            >
                              <div className="leading-tight whitespace-nowrap">+{events.length - 2}</div>
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