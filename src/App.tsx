import "./App.css";
import { Routes, Route } from "react-router-dom";
import DashboardPage from "./routes/DashboardPage";
import TasksPage from "./routes/TasksPage";
import HabitsPage from "./routes/HabitsPage";
import TimerPage from "./routes/TimerPage";
import NotesPage from "./routes/NotesPage";
import InsightsPage from "./routes/InsightsPage";
import SettingsPage from "./routes/SettingsPage";
import Layout from "./layouts/Layout";
import { PomodoroProvider } from './features/pomodoro/PomodoroContext';
import { TasksProvider } from './features/tasks/TasksContext';


function App() {

  return (
  <PomodoroProvider>
  <TasksProvider>
    <Routes>
      <Route element={<Layout/>}>
        <Route index element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="timer" element={<TimerPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
    </TasksProvider>
    </PomodoroProvider>
  );
}

export default App;
