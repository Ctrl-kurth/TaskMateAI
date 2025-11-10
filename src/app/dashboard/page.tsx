'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inprogress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
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
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

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
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
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

      if (!response.ok) {
        throw new Error('Failed to generate sub-tasks');
      }

      const { subTasks } = await response.json();
      
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
      alert(`✅ Successfully created ${subTasks.length} sub-tasks!`);
      
    } catch (error) {
      console.error('AI Breakdown error:', error);
      alert('❌ Failed to generate task breakdown. Please try again.');
      throw error; // Re-throw to let modal handle it
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 md:px-8 py-4 md:py-5">
        <div className="flex flex-col md:flex-row items-start md:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Back to Welcome Button */}
            <button
              onClick={() => router.push('/welcome')}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors group"
              title="Back to Welcome"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold">TaskMate AI</h1>
              <p className="text-xs md:text-sm text-gray-400 mt-1">Manage your team's tasks and projects</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex items-center gap-2 bg-gray-800 text-white p-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/50 md:bg-transparent" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="fixed md:absolute top-0 md:top-auto right-0 md:right-0 md:mt-2 w-full md:w-96 h-full md:h-auto md:max-h-128 bg-[#0a0a0a] border-0 md:border border-gray-800 md:rounded-lg shadow-lg z-50 overflow-y-auto">
                    <div className="sticky top-0 bg-[#0a0a0a] border-b border-gray-800 p-4 flex items-center justify-between">
                      <h3 className="font-medium text-base md:text-lg">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="md:hidden text-gray-400 hover:text-white p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="p-12 md:p-8 text-center text-gray-500 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-800">
                        {notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`p-4 md:p-4 hover:bg-black transition-colors ${
                              !notif.read ? 'bg-blue-500/5' : ''
                            }`}
                          >
                            <p className="text-sm md:text-sm leading-relaxed">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
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
                                  className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs md:text-sm py-2.5 md:py-2 px-3 rounded-md transition-colors font-medium"
                                >
                                  ✓ Accept
                                </button>
                                <button
                                  onClick={() => handleInvitationResponse(notif.teamMemberId, 'decline')}
                                  className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs md:text-sm py-2.5 md:py-2 px-3 rounded-md transition-colors font-medium"
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
                </>
              )}
            </div>

            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 md:gap-2 bg-white text-black px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              <span>+</span>
              <span className="hidden sm:inline">New Task</span>
              <span className="sm:hidden">Task</span>
            </button>
            <button 
              onClick={() => setShowAIBreakdown(true)}
              className="flex items-center gap-1 md:gap-2 bg-purple-600 text-white px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium hover:bg-purple-700 transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="hidden sm:inline">AI Breakdown</span>
              <span className="sm:hidden">AI</span>
            </button>
            <button 
              onClick={() => setShowTeamModal(true)}
              className="flex items-center gap-1 md:gap-2 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Friends ({allTeamMembers.length})</span>
              <span className="sm:hidden">{allTeamMembers.length}</span>
            </button>
            
            {/* User Info */}
            {currentUser && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-md">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                  {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white">{currentUser.name}</span>
                  <span className="text-xs text-gray-400">{currentUser.email}</span>
                </div>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 md:gap-2 bg-gray-800 text-white px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8 py-4 md:py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Total Tasks</p>
                <p className="text-xl md:text-2xl font-semibold mt-2">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">+2 from last week</p>
              </div>
              <div className="bg-purple-500/10 p-2 rounded-md">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">In Progress</p>
                <p className="text-xl md:text-2xl font-semibold mt-2">{stats.inProgress}</p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">{stats.inProgress} active now</p>
              </div>
              <div className="bg-blue-500/10 p-2 rounded-md">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">Completed</p>
                <p className="text-xl md:text-2xl font-semibold mt-2">{stats.completed}</p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">25% completion rate</p>
              </div>
              <div className="bg-green-500/10 p-2 rounded-md">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">To Do</p>
                <p className="text-xl md:text-2xl font-semibold mt-2">{stats.todo}</p>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">3 due this week</p>
              </div>
              <div className="bg-pink-500/10 p-2 rounded-md">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 md:mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-gray-800 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-gray-700"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 md:mb-8 overflow-x-auto pb-2">
          {[
            { key: 'all' as const, label: `All Tasks (${filteredTasks.length})` },
            { key: 'todo' as const, label: `To Do (${todoTasks.length})` },
            { key: 'inprogress' as const, label: `In Progress (${inProgressTasks.length})` },
            { key: 'done' as const, label: `Completed (${completedTasks.length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === key
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#111]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Task Columns */}
        {activeTab === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div>
              <h2 className="text-sm font-medium text-gray-300 mb-3 md:mb-4">To Do</h2>
              {todoTasks.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-10 border border-dashed border-gray-800 rounded-lg">
                  No tasks
                </p>
              ) : (
                <div className="space-y-4">
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
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-300 mb-3 md:mb-4">In Progress</h2>
              {inProgressTasks.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-10 border border-dashed border-gray-800 rounded-lg">
                  No tasks
                </p>
              ) : (
                <div className="space-y-4">
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
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-300 mb-3 md:mb-4">Completed</h2>
              {completedTasks.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-10 border border-dashed border-gray-800 rounded-lg">
                  No tasks
                </p>
              ) : (
                <div className="space-y-4">
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
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Buttons for Multi-Select */}
      {selectedTasks.size > 0 && (
        <div className="fixed bottom-4 md:bottom-8 right-4 md:right-8 flex gap-2 md:gap-3 z-50">
          <div className="bg-purple-600 text-white px-3 md:px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <span className="text-sm md:text-base font-medium">{selectedTasks.size} selected</span>
          </div>
          <button
            onClick={handleCancelSelection}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 md:p-3 rounded-full shadow-lg transition-colors"
            title="Cancel selection"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={handleBulkDelete}
            className="bg-red-600 hover:bg-red-700 text-white p-2 md:p-3 rounded-full shadow-lg transition-colors"
            title="Delete selected tasks"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-[#0a0a0a] border-t md:border border-gray-800 rounded-t-2xl md:rounded-lg w-full max-w-2xl p-5 md:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Friends
            </h2>
            <p className="text-xs md:text-sm text-gray-400 mt-1">Add friends to assign tasks</p>
          </div>
          <div className="flex items-center gap-2">
            {members.length > 0 && (
              <button
                onClick={handleCleanupDuplicates}
                className="text-xs text-gray-400 hover:text-yellow-400 active:text-yellow-500 transition-colors px-2 py-1 border border-gray-700 rounded hover:border-yellow-500"
                title="Remove duplicate friends"
              >
                🧹 Cleanup
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white active:text-gray-300 transition-colors text-2xl md:text-xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Add Friend Form */}
        <form onSubmit={handleAddMember} className="mb-4 md:mb-6 p-3 md:p-4 bg-black border border-gray-800 rounded-lg">
          <h3 className="text-sm font-medium mb-3">Add New Friend</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="bg-[#0a0a0a] border border-gray-800 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="bg-[#0a0a0a] border border-gray-800 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="flex-1 bg-[#0a0a0a] border border-gray-800 rounded-md px-3 py-2.5 md:py-2 text-white text-base md:text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="friend">Friend</option>
              <option value="close friend">Close Friend</option>
              <option value="best friend">Best Friend</option>
            </select>
            <button
              type="submit"
              disabled={isAdding}
              className="px-4 py-3 md:py-2 bg-blue-600 text-white rounded-md text-base md:text-sm font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {isAdding ? 'Adding...' : 'Add Friend'}
            </button>
          </div>
        </form>

        {/* Friends List */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 mb-3">
            {members.length} {members.length === 1 ? 'Friend' : 'Friends'}
          </h3>
          {members.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8 border border-dashed border-gray-800 rounded-lg">
              No friends yet. Add your first friend above.
            </p>
          ) : (
            members.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-3 md:p-3 bg-black border border-gray-800 rounded-lg hover:border-gray-700 active:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 md:w-10 md:h-10 shrink-0 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                    {getInitials(member.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-gray-400 truncate">{member.email}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {member.role}
                      </span>
                      {(member as any).status && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          (member as any).status === 'accepted' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          (member as any).status === 'declined' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
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
                  className="p-2.5 md:p-2 hover:bg-gray-800 active:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors shrink-0 ml-2"
                  title="Remove friend"
                >
                  <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-[#0a0a0a] border-t md:border border-gray-800 rounded-t-2xl md:rounded-lg w-full max-w-2xl p-5 md:p-6 max-h-[90vh] md:max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Task Breakdown
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white active:text-gray-300 transition-colors text-2xl md:text-xl leading-none"
          >
            ✕
          </button>
        </div>
        
        <p className="text-sm text-gray-400 mb-4">
          Describe a large or complex task, and AI will break it down into actionable sub-tasks.
        </p>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Example: Plan a marketing campaign, prepare for an exam, organize a team event, build a new feature..."
          className="w-full h-40 md:h-40 bg-black border border-gray-800 rounded-lg p-3 md:p-3 text-white resize-none focus:outline-none focus:border-purple-500 placeholder:text-gray-600 text-base"
        />

        <div className="flex flex-col-reverse md:flex-row justify-end gap-3 md:gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-3 md:py-2 border border-gray-800 rounded-lg hover:bg-[#1a1a1a] active:bg-gray-800 transition-colors font-medium md:hidden"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !value.trim()}
            className="px-4 py-3 md:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors font-medium"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, description, status, priority, assignee, dueDate });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-[#0a0a0a] border-t md:border border-gray-800 rounded-t-2xl md:rounded-lg max-w-md w-full p-5 md:p-6 max-h-[90vh] md:max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg md:text-xl font-semibold">{task ? 'Edit Task' : 'New Task'}</h2>
          <button
            onClick={onClose}
            type="button"
            className="md:hidden text-gray-400 hover:text-white p-2 -mr-2"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:border-gray-600"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-black border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:border-gray-600"
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full bg-black border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:border-gray-600"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Assignee</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:border-gray-600"
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:border-gray-600"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-white text-black py-3 md:py-2 rounded-md font-medium hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              {task ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 text-white py-3 md:py-2 rounded-md font-medium hover:bg-gray-700 active:bg-gray-600 transition-colors md:hidden"
            >
              Cancel
            </button>
          </div>
        </form>
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
  isSelectionMode 
}: { 
  task: Task; 
  onEdit: (task: Task) => void; 
  onDelete: (id: string) => void; 
  onToggleStatus: (task: Task) => void;
  isSelected?: boolean;
  onSelect?: (taskId: string) => void;
  isSelectionMode?: boolean;
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
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (task.status === 'inprogress') {
      return (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={2} />
      </svg>
    );
  };

  const getPriorityColor = () => {
    if (task.priority === 'high') return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (task.priority === 'medium') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  };

  const getInitials = (name?: string) => {
    if (!name) return '--';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`bg-[#0a0a0a] border rounded-lg p-3 md:p-4 hover:border-gray-700 transition-colors group relative ${
      isSelected ? 'border-purple-500 bg-purple-500/5' : 'border-gray-800'
    }`}>
      <div className="flex items-start gap-2 md:gap-3 mb-3">
        {/* Selection Checkbox */}
        {(isSelectionMode || isSelected) && onSelect && (
          <button
            onClick={() => onSelect(task._id)}
            className="shrink-0 mt-0.5"
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isSelected 
                ? 'bg-purple-600 border-purple-600' 
                : 'border-gray-600 hover:border-purple-500'
            }`}>
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        )}
        
        <button
          onClick={isSelectionMode ? () => onSelect?.(task._id) : handleCircleClick}
          onContextMenu={handleRightClick}
          className="cursor-pointer hover:scale-110 active:scale-95 transition-transform shrink-0 p-1 -m-1"
          title={isSelectionMode ? 'Select task' : task.status === 'todo' ? 'Click to start' : task.status === 'inprogress' ? 'Click to complete' : 'Click to reset'}
        >
          {getStatusIcon()}
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs md:text-sm font-medium wrap-break-word">{task.title}</h3>
          {task.priority && (
            <span className={`inline-block mt-1 md:mt-2 px-1.5 md:px-2 py-0.5 text-xs rounded border ${getPriorityColor()}`}>
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
          <div className="absolute top-12 left-4 z-50 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => {
                onDelete(task._id);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Task
            </button>
          </div>
        </>
      )}

      {task.description && (
        <p className="text-xs md:text-sm text-gray-400 mb-3 md:mb-4 wrap-break-word">{task.description}</p>
      )}

      <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs">
            {getInitials(task.assignee)}
          </div>
          <span className="text-xs text-gray-400">{task.assignee || 'Unassigned'}</span>
        </div>
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className="text-xs text-gray-500">{formatDate(task.dueDate)}</span>
          )}
          <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 md:p-1 hover:bg-gray-800 active:bg-gray-700 rounded text-gray-400 hover:text-white"
              title="Edit"
            >
              <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(task._id)}
              className="p-1.5 md:p-1 hover:bg-gray-800 active:bg-gray-700 rounded text-gray-400 hover:text-red-400"
              title="Delete"
            >
              <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
