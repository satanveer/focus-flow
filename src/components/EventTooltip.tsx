import React from 'react';
import type { CalendarEvent } from '../domain/models';

interface EventTooltipProps {
  events: CalendarEvent[];
  isVisible: boolean;
  position?: { x: number; y: number };
}

const EventTooltip: React.FC<EventTooltipProps> = ({ events, isVisible, position }) => {
  if (!isVisible || events.length === 0) {
    return null;
  }

  const getEventColorClasses = (event: CalendarEvent) => {
    if (event.color) return 'bg-blue-500';
    
    switch (event.type) {
      case 'focus': return 'bg-blue-500';
      case 'break': return 'bg-green-500';
      case 'task': return 'bg-purple-500';
      case 'meeting': return 'bg-red-500';
      case 'personal': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString(undefined, { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    };

    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 1000,
    ...(position && {
      left: position.x,
      top: position.y,
    })
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 max-w-xs"
      style={style}
    >
      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-2"
          >
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${getEventColorClasses(event)}`}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                {event.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatEventTime(event)}
              </div>
              {event.description && (
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                  {event.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventTooltip;