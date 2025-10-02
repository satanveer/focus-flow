import "./App.css";
import { Routes, Route } from "react-router-dom";
import DashboardPage from "./routes/DashboardPage";
import AppwriteTasksPage from "./routes/AppwriteTasksPage";
import TimerPage from "./routes/TimerPage";
import NotesPage from "./routes/NotesPage";
import InsightsPage from "./routes/InsightsPage";
import SettingsPage from "./routes/SettingsPage";
import AuthCallback from "./routes/AuthCallback";
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
        {/* OAuth callback route - outside of ProtectedRoute */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <CalendarProvider>
              <PomodoroProvider>
                <TabTitleUpdater />
                <AppwriteTasksProvider>
                  <NotesProvider>
                    <Routes>
                      <Route element={<Layout/>}>
                        <Route index element={<DashboardPage />} />
                        <Route path="tasks" element={<AppwriteTasksPage />} />
                        <Route path="timer" element={<TimerPage />} />
                        <Route path="notes" element={<NotesPage />} />
                        <Route path="insights" element={<InsightsPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                      </Route>
                    </Routes>
                  </NotesProvider>
                </AppwriteTasksProvider>
              </PomodoroProvider>
            </CalendarProvider>
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;
