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
        <div className="text-neutral-500 font-mono text-sm tracking-wide">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#ededed] relative overflow-x-hidden selection:bg-neutral-800 selection:text-white">
      {/* Background ambient radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-neutral-800/10 via-neutral-900/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/70 backdrop-blur-md border-b border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-white tracking-tight text-base">TaskMate AI</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={handleGoToDashboard}
                  className="px-3.5 py-1.5 text-neutral-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 text-neutral-400 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  className="px-3.5 py-1.5 text-neutral-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={handleSignup}
                  className="px-4 py-1.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Welcome Section */}
        <div className="text-center mb-16 md:mb-24">
          {user && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-neutral-900/90 border border-neutral-800 rounded-full mb-8 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-neutral-400 text-xs font-mono">Welcome back,</span>
              <span className="text-white text-xs font-medium">{user.name}</span>
            </div>
          )}
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            Manage Your Tasks
            <br />
            <span className="text-neutral-500 font-bold">with Precision</span>
          </h1>
          
          <p className="text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Stay organized, track progress, and collaborate seamlessly with your team. Everything you need
            to manage projects efficiently, all in one place.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-10">
            {user ? (
              <>
                <button
                  onClick={handleGoToDashboard}
                  className="w-full sm:w-auto px-6 py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-neutral-200 transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer group"
                >
                  Open Dashboard
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={handleViewCompleted}
                  className="w-full sm:w-auto px-6 py-3 bg-neutral-950 text-neutral-300 rounded-lg text-sm font-medium border border-neutral-800 hover:border-neutral-700 hover:text-white transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View Completed Tasks
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  className="w-full sm:w-auto px-6 py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-neutral-200 transition-all duration-200 shadow-md cursor-pointer"
                >
                  Get Started
                </button>
                <button
                  onClick={handleSignup}
                  className="w-full sm:w-auto px-6 py-3 bg-neutral-950 text-neutral-300 rounded-lg text-sm font-medium border border-neutral-800 hover:border-neutral-700 hover:text-white transition-all duration-200 cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">Everything You Need</h2>
            <p className="text-neutral-400 text-sm md:text-base">Powerful features to help you stay productive</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Task Management */}
            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-6 hover:border-neutral-700 transition-all duration-200 group">
              <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center mb-4 group-hover:border-neutral-700 transition-colors">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Task Management</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">Organize and prioritize your tasks efficiently</p>
            </div>

            {/* Time Tracking */}
            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-6 hover:border-neutral-700 transition-all duration-200 group">
              <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center mb-4 group-hover:border-neutral-700 transition-colors">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Time Tracking</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">Monitor time spent on each task</p>
            </div>

            {/* Team Collaboration */}
            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-6 hover:border-neutral-700 transition-all duration-200 group">
              <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center mb-4 group-hover:border-neutral-700 transition-colors">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Team Collaboration</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">Work together seamlessly with your team</p>
            </div>

            {/* Analytics */}
            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-6 hover:border-neutral-700 transition-all duration-200 group">
              <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center mb-4 group-hover:border-neutral-700 transition-colors">
                <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Analytics</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">Track progress with detailed insights</p>
            </div>

            {/* AI Task Breakdown */}
            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-6 hover:border-neutral-700 transition-all duration-200 group">
              <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center mb-4 group-hover:border-neutral-700 transition-colors">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">AI Task Breakdown</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">Automatically break down complex tasks into actionable sub-tasks</p>
            </div>

            {/* Notifications */}
            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-6 hover:border-neutral-700 transition-all duration-200 group">
              <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-center mb-4 group-hover:border-neutral-700 transition-colors">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">Real-time Notifications</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">Stay updated with instant task and team alerts</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {user && (
          <div className="bg-gradient-to-b from-neutral-900/60 to-neutral-950 border border-neutral-800/80 rounded-2xl p-10 md:p-14 text-center relative overflow-hidden shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-3">Ready to Get Started?</h2>
            <p className="text-neutral-400 text-sm md:text-base mb-8 max-w-xl mx-auto">
              Jump into your dashboard and start managing your tasks effectively
            </p>
            <button
              onClick={handleGoToDashboard}
              className="px-7 py-3.5 bg-white text-black rounded-lg font-semibold hover:bg-neutral-200 transition-all duration-200 inline-flex items-center gap-2 text-sm cursor-pointer shadow-md"
            >
              Launch Dashboard
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-neutral-500 text-xs md:text-sm font-mono">
              © {new Date().getFullYear()} TaskMate AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs md:text-sm text-neutral-400">
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
