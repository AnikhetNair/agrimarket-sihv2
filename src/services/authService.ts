import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { dataStore } from './dataStore';

export type AppRole = 'FARMER' | 'FPO' | 'BUYER';

export interface AuthUser {
  id: string;
  auth_user_id: string;
  email: string;
  name: string;
  role: AppRole;
  phone: string;
  location: string;
  district: string;
  state: string;
  organization_id?: string;
  organization_name?: string;
  preferred_language: 'en' | 'hi' | 'mr';
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expires_at: number;
}

// Canonical database users mapped to credentials
export const SEED_CREDENTIALS = [
  {
    email: 'farmer.demo@agrimarket.in',
    password: 'FarmerDemo123!',
    role: 'FARMER' as AppRole,
    user: {
      id: 'usr-farmer-1',
      auth_user_id: 'auth-usr-farmer-1',
      email: 'farmer.demo@agrimarket.in',
      name: 'Ramesh Patil',
      role: 'FARMER' as AppRole,
      phone: '+91 98220 33412',
      location: 'Dindori, Nashik',
      district: 'Nashik',
      state: 'Maharashtra',
      organization_id: 'org-fpo-1',
      organization_name: 'Sahyadri Farmers Producer Company',
      preferred_language: 'mr' as const,
    },
  },
  {
    email: 'fpo.demo@agrimarket.in',
    password: 'FpoDemo123!',
    role: 'FPO' as AppRole,
    user: {
      id: 'usr-fpo-1',
      auth_user_id: 'auth-usr-fpo-1',
      email: 'fpo.demo@agrimarket.in',
      name: 'Vikram Deshmukh',
      role: 'FPO' as AppRole,
      phone: '+91 98220 11223',
      location: 'Pimpalgaon Baswant, Nashik',
      district: 'Nashik',
      state: 'Maharashtra',
      organization_id: 'org-fpo-1',
      organization_name: 'Sahyadri Farmers Producer Company',
      preferred_language: 'mr' as const,
    },
  },
  {
    email: 'buyer.demo@agrimarket.in',
    password: 'BuyerDemo123!',
    role: 'BUYER' as AppRole,
    user: {
      id: 'usr-buyer-1',
      auth_user_id: 'auth-usr-buyer-1',
      email: 'buyer.demo@agrimarket.in',
      name: 'Arjun Mehta',
      role: 'BUYER' as AppRole,
      phone: '+91 98200 44551',
      location: 'Pune Central Distribution Hub',
      district: 'Pune',
      state: 'Maharashtra',
      organization_id: 'org-buyer-1',
      organization_name: 'FreshKart Foods India Ltd',
      preferred_language: 'en' as const,
    },
  },
];

const STORAGE_KEY = 'agri_market_auth_session';

class AuthService {
  private currentSession: AuthSession | null = null;
  private listeners: ((user: AuthUser | null) => void)[] = [];

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: AuthSession = JSON.parse(stored);
        if (parsed.expires_at > Date.now()) {
          this.currentSession = parsed;
          dataStore.setActiveUser(parsed.user.id);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  public getSession(): AuthSession | null {
    if (this.currentSession && this.currentSession.expires_at <= Date.now()) {
      this.currentSession = null;
      localStorage.removeItem(STORAGE_KEY);
    }
    return this.currentSession;
  }

  public getUser(): AuthUser | null {
    return this.getSession()?.user || null;
  }

  public isAuthenticated(): boolean {
    return this.getUser() !== null;
  }

  public async signIn(email: string, password: string):Promise<{ user: AuthUser; error?: string }> {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. If real Supabase is configured with active remote backend
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          // Resolve role from database profile
          const { data: profile } = await supabase
            .from('users')
            .select('*, organizations(*)')
            .eq('auth_user_id', data.user.id)
            .single();

          const resolvedRole: AppRole = (profile?.role as AppRole) || 'FARMER';
          const authUser: AuthUser = {
            id: profile?.id || data.user.id,
            auth_user_id: data.user.id,
            email: data.user.email || trimmedEmail,
            name: profile?.full_name || data.user.user_metadata?.full_name || 'Agri User',
            role: resolvedRole,
            phone: profile?.phone || '',
            location: profile?.location || 'Nashik, Maharashtra',
            district: profile?.district || 'Nashik',
            state: profile?.state || 'Maharashtra',
            organization_id: profile?.organization_id,
            organization_name: profile?.organizations?.name,
            preferred_language: (profile?.preferred_language as any) || 'en',
          };

          this.saveSession(authUser, data.session?.access_token || 'supabase-token');
          return { user: authUser };
        }
      } catch (err: any) {
        console.warn('Supabase remote auth attempt failed, checking seeded records:', err.message);
      }
    }

    // 2. Database seed authentication with role resolution
    const match = SEED_CREDENTIALS.find(
      (c) => c.email.toLowerCase() === trimmedEmail && c.password === password
    );

    if (!match) {
      // Friendly message indicating invalid credentials
      throw new Error('Invalid email or password. Please verify your credentials or select a demo account.');
    }

    const authUser = match.user;
    const dummyToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.saveSession(authUser, dummyToken);

    return { user: authUser };
  }

  private saveSession(user: AuthUser, token: string) {
    const session: AuthSession = {
      token,
      user,
      expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    this.currentSession = session;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    dataStore.setActiveUser(user.id);
    this.notifyListeners(user);
  }

  public async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Supabase signOut error:', err);
      }
    }
    this.currentSession = null;
    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners(null);
  }

  public updatePreferredLanguage(lang: 'en' | 'hi' | 'mr') {
    if (this.currentSession) {
      this.currentSession.user.preferred_language = lang;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentSession));
      localStorage.setItem('agri_preferred_language', lang);
      this.notifyListeners(this.currentSession.user);
    }
  }

  public onAuthStateChange(listener: (user: AuthUser | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(user: AuthUser | null) {
    this.listeners.forEach((l) => l(user));
  }
}

export const authService = new AuthService();
