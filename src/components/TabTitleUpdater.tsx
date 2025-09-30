import { useEffect } from 'react';
import { usePomodoro } from '../features/pomodoro/PomodoroContext';

/**
 * TabTitleUpdater component that updates the browser tab title when timer is running
 * Shows format like: "25:00 Focus • BobbyFlow" or "5:00 Break • BobbyFlow"
 */
export function TabTitleUpdater() {
  const { active, getRemaining, showTimerInTab } = usePomodoro();

  useEffect(() => {
    if (!showTimerInTab) {
      // Reset to default title when feature is disabled
      document.title = 'BobbyFlow';
      return;
    }

    if (!active) {
      // No active timer, show default title
      document.title = 'BobbyFlow';
      return;
    }

    // Function to update title with current timer info
    const updateTitle = () => {
      if (!active || !showTimerInTab) {
        document.title = 'BobbyFlow';
        return;
      }

      const remainingSeconds = getRemaining();
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      const modeText = active.mode === 'focus' ? 'Focus' : 
                      active.mode === 'shortBreak' ? 'Break' : 'Long Break';
      
      // Show paused indicator if timer is paused
      const pausedIndicator = active.paused ? ' (Paused)' : '';
      
      document.title = `${timeString} ${modeText}${pausedIndicator} • BobbyFlow`;
    };

    // Update immediately
    updateTitle();

    // Set up interval to update every second when timer is active
    const interval = setInterval(updateTitle, 1000);

    // Cleanup interval on component unmount or when dependencies change
    return () => {
      clearInterval(interval);
      // Reset to default title when timer stops
      if (!active || !showTimerInTab) {
        document.title = 'BobbyFlow';
      }
    };
  }, [active, getRemaining, showTimerInTab]);

  // This component doesn't render anything
  return null;
}

export default TabTitleUpdater;