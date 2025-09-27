import React from 'react';
import { TasksProvider } from '../features/tasks/TasksContext';
import { TaskForm } from '../features/tasks/components/TaskForm';
import { TaskFilters } from '../features/tasks/components/TaskFilters';
import { TaskList } from '../features/tasks/components/TaskList';
import { TaskStats, TaskProgressBar } from '../features/tasks/components/TaskStats';
const TaskCharts = React.lazy(() => import('../features/tasks/components/TaskCharts').then(m => ({ default: m.TaskCharts })));
import '../features/tasks/tasks.css';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function TasksPage() {
    return (
        <TasksProvider>
            <div className="ff-stack" style={{gap:'1.5rem'}}>
                <header className="ff-stack" style={{gap:'.25rem'}}>
                    <h1 style={{fontSize:'1.4rem', fontWeight:600}}>Tasks</h1>
                    <p style={{fontSize:'.8rem', color:'var(--text-muted)'}}>Capture, prioritize, and complete your work.</p>
                </header>
                <div className="task-layout" style={{gap:'1.5rem'}}>
                    <div className="ff-stack" style={{gap:'1.5rem'}}>
                        <TaskForm />
                        <TaskFilters />
                        <TaskStats />
                    </div>
                    <TaskList />
                </div>
                <TaskProgressBar />
                <ErrorBoundary>
                    <React.Suspense fallback={<div className="card" style={{textAlign:'center', fontSize:'.7rem'}}>Loading charts…</div>}>
                        <TaskCharts />
                    </React.Suspense>
                </ErrorBoundary>
            </div>
        </TasksProvider>
    );
}