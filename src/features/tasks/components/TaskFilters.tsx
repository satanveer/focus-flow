import React from 'react';
import { useTasksContext } from '../TasksContext';
import type { TaskPriority } from '../../../domain/models';

const allPriorities: TaskPriority[] = ['low', 'medium', 'high'];

export const TaskFilters: React.FC = () => {
  const { filters, setFilters } = useTasksContext();

  function togglePriority(p: TaskPriority) {
    setFilters({
      priorities: filters.priorities.includes(p)
        ? filters.priorities.filter(x => x !== p)
        : [...filters.priorities, p]
    });
  }

  function clearFilters() {
    setFilters({ search: '', priorities: [], hideCompleted: false, tag: null });
  }

  return (
    <div className="card ff-stack">
      <div className="tasks-toolbar" style={{gap:'.75rem'}}>
        <input
          placeholder="Search tasks..."
          value={filters.search}
          onChange={e => setFilters({ search: e.target.value })}
          style={{flex:2}}
          type="text"
        />
        <div className="ff-row" style={{flexWrap:'wrap', gap:'.4rem'}}>
          {allPriorities.map(p => {
            const active = filters.priorities.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePriority(p)}
                className={`btn ${active ? 'primary' : 'outline'}`}
              >
                {p}
              </button>
            );
          })}
          <label className="ff-row" style={{fontSize:'.65rem'}}>
            <input
              type="checkbox"
              checked={filters.hideCompleted}
              onChange={e => setFilters({ hideCompleted: e.target.checked })}
            />
            <span>Hide completed</span>
          </label>
          <button type="button" onClick={clearFilters} className="btn outline" style={{marginLeft:'auto'}}>Reset</button>
        </div>
      </div>
    </div>
  );
};
