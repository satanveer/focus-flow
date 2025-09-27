import React from 'react';
import { useTasksContext } from '../TasksContext';
import { TaskItem } from './TaskItem';

export const TaskList: React.FC = () => {
  const { filteredTasks, clearCompleted, tasks } = useTasksContext();
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
        {filteredTasks.map(t => <TaskItem key={t.id} task={t} />)}
      </ul>
    </div>
  );
};
