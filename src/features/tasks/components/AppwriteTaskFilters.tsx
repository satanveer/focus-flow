import React from 'react';
import { useAppwriteTasksContext } from '../AppwriteTasksContext';
import type { TaskPriority } from '../../../domain/models';

const allPriorities: TaskPriority[] = ['low', 'medium', 'high'];

export const AppwriteTaskFilters: React.FC = () => {
  const { filters, setFilters, tasks, loading } = useAppwriteTasksContext();
  const tagSet = Array.from(new Set(tasks.flatMap(t => t.tags))).slice(0,40);

  function togglePriority(p: TaskPriority) {
    setFilters(prev => ({
      ...prev,
      priorities: prev.priorities.includes(p)
        ? prev.priorities.filter((x: TaskPriority) => x !== p)
        : [...prev.priorities, p]
    }));
  }

  function clearFilters() {
    setFilters({ search: '', priorities: [], status: 'all', hideCompleted: false, tag: null, quickFilter: null });
  }

  const hasActiveFilters = filters.search || filters.priorities.length || filters.hideCompleted || filters.tag || filters.quickFilter;

  return (
    <div className="card">
      <div className="ff-stack gap-2 sm:gap-3">
        <div className="flex justify-between items-center">
          <h3 className="text-[0.7rem] sm:text-sm font-semibold m-0">Filters</h3>
          {hasActiveFilters && (
            <button className="btn subtle text-[0.5rem] sm:text-[0.6rem] px-1.5 py-0.5 sm:px-2 sm:py-1" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
        
        <div className="ff-stack gap-1.5 sm:gap-2.5">
          {/* Search */}
          <input
            type="text"
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Search..."
            className="text-[0.7rem] sm:text-sm"
            disabled={loading}
          />
          
          {/* Quick filters */}
          <div className="ff-stack gap-1">
            <span className="text-[0.55rem] sm:text-[0.65rem] font-medium text-[var(--text-muted)]">Quick</span>
            <div className="ff-row gap-1 sm:gap-1.5 flex-wrap">
              {(['today', 'high', 'focusHeavy'] as const).map(qf => (
                <button
                  key={qf}
                  onClick={() => setFilters(prev => ({ ...prev, quickFilter: prev.quickFilter === qf ? null : qf }))}
                  className={`filter-chip text-[0.5rem] sm:text-[0.6rem] px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border ${filters.quickFilter === qf ? 'active' : ''}`}
                  disabled={loading}
                  style={{
                    borderColor: 'var(--border)',
                    background: filters.quickFilter === qf ? 'var(--accent)' : 'var(--bg)',
                    color: filters.quickFilter === qf ? 'var(--accent-foreground)' : 'var(--text-primary)'
                  }}
                >
                  {qf === 'today' ? 'Today' : qf === 'high' ? 'High' : 'Focus'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Priority filters */}
          <div className="ff-stack gap-1">
            <span className="text-[0.55rem] sm:text-[0.65rem] font-medium text-[var(--text-muted)]">Priority</span>
            <div className="ff-row gap-1 sm:gap-1.5">
              {allPriorities.map(p => (
                <button
                  key={p}
                  onClick={() => togglePriority(p)}
                  className={`filter-chip text-[0.5rem] sm:text-[0.6rem] px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border ${filters.priorities.includes(p) ? 'active' : ''}`}
                  disabled={loading}
                  style={{
                    borderColor: 'var(--border)',
                    background: filters.priorities.includes(p) ? 'var(--accent)' : 'var(--bg)',
                    color: filters.priorities.includes(p) ? 'var(--accent-foreground)' : 'var(--text-primary)'
                  }}
                >
                  {p === 'low' ? 'Low' : p === 'medium' ? 'Med' : 'High'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Tag filters */}
          {tagSet.length > 0 && (
            <div className="ff-stack gap-1">
              <span className="text-[0.55rem] sm:text-[0.65rem] font-medium text-[var(--text-muted)]">Tags</span>
              <div className="ff-row gap-1 sm:gap-1.5 flex-wrap max-h-14 sm:max-h-16 overflow-y-auto">
                {tagSet.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setFilters(prev => ({ ...prev, tag: prev.tag === tag ? null : tag }))}
                    className={`filter-chip text-[0.5rem] sm:text-[0.6rem] px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border ${filters.tag === tag ? 'active' : ''}`}
                    disabled={loading}
                    style={{
                      borderColor: 'var(--border)',
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
          <label className="flex items-center gap-1.5 text-[0.65rem] sm:text-sm">
            <input
              type="checkbox"
              checked={filters.hideCompleted}
              onChange={e => setFilters(prev => ({ ...prev, hideCompleted: e.target.checked }))}
              disabled={loading}
            />
            Hide completed
          </label>
        </div>
      </div>
    </div>
  );
};

export default AppwriteTaskFilters;