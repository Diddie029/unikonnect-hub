import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  university: string | null;
  course: string | null;
  year_of_study: number | null;
  is_suspended: boolean;
  is_online: boolean;
  is_verified: boolean;
  created_at: string;
}

interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  profile: Profile | null;
  profiles: Profile[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  isAIEnabled: boolean;
  toggleAI: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  suspendUser: (userId: string) => Promise<void>;
  unsuspendUser: (userId: string) => Promise<void>;
}

interface SignupData {
  email: string;
  password: string;
  username: string;
  name: string;
  university: string;
  course: string;
  yearOfStudy: number;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAIEnabled, setIsAIEnabled] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) setProfile(data as Profile);
    return data as Profile | null;
  }, []);

  const checkAdmin = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data);
  }, []);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setProfiles(data as Profile[]);
  }, []);

  // Set online status
  const setOnlineStatus = useCallback(async (userId: string, online: boolean) => {
    await supabase.from('profiles').update({ is_online: online }).eq('user_id', userId);
  }, []);

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Use setTimeout to avoid Supabase deadlock
        setTimeout(async () => {
          await fetchProfile(session.user.id);
          await checkAdmin(session.user.id);
          await fetchProfiles();
          await setOnlineStatus(session.user.id, true);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setProfiles([]);
      }
      setIsLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        checkAdmin(session.user.id);
        fetchProfiles();
        setOnlineStatus(session.user.id, true);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, checkAdmin, fetchProfiles, setOnlineStatus]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          username: data.username,
          name: data.name,
        },
      },
    });
    if (error) return { success: false, error: error.message };

    // Wait for the profile trigger, then update additional fields
    await new Promise(r => setTimeout(r, 1000));
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user) {
      await supabase.from('profiles').update({
        university: data.university,
        course: data.course,
        year_of_study: data.yearOfStudy,
      }).eq('user_id', sessionData.session.user.id);
    }

    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    if (user) {
      await setOnlineStatus(user.id, false);
    }
    await supabase.auth.signOut();
  }, [user, setOnlineStatus]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
      await fetchProfiles();
    }
  }, [user, fetchProfile, fetchProfiles]);

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    if (!user) return;
    await supabase.from('profiles').update(data).eq('user_id', user.id);
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const suspendUser = useCallback(async (userId: string) => {
    await supabase.from('profiles').update({ is_suspended: true }).eq('user_id', userId);
    // Log the action
    await supabase.from('audit_logs').insert({
      action: 'suspend_user',
      admin_id: user?.id,
      target_id: userId,
      target_type: 'user',
      details: { reason: 'Admin suspension' },
    });
    await fetchProfiles();
  }, [user, fetchProfiles]);

  const unsuspendUser = useCallback(async (userId: string) => {
    await supabase.from('profiles').update({ is_suspended: false }).eq('user_id', userId);
    await supabase.from('audit_logs').insert({
      action: 'unsuspend_user',
      admin_id: user?.id,
      target_id: userId,
      target_type: 'user',
      details: { reason: 'Admin reinstatement' },
    });
    await fetchProfiles();
  }, [user, fetchProfiles]);

  const toggleAI = useCallback(() => setIsAIEnabled(prev => !prev), []);

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      profiles,
      isAuthenticated: !!session,
      isAdmin,
      isLoading,
      isAIEnabled,
      toggleAI,
      login,
      signup,
      logout,
      refreshProfile,
      updateProfile,
      suspendUser,
      unsuspendUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
