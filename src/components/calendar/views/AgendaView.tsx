import React from 'react';
import { useCalendar } from '../../../contexts/CalendarContext';

const AgendaView: React.FC = () => {
  const { state, showEventModal } = useCalendar();

  // Get upcoming events for the next 30 days
  const getUpcomingEvents = () => {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(now.getDate() + 30);

    return state.events
      .filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate >= now && eventDate <= endDate;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  const upcomingEvents = getUpcomingEvents();

  const getEventColorClasses = (eventType: string) => {
    switch (eventType) {
      case 'focus': 
        return {
          border: '#3b82f6',
          bg: 'color-mix(in srgb, #3b82f6 8%, transparent)'
        };
      case 'break': 
        return {
          border: '#10b981',
          bg: 'color-mix(in srgb, #10b981 8%, transparent)'
        };
      case 'task': 
        return {
          border: '#667eea',
          bg: 'color-mix(in srgb, #667eea 8%, transparent)'
        };
      case 'meeting': 
        return {
          border: '#ef4444',
          bg: 'color-mix(in srgb, #ef4444 8%, transparent)'
        };
      case 'personal': 
        return {
          border: '#f59e0b',
          bg: 'color-mix(in srgb, #f59e0b 8%, transparent)'
        };
      default: 
        return {
          border: '#6b7280',
          bg: 'var(--bg-alt)'
        };
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'focus': return '#3b82f6';
      case 'break': return '#10b981';
      case 'task': return '#667eea';
      case 'meeting': return '#ef4444';
      case 'personal': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatEventTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    return `${start.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })} - ${end.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Upcoming Events</h3>
          <span className="text-sm font-medium px-3 py-1 rounded-full" 
                style={{ 
                  background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                  color: 'var(--accent)'
                }}>
            Next 30 Days
          </span>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.map((event) => {
              const eventColors = getEventColorClasses(event.type);
              const typeColor = getEventTypeColor(event.type);
              return (
                <div
                  key={event.id}
                  className="rounded-lg cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg overflow-hidden"
                  style={{
                    borderLeft: `4px solid ${eventColors.border}`,
                    background: eventColors.bg,
                    border: `1px solid ${eventColors.border}`,
                    borderLeftWidth: '4px'
                  }}
                  onClick={() => showEventModal(event)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{event.title}</h4>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                                style={{ 
                                  background: typeColor,
                                  color: 'white'
                                }}>
                            {event.type}
                          </span>
                        </div>
                        
                        {event.description && (
                          <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{event.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm flex-wrap" style={{ color: 'var(--text-muted)' }}>
                          <div className="flex items-center gap-1.5 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatEventDate(event.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatEventTime(event.startTime, event.endTime)}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1.5 font-medium">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {event.status && (
                        <div className="ml-4">
                          <span className="text-xs font-semibold px-2 py-1 rounded-md capitalize"
                                style={{
                                  background: 'var(--bg-alt)',
                                  color: 'var(--text-muted)'
                                }}>
                            {event.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full" 
                 style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--accent)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--text)' }}>No upcoming events</h3>
            <p className="mb-8 text-base max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
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
        )}
      </div>
    </div>
  );
};

export default AgendaView;