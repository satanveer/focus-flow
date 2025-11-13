import React, { useState } from 'react';
import { useAppwriteTasksContext } from '../AppwriteTasksContext';
import { TaskItem } from './TaskItem';
import type { Task } from '../../../domain/models';

const ITEMS_PER_PAGE = 8;

export const AppwriteTaskList: React.FC = () => {
  const { filteredTasks, clearCompleted, tasks, loading, error, filters, setFilters } = useAppwriteTasksContext();
  const hasCompleted = tasks.some(t => t.completed);
  const showingCompleted = filters.status === 'completed';
  const [currentPage, setCurrentPage] = useState(1);

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

  // Separate active and completed tasks from ALL tasks (not just filtered)
  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  
  // Get the filtered versions for display
  const filteredActiveTasks = filteredTasks.filter(t => !t.completed);
  const filteredCompletedTasks = filteredTasks.filter(t => t.completed);
  
  // Determine which tasks to show based on filter
  const tasksToShow = showingCompleted ? filteredCompletedTasks : filteredActiveTasks;
  
  // Calculate pagination
  const totalPages = Math.ceil(tasksToShow.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTasks = tasksToShow.slice(startIndex, endIndex);
  
  // Reset to page 1 when switching between active/completed
  const handleToggleView = () => {
    setCurrentPage(1);
    setFilters({...filters, status: showingCompleted ? 'pending' : 'completed'});
  };

  return (
    <div className="ff-stack">
      <div className="ff-row" style={{justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap: '0.75rem'}}>
        <div style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
          <button 
            className={!showingCompleted ? "btn primary" : "btn outline"}
            onClick={handleToggleView}
            disabled={!showingCompleted && filteredActiveTasks.length === 0}
            style={{fontSize: '.7rem'}}
          >
            Active ({activeTasks.length})
          </button>
          <button 
            className={showingCompleted ? "btn primary" : "btn outline"}
            onClick={handleToggleView}
            disabled={showingCompleted && filteredCompletedTasks.length === 0}
            style={{fontSize: '.7rem'}}
          >
            Completed ({completedTasks.length})
          </button>
        </div>
        <div style={{display:'flex', gap:'0.5rem'}}>
          {hasCompleted && showingCompleted && (
            <button className="btn outline" onClick={clearCompleted} style={{fontSize: '.7rem'}}>
              Clear Completed
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      {tasksToShow.length === 0 ? (
        <div className="list-shell empty-state">
          {showingCompleted ? 'No completed tasks yet.' : 'No active tasks. Great job!'}
        </div>
      ) : (
        <>
          <ul className="list-shell" role="list">
            {paginatedTasks.map((t: Task) => <TaskItem key={t.id} task={t} />)}
          </ul>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'0.5rem', marginTop:'1rem'}}>
              <button
                className="btn outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{fontSize: '.7rem', padding: '.4rem .8rem'}}
                aria-label="Previous page"
              >
                Previous
              </button>
              
              <div style={{display:'flex', gap:'0.25rem', alignItems:'center'}}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={currentPage === page ? "btn primary" : "btn subtle"}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      fontSize: '.7rem',
                      padding: '.4rem .65rem',
                      minWidth: '2rem'
                    }}
                    aria-label={`Go to page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                className="btn outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{fontSize: '.7rem', padding: '.4rem .8rem'}}
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AppwriteTaskList;