'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PomodoroTimer from '@/components/PomodoroTimer';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  pomodoroSessions?: number;
  createdAt: string;
}

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'todo' | 'inprogress' | 'done'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAIBreakdown, setShowAIBreakdown] = useState(false);
  const [aiTaskInput, setAiTaskInput] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allTeamMembers, setAllTeamMembers] = useState<TeamMember[]>([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [pomodoroTask, setPomodoroTask] = useState<Task | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Get current user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser({ name: user.name, email: user.email });
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
    
    fetchTasks();
    fetchTeamMembers();
    fetchNotifications();
    fetchPendingAssignments();
    
    // Poll for new notifications and assignments every 10 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchPendingAssignments();
    }, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setTasks(data.tasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch only accepted members for assignee dropdown
      const response = await fetch('/api/team', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setTeamMembers(data.members);

      // Fetch all members (including pending) for team modal
      const allResponse = await fetch('/api/team?showAll=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allData = await allResponse.json();
      if (allResponse.ok) setAllTeamMembers(allData.members);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchPendingAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tasks/assign', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setPendingAssignments(data.pendingTasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch pending assignments:', error);
    }
  };

  const handleAssignmentResponse = async (assignedTaskId: string, action: 'accept' | 'reject') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/assign/${assignedTaskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        if (action === 'accept') {
          alert('✅ Task accepted and added to your tasks!');
          await fetchTasks();
        } else {
          alert('❌ Task rejected');
        }
        await fetchPendingAssignments();
        await fetchNotifications();
      } else {
        alert(data.error || 'Failed to respond to task assignment');
      }
    } catch (error) {
      console.error('Failed to respond to assignment:', error);
      alert('Failed to respond to task assignment');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const handleInvitationResponse = async (teamMemberId: string, action: 'accept' | 'decline') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/team/invitation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamMemberId, action }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        await fetchNotifications();
        await fetchTeamMembers();
        alert(`Friend request ${action}ed successfully!`);
      } else {
        alert(data.error || 'Failed to process invitation');
      }
    } catch (error) {
      console.error('Failed to process invitation:', error);
      alert('Failed to process invitation');
    }
  };

  const handleAddTask = async (taskData: Partial<Task>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });
      if (response.ok) {
        await fetchTasks();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleEditTask = async (taskData: Partial<Task>) => {
    if (!editingTask) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${editingTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });
      if (response.ok) {
        await fetchTasks();
        setShowEditModal(false);
        setEditingTask(null);
      }
    } catch (error) {
      console.error('Failed to edit task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleToggleStatus = async (updatedTask: Task) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${updatedTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: updatedTask.status }),
      });

      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      
      // Auto-enable selection mode when selecting tasks
      if (newSet.size > 0) {
        setIsSelectionMode(true);
      } else {
        setIsSelectionMode(false);
      }
      
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) return;
    
    if (!confirm(`Delete ${selectedTasks.size} selected task(s)?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Delete all selected tasks
      await Promise.all(
        Array.from(selectedTasks).map(taskId =>
          fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      
      await fetchTasks();
      setSelectedTasks(new Set());
      setIsSelectionMode(false);
      alert(`✅ Successfully deleted ${selectedTasks.size} task(s)!`);
    } catch (error) {
      console.error('Error deleting tasks:', error);
      alert('❌ Failed to delete some tasks');
    }
  };

  const handleCancelSelection = () => {
    setSelectedTasks(new Set());
    setIsSelectionMode(false);
  };

  const handleAIBreakdown = async (mainTask: string) => {
    if (!mainTask.trim()) return;
    
    try {
      // Call AI API to generate sub-tasks
      const response = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mainTask }),
      });

      const data = await response.json();
      
      // Handle rate limit or fallback scenarios
      if (response.status === 429 || data.error === 'AI_MODELS_UNAVAILABLE') {
        const attemptedModels = data.attemptedModels?.join(', ') || 'multiple models';
        alert(`⏳ AI models temporarily unavailable.\n\nTried: ${attemptedModels}\n\n${data.message || 'Using intelligent fallback breakdown.'}`);
        // Still use the fallback tasks if provided
        if (data.subTasks && data.subTasks.length > 0) {
          // Continue with fallback tasks
        } else {
          return;
        }
      } else if (!response.ok) {
        throw new Error(data.error || 'Failed to generate sub-tasks');
      }

      const { subTasks, usingFallback, message, model } = data;
      
      if (!subTasks || subTasks.length === 0) {
        throw new Error('No sub-tasks were generated');
      }
      
      // Show info if using fallback
      if (usingFallback && response.ok) {
        alert(`ℹ️ ${message}\n\nGenerating ${subTasks.length} sub-tasks...`);
      }
      
      // Create all sub-tasks in the todo column
      for (const subTask of subTasks) {
        await handleAddTask({
          title: subTask,
          status: 'todo',
          priority: 'medium',
          description: `Generated from: "${mainTask}"`,
        });
      }

      // Refresh tasks to show the new sub-tasks
      await fetchTasks();
      
      // Show success message
      if (!usingFallback) {
        alert(`✅ AI Breakdown successfully created ${subTasks.length} sub-tasks!`);
      } else {
        alert(`✅ Created ${subTasks.length} sub-tasks to get you started!`);
      }
      
    } catch (error) {
      console.error('AI Breakdown error:', error);
      alert('❌ Failed to generate task breakdown. Please try again later.');
      throw error; // Re-throw to let modal handle it
    }
  };

  const handlePomodoroTimeUpdate = async (taskId: string, minutesWorked: number) => {
    try {
      const token = localStorage.getItem('token');
      const task = tasks.find(t => t._id === taskId);
      if (!task) return;

      const updatedActualMinutes = (task.actualMinutes || 0) + minutesWorked;
      const updatedPomodoroSessions = (task.pomodoroSessions || 0) + 1;

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          actualMinutes: updatedActualMinutes,
          pomodoroSessions: updatedPomodoroSessions,
        }),
      });

      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Failed to update task time:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (task.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && task.status === activeTab;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'inprogress');
  const completedTasks = filteredTasks.filter(t => t.status === 'done');

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'inprogress').length,
    completed: tasks.filter(t => t.status === 'done').length,
    totalPomodoros: tasks.reduce((sum, t) => sum + (t.pomodoroSessions || 0), 0),
    totalTimeSpent: tasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0),
    totalTimeEstimated: tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-neutral-500 font-mono text-sm tracking-wide">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#ededed] relative selection:bg-neutral-800 selection:text-white">
      {/* Sticky Header Bar */}
      <header className="sticky top-0 z-30 bg-black/70 backdrop-blur-md border-b border-neutral-800/80 px-4 md:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Back to Welcome Button */}
            <button
              onClick={() => router.push('/welcome')}
              className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors group cursor-pointer p-1"
              title="Back to Welcome"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div>
                <h1 className="text-base md:text-lg font-bold tracking-tight text-white">TaskMate AI</h1>
                <p className="text-[11px] text-neutral-400 font-mono">Manage your team's tasks and projects</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            {/* Pending Assignments Bell */}
            {pendingAssignments.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setShowAssignmentModal(true)}
                  className="relative flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition-all cursor-pointer text-xs font-mono"
                  title="Pending Task Assignments"
                >
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="font-semibold">{pendingAssignments.length} Pending</span>
                </button>
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex items-center justify-center bg-neutral-900 border border-neutral-800 text-neutral-300 p-2 rounded-lg hover:text-white hover:border-neutral-700 transition-all cursor-pointer"
                title="Notifications"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-mono font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center border-2 border-black">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="fixed top-16 right-2 md:absolute md:top-auto md:right-0 md:mt-2 w-[calc(100%-1rem)] max-w-sm md:w-96 max-h-[80vh] md:max-h-128 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                    <div className="bg-neutral-900/60 border-b border-neutral-800 p-4 flex items-center justify-between shrink-0">
                      <h3 className="font-semibold text-sm text-white">Notifications</h3>
                      <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-mono text-neutral-400 hover:text-white cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-neutral-400 hover:text-white text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500 font-mono text-xs">
                          No notifications yet
                        </div>
                      ) : (
                        <div className="divide-y divide-neutral-900">
                          {notifications.map((notif) => (
                            <div
                              key={notif._id}
                              className={`p-4 hover:bg-neutral-900/40 transition-colors ${
                                !notif.read ? 'bg-neutral-900/20' : ''
                              }`}
                            >
                              <p className="text-xs text-neutral-200 leading-relaxed">{notif.message}</p>
                              <p className="text-[10px] font-mono text-neutral-500 mt-2">
                                {new Date(notif.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              
                              {/* Show Accept/Decline buttons for team invitations */}
                              {notif.type === 'team_invitation' && notif.actionRequired && (
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={() => handleInvitationResponse(notif.teamMemberId, 'accept')}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-1.5 px-3 rounded-lg transition-colors font-medium cursor-pointer"
                                  >
                                    ✓ Accept
                                  </button>
                                  <button
                                    onClick={() => handleInvitationResponse(notif.teamMemberId, 'decline')}
                                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs py-1.5 px-3 rounded-lg transition-colors font-medium cursor-pointer"
                                  >
                                    ✗ Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-white text-black px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-semibold hover:bg-neutral-200 transition-all shadow-xs whitespace-nowrap cursor-pointer"
            >
              <span>+</span>
              <span className="hidden sm:inline">New Task</span>
              <span className="sm:hidden">Task</span>
            </button>

            <button 
              onClick={() => setShowAIBreakdown(true)}
              className="flex items-center gap-1.5 bg-neutral-900 text-neutral-200 border border-neutral-800 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium hover:border-neutral-700 hover:text-white transition-all whitespace-nowrap cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="hidden sm:inline">AI Breakdown</span>
              <span className="sm:hidden">AI</span>
            </button>

            <button 
              onClick={() => setShowTeamModal(true)}
              className="flex items-center gap-1.5 bg-neutral-900 text-neutral-200 border border-neutral-800 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium hover:border-neutral-700 hover:text-white transition-all whitespace-nowrap cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Friends ({allTeamMembers.length})</span>
              <span className="sm:hidden">{allTeamMembers.length}</span>
            </button>
            
            {/* User Info */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors cursor-pointer shadow-xs"
                >
                  {(currentUser.name || 'U').split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2)}
                </button>

                {/* User Dropdown */}
                {showUserDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowUserDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl z-50 p-4">
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-neutral-800">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black text-xs font-bold shrink-0">
                          {(currentUser.name || 'U').split(' ').map(n => n[0] || '').join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-xs font-semibold text-white truncate">{currentUser.name || 'User'}</span>
                          <span className="text-[11px] font-mono text-neutral-400 truncate">{currentUser.email}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
        {/* Metric Cards (Grid of 4) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4 mb-6">
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-4.5 hover:border-neutral-700/80 transition-all duration-200 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Total Tasks</p>
                <p className="text-2xl font-mono font-bold tracking-tight text-white mt-1">{stats.total}</p>
                <p className="text-[11px] text-neutral-500 mt-1 hidden sm:block font-mono">+2 from last week</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-4.5 hover:border-neutral-700/80 transition-all duration-200 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">In Progress</p>
                <p className="text-2xl font-mono font-bold tracking-tight text-white mt-1">{stats.inProgress}</p>
                <p className="text-[11px] text-neutral-500 mt-1 hidden sm:block font-mono">{stats.inProgress} active now</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-4.5 hover:border-neutral-700/80 transition-all duration-200 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Completed</p>
                <p className="text-2xl font-mono font-bold tracking-tight text-white mt-1">{stats.completed}</p>
                <p className="text-[11px] text-neutral-500 mt-1 hidden sm:block font-mono">25% completion rate</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-4.5 hover:border-neutral-700/80 transition-all duration-200 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">To Do</p>
                <p className="text-2xl font-mono font-bold tracking-tight text-white mt-1">{stats.todo}</p>
                <p className="text-[11px] text-neutral-500 mt-1 hidden sm:block font-mono">3 due this week</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Pomodoro & Time Stats (Grid of 3) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 md:gap-4 mb-6">
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-4 flex items-center gap-3.5 hover:border-neutral-700/80 transition-all">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Pomodoros</p>
              <p className="text-xl font-mono font-bold text-white mt-0.5">{stats.totalPomodoros}</p>
              <p className="text-[11px] font-mono text-neutral-500">{Math.round(stats.totalPomodoros * 25)} mins focused</p>
            </div>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-4 flex items-center gap-3.5 hover:border-neutral-700/80 transition-all">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Time Spent</p>
              <p className="text-xl font-mono font-bold text-white mt-0.5">
                {Math.floor(stats.totalTimeSpent / 60)}h {Math.round(stats.totalTimeSpent % 60)}m
              </p>
              <p className="text-[11px] font-mono text-neutral-500">Actual work time</p>
            </div>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-4 flex items-center gap-3.5 hover:border-neutral-700/80 transition-all">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Accuracy</p>
              <p className="text-xl font-mono font-bold text-white mt-0.5">
                {stats.totalTimeEstimated > 0 
                  ? Math.round((stats.totalTimeSpent / stats.totalTimeEstimated) * 100) 
                  : 0}%
              </p>
              <p className="text-[11px] font-mono text-neutral-500">
                {stats.totalTimeSpent > stats.totalTimeEstimated ? 'Over' : 'Under'} estimated
              </p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: 'all' as const, label: `All Tasks (${filteredTasks.length})` },
            { key: 'todo' as const, label: `To Do (${todoTasks.length})` },
            { key: 'inprogress' as const, label: `In Progress (${inProgressTasks.length})` },
            { key: 'done' as const, label: `Completed (${completedTasks.length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === key
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Task Columns */}
        {activeTab === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">To Do</h2>
                <span className="text-xs font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-md px-2 py-0.5">{todoTasks.length}</span>
              </div>
              {todoTasks.length === 0 ? (
                <div className="text-center text-neutral-500 text-xs font-mono py-12 border border-dashed border-neutral-800/80 rounded-xl">
                  No tasks
                </div>
              ) : (
                <div className="space-y-3">
                  {todoTasks.map(task => (
                    <TaskCard 
                      key={task._id} 
                      task={task} 
                      onEdit={openEditModal}
                      onDelete={handleDeleteTask}
                      onToggleStatus={handleToggleStatus}
                      isSelected={selectedTasks.has(task._id)}
                      onSelect={handleTaskSelection}
                      isSelectionMode={isSelectionMode}
                      onStartPomodoro={setPomodoroTask}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">In Progress</h2>
                <span className="text-xs font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-md px-2 py-0.5">{inProgressTasks.length}</span>
              </div>
              {inProgressTasks.length === 0 ? (
                <div className="text-center text-neutral-500 text-xs font-mono py-12 border border-dashed border-neutral-800/80 rounded-xl">
                  No tasks
                </div>
              ) : (
                <div className="space-y-3">
                  {inProgressTasks.map(task => (
                    <TaskCard 
                      key={task._id} 
                      task={task} 
                      onEdit={openEditModal}
                      onDelete={handleDeleteTask}
                      onToggleStatus={handleToggleStatus}
                      isSelected={selectedTasks.has(task._id)}
                      onSelect={handleTaskSelection}
                      isSelectionMode={isSelectionMode}
                      onStartPomodoro={setPomodoroTask}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">Completed</h2>
                <span className="text-xs font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-md px-2 py-0.5">{completedTasks.length}</span>
              </div>
              {completedTasks.length === 0 ? (
                <div className="text-center text-neutral-500 text-xs font-mono py-12 border border-dashed border-neutral-800/80 rounded-xl">
                  No tasks
                </div>
              ) : (
                <div className="space-y-3">
                  {completedTasks.map(task => (
                    <TaskCard 
                      key={task._id} 
                      task={task} 
                      onEdit={openEditModal}
                      onDelete={handleDeleteTask}
                      onToggleStatus={handleToggleStatus}
                      isSelected={selectedTasks.has(task._id)}
                      onSelect={handleTaskSelection}
                      isSelectionMode={isSelectionMode}
                      onStartPomodoro={setPomodoroTask}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'todo' && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">To Do Tasks</h2>
              <span className="text-xs font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-md px-2 py-0.5">{todoTasks.length}</span>
            </div>
            {todoTasks.length === 0 ? (
              <div className="text-center text-neutral-500 text-xs font-mono py-12 border border-dashed border-neutral-800/80 rounded-xl">No to do tasks</div>
            ) : (
              <div className="space-y-3">
                {todoTasks.map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={openEditModal}
                    onDelete={handleDeleteTask}
                    onToggleStatus={handleToggleStatus}
                    isSelected={selectedTasks.has(task._id)}
                    onSelect={handleTaskSelection}
                    isSelectionMode={isSelectionMode}
                    onStartPomodoro={setPomodoroTask}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'inprogress' && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">In Progress Tasks</h2>
              <span className="text-xs font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-md px-2 py-0.5">{inProgressTasks.length}</span>
            </div>
            {inProgressTasks.length === 0 ? (
              <div className="text-center text-neutral-500 text-xs font-mono py-12 border border-dashed border-neutral-800/80 rounded-xl">No in progress tasks</div>
            ) : (
              <div className="space-y-3">
                {inProgressTasks.map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={openEditModal}
                    onDelete={handleDeleteTask}
                    onToggleStatus={handleToggleStatus}
                    isSelected={selectedTasks.has(task._id)}
                    onSelect={handleTaskSelection}
                    isSelectionMode={isSelectionMode}
                    onStartPomodoro={setPomodoroTask}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'done' && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">Completed Tasks</h2>
              <span className="text-xs font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-md px-2 py-0.5">{completedTasks.length}</span>
            </div>
            {completedTasks.length === 0 ? (
              <div className="text-center text-neutral-500 text-xs font-mono py-12 border border-dashed border-neutral-800/80 rounded-xl">No completed tasks yet</div>
            ) : (
              <div className="space-y-3">
                {completedTasks.map(task => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={openEditModal}
                    onDelete={handleDeleteTask}
                    onToggleStatus={handleToggleStatus}
                    isSelected={selectedTasks.has(task._id)}
                    onSelect={handleTaskSelection}
                    isSelectionMode={isSelectionMode}
                    onStartPomodoro={setPomodoroTask}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Buttons for Multi-Select */}
      {selectedTasks.size > 0 && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
          <div className="bg-neutral-900 border border-neutral-700 text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2">
            <span className="text-xs font-mono font-medium">{selectedTasks.size} selected</span>
          </div>
          <button
            onClick={handleCancelSelection}
            className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 p-2.5 rounded-xl shadow-2xl transition-colors cursor-pointer"
            title="Cancel selection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={handleBulkDelete}
            className="bg-rose-600 hover:bg-rose-500 text-white p-2.5 rounded-xl shadow-2xl transition-colors cursor-pointer"
            title="Delete selected tasks"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <TaskModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddTask}
          teamMembers={teamMembers}
        />
      )}
      {showEditModal && editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setShowEditModal(false);
            setEditingTask(null);
          }}
          onSave={handleEditTask}
          teamMembers={teamMembers}
        />
      )}
      {showAIBreakdown && (
        <AIBreakdownModal
          value={aiTaskInput}
          onChange={setAiTaskInput}
          onClose={() => {
            setShowAIBreakdown(false);
            setAiTaskInput('');
          }}
          onSubmit={handleAIBreakdown}
        />
      )}
      {showTeamModal && (
        <TeamModal
          members={allTeamMembers}
          onClose={() => setShowTeamModal(false)}
          onRefresh={fetchTeamMembers}
        />
      )}
      {pomodoroTask && (
        <PomodoroTimer
          task={pomodoroTask}
          onClose={() => setPomodoroTask(null)}
          onTimeUpdate={handlePomodoroTimeUpdate}
        />
      )}
      {showAssignmentModal && (
        <AssignmentModal
          assignments={pendingAssignments}
          onClose={() => setShowAssignmentModal(false)}
          onRespond={handleAssignmentResponse}
        />
      )}
    </div>
  );
}

function TeamModal({
  members,
  onClose,
  onRefresh,
}: {
  members: TeamMember[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('friend');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsAdding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, role }),
      });

      const data = await response.json();

      if (response.ok) {
        setName('');
        setEmail('');
        setRole('friend');
        alert('Friend request sent! They will receive an invitation notification.');
        await onRefresh();
      } else {
        alert(data.error || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
      alert('Failed to send friend request');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this friend?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        alert('Friend removed successfully!');
        await onRefresh();
      } else {
        const data = await response.json();
        alert(`Failed to remove friend: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
      alert('Failed to remove friend');
    }
  };

  const handleCleanupDuplicates = async () => {
    if (!confirm('This will remove duplicate friends (keeping the oldest entry for each email). Continue?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/team/cleanup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(data.message);
        await onRefresh();
      } else {
        alert(data.error || 'Failed to cleanup duplicates');
      }
    } catch (error) {
      console.error('Failed to cleanup duplicates:', error);
      alert('Failed to cleanup duplicates');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-neutral-950 border-t md:border border-neutral-800 rounded-t-2xl md:rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Friends
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">Add friends to assign tasks</p>
          </div>
          <div className="flex items-center gap-2">
            {members.length > 0 && (
              <button
                onClick={handleCleanupDuplicates}
                className="text-xs font-mono text-neutral-400 hover:text-amber-400 transition-colors px-2.5 py-1 border border-neutral-800 rounded-lg hover:border-amber-500/50 cursor-pointer"
                title="Remove duplicate friends"
              >
                🧹 Cleanup
              </button>
            )}
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors text-lg leading-none cursor-pointer p-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Add Friend Form */}
        <form onSubmit={handleAddMember} className="mb-6 p-4 bg-black border border-neutral-800/80 rounded-xl">
          <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-3">Add New Friend</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-xs placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              required
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-neutral-500"
            >
              <option value="friend">Friend</option>
              <option value="close friend">Close Friend</option>
              <option value="best friend">Best Friend</option>
            </select>
            <button
              type="submit"
              disabled={isAdding}
              className="px-4 py-2 bg-white text-black rounded-lg text-xs font-semibold hover:bg-neutral-200 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isAdding ? 'Adding...' : 'Add Friend'}
            </button>
          </div>
        </form>

        {/* Friends List */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-3">
            {members.length} {members.length === 1 ? 'Friend' : 'Friends'}
          </h3>
          {members.length === 0 ? (
            <div className="text-center text-neutral-500 text-xs font-mono py-8 border border-dashed border-neutral-800 rounded-xl">
              No friends yet. Add your first friend above.
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-3 bg-black border border-neutral-800/80 rounded-xl hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-white flex items-center justify-center text-black font-bold text-xs">
                    {getInitials(member.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{member.name}</p>
                    <p className="text-[11px] font-mono text-neutral-400 truncate">{member.email}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {member.role}
                      </span>
                      {(member as any).status && (
                        <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                          (member as any).status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          (member as any).status === 'declined' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {(member as any).status === 'accepted' ? '✓ Accepted' :
                           (member as any).status === 'declined' ? '✗ Declined' :
                           '⏳ Pending'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMember(member._id)}
                  className="p-2 hover:bg-neutral-900 rounded-lg text-neutral-400 hover:text-rose-400 transition-colors shrink-0 ml-2 cursor-pointer"
                  title="Remove friend"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AIBreakdownModal({ 
  value, 
  onChange, 
  onClose, 
  onSubmit 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  onClose: () => void; 
  onSubmit: (mainTask: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim()) return;
    setIsLoading(true);
    try {
      await onSubmit(value);
      onClose();
    } catch (error) {
      // Error is handled in parent, just stop loading
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-neutral-950 border-t md:border border-neutral-800 rounded-t-2xl md:rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Task Breakdown
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors text-lg leading-none cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
        
        <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
          Describe a large or complex task, and AI will break it down into actionable sub-tasks.
        </p>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Example: Plan a marketing campaign, prepare for an exam, organize a team event, build a new feature..."
          className="w-full h-36 bg-black border border-neutral-800 rounded-xl p-3.5 text-sm text-white resize-none focus:outline-none focus:border-neutral-500 placeholder:text-neutral-600 transition-all font-sans"
        />

        <div className="flex flex-col-reverse md:flex-row justify-end gap-2.5 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-neutral-800 rounded-lg text-neutral-300 hover:bg-neutral-900 transition-colors text-xs font-medium md:hidden cursor-pointer"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !value.trim()}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-xs font-semibold cursor-pointer shadow-xs"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Sub-Tasks
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskModal({ 
  task, 
  onClose, 
  onSave, 
  teamMembers 
}: { 
  task?: Task; 
  onClose: () => void; 
  onSave: (data: Partial<Task>) => void;
  teamMembers: TeamMember[];
}) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'todo');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [assignee, setAssignee] = useState(task?.assignee || '');
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimatedMinutes || 0);
  const [showAssignToFriend, setShowAssignToFriend] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, description, status, priority, assignee, dueDate, estimatedMinutes });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-neutral-950 border-t md:border border-neutral-800 rounded-t-2xl md:rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white tracking-tight">{task ? 'Edit Task' : 'New Task'}</h2>
          <button
            onClick={onClose}
            type="button"
            className="text-neutral-400 hover:text-white p-1 cursor-pointer text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 transition-all"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 transition-all"
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 transition-all"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">Assignee</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 transition-all"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member._id} value={member.name}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
              Estimated Time (minutes)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEstimatedMinutes(m => Math.max(0, m - 5))}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-mono hover:text-white hover:border-neutral-700 transition cursor-pointer"
                aria-label="Decrease estimate by 5 minutes"
              >−5</button>
              <input
                type="number"
                min="0"
                placeholder="60"
                value={estimatedMinutes || ''}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
                className="flex-1 bg-black border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 font-mono text-center appearance-none"
                aria-label="Estimated minutes"
              />
              <button
                type="button"
                onClick={() => setEstimatedMinutes(m => m + 5)}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-mono hover:text-white hover:border-neutral-700 transition cursor-pointer"
                aria-label="Increase estimate by 5 minutes"
              >+5</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[25,50,60,90,120].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setEstimatedMinutes(preset)}
                  className={`text-[11px] font-mono px-2 py-1 rounded-md border ${
                    estimatedMinutes === preset 
                      ? 'bg-white text-black border-white font-semibold' 
                      : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                  } transition cursor-pointer`}
                  aria-label={`Set estimate to ${preset} minutes`}
                >{preset}m</button>
              ))}
            </div>
            <p className="text-[11px] font-mono text-neutral-500 mt-2">
              💡 Helps with Pomodoro planning (1 Pomodoro = 25 minutes)
            </p>
          </div>

          <div className="flex gap-2.5 pt-3">
            <button
              type="submit"
              className="flex-1 bg-white text-black py-2.5 rounded-lg text-xs font-semibold hover:bg-neutral-200 transition-colors shadow-xs cursor-pointer"
            >
              {task ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-neutral-900 text-white py-2.5 rounded-lg text-xs font-medium hover:bg-neutral-800 transition-colors md:hidden cursor-pointer"
            >
              Cancel
            </button>
          </div>
          
          {task && (
            <div className="pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowAssignToFriend(true)}
                className="w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Assign to Friend
              </button>
            </div>
          )}
        </form>
        
        {showAssignToFriend && task && (
          <AssignTaskModal
            task={task}
            friends={teamMembers}
            onClose={() => setShowAssignToFriend(false)}
          />
        )}
      </div>
    </div>
  );
}

function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  isSelected, 
  onSelect, 
  isSelectionMode,
  onStartPomodoro
}: { 
  task: Task; 
  onEdit: (task: Task) => void; 
  onDelete: (id: string) => void; 
  onToggleStatus: (task: Task) => void;
  isSelected?: boolean;
  onSelect?: (taskId: string) => void;
  isSelectionMode?: boolean;
  onStartPomodoro?: (task: Task) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const handleCircleClick = () => {
    // Toggle between todo -> inprogress -> done -> todo
    let newStatus: 'todo' | 'inprogress' | 'done' = 'todo';
    
    if (task.status === 'todo') {
      newStatus = 'inprogress';
    } else if (task.status === 'inprogress') {
      newStatus = 'done';
    } else {
      newStatus = 'todo';
    }
    
    onToggleStatus({ ...task, status: newStatus });
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(true);
  };

  const getStatusIcon = () => {
    if (task.status === 'done') {
      return (
        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (task.status === 'inprogress') {
      return (
        <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-neutral-600 shrink-0 hover:text-neutral-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
      </svg>
    );
  };

  const getPriorityColor = () => {
    if (task.priority === 'high') return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (task.priority === 'medium') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  };

  const getInitials = (name?: string) => {
    if (!name) return '--';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`bg-neutral-950/80 border rounded-xl p-4 hover:border-neutral-700 transition-all duration-200 group relative ${
      isSelected ? 'border-purple-500/80 bg-purple-500/5' : 'border-neutral-800/80'
    }`}>
      <div className="flex items-start gap-2.5 mb-2.5">
        {/* Selection Checkbox */}
        {(isSelectionMode || isSelected) && onSelect && (
          <button
            onClick={() => onSelect(task._id)}
            className="shrink-0 mt-0.5 cursor-pointer"
          >
            <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-colors ${
              isSelected 
                ? 'bg-white border-white text-black' 
                : 'border-neutral-700 hover:border-neutral-500'
            }`}>
              {isSelected && (
                <svg className="w-3 h-3 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        )}
        
        <button
          onClick={isSelectionMode ? () => onSelect?.(task._id) : handleCircleClick}
          onContextMenu={handleRightClick}
          className="cursor-pointer hover:scale-110 active:scale-95 transition-transform shrink-0 mt-0.5 p-0.5 -m-0.5"
          title={isSelectionMode ? 'Select task' : task.status === 'todo' ? 'Click to start' : task.status === 'inprogress' ? 'Click to complete' : 'Click to reset'}
        >
          {getStatusIcon()}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs md:text-sm font-semibold text-white tracking-tight leading-snug wrap-break-word">{task.title}</h3>
          {task.priority && (
            <span className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-md border ${getPriorityColor()}`}>
              {task.priority}
            </span>
          )}
        </div>
      </div>

      {/* Context Menu for Delete */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-10 left-4 z-50 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
            <button
              onClick={() => {
                onDelete(task._id);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-2 cursor-pointer font-mono"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Task
            </button>
          </div>
        </>
      )}

      {task.description && (
        <p className="text-xs text-neutral-400 mb-3 leading-relaxed wrap-break-word">{task.description}</p>
      )}

      {/* Time Tracking Info */}
      {(task.pomodoroSessions || task.estimatedMinutes || task.actualMinutes) && (
        <div className="flex items-center gap-3 mb-3 text-[11px] font-mono">
          {task.pomodoroSessions && task.pomodoroSessions > 0 && (
            <div className="flex items-center gap-1 text-rose-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{task.pomodoroSessions} 🍅</span>
            </div>
          )}
          {task.actualMinutes && task.actualMinutes > 0 && (
            <div className="flex items-center gap-1 text-blue-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{Math.round(task.actualMinutes)}m</span>
            </div>
          )}
          {task.estimatedMinutes && task.estimatedMinutes > 0 && (
            <div className="flex items-center gap-1 text-neutral-500">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>est. {task.estimatedMinutes}m</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2.5 border-t border-neutral-900">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] font-mono text-neutral-300">
            {getInitials(task.assignee)}
          </div>
          <span className="text-xs text-neutral-400">{task.assignee || 'Unassigned'}</span>
        </div>
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className="text-[11px] font-mono text-neutral-500">{formatDate(task.dueDate)}</span>
          )}
          <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onStartPomodoro?.(task)}
              className="p-1 hover:bg-neutral-900 rounded text-neutral-400 hover:text-blue-400 transition-colors cursor-pointer"
              title="Start Pomodoro Timer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={() => onEdit(task)}
              className="p-1 hover:bg-neutral-900 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(task._id)}
              className="p-1 hover:bg-neutral-900 rounded text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignTaskModal({
  task,
  friends,
  onClose,
}: {
  task: Task;
  friends: TeamMember[];
  onClose: () => void;
}) {
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedFriendId) {
      alert('Please select a friend to assign this task to');
      return;
    }

    setIsAssigning(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tasks/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: task._id,
          assignToUserId: selectedFriendId,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`✓ Task assigned to ${friends.find(f => f._id === selectedFriendId)?.name}!`);
        onClose();
      } else {
        alert(data.error || 'Failed to assign task');
      }
    } catch (error) {
      console.error('Failed to assign task:', error);
      alert('Failed to assign task');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white tracking-tight">Assign Task to Friend</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 cursor-pointer text-lg leading-none"
            disabled={isAssigning}
          >
            ✕
          </button>
        </div>

        <div className="mb-4 p-4 bg-black border border-neutral-800/80 rounded-xl">
          <h4 className="font-semibold text-white text-xs mb-1">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-neutral-500">
            {task.priority && (
              <span className={`px-2 py-0.5 rounded ${
                task.priority === 'high' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                task.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {task.priority}
              </span>
            )}
            {task.estimatedMinutes && (
              <span>⏱️ {task.estimatedMinutes} min</span>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
            Select Friend
          </label>
          {friends.length === 0 ? (
            <div className="text-xs text-neutral-500 text-center py-6 border border-dashed border-neutral-800 rounded-xl font-mono">
              No friends available. Add friends from the Friends menu.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {friends.map((friend) => (
                <label
                  key={friend._id}
                  className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                    selectedFriendId === friend._id
                      ? 'border-white bg-neutral-900'
                      : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="friend"
                    value={friend._id}
                    checked={selectedFriendId === friend._id}
                    onChange={(e) => setSelectedFriendId(e.target.value)}
                    className="w-4 h-4 text-white focus:ring-0"
                  />
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-black text-xs font-bold shrink-0">
                    {friend.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-xs truncate">{friend.name}</p>
                    <p className="text-[11px] font-mono text-neutral-400 truncate">{friend.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 py-2.5 px-4 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            disabled={isAssigning}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedFriendId || isAssigning}
            className="flex-1 bg-white hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed text-black py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            {isAssigning ? 'Assigning...' : 'Assign Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignmentModal({
  assignments,
  onClose,
  onRespond,
}: {
  assignments: any[];
  onClose: () => void;
  onRespond: (assignedTaskId: string, action: 'accept' | 'reject') => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white tracking-tight">Pending Task Assignments</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 cursor-pointer text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center text-neutral-500 font-mono text-xs py-10">
            No pending assignments
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment._id}
                className="bg-black border border-neutral-800/80 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-1 tracking-tight">
                      {assignment.title}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      From: <span className="text-white font-medium">{assignment.assignedBy.name}</span> <span className="font-mono text-[11px]">({assignment.assignedBy.email})</span>
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider border ${
                    assignment.priority === 'high' 
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : assignment.priority === 'medium'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {assignment.priority}
                  </span>
                </div>

                {assignment.description && (
                  <p className="text-neutral-300 text-xs mb-4 leading-relaxed">
                    {assignment.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-[11px] font-mono text-neutral-500 mb-4">
                  {assignment.estimatedMinutes && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Estimated: {assignment.estimatedMinutes} minutes</span>
                    </div>
                  )}
                  {assignment.dueDate && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => onRespond(assignment._id, 'accept')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    ✓ Accept
                  </button>
                  <button
                    onClick={() => onRespond(assignment._id, 'reject')}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
