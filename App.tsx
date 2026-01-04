
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Priority } from './types';
import { TaskItem } from './components/TaskItem';
import { db } from './db';

type TimeRange = 'yesterday' | 'tomorrow' | 'week' | 'month';
type StatusFilter = 'all' | 'pending' | 'completed';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [isDbReady, setIsDbReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved'>('idle');
  
  // View States
  const [timeRange, setTimeRange] = useState<TimeRange>('tomorrow');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Helpers for dates
  const getFormattedDate = (date: Date) => date.toISOString().split('T')[0];
  const tomorrowDateStr = getFormattedDate(new Date(Date.now() + 86400000));
  const yesterdayDateStr = getFormattedDate(new Date(Date.now() - 86400000));

  // Initialize IndexedDB
  useEffect(() => {
    const init = async () => {
      try {
        await db.init();
        const storedTasks = await db.getAllTasks();
        setTasks(storedTasks);
        setIsDbReady(true);
        setSyncStatus('saved');
      } catch (e) {
        console.error("Database connection failed", e);
      }
    };
    init();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isDbReady) return;

    setSyncStatus('syncing');
    const newTask: Task = {
      id: Math.random().toString(36).substring(7),
      text: input,
      completed: false,
      priority: priority,
      category: 'Manual',
      createdAt: Date.now(),
      targetDate: tomorrowDateStr,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      subtasks: []
    };

    await db.saveTask(newTask);
    setTasks(prev => [newTask, ...prev]);
    
    setInput('');
    setStartTime('');
    setEndTime('');
    setPriority(Priority.MEDIUM);
    setSyncStatus('saved');
  };

  const toggleTask = async (id: string) => {
    setSyncStatus('syncing');
    const updatedTasks = tasks.map(t => {
      if (t.id === id) {
        const updated = { ...t, completed: !t.completed };
        db.saveTask(updated);
        return updated;
      }
      return t;
    });
    setTasks(updatedTasks);
    setSyncStatus('saved');
  };

  const deleteTask = async (id: string) => {
    setSyncStatus('syncing');
    await db.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
    setSyncStatus('saved');
  };

  const filteredTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter(task => {
      let isInTimeRange = false;
      if (timeRange === 'tomorrow') {
        isInTimeRange = task.targetDate === tomorrowDateStr;
      } else if (timeRange === 'yesterday') {
        isInTimeRange = task.targetDate === yesterdayDateStr;
      } else if (timeRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        isInTimeRange = new Date(task.createdAt) >= weekAgo;
      } else if (timeRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(now.getDate() - 30);
        isInTimeRange = new Date(task.createdAt) >= monthAgo;
      }

      if (!isInTimeRange) return false;
      if (statusFilter === 'pending') return !task.completed;
      if (statusFilter === 'completed') return task.completed;
      return true;
    }).sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      return b.createdAt - a.createdAt;
    });
  }, [tasks, timeRange, statusFilter, tomorrowDateStr, yesterdayDateStr]);

  const stats = useMemo(() => {
    const rangeTasks = tasks.filter(task => {
      if (timeRange === 'tomorrow') return task.targetDate === tomorrowDateStr;
      if (timeRange === 'yesterday') return task.targetDate === yesterdayDateStr;
      if (timeRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(new Date().getDate() - 7);
        return new Date(task.createdAt) >= weekAgo;
      }
      const monthAgo = new Date();
      monthAgo.setDate(new Date().getDate() - 30);
      return new Date(task.createdAt) >= monthAgo;
    });

    const completed = rangeTasks.filter(t => t.completed).length;
    const total = rangeTasks.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    return { completed, total, progress };
  }, [tasks, timeRange, tomorrowDateStr, yesterdayDateStr]);

  return (
    <div className="min-h-screen pb-24 bg-zinc-900 text-white selection:bg-white selection:text-zinc-900">
      <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800 shadow-xl">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="flex items-end justify-between mb-10">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter uppercase leading-none border-b-4 border-white inline-block">
                Focus
              </h1>
              <div className="flex items-center gap-2 pt-1">
                <span className={`w-2 h-2 rounded-full ${isDbReady ? 'bg-white' : 'bg-zinc-700'} ${isDbReady && 'animate-pulse'}`}></span>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                  {isDbReady ? 'Storage Online' : 'System Offline'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-1">Current Matrix</div>
              <div className="text-2xl font-black text-white tracking-tighter uppercase">{timeRange}</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-10">
            {(['yesterday', 'tomorrow', 'week', 'month'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`py-3 text-[10px] font-black uppercase tracking-widest border transition-all ${
                  timeRange === range 
                    ? 'bg-white text-zinc-950 border-white' 
                    : 'text-zinc-500 border-zinc-800 bg-zinc-950 hover:border-zinc-500'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Completion Rate</div>
                <div className="text-sm font-black text-white">{stats.completed} OF {stats.total} OBJECTIVES</div>
              </div>
              <div className="text-4xl font-black tracking-tighter">{Math.round(stats.progress)}%</div>
            </div>
            <div className="w-full h-4 bg-zinc-950 border border-zinc-800">
              <div 
                className="h-full bg-white transition-all duration-700 ease-out"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 mt-12">
        <div className="flex gap-8 mb-10 border-b border-zinc-800">
          {(['all', 'pending', 'completed'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`text-[11px] font-black uppercase tracking-[0.3em] pb-4 transition-all relative ${
                statusFilter === f ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {f}
              {statusFilter === f && <span className="absolute bottom-0 left-0 w-full h-1 bg-white"></span>}
            </button>
          ))}
        </div>

        {timeRange === 'tomorrow' && (
          <form onSubmit={handleAddTask} className="mb-16 border-2 border-white p-8 space-y-8 bg-zinc-950 shadow-2xl">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-white uppercase tracking-[0.4em]">New Objective</label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Declare intent..."
                className="w-full bg-transparent border-b-2 border-zinc-800 py-4 focus:outline-none focus:border-white text-2xl font-bold text-white placeholder:text-zinc-800 transition-all rounded-none uppercase tracking-tight"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em]">Priority Level</label>
                <div className="flex gap-2">
                  {[Priority.LOW, Priority.MEDIUM, Priority.HIGH].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-3 text-[10px] font-black border transition-all ${
                        priority === p 
                          ? 'bg-white text-zinc-950 border-white'
                          : 'bg-transparent border-zinc-800 text-zinc-600 hover:border-zinc-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] block text-center">Start</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 py-3 px-3 text-[11px] font-black text-white focus:outline-none focus:border-white [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.4em] block text-center">End</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 py-3 px-3 text-[11px] font-black text-white focus:outline-none focus:border-white [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!input.trim() || !isDbReady}
              className="w-full py-5 bg-white hover:bg-zinc-200 disabled:opacity-10 disabled:cursor-not-allowed text-zinc-950 font-black uppercase tracking-[0.5em] text-xs transition-all"
            >
              Commit Objective
            </button>
          </form>
        )}

        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-24 border-2 border-zinc-800 bg-zinc-950/50">
              <p className="text-zinc-600 font-black uppercase tracking-[0.5em] text-[10px]">No Data Recorded</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="mt-40 text-center px-6">
        <div className="flex flex-col items-center gap-10">
          <div className="h-1 w-24 bg-zinc-700"></div>
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.6em]">
              Focus Matrix v3.0
            </p>
            <p className="text-[9px] text-zinc-600 font-medium uppercase tracking-[0.4em]">
              Locally Encrypted Data // Encrypted at Rest
            </p>
          </div>
          <button className="text-[10px] text-zinc-500 hover:text-white font-black uppercase tracking-[0.5em] transition-all border-b border-transparent hover:border-white pb-1">
            Connect Remote Node
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
