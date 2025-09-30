import React from 'react';
import { useAppwriteTasksContext } from '../AppwriteTasksContext';
import { TaskItem } from './TaskItem';
import type { Task } from '../../../domain/models';

export const TaskList: React.FC = () => {
  const { filteredTasks, clearCompleted, tasks } = useAppwriteTasksContext();
  const hasCompleted = tasks.some(t => t.completed);

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
