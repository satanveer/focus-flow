import "./App.css";
import { Routes, Route } from "react-router-dom";
import DashboardPage from "./routes/DashboardPage";
import AppwriteTasksPage from "./routes/AppwriteTasksPage";
import CalendarPage from "./routes/CalendarPage";
import TimerPage from "./routes/TimerPage";
import NotesPage from "./routes/NotesPage";
import InsightsPage from "./routes/InsightsPage";
import SettingsPage from "./routes/SettingsPage";
import GoogleCalendarCallback from "./routes/GoogleCalendarCallback";
import Layout from "./layouts/Layout";
import { PomodoroProvider } from './features/pomodoro/PomodoroContext';
import TabTitleUpdater from './components/TabTitleUpdater';

import { NotesProvider } from './features/notes/NotesContext';
import { AuthProvider, ProtectedRoute } from './contexts/AuthContext';
import { AppwriteTasksProvider } from './features/tasks/AppwriteTasksContext';
import { CalendarProvider } from './contexts/CalendarContext';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* OAuth callback routes - outside of ProtectedRoute */}
        {/* Google OAuth callback is now handled in AuthContext */}
        <Route path="/auth/google-calendar" element={<GoogleCalendarCallback />} />
        
        {/* Protected routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <AppwriteTasksProvider>
              <CalendarProvider>
                <PomodoroProvider>
                  <TabTitleUpdater />
                  <NotesProvider>
                    <Routes>
                      <Route element={<Layout/>}>
                        <Route index element={<DashboardPage />} />
                        <Route path="tasks" element={<AppwriteTasksPage />} />
                        <Route path="calendar" element={<CalendarPage />} />
                        <Route path="timer" element={<TimerPage />} />
                        <Route path="notes" element={<NotesPage />} />
                        <Route path="insights" element={<InsightsPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                      </Route>
                    </Routes>
                  </NotesProvider>
                </PomodoroProvider>
              </CalendarProvider>
            </AppwriteTasksProvider>
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;
