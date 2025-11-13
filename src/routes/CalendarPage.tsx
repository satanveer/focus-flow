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
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[1400px] mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Calendar</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Your Focus Flow calendar with Google Calendar sync
              </p>
            </div>
            
            {/* Google Calendar Connection Status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all" 
                 style={{ 
                   background: googleCalendar.isConnected ? 'color-mix(in srgb, #10b981 8%, transparent)' : 'var(--bg-alt)',
                   border: `1px solid ${googleCalendar.isConnected ? '#10b981' : 'var(--border)'}`
                 }}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                googleCalendar.isConnected ? 'bg-green-500' : 'bg-gray-400'
              } animate-pulse`} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                {googleCalendar.isConnected ? 'Google Calendar Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Calendar Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Calendar Grid - Takes most space */}
          <div className="xl:col-span-3 order-1">
            <div style={{ 
              background: 'var(--surface)', 
              borderRadius: '12px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <CalendarHeader />
              <CalendarGrid />
            </div>
          </div>

          {/* Sidebar - Google Calendar Settings and Mini Calendar */}
          <div className="xl:col-span-1 space-y-4 order-2">
            {/* Google Calendar Sync Panel */}
            <div style={{
              background: 'var(--surface)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                  Google Calendar
                </h3>
              </div>
              <div className="p-3">
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