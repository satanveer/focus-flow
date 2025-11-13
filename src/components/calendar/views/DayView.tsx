import React, { useState } from 'react';
import { useCalendar } from '../../../contexts/CalendarContext';
import type { CalendarEvent } from '../../../domain/models';
import EventTooltip from '../../EventTooltip';

const DayView: React.FC = () => {
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

  // Hours for the time grid (7 AM to 9 PM)
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);

  // Get events for a specific hour
  const getEventsForHour = (hour: number) => {
    return state.events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventDay = eventStart.toDateString();
      const eventHour = eventStart.getHours();
      
      return eventDay === state.selectedDate.toDateString() && eventHour === hour;
    });
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const getEventColorClasses = (eventType: string) => {
    switch (eventType) {
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

  const handleMoreEventsHover = (
    events: CalendarEvent[], 
    mouseEvent: React.MouseEvent,
    pin = false
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

  const dayName = state.selectedDate.toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  const today = new Date().toDateString();
  const isToday = state.selectedDate.toDateString() === today;
  const dayEvents = state.events.filter(e => new Date(e.startTime).toDateString() === state.selectedDate.toDateString());

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day header */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>
              {dayName}
            </div>
            <div className={`text-2xl font-bold flex items-center gap-2 ${
              isToday ? 'rounded-full inline-flex items-center justify-center w-10 h-10' : ''
            }`}
            style={isToday ? {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 3px 10px rgba(102, 126, 234, 0.4)'
            } : {
              color: 'var(--text)'
            }}>
              {state.selectedDate.getDate()}
            </div>
          </div>
          
          <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {state.selectedDate.toLocaleDateString(undefined, { 
              month: 'long', 
              year: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Time grid or empty state */}
      {dayEvents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-64">
          <div className="text-center p-6">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full" 
                 style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--accent)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>No events today</h3>
            <p className="mb-4 max-w-sm mx-auto text-sm" style={{ color: 'var(--text-muted)' }}>
              Start a focus session or create an event to get started.
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
        /* Time grid */
        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            {/* Time column */}
            <div className="w-16 min-w-16" style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)' }}>
              {hours.map(hour => (
                <div key={hour} className="h-12 flex items-start justify-end px-1.5 py-0.5" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-[10px] font-semibold leading-none" style={{ color: 'var(--text-muted)' }}>
                    {formatHour(hour)}
                  </span>
                </div>
              ))}
            </div>

            {/* Events column */}
            <div className="flex-1" style={{ background: 'var(--surface)' }}>
              {hours.map(hour => {
                const events = getEventsForHour(hour);
                return (
                  <div
                    key={hour}
                    className="h-12 p-1 cursor-pointer transition-all duration-200 overflow-hidden"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 5%, transparent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    onClick={() => {
                      const newEventTime = new Date(state.selectedDate);
                      newEventTime.setHours(hour, 0, 0, 0);
                    }}
                  >
                    {events.length > 0 && (
                      <div className="flex flex-col gap-0.5 h-full justify-start">
                        {/* Show only first event */}
                        {events.slice(0, 1).map((event) => {
                          const eventColors = getEventColorClasses(event.type);
                          const startTime = new Date(event.startTime);
                          const endTime = new Date(event.endTime);
                          const durationMins = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
                          const timeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                          
                          return (
                            <div
                              key={event.id}
                              className="text-[9px] px-2 py-1 rounded-md cursor-pointer flex-shrink-0 transition-all duration-200 hover:scale-[1.01] hover:shadow-md flex flex-col items-center justify-center gap-0.5 font-medium text-center"
                              style={{ 
                                minHeight: '20px',
                                maxHeight: '26px',
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
                              title={`${event.title} - ${timeStr} (${durationMins} min)`}
                            >
                              <div className="truncate leading-tight w-full">{event.title}</div>
                              <div className="text-[8px] opacity-75 whitespace-nowrap">
                                {timeStr} · {durationMins}m
                              </div>
                            </div>
                          );
                        })}
                        {/* Show +N more if there are additional events */}
                        {events.length > 1 && (
                          <div 
                            className="text-[7px] rounded-md px-2 py-1 cursor-pointer transition-all duration-200 flex-shrink-0 flex items-center justify-center font-semibold leading-none"
                            style={{ 
                              height: '14px', 
                              minHeight: '14px',
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
          </div>
        </div>
      )}
      
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

export default DayView;