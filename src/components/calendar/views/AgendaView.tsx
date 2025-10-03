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
      case 'focus': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'break': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'task': return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'meeting': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'personal': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'focus': return 'text-blue-700 dark:text-blue-300';
      case 'break': return 'text-green-700 dark:text-green-300';
      case 'task': return 'text-purple-700 dark:text-purple-300';
      case 'meeting': return 'text-red-700 dark:text-red-300';
      case 'personal': return 'text-orange-700 dark:text-orange-300';
      default: return 'text-gray-700 dark:text-gray-300';
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
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Upcoming Events</h3>

        {upcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className={`border-l-4 p-4 rounded-r-lg cursor-pointer hover:shadow-md transition-shadow ${getEventColorClasses(event.type)}`}
                onClick={() => showEventModal(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-base font-medium text-gray-900 dark:text-gray-100">{event.title}</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{event.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatEventDate(event.startTime)}</span>
                      <span>{formatEventTime(event.startTime, event.endTime)}</span>
                      {event.location && (
                        <span>📍 {event.location}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {event.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No upcoming events</h3>
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
        )}
      </div>
    </div>
  );
};

export default AgendaView;