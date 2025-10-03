import React from 'react';
import { useCalendar } from '../../contexts/CalendarContext';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
import DayView from './views/DayView';
import AgendaView from './views/AgendaView';

const CalendarGrid: React.FC = () => {
  const { state } = useCalendar();

  const renderView = () => {
    switch (state.view.type) {
      case 'month':
        return <MonthView />;
      case 'week':
        return <WeekView />;
      case 'day':
        return <DayView />;
      case 'agenda':
        return <AgendaView />;
      default:
        return <WeekView />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
      {state.loading.events ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Loading calendar events...
          </p>
        </div>
      ) : (
        renderView()
      )}
    </div>
  );
};

export default CalendarGrid;