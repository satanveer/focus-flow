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

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdaysShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <>
      <div className="flex-1 flex flex-col">
      {/* Weekday headers */}
      <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border)' }}>
        {weekdays.map((day, index) => (
          <div key={day} className="p-2 sm:p-2.5 text-center" style={{ borderRight: index < 6 ? '1px solid var(--border)' : 'none' }}>
            {/* Show single letter on mobile, full text on tablet+ */}
            <span className="text-xs font-semibold uppercase tracking-wide sm:hidden" style={{ color: 'var(--text-muted)' }}>
              {weekdaysShort[index]}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
              {day}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar grid or empty state */}
      {state.events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-64">
          <div className="text-center p-6">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full" 
                 style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--accent)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>No events this month</h3>
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
        /* Calendar grid */
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {monthDays.map((day, index) => {
            const isToday = day.toDateString() === today;
            const isCurrentMonth = day.getMonth() === selectedMonth;
            const events = getEventsForDay(day);

            return (
              <div
                key={index}
                className={`p-1 sm:p-2 min-h-16 sm:min-h-20 cursor-pointer transition-all duration-200 ${
                  !isCurrentMonth ? 'opacity-40' : ''
                }`}
                style={{
                  borderRight: (index % 7) < 6 ? '1px solid var(--border)' : 'none',
                  borderBottom: '1px solid var(--border)',
                  background: !isCurrentMonth 
                    ? 'color-mix(in srgb, var(--text-muted) 3%, transparent)' 
                    : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (isCurrentMonth) {
                    e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 5%, transparent)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = !isCurrentMonth 
                    ? 'color-mix(in srgb, var(--text-muted) 3%, transparent)' 
                    : 'transparent';
                }}
                onClick={() => {
                  const newEventTime = new Date(day);
                  newEventTime.setHours(9, 0, 0, 0);
                }}
              >
                {/* Day number */}
                <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                  <span className={`text-xs sm:text-sm font-semibold transition-all ${
                    isToday 
                      ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center'
                      : ''
                  }`}
                  style={isToday ? {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    boxShadow: '0 2px 6px rgba(102, 126, 234, 0.4)'
                  } : {
                    color: isCurrentMonth ? 'var(--text)' : 'var(--text-muted)'
                  }}>
                    {day.getDate()}
                  </span>
                </div>

                {/* Events */}
                <div className="space-y-0.5 sm:space-y-1">
                  {events.length > 0 && (
                    <>
                      {/* Mobile: Show dots */}
                      <div className="flex gap-1 sm:hidden flex-wrap">
                        {events.slice(0, 4).map((event) => {
                          const eventColors = getEventColorClasses(event.type);
                          return (
                            <div
                              key={event.id}
                              className="w-1.5 h-1.5 rounded-full transition-transform hover:scale-125 cursor-pointer"
                              style={{ background: eventColors.bg }}
                              onClick={(e) => {
                                e.stopPropagation();
                                showEventModal(event);
                              }}
                            />
                          );
                        })}
                        {events.length > 4 && (
                          <span className="text-[9px] font-medium" style={{ color: 'var(--text-muted)' }}>
                            +{events.length - 4}
                          </span>
                        )}
                      </div>
                      
                      {/* Tablet+: Show event bars */}
                      <div className="hidden sm:block space-y-1">
                        {events.slice(0, 2).map((event) => {
                          const eventColors = getEventColorClasses(event.type);
                          return (
                            <div
                              key={event.id}
                              className="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm"
                              style={{
                                background: eventColors.bg,
                                color: eventColors.text,
                                border: `1px solid ${eventColors.border}`
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                showEventModal(event);
                              }}
                            >
                              <span className="truncate block">{event.title}</span>
                            </div>
                          );
                        })}
                        {events.length > 2 && (
                          <div 
                            className="text-[9px] text-center font-semibold cursor-pointer transition-all duration-200 px-1 py-0.5 rounded"
                            style={{
                              color: 'var(--accent)',
                              background: 'color-mix(in srgb, var(--accent) 10%, transparent)'
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
                            +{events.length - 2}
                          </div>
                        )}
                      </div>
                    </>
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