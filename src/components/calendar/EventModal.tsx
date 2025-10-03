import React, { useState, useEffect } from 'react';
import { useCalendar } from '../../contexts/CalendarContext';
import type { CalendarEvent } from '../../domain/models';

const EventModal: React.FC = () => {
  const { state, hideEventModal, createEvent, updateEvent, deleteEvent } = useCalendar();
  const { selectedEvent } = state;

  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    type: 'focus',
    status: 'scheduled',
    startTime: '',
    endTime: '',
    allDay: false,
    recurrence: 'none',
    tags: [],
    reminders: [15],
    attendees: [],
    location: '',
    focusDuration: 1500 // 25 minutes default
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data when modal opens
  useEffect(() => {
    if (selectedEvent && selectedEvent.id !== 'temp') {
      setFormData(selectedEvent);
    } else {
      // New event or temp event
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      setFormData({
        title: selectedEvent?.title || '',
        description: selectedEvent?.description || '',
        type: selectedEvent?.type || 'focus',
        status: selectedEvent?.status || 'scheduled',
        startTime: selectedEvent?.startTime || now.toISOString().slice(0, 16),
        endTime: selectedEvent?.endTime || oneHourLater.toISOString().slice(0, 16),
        allDay: selectedEvent?.allDay || false,
        recurrence: selectedEvent?.recurrence || 'none',
        tags: selectedEvent?.tags || [],
        reminders: selectedEvent?.reminders || [15],
        attendees: selectedEvent?.attendees || [],
        location: selectedEvent?.location || '',
        focusDuration: selectedEvent?.focusDuration || 1500
      });
    }
  }, [selectedEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📅 EventModal: Submitting form data:', formData);
      
      if (selectedEvent && selectedEvent.id !== 'temp') {
        // Update existing event
        console.log('📅 EventModal: Updating existing event');
        await updateEvent(selectedEvent.id, formData);
      } else {
        // Create new event
        console.log('📅 EventModal: Creating new event');
        const newEvent = await createEvent({
          title: formData.title!,
          description: formData.description,
          type: formData.type!,
          status: formData.status!,
          startTime: formData.startTime!,
          endTime: formData.endTime!,
          allDay: formData.allDay!,
          recurrence: formData.recurrence!,
          tags: formData.tags || [],
          reminders: formData.reminders || [],
          attendees: formData.attendees || [],
          location: formData.location,
          focusDuration: formData.focusDuration,
        });
        console.log('✅ EventModal: Event created successfully:', newEvent);
      }
      
      console.log('📅 EventModal: Hiding modal');
      hideEventModal();
    } catch (err: any) {
      console.error('❌ EventModal: Error saving event:', err);
      setError(err.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent || selectedEvent.id === 'temp') return;
    
    if (confirm('Are you sure you want to delete this event?')) {
      setLoading(true);
      try {
        await deleteEvent(selectedEvent.id);
        hideEventModal();
      } catch (err: any) {
        setError(err.message || 'Failed to delete event');
      } finally {
        setLoading(false);
      }
    }
  };

  const updateFormData = (field: keyof CalendarEvent, value: any) => {
    // Special handling for datetime fields to avoid timezone issues
    if (field === 'startTime' || field === 'endTime') {
      // Convert the datetime-local value to ISO string for storage
      const dateValue = value ? new Date(value).toISOString() : value;
      setFormData(prev => ({ ...prev, [field]: dateValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Helper function to convert ISO string to datetime-local format
  const toDateTimeLocal = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Get local time in YYYY-MM-DDTHH:MM format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const eventTypes = [
    { value: 'focus', label: '🎯 Focus Session', color: 'bg-blue-500' },
    { value: 'break', label: '☕ Break', color: 'bg-yellow-500' },
    { value: 'task', label: '✅ Task', color: 'bg-green-500' },
    { value: 'meeting', label: '🤝 Meeting', color: 'bg-purple-500' },
    { value: 'personal', label: '🏠 Personal', color: 'bg-pink-500' },
    { value: 'goal', label: '🎯 Goal', color: 'bg-indigo-500' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[90vh] overflow-auto shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {selectedEvent && selectedEvent.id !== 'temp' ? 'Edit Event' : 'Create Event'}
          </h2>
          
          <button
            onClick={hideEventModal}
            className="w-8 h-8 rounded-full border-0 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="Enter event title"
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Event Type
              </label>
              <select
                value={formData.type || 'focus'}
                onChange={(e) => updateFormData('type', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {eventTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={toDateTimeLocal(formData.startTime || '')}
                  onChange={(e) => updateFormData('startTime', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={toDateTimeLocal(formData.endTime || '')}
                  onChange={(e) => updateFormData('endTime', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Add a description..."
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Focus Duration (for focus events) */}
            {formData.type === 'focus' && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Focus Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.focusDuration ? Math.floor(formData.focusDuration / 60) : 25}
                  onChange={(e) => updateFormData('focusDuration', parseInt(e.target.value) * 60)}
                  min={1}
                  max={180}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              {selectedEvent && selectedEvent.id !== 'temp' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 rounded-md border border-red-500 bg-transparent text-red-600 dark:text-red-400 text-sm font-semibold cursor-pointer transition-all hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              )}
              
              <button
                type="button"
                onClick={hideEventModal}
                disabled={loading}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading || !formData.title?.trim()}
                className="flex-1 px-4 py-2 rounded-md border-0 bg-blue-600 text-white text-sm font-semibold cursor-pointer transition-all hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Saving...' : (selectedEvent && selectedEvent.id !== 'temp' ? 'Update Event' : 'Create Event')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;