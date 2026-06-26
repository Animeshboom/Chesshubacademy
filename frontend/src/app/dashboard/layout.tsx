'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, UserCheck, ShieldCheck, BookOpen,
  LogOut, Award, Flame, Users, Calendar, Gamepad2,
  ClipboardList, TrendingUp, Settings, ChevronRight,
  GraduationCap, BarChart3, Image
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold animate-bounce mb-4">♞</div>
        <span className="text-sm text-muted animate-pulse">Loading ChessHub Academy...</span>
      </div>
    );
  }

  const isClassroom = pathname.includes('/classroom/');
  if (isClassroom) return <>{children}</>;

  const navByRole: Record<string, { label: string; icon: any; path: string }[]> = {
    manager: [
      { label: 'Overview', icon: LayoutDashboard, path: '/dashboard/manager' },
      { label: 'Demo Leads', icon: TrendingUp, path: '/dashboard/manager/leads' },
      { label: 'Sessions', icon: Calendar, path: '/dashboard/manager/sessions' },
      { label: 'Coaches', icon: UserCheck, path: '/dashboard/manager/coaches' },
      { label: 'Students', icon: ShieldCheck, path: '/dashboard/manager/students' },
      { label: 'Gallery', icon: Image, path: '/dashboard/manager/gallery' },
    ],
    coach: [
      { label: "Today's Classes", icon: Calendar, path: '/dashboard/coach' },
      { label: 'My Students', icon: Users, path: '/dashboard/coach/students' },
      { label: 'Homework Queue', icon: ClipboardList, path: '/dashboard/coach/homework' },
    ],
    student: [
      { label: 'My Portal', icon: LayoutDashboard, path: '/dashboard/student' },
      { label: 'My Classes', icon: Calendar, path: '/dashboard/student/classes' },
      { label: 'Puzzles Arena', icon: Gamepad2, path: '/dashboard/student/puzzles' },
      { label: 'My Progress', icon: BarChart3, path: '/dashboard/student/progress' },
    ],
    parent: [
      { label: 'Parent Portal', icon: LayoutDashboard, path: '/dashboard/parent' },
    ],
  };

  const navItems = navByRole[user.role] || [];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground font-sans">
      <aside className="w-full md:w-60 glass border-r border-border flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border/80">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-lg font-bold">♞</div>
            <div>
              <span className="font-extrabold text-xs tracking-tight text-white block">ChessHub</span>
              <span className="text-[10px] text-muted font-medium">Academy Portal</span>
            </div>
          </div>
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== `/dashboard/${user.role}` && pathname.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted hover:text-foreground hover:bg-border/30'
                  }`}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-border/60 space-y-3">
          {user.role === 'student' && (profile?.daily_streak ?? 0) > 0 && (
            <div className="px-3 py-2 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-between text-accent">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-accent" /> Streak
              </span>
              <span className="text-sm font-extrabold">{profile?.daily_streak}d</span>
            </div>
          )}
          {user.role === 'student' && profile?.total_xp !== undefined && (
            <div className="px-3 py-2 bg-secondary/10 border border-secondary/20 rounded-xl flex items-center justify-between text-secondary">
              <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Level {profile?.level}
              </span>
              <span className="text-xs font-extrabold">{profile?.total_xp} XP</span>
            </div>
          )}
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-xs font-bold text-foreground">{user.first_name} {user.last_name}</p>
              <p className="text-[10px] text-muted capitalize">{user.role}</p>
            </div>
            <button onClick={logout}
              className="p-2 border border-border/60 bg-background/40 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 rounded-lg transition text-muted"
              title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="h-14 glass border-b border-border/80 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-white capitalize">{user.role} Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            {user.role === 'student' && profile?.session_balance !== undefined && (
              <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-xl font-semibold">
                {profile.session_balance} Classes Left
              </span>
            )}
            <span className="text-[11px] text-muted bg-background/50 border border-border/60 px-3 py-1 rounded-xl">
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </header>
        <div className="flex-1 p-5 md:p-7 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
