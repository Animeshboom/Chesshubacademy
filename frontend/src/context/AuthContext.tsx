'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'manager' | 'coach' | 'student';
  phone?: string;
}

interface PerformanceProfile {
  id: string;
  blunders_avg: number;
  mistakes_avg: number;
  inaccuracies_avg: number;
  acpl: number;
  opening_perf_rating: number;
  middlegame_perf_rating: number;
  endgame_perf_rating: number;
  puzzle_accuracy: number;
  puzzle_rating: number;
  solve_speed_seconds: number;
  strongest_theme: string;
  weakest_theme: string;
  fork_weakness: number;
  pin_weakness: number;
  skewer_weakness: number;
  king_safety_issues: number;
  calculation_issues: number;
  endgame_issues: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_alerts: string[];
  recommendations: { type: string; category: string; message: string }[];
  updated_at: string;
}

interface Profile {
  id?: string;
  student_id?: string;
  assigned_coach_id?: string;
  assigned_coach_name?: string;
  assigned_coach?: { user: { first_name: string; last_name: string } };
  parent_name?: string;
  parent_email?: string;
  lichess_username?: string;
  lichess_rating?: number;
  lichess_blitz_rating?: number;
  lichess_rapid_rating?: number;
  lichess_classical_rating?: number;
  session_balance?: number;
  total_xp?: number;
  level?: number;
  coach_id?: string;
  bio?: string;
  zoom_personal_link?: string;
  hourly_rate?: string;
  has_zoom_configured?: boolean;
  daily_streak?: number;
  starting_rating?: number;
  target_rating?: number;
  strengths?: string[];
  weaknesses?: string[];
  coach_notes?: string;
  weekly_goals?: { text: string; completed: boolean }[];
  monthly_goals?: { text: string; completed: boolean }[];
  roadmap?: Record<string, { status: 'not_started' | 'in_progress' | 'completed'; topics: string[] }>;
  performance_profile?: PerformanceProfile;
  package_tracking?: any[];
  students?: any[];
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Load profile details from API
  const refreshProfile = async () => {
    try {
      const response = await api.get('/auth/me/');
      setUser(response.data.user);
      setProfile(response.data.profile);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');

      if (accessToken && savedUser) {
        setUser(JSON.parse(savedUser));
        setIsLoading(false);
        // Refresh stats from the server in the background
        await refreshProfile();
      } else {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login/', { email, password });
      const { access, refresh, user: loggedUser } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      
      setUser(loggedUser);
      setIsLoading(false);

      // Load profile info immediately
      await refreshProfile();

      // Redirect depending on user role
      router.push(`/dashboard/${loggedUser.role}`);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setProfile(null);
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
