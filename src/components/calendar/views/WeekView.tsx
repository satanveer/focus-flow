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
    isPinned: boolean;
  }>({
    isVisible: false,
    events: [],
    position: { x: 0, y: 0 },
    isPinned: false
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

  // Hours for the time grid (showing condensed work hours 7 AM to 9 PM)
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);

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
    mouseEvent: React.MouseEvent,
    pin = false // If true, tooltip stays open for scrolling
  ) => {
    const rect = mouseEvent.currentTarget.getBoundingClientRect();
    setTooltipState({
      isVisible: true,
      events,
      position: {
        x: rect.left - 200, // Position tooltip to the left of the indicator
        y: rect.top
      },
      isPinned: pin
    });
  };

  const handleMoreEventsLeave = () => {
    setTooltipState(prev => prev.isPinned ? prev : { ...prev, isVisible: false });
  };
  
  const handleCloseTooltip = () => {
    setTooltipState(prev => ({ ...prev, isVisible: false, isPinned: false }));
  };

  // Close tooltip when clicking outside
  React.useEffect(() => {
    if (!tooltipState.isPinned) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.event-tooltip')) {
        handleCloseTooltip();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [tooltipState.isPinned]);

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Week header with days */}
        <div className="flex min-w-full" style={{ borderBottom: '1px solid var(--border)' }}>
          {/* Time column placeholder - fixed width */}
          <div className="w-14 sm:w-16 flex-shrink-0" style={{ background: 'var(--surface)' }} />
          
          {/* Day headers - equal width */}
          {weekDays.map((day, i) => (
            <div
              key={i}
              className="flex-1 p-2 text-center min-w-0 transition-all duration-200"
              style={{ 
                width: `calc((100% - 4rem) / ${weekDays.length})`,
                borderLeft: '1px solid var(--border)',
                background: day.toDateString() === today 
                  ? 'color-mix(in srgb, var(--accent) 8%, transparent)' 
                  : 'var(--surface)'
              }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide mb-1 truncate" style={{ color: 'var(--text-muted)' }}>
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
              <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mx-auto transition-all duration-200 ${
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
          <div className="flex items-center justify-center h-full min-h-64">
            <div className="text-center p-6">
              <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full" 
                   style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--accent)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>No events this week</h3>
              <p className="mb-4 max-w-sm mx-auto text-sm" style={{ color: 'var(--text-muted)' }}>
                Start a focus session or connect Google Calendar to see your events here.
              </p>
              <button
                onClick={() => showEventModal()}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  boxShadow: '0 3px 10px rgba(102, 126, 234, 0.3)'
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
            <div className="w-14 sm:w-16 flex-shrink-0" style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)' }}>
              {hours.map(hour => (
                <div key={hour} className="h-12 flex items-start justify-end px-1.5 py-0.5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-[10px] font-semibold leading-none" style={{ color: 'var(--text-muted)' }}>
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
                  width: `calc((100% - 4rem) / ${weekDays.length})`,
                  borderLeft: '1px solid var(--border)',
                  background: 'var(--surface)'
                }}
              >
                {hours.map(hour => {
                  const events = getEventsForSlot(day, hour);
                  return (
                    <div
                      key={hour}
                      className="h-12 p-0.5 relative cursor-pointer transition-all duration-200"
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
                        <div className="flex flex-col gap-0.5 h-full overflow-hidden">
                          {/* Show only first event */}
                          {events.slice(0, 1).map((event) => {
                            const eventColors = getEventColorClasses(event);
                            const startTime = new Date(event.startTime);
                            const endTime = new Date(event.endTime);
                            const durationMins = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
                            
                            return (
                              <div
                                key={event.id}
                                className="text-[9px] px-1 py-0.5 rounded cursor-pointer flex-shrink-0 transition-all duration-200 hover:scale-[1.02] hover:shadow-md overflow-hidden font-medium flex items-center justify-center text-center"
                                style={{ 
                                  minHeight: '16px',
                                  maxHeight: '18px',
                                  background: eventColors.bg,
                                  color: eventColors.text,
                                  border: `1px solid ${eventColors.border}`,
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showEventModal(event);
                                }}
                                onMouseEnter={(e) => {
                                  handleMoreEventsHover(events, e);
                                }}
                                onMouseLeave={handleMoreEventsLeave}
                                title={`${event.title} (${durationMins} min)`}
                              >
                                <div className="truncate leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                  {event.title}
                                </div>
                              </div>
                            );
                          })}
                          {/* Show +N more if there are additional events */}
                          {events.length > 1 && (
                            <div 
                              className="text-[7px] rounded px-1 py-0.5 cursor-pointer transition-all duration-200 flex-shrink-0 text-center overflow-hidden font-semibold leading-none flex items-center justify-center"
                              style={{ 
                                minHeight: '14px', 
                                height: '14px',
                                color: 'var(--accent)',
                                background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                                border: '1px solid var(--accent)'
                              }}
                              onMouseEnter={(e) => {
                                handleMoreEventsHover(events, e, false);
                                e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 20%, transparent)';
                              }}
                              onMouseLeave={(e) => {
                                handleMoreEventsLeave();
                                e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 10%, transparent)';
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Pin the tooltip to keep it open for scrolling
                                handleMoreEventsHover(events, e, true);
                              }}
                            >
                              +{events.length - 1}
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
        isPinned={tooltipState.isPinned}
      />
    </div>
    </>
  );
};

export default WeekView;