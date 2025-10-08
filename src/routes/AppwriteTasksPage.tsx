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
            <div className="ff-stack gap-3 sm:gap-6 p-2 sm:p-6">
                <header className="ff-stack gap-0.5 sm:gap-2 px-1 sm:px-0">
                    <h1 className="text-lg sm:text-2xl font-semibold">Tasks</h1>
                    <p className="text-[0.7rem] sm:text-sm text-[var(--text-muted)]">Capture, prioritize, and complete your work.</p>
                </header>
                <div className="task-layout flex flex-col xl:grid xl:grid-cols-[320px_1fr] gap-3 sm:gap-6">
                    <div className="ff-stack gap-3 sm:gap-6">
                        <AppwriteTaskForm />
                        <AppwriteTaskFilters />
                        <AppwriteTaskStats />
                    </div>
                    <AppwriteTaskList />
                </div>
                <AppwriteTaskProgressBar />
                <ErrorBoundary>
                    <React.Suspense fallback={<div className="card text-center text-xs sm:text-sm">Loading charts…</div>}>
                        <TaskCharts />
                    </React.Suspense>
                </ErrorBoundary>
            </div>
    );
}