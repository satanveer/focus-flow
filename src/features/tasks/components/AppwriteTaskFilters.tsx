import React from 'react';
import { useAppwriteTasksContext } from '../AppwriteTasksContext';
import type { TaskPriority } from '../../../domain/models';

const allPriorities: TaskPriority[] = ['low', 'medium', 'high'];

export const AppwriteTaskFilters: React.FC = () => {
  const { filters, setFilters, tasks, loading } = useAppwriteTasksContext();
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

  const hasActiveFilters = filters.search || filters.priorities.length || filters.hideCompleted || filters.tag || filters.quickFilter;

  return (
    <div className="card" style={{padding:'1rem'}}>
      <div className="ff-stack" style={{gap:'.75rem'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h3 style={{fontSize:'.8rem', fontWeight:600, margin:0}}>Filters</h3>
          {hasActiveFilters && (
            <button className="btn subtle" onClick={clearFilters} style={{fontSize:'.6rem'}}>
              Clear All
            </button>
          )}
        </div>
        
        <div className="ff-stack" style={{gap:'.5rem'}}>
          {/* Search */}
          <input
            type="text"
            value={filters.search}
            onChange={e => setFilters({ search: e.target.value })}
            placeholder="Search tasks..."
            style={{fontSize:'.7rem'}}
            disabled={loading}
          />
          
          {/* Quick filters */}
          <div className="ff-stack" style={{gap:'.3rem'}}>
            <span style={{fontSize:'.65rem', fontWeight:500, color:'var(--text-muted)'}}>Quick filters</span>
            <div className="ff-row" style={{gap:'.3rem', flexWrap:'wrap'}}>
              {(['today', 'high', 'focusHeavy'] as const).map(qf => (
                <button
                  key={qf}
                  onClick={() => setFilters({ quickFilter: filters.quickFilter === qf ? null : qf })}
                  className={`filter-chip ${filters.quickFilter === qf ? 'active' : ''}`}
                  disabled={loading}
                  style={{
                    fontSize:'.6rem',
                    padding:'.2rem .5rem',
                    border:'1px solid var(--border)',
                    borderRadius:'1rem',
                    background: filters.quickFilter === qf ? 'var(--accent)' : 'var(--bg)',
                    color: filters.quickFilter === qf ? 'var(--accent-foreground)' : 'var(--text-primary)'
                  }}
                >
                  {qf === 'today' ? 'Due Today' : qf === 'high' ? 'High Priority' : 'Focus Heavy'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Priority filters */}
          <div className="ff-stack" style={{gap:'.3rem'}}>
            <span style={{fontSize:'.65rem', fontWeight:500, color:'var(--text-muted)'}}>Priority</span>
            <div className="ff-row" style={{gap:'.3rem'}}>
              {allPriorities.map(p => (
                <button
                  key={p}
                  onClick={() => togglePriority(p)}
                  className={`filter-chip ${filters.priorities.includes(p) ? 'active' : ''}`}
                  disabled={loading}
                  style={{
                    fontSize:'.6rem',
                    padding:'.2rem .5rem',
                    border:'1px solid var(--border)',
                    borderRadius:'1rem',
                    background: filters.priorities.includes(p) ? 'var(--accent)' : 'var(--bg)',
                    color: filters.priorities.includes(p) ? 'var(--accent-foreground)' : 'var(--text-primary)'
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Tag filters */}
          {tagSet.length > 0 && (
            <div className="ff-stack" style={{gap:'.3rem'}}>
              <span style={{fontSize:'.65rem', fontWeight:500, color:'var(--text-muted)'}}>Tags</span>
              <div className="ff-row" style={{gap:'.3rem', flexWrap:'wrap', maxHeight:'4rem', overflowY:'auto'}}>
                {tagSet.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setFilters({ tag: filters.tag === tag ? null : tag })}
                    className={`filter-chip ${filters.tag === tag ? 'active' : ''}`}
                    disabled={loading}
                    style={{
                      fontSize:'.6rem',
                      padding:'.2rem .5rem',
                      border:'1px solid var(--border)',
                      borderRadius:'1rem',
                      background: filters.tag === tag ? 'var(--accent)' : 'var(--bg)',
                      color: filters.tag === tag ? 'var(--accent-foreground)' : 'var(--text-primary)'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Show/hide completed */}
          <label style={{display:'flex', alignItems:'center', gap:'.5rem', fontSize:'.7rem'}}>
            <input
              type="checkbox"
              checked={filters.hideCompleted}
              onChange={e => setFilters({ hideCompleted: e.target.checked })}
              disabled={loading}
            />
            Hide completed tasks
          </label>
        </div>
      </div>
    </div>
  );
};

export default AppwriteTaskFilters;