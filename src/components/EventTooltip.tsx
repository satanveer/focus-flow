import React from 'react';
import type { CalendarEvent } from '../domain/models';

interface EventTooltipProps {
  events: CalendarEvent[];
  isVisible: boolean;
  position?: { x: number; y: number };
  isPinned?: boolean; // New prop to keep tooltip open for scrolling
}

const EventTooltip: React.FC<EventTooltipProps> = ({ events, isVisible, position, isPinned = false }) => {
  if (!isVisible || !position || events.length === 0) return null;

  // Calculate positioning to prevent overflow
  const tooltipWidth = 384; // max-w-sm is roughly 384px
  
  // Adjust position to prevent left overflow
  let xPosition = position.x;
  let transformX = '-50%'; // default center
  
  // If tooltip would overflow left side
  if (position.x < tooltipWidth / 2) {
    xPosition = 8; // 8px from left edge
    transformX = '0%'; // align left instead of center
  }
  // If tooltip would overflow right side
  else if (position.x > window.innerWidth - tooltipWidth / 2) {
    xPosition = window.innerWidth - 8; // 8px from right edge
    transformX = '-100%'; // align right instead of center
  }

  // Show only the first event in detail for now
  const event = events[0];

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'focus': return 'bg-gradient-to-r from-purple-500 to-indigo-600';
      case 'break': return 'bg-gradient-to-r from-green-500 to-emerald-600';
      case 'task': return 'bg-gradient-to-r from-blue-500 to-cyan-600';
      case 'meeting': return 'bg-gradient-to-r from-red-500 to-rose-600';
      case 'personal': return 'bg-gradient-to-r from-orange-500 to-amber-600';
      case 'goal': return 'bg-gradient-to-r from-pink-500 to-fuchsia-600';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-600';
    }
  };

  const getProductivityEmoji = (rating?: 'great' | 'some-distractions' | 'unfocused') => {
    switch (rating) {
      case 'great': return '🌟';
      case 'some-distractions': return '⚡';
      case 'unfocused': return '💭';
      default: return '';
    }
  };

  const getProductivityText = (rating?: 'great' | 'some-distractions' | 'unfocused') => {
    switch (rating) {
      case 'great': return 'Deep Focus';
      case 'some-distractions': return 'Some Distractions';
      case 'unfocused': return 'Unfocused';
      default: return '';
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes} min`;
  };

  const getEventTypeLabel = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'focus': return '🎯 Focus Session';
      case 'break': return '☕ Break';
      case 'task': return '✅ Task';
      case 'meeting': return '👥 Meeting';
      case 'personal': return '🏠 Personal';
      case 'goal': return '🎯 Goal';
      default: return 'Event';
    }
  };

  return (
    <div
      className={`fixed z-50 event-tooltip ${isPinned ? 'pointer-events-auto' : 'pointer-events-none'}`}
      style={{
        left: xPosition,
        top: position.y,
        transform: `translate(${transformX}, -100%)`,
        marginTop: '-8px',
      }}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-w-sm overflow-hidden">
        {/* Show all events when multiple */}
        {events.length > 1 ? (
          <>
            <div className="p-3 text-white bg-gradient-to-r from-purple-500 to-indigo-600">
              <div className="text-xs font-semibold opacity-90 mb-1">
                {events.length} Events at this time
              </div>
              {isPinned && (
                <div className="text-[10px] opacity-75">
                  Scroll to see all events
                </div>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto"
                 style={{ pointerEvents: isPinned ? 'auto' : 'none' }}
            >
              {events.map((evt, idx) => {
                const eventColors = getEventColor(evt.type);
                const durationMins = Math.round((new Date(evt.endTime).getTime() - new Date(evt.startTime).getTime()) / 60000);
                
                return (
                  <div key={evt.id || idx} className="p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-3 h-3 rounded-full ${eventColors}`} />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {getEventTypeLabel(evt.type)}
                      </span>
                      {evt.focusDuration && (
                        <span className="text-xs text-gray-600 dark:text-gray-400 ml-auto">
                          {durationMins}m
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{evt.title}</h3>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {formatTime(evt.startTime)} - {formatTime(evt.endTime)}
                    </div>
                    {evt.status && (
                      <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full ${
                        evt.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        evt.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {evt.status.charAt(0).toUpperCase() + evt.status.slice(1)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Single event - show detailed view */
          <>
        <div className={`${getEventColor(event.type)} p-3 text-white`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium opacity-90">{getEventTypeLabel(event.type)}</span>
            {event.focusDuration && (
              <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                {formatDuration(event.focusDuration)}
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold truncate">{event.title}</h3>
          <div className="text-xs opacity-90 mt-1">
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </div>
        </div>

        <div className="p-3 space-y-2">
          {event.productivityRating && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">{getProductivityEmoji(event.productivityRating)}</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {getProductivityText(event.productivityRating)}
              </span>
            </div>
          )}

          {event.focusDuration && event.actualFocusTime && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Planned:</span>
                <span className="font-medium">{formatDuration(event.focusDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span>Actual:</span>
                <span className="font-medium">{formatDuration(event.actualFocusTime)}</span>
              </div>
            </div>
          )}

          {event.description && (
            <div className="text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
              {event.description.split('\n').slice(0, 3).map((line, i) => (
                <div key={i} className={line.startsWith('**') ? 'font-medium mt-1' : ''}>
                  {line.replace(/\*\*/g, '')}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              event.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
              event.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
              event.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </span>
            {event.source && event.source !== 'local' && (
              <span className="text-xs text-gray-500">
                {event.source === 'google' ? '📅 Google' : event.source === 'synced' ? '🔄 Synced' : ''}
              </span>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default EventTooltip;
