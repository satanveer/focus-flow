import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Routes, Route, NavLink } from "react-router-dom";
import DashboardPage from "./routes/DashboardPage";
import TasksPage from "./routes/TasksPage";
import HabitsPage from "./routes/HabitsPage";
import TimerPage from "./routes/TimerPage";
import NotesPage from "./routes/NotesPage";
import InsightsPage from "./routes/InsightsPage";
import SettingsPage from "./routes/SettingsPage";
import Layout from "./layouts/Layout";


function App() {
  const [count, setCount] = useState(0);

  return (
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
  );
}

export default App;
