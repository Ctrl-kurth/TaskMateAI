'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    inProgress: 0,
    completed: 0,
    teamMembers: 0,
    tasksThisWeek: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [router]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch tasks
      const tasksRes = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tasksData = await tasksRes.json();

      // Fetch team members
      const teamRes = await fetch('/api/team', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teamData = await teamRes.json();

      const tasks = tasksData.tasks || [];
      const inProgress = tasks.filter((t: any) => t.status === 'in-progress').length;
      const completed = tasks.filter((t: any) => t.status === 'completed').length;
      const total = tasks.length;

      // Calculate tasks from this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const tasksThisWeek = tasks.filter((t: any) => 
        new Date(t.createdAt) >= oneWeekAgo
      ).length;

      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      setStats({
        totalTasks: total,
        inProgress,
        completed,
        teamMembers: teamData.friends?.length || 0,
        tasksThisWeek,
        completionRate,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleViewCompleted = () => {
    router.push('/dashboard?filter=completed');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignup = () => {
    router.push('/register');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <span className="font-semibold text-lg">TaskMate AI</span>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={handleGoToDashboard}
                  className="px-4 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={handleSignup}
                  className="px-4 py-2 bg-white text-black rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          {user && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-full mb-6">
              <span className="text-gray-400 text-sm">Welcome back, </span>
              <span className="text-white text-sm font-medium">{user.name}</span>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Manage Your Tasks
            <br />
            <span className="text-gray-400">with Precision</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Stay organized, track progress, and collaborate seamlessly with your team. Everything you need
            to manage projects efficiently, all in one place.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 mt-8">
            {user ? (
              <>
                <button
                  onClick={handleGoToDashboard}
                  className="px-6 py-3 bg-white text-black rounded-md font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  Open Dashboard
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={handleViewCompleted}
                  className="px-6 py-3 bg-transparent text-white rounded-md font-medium border border-gray-700 hover:border-gray-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View Completed Tasks
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  className="px-6 py-3 bg-white text-black rounded-md font-medium hover:bg-gray-100 transition-colors"
                >
                  Get Started
                </button>
                <button
                  onClick={handleSignup}
                  className="px-6 py-3 bg-transparent text-white rounded-md font-medium border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {user && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold mb-1">{stats.totalTasks}</div>
              <div className="text-gray-400 text-sm mb-2">Total Tasks</div>
              <div className="text-green-500 text-xs">+{stats.tasksThisWeek} this week</div>
            </div>

            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold mb-1">{stats.inProgress}</div>
              <div className="text-gray-400 text-sm mb-2">In Progress</div>
              <div className="text-blue-500 text-xs">Active now</div>
            </div>

            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold mb-1">{stats.completed}</div>
              <div className="text-gray-400 text-sm mb-2">Completed</div>
              <div className="text-gray-500 text-xs">{stats.completionRate}% rate</div>
            </div>

            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold mb-1">{stats.teamMembers}</div>
              <div className="text-gray-400 text-sm mb-2">Team Members</div>
              <div className="text-purple-500 text-xs">Active</div>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Everything You Need</h2>
          <p className="text-gray-400 text-center mb-12">Powerful features to help you stay productive</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Task Management */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Task Management</h3>
              <p className="text-gray-400 text-sm">Organize and prioritize your tasks efficiently</p>
            </div>

            {/* Time Tracking */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Time Tracking</h3>
              <p className="text-gray-400 text-sm">Monitor time spent on each task</p>
            </div>

            {/* Team Collaboration */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Team Collaboration</h3>
              <p className="text-gray-400 text-sm">Work together seamlessly with your team</p>
            </div>

            {/* Analytics */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Analytics</h3>
              <p className="text-gray-400 text-sm">Track progress with detailed insights</p>
            </div>

            {/* AI Task Breakdown */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Task Breakdown</h3>
              <p className="text-gray-400 text-sm">Automatically break down complex tasks into actionable sub-tasks</p>
            </div>

            {/* Notifications */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Notifications</h3>
              <p className="text-gray-400 text-sm">Stay updated with instant task and team alerts</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {user && (
          <div className="bg-linear-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Jump into your dashboard and start managing your tasks effectively
            </p>
            <button
              onClick={handleGoToDashboard}
              className="px-8 py-4 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-2 text-lg"
            >
              Launch Dashboard
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} TaskMate AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
