import React from 'react';
import { AppwriteTaskForm } from '../features/tasks/components/AppwriteTaskForm';
import { AppwriteTaskFilters } from '../features/tasks/components/AppwriteTaskFilters';
import { AppwriteTaskList } from '../features/tasks/components/AppwriteTaskList';
import { AppwriteTaskStats, AppwriteTaskProgressBar } from '../features/tasks/components/AppwriteTaskStats';
const TaskCharts = React.lazy(() => import('../features/tasks/components/TaskCharts').then(m => ({ default: m.TaskCharts })));
import '../features/tasks/tasks.css';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function AppwriteTasksPage() {
    return (
            <div className="ff-stack" style={{gap:'1.5rem'}}>
                <header className="ff-stack" style={{gap:'.25rem'}}>
                    <h1 style={{fontSize:'1.4rem', fontWeight:600}}>Tasks</h1>
                    <p style={{fontSize:'.8rem', color:'var(--text-muted)'}}>Capture, prioritize, and complete your work.</p>
                </header>
                <div className="task-layout" style={{gap:'1.5rem'}}>
                    <div className="ff-stack" style={{gap:'1.5rem'}}>
                        <AppwriteTaskForm />
                        <AppwriteTaskFilters />
                        <AppwriteTaskStats />
                    </div>
                    <AppwriteTaskList />
                </div>
                <AppwriteTaskProgressBar />
                <ErrorBoundary>
                    <React.Suspense fallback={<div className="card" style={{textAlign:'center', fontSize:'.7rem'}}>Loading charts…</div>}>
                        <TaskCharts />
                    </React.Suspense>
                </ErrorBoundary>
            </div>
    );
}