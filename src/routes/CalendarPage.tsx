import React, { useState } from 'react';
import { useCalendar } from '../contexts/CalendarContext';
import CalendarHeader from '../components/calendar/CalendarHeader';
import CalendarGrid from '../components/calendar/CalendarGrid';
import CalendarSidebar from '../components/calendar/CalendarSidebar';
import GoogleCalendarSettings from '../components/GoogleCalendarSettings';
import EventModal from '../components/calendar/EventModal';

const CalendarPage: React.FC = () => {
  const { googleCalendar, state } = useCalendar();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Calendar</h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Your Focus Flow calendar with Google Calendar sync
            </p>
            
            {/* Google Calendar Connection Status */}
            <div className="flex items-center">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mr-2 sm:mr-3 ${
                googleCalendar.isConnected ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                {googleCalendar.isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Calendar Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Calendar Grid - Takes most space */}
          <div className="xl:col-span-3 order-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <CalendarHeader />
              <CalendarGrid />
            </div>
          </div>

          {/* Sidebar - Google Calendar Settings and Mini Calendar */}
          <div className="xl:col-span-1 space-y-4 sm:space-y-6 order-2">
            {/* Google Calendar Sync Panel */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
              <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Google Calendar</h3>
              </div>
              <div className="p-3 sm:p-4">
                <GoogleCalendarSettings />
              </div>
            </div>

            {/* Calendar Sidebar */}
            <CalendarSidebar 
              collapsed={sidebarCollapsed} 
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {state.showEventModal && <EventModal />}
    </div>
  );
};

export default CalendarPage;