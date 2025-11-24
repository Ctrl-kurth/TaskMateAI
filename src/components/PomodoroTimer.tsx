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
        return 'from-blue-500 to-purple-600';
      case 'shortBreak':
        return 'from-green-500 to-emerald-600';
      case 'longBreak':
        return 'from-orange-500 to-red-600';
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'work':
        return <Zap className="w-6 h-6" />;
      case 'shortBreak':
        return <Coffee className="w-6 h-6" />;
      case 'longBreak':
        return <Coffee className="w-6 h-6" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 md:p-8 relative max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white z-10"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Task Info */}
        <div className="mb-4 sm:mb-6 pr-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
            Focus Mode
          </h2>
          <p className="text-sm sm:text-base text-gray-400 line-clamp-2">
            {task.title}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => switchMode('work')}
              className={`flex-1 py-1.5 px-2 sm:py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              mode === 'work'
                ? 'bg-white text-black'
                : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800'
            }`}
          >
            Work
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
              className={`flex-1 py-1.5 px-2 sm:py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              mode === 'shortBreak'
                ? 'bg-white text-black'
                : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800'
            }`}
          >
            <span className="hidden sm:inline">Short Break</span>
            <span className="sm:hidden">Short</span>
          </button>
          <button
            onClick={() => switchMode('longBreak')}
              className={`flex-1 py-1.5 px-2 sm:py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              mode === 'longBreak'
                ? 'bg-white text-black'
                : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800'
            }`}
          >
            <span className="hidden sm:inline">Long Break</span>
            <span className="sm:hidden">Long</span>
          </button>
        </div>

        {/* Timer Display */}
        <div className="relative mb-6 sm:mb-8 max-w-[280px] sm:max-w-none mx-auto">
          {/* Progress Ring */}
          <svg className="w-full h-full" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-800"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - getProgress() / 100)}`}
              className="transition-all duration-1000"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={mode === 'work' ? 'text-blue-500' : mode === 'shortBreak' ? 'text-green-500' : 'text-orange-500'} stopColor="currentColor" />
                <stop offset="100%" className={mode === 'work' ? 'text-purple-600' : mode === 'shortBreak' ? 'text-emerald-600' : 'text-red-600'} stopColor="currentColor" />
              </linearGradient>
            </defs>
          </svg>

          {/* Time and Icon */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`bg-linear-to-r ${getModeColor()} p-2 sm:p-3 rounded-full mb-2 sm:mb-3 text-white`}>
              {getModeIcon()}
            </div>
            <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">
              {mode === 'work' ? 'Focus Time' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={toggleTimer}
            className="flex-1 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold bg-white text-black shadow-lg transition-all transform active:scale-95 hover:bg-gray-100"
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                Pause
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                Start
              </span>
            )}
          </button>
          <button
            onClick={resetTimer}
            className="px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold bg-gray-900 text-gray-300 hover:bg-gray-800 transition-all border border-gray-800 active:scale-95"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-black border border-gray-800 p-2 sm:p-4 rounded-lg text-center">
            <div className="text-lg sm:text-2xl font-bold text-white">
              {completedPomodoros}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
              Pomodoros
            </div>
          </div>
          <div className="bg-black border border-gray-800 p-2 sm:p-4 rounded-lg text-center">
            <div className="text-lg sm:text-2xl font-bold text-white">
              {task.estimatedMinutes || 0}m
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
              Estimated
            </div>
          </div>
          <div className="bg-black border border-gray-800 p-2 sm:p-4 rounded-lg text-center">
            <div className="text-lg sm:text-2xl font-bold text-white">
              {Math.round((task.actualMinutes || 0) + sessionMinutes)}m
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
              Actual
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-400">
            💡 <strong>Tip:</strong> {mode === 'work' 
              ? 'Focus on one task at a time. Close distractions.' 
              : 'Take a real break! Step away from your screen.'}
          </p>
        </div>
      </div>
    </div>
  );
}
