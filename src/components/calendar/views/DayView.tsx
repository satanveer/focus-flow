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
  }>({
    isVisible: false,
    events: [],
    position: { x: 0, y: 0 }
  });

  // Hours for the time grid (6 AM to 11 PM)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

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
      <div className="p-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              {dayName}
            </div>
            <div className={`text-3xl font-bold flex items-center gap-3 ${
              isToday ? 'rounded-full inline-flex items-center justify-center w-14 h-14' : ''
            }`}
            style={isToday ? {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            } : {
              color: 'var(--text)'
            }}>
              {state.selectedDate.getDate()}
            </div>
          </div>
          
          <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {state.selectedDate.toLocaleDateString(undefined, { 
              month: 'long', 
              year: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Time grid or empty state */}
      {dayEvents.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-96">
          <div className="text-center p-8">
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full" 
                 style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--accent)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>No events today</h3>
            <p className="mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
              Start a focus session or create an event to get started.
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
        /* Time grid */
        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            {/* Time column */}
            <div className="w-20 min-w-20" style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)' }}>
              {hours.map(hour => (
                <div key={hour} className="h-16 flex items-start justify-end px-2 py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                  <span className="text-xs font-semibold leading-none" style={{ color: 'var(--text-muted)' }}>
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
                    className="h-16 p-2 cursor-pointer transition-all duration-200 overflow-hidden"
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
                      <div className="flex flex-col gap-1.5 h-full justify-start">
                        {events.slice(0, 2).map((event) => {
                          const eventColors = getEventColorClasses(event.type);
                          return (
                            <div
                              key={event.id}
                              className="text-sm px-3 py-2 rounded-lg truncate cursor-pointer flex-shrink-0 transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center font-medium"
                              style={{ 
                                height: events.length === 1 ? 'auto' : '24px',
                                minHeight: '24px',
                                maxHeight: '28px',
                                background: eventColors.bg,
                                color: eventColors.text,
                                border: `1px solid ${eventColors.border}`
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                showEventModal(event);
                              }}
                            >
                              <div className="truncate leading-tight">{event.title}</div>
                            </div>
                          );
                        })}
                        {events.length > 2 && (
                          <div 
                            className="text-xs rounded-lg px-3 py-1 cursor-pointer transition-all duration-200 flex-shrink-0 flex items-center justify-center font-semibold"
                            style={{ 
                              height: '22px', 
                              minHeight: '22px', 
                              maxHeight: '24px',
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
                            <div className="leading-tight">+{events.length - 2} more</div>
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
      />
    </div>
    </>
  );
};

export default DayView;