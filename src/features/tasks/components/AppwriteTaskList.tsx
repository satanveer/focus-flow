import React from 'react';
import { useAppwriteTasksContext } from '../AppwriteTasksContext';
import { TaskItem } from './TaskItem';
import type { Task } from '../../../domain/models';

export const AppwriteTaskList: React.FC = () => {
  const { filteredTasks, clearCompleted, tasks, loading, error } = useAppwriteTasksContext();
  const hasCompleted = tasks.some(t => t.completed);

  if (loading) {
    return (
      <div className="list-shell empty-state">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="loading-spinner" style={{ 
            width: '16px', 
            height: '16px', 
            border: '2px solid #e2e8f0', 
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading tasks...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="list-shell empty-state" style={{ color: 'var(--error)' }}>
        Error loading tasks: {error}
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    return <div className="list-shell empty-state">No tasks match your filters.</div>;
  }

  return (
    <div className="ff-stack">
      <div className="ff-row" style={{justifyContent:'flex-end'}}>
        {hasCompleted && <button className="btn outline" onClick={clearCompleted}>Clear Completed</button>}
      </div>
      <ul className="list-shell" role="list">
        {filteredTasks.map((t: Task) => <TaskItem key={t.id} task={t} />)}
      </ul>
    </div>
  );
};

export default AppwriteTaskList;