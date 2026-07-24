'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Clock, Coffee, Zap } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  estimatedMinutes?: number;
  actualMinutes?: number;
  pomodoroSessions?: number;
}

interface PomodoroTimerProps {
  task: Task;
  onClose: () => void;
  onTimeUpdate: (taskId: string, minutes: number) => void;
}

const WORK_TIME = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK = 5 * 60; // 5 minutes
const LONG_BREAK = 15 * 60; // 15 minutes

export default function PomodoroTimer({ task, onClose, onTimeUpdate }: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [completedPomodoros, setCompletedPomodoros] = useState(task.pomodoroSessions || 0);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create notification sound (simple beep using Web Audio API)
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
    }
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });

        // Track actual time for work sessions
        if (mode === 'work') {
          setSessionMinutes((prev) => prev + 1 / 60);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, mode]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    playNotificationSound();
    showNotification();

    if (mode === 'work') {
      const newPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newPomodoros);
      
      // Update task time
      onTimeUpdate(task._id, sessionMinutes);
      setSessionMinutes(0);

      // Suggest break type
      if (newPomodoros % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(LONG_BREAK);
      } else {
        setMode('shortBreak');
        setTimeLeft(SHORT_BREAK);
      }
    } else {
      setMode('work');
      setTimeLeft(WORK_TIME);
    }
  };

  const playNotificationSound = () => {
    // Simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Timer', {
        body: mode === 'work' ? 'Work session complete! Time for a break.' : 'Break over! Ready to focus?',
        icon: '/favicon.ico',
      });
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const toggleTimer = () => {
    if (!isRunning) {
      requestNotificationPermission();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (mode === 'work') {
      setTimeLeft(WORK_TIME);
    } else if (mode === 'shortBreak') {
      setTimeLeft(SHORT_BREAK);
    } else {
      setTimeLeft(LONG_BREAK);
    }
  };

  const switchMode = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'work') {
      setTimeLeft(WORK_TIME);
    } else if (newMode === 'shortBreak') {
      setTimeLeft(SHORT_BREAK);
    } else {
      setTimeLeft(LONG_BREAK);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const total = mode === 'work' ? WORK_TIME : mode === 'shortBreak' ? SHORT_BREAK : LONG_BREAK;
    return ((total - timeLeft) / total) * 100;
  };

  const getModeColor = () => {
    switch (mode) {
      case 'work':
        return 'from-[#ffffff] to-[#a1a1a1]';
      case 'shortBreak':
        return 'from-emerald-400 to-teal-500';
      case 'longBreak':
        return 'from-amber-400 to-orange-500';
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'work':
        return <Zap className="w-5 h-5 text-black" />;
      case 'shortBreak':
        return <Coffee className="w-5 h-5 text-black" />;
      case 'longBreak':
        return <Coffee className="w-5 h-5 text-black" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 selection:bg-neutral-800 selection:text-white">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[96vh] overflow-y-auto p-4 sm:p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 hover:bg-neutral-900 rounded-lg transition-colors text-neutral-400 hover:text-white z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Task Info */}
        <div className="mb-4 pr-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-full mb-2">
            <Clock className="w-3 h-3 text-neutral-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300">Focus Mode</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight line-clamp-2">
            {task.title}
          </h2>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-1.5 mb-5 p-1 bg-neutral-900 border border-neutral-800/80 rounded-xl">
          <button
            onClick={() => switchMode('work')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              mode === 'work'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Work
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              mode === 'shortBreak'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">Short Break</span>
            <span className="sm:hidden">Short</span>
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              mode === 'longBreak'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">Long Break</span>
            <span className="sm:hidden">Long</span>
          </button>
        </div>

        {/* Timer Display */}
        <div className="relative mb-6 max-w-[220px] sm:max-w-[240px] mx-auto">
          {/* Progress Ring */}
          <svg className="w-full h-full" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="#171717"
              strokeWidth="6"
            />
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="url(#pomodoro-gradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - getProgress() / 100)}`}
              className="transition-all duration-1000"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
            <defs>
              <linearGradient id="pomodoro-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={mode === 'work' ? '#ffffff' : mode === 'shortBreak' ? '#34d399' : '#fbbf24'} />
                <stop offset="100%" stopColor={mode === 'work' ? '#a3a3a3' : mode === 'shortBreak' ? '#10b981' : '#f59e0b'} />
              </linearGradient>
            </defs>
          </svg>

          {/* Time and Icon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`bg-gradient-to-r ${getModeColor()} p-2 rounded-full mb-2 shadow-sm`}>
              {getModeIcon()}
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white">
              {formatTime(timeLeft)}
            </div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mt-1">
              {mode === 'work' ? 'Focus Time' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2.5 mb-5">
          <button
            onClick={toggleTimer}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition-all duration-200 shadow-md cursor-pointer active:scale-98 flex items-center justify-center gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start
              </>
            )}
          </button>
          <button
            onClick={resetTimer}
            className="px-4 py-3 rounded-xl font-semibold bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all border border-neutral-800 cursor-pointer active:scale-98"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-black border border-neutral-800/80 p-2.5 rounded-xl text-center">
            <div className="text-base font-mono font-bold text-white">
              {completedPomodoros}
            </div>
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mt-0.5">
              Sessions
            </div>
          </div>
          <div className="bg-black border border-neutral-800/80 p-2.5 rounded-xl text-center">
            <div className="text-base font-mono font-bold text-white">
              {task.estimatedMinutes || 0}m
            </div>
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mt-0.5">
              Estimated
            </div>
          </div>
          <div className="bg-black border border-neutral-800/80 p-2.5 rounded-xl text-center">
            <div className="text-base font-mono font-bold text-white">
              {Math.round((task.actualMinutes || 0) + sessionMinutes)}m
            </div>
            <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mt-0.5">
              Actual
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-xs text-neutral-300">
          <p className="leading-relaxed">
            <strong className="text-white">Tip:</strong> {mode === 'work' 
              ? 'Focus on one task at a time. Minimize distractions.' 
              : 'Take a step away from the screen for a true break.'}
          </p>
        </div>
      </div>
    </div>
  );
}
