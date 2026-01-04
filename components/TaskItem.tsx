
import React from 'react';
import { Task, Priority } from '../types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const PriorityTag: React.FC<{ priority: Priority }> = ({ priority }) => {
  const styles = {
    [Priority.LOW]: 'text-zinc-500',
    [Priority.MEDIUM]: 'text-zinc-300',
    [Priority.HIGH]: 'text-white border-white',
  };

  return (
    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${styles[priority]}`}>
      {priority}
    </span>
  );
};

const formatTime = (timeStr: string) => {
  try {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${minutes} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  const hasTime = task.startTime || task.endTime;

  return (
    <div className={`group bg-zinc-950 border-2 transition-all duration-300 ${task.completed ? 'border-zinc-900 opacity-40' : 'border-zinc-800 hover:border-white'}`}>
      <div className="flex items-stretch">
        {/* Toggle Area */}
        <button
          onClick={() => onToggle(task.id)}
          className={`flex-shrink-0 w-16 flex items-center justify-center border-r-2 transition-all ${
            task.completed 
              ? 'bg-white border-white text-black' 
              : 'border-zinc-900 group-hover:border-white text-white hover:bg-white hover:text-black'
          }`}
        >
          {task.completed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
             <div className="w-4 h-4 border-2 border-current"></div>
          )}
        </button>

        {/* Content Area */}
        <div className="flex-1 min-w-0 p-6">
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <PriorityTag priority={task.priority} />
            {hasTime && (
              <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {task.startTime && formatTime(task.startTime)}
                  {task.startTime && task.endTime && ' > '}
                  {task.endTime && formatTime(task.endTime)}
                </span>
              </div>
            )}
            <span className="text-[10px] font-black text-zinc-700 tracking-[0.2em] ml-auto">{task.targetDate}</span>
          </div>
          
          <p className={`text-white font-bold text-xl tracking-tight leading-tight uppercase ${task.completed ? 'line-through text-zinc-600' : ''}`}>
            {task.text}
          </p>
        </div>

        {/* Actions Area */}
        <div className="flex flex-col border-l-2 border-zinc-900 group-hover:border-white transition-all">
          <button
            onClick={() => onDelete(task.id)}
            className="flex-1 px-4 text-zinc-800 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center border-b-2 border-zinc-900 group-hover:border-white"
            title="Archive"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
