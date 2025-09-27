import React from 'react';
import { useTasksContext } from '../TasksContext';
import type { TaskPriority } from '../../../domain/models';

const allPriorities: TaskPriority[] = ['low', 'medium', 'high'];

export const TaskFilters: React.FC = () => {
  const { filters, setFilters, tasks } = useTasksContext();
  const tagSet = Array.from(new Set(tasks.flatMap(t => t.tags))).slice(0,40);

  function togglePriority(p: TaskPriority) {
    setFilters({
      priorities: filters.priorities.includes(p)
        ? filters.priorities.filter(x => x !== p)
        : [...filters.priorities, p]
    });
  }

  function clearFilters() {
    setFilters({ search: '', priorities: [], hideCompleted: false, tag: null, quickFilter: null });
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
          {/* Quick Filters */}
          {['today','high','focusHeavy'].map(qf => {
            const label = qf === 'today' ? 'Due Today' : qf === 'high' ? 'High Priority' : 'Focus Heavy';
            const active = filters.quickFilter === qf;
            return (
              <button
                key={qf}
                type="button"
                onClick={() => setFilters({ quickFilter: active ? null : qf as any })}
                className={`btn ${active ? 'primary' : 'outline'}`}
                style={{fontSize:'.6rem'}}
              >{label}</button>
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
        {tagSet.length>0 && (
          <div className="ff-row" style={{flexWrap:'wrap', gap:'.35rem', marginTop:'.5rem'}} aria-label="Tag filters">
            {tagSet.map(tag => {
              const active = filters.tag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  className={`btn ${active ? 'primary':'subtle'}`}
                  style={{fontSize:'.55rem', padding:'.3rem .55rem'}}
                  aria-pressed={active || undefined}
                  onClick={() => setFilters({ tag: active ? null : tag })}
                >{tag}</button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
