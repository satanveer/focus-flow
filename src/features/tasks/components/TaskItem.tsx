import React from 'react';
import type { Task } from '../../../domain/models';
import { useTasksContext } from '../TasksContext';
import { Link } from 'react-router-dom';

function tagColor(tag: string) {
  // Simple hash to h(0-359)
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) % 360;
  return `hsl(${h} 70% 45%)`;
}

interface Props { task: Task; }

function dueInfo(task: Task) {
  if (!task.dueDate) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(task.dueDate); due.setHours(0,0,0,0);
  const diff = due.getTime() - today.getTime();
  const oneDay = 86400000;
  if (diff < 0) return <span className="due-chip overdue">Overdue</span>;
  if (diff === 0) return <span className="due-chip today">Today</span>;
  if (diff === oneDay) return <span className="due-chip">Tomorrow</span>;
  return <span className="due-chip">Due {due.toLocaleDateString()}</span>;
}

export const TaskItem: React.FC<Props> = ({ task }) => {
  const { toggleTask, removeTask } = useTasksContext();
  return (
    <li className="task-item">
      <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} aria-label="Toggle complete" />
      <div>
        <div className="task-title-wrapper">
          <span className={`task-title ${task.completed ? 'completed' : ''}`}>{task.title}</span>{' '}
          <span className={`badge dot priority-${task.priority}`}>{task.priority}</span>
        </div>
        {task.description && <div className="task-desc">{task.description}</div>}
        <div className="task-meta">
          {dueInfo(task)}
          {task.tags.map(tag => <span key={tag} className="tag" style={{background:`hsl(${(tagColor(tag).match(/\d+/)||['0'])[0]} 70% 18%)`, borderColor: tagColor(tag), color: tagColor(tag)}}>{tag}</span>)}
          {typeof task.focusSeconds === 'number' && task.focusSeconds > 0 && (
            <span className="tag" style={{background:'var(--accent-accent2)', borderColor:'var(--accent-accent3)', color:'#fff'}}>⏱ {Math.round(task.focusSeconds/60)}m</span>
          )}
        </div>
      </div>
      <div className="ff-row" style={{alignSelf:'flex-start', gap:'.3rem'}}>
        <Link to={`/timer?taskId=${task.id}&autoStart=1`} className="btn primary" aria-label="Focus with Pomodoro">Focus</Link>
        <button className="btn outline" onClick={() => removeTask(task.id)} aria-label="Delete task">Del</button>
      </div>
    </li>
  );
};
