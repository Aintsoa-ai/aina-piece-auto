import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface Profile {
  id: string;
  full_name: string;
  role_id: string;
  boutique_id: string;
  created_at: string;
  last_login: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const profileRef = useRef<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const setProfile = (p: Profile | null) => {
    profileRef.current = p;
    setProfileState(p);
  };
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRole = async (userId: string, userEmail?: string) => {
    console.log('fetchProfileAndRole initiated for:', userId);
    
    // Create a slightly longer timeout promise
    const timeoutPromise = new Promise<any>((resolve) => 
      setTimeout(() => resolve({ isTimeout: true }), 5000)
    );

    try {
      // Query profiles and joined roles
      const queryPromise = supabase
        .from('profiles')
        .select('*, roles(name)')
        .eq('id', userId)
        .single();

      const result = await Promise.race([queryPromise, timeoutPromise]);

      if (result && !result.isTimeout && result.data) {
        console.log('Profile loaded successfully from DB');
        setProfile(result.data);
        setRole((result.data as any).roles?.name?.toLowerCase() || result.data.role_id?.toLowerCase() || 'caissier');
        return;
      }

      if (result && result.isTimeout) {
        console.warn('Profile fetch timed out after 5s. Activating fallback.');
        if (profileRef.current && profileRef.current.id === userId) {
            console.log('Keeping existing profile during timeout.');
            return;
        }
      } else {
        console.warn('Profile fetch returned no data. Activating fallback.', result?.error);
      }

      const isAdmin = userEmail === 'ainapieces2026@gmail.com';
      
      setProfile({
        id: userId,
        full_name: isAdmin ? 'Administrateur Aina' : 'Utilisateur',
        role_id: isAdmin ? 'administrateur' : 'caissier',
        boutique_id: '',
        created_at: new Date().toISOString(),
        last_login: null
      });
      setRole(isAdmin ? 'administrateur' : 'caissier');
    } catch (err) {
      console.error('Error fetching profile, using fallback:', err);
      const isAdmin = userEmail === 'ainapieces2026@gmail.com';
      setProfile({
        id: userId,
        full_name: isAdmin ? 'Administrateur Aina' : 'Utilisateur',
        role_id: isAdmin ? 'administrateur' : 'caissier',
        boutique_id: '',
        created_at: new Date().toISOString(),
        last_login: null
      });
      setRole(isAdmin ? 'administrateur' : 'caissier');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndRole(user.id, user.email);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        console.log('Initializing auth session...');
        // Set a strict 4-second timeout for session initialization
        const sessionTimeout = new Promise<any>((resolve) => 
          setTimeout(() => resolve({ isTimeout: true }), 4000)
        );

        const sessionQuery = supabase.auth.getSession();
        const result = await Promise.race([sessionQuery, sessionTimeout]);

        if (!isMounted) return;

        if (result && !result.isTimeout && result.data?.session) {
          const session = result.data.session;
          setUser(session.user);
          await fetchProfileAndRole(session.user.id, session.user.email);
        } else {
          if (result?.isTimeout) {
            console.warn('Auth session check timed out.');
          }
          setUser(null);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      console.log('Auth state change event:', _event);
      
      setUser(session?.user ?? null);
      if (session?.user) {
        // La vraie vérification anti-closure : a-t-on DÉJÀ un profil chargé ?
        const isFirstLoad = !profileRef.current;
        
        if (isFirstLoad) {
          setLoading(true);
        }
        
        try {
          await fetchProfileAndRole(session.user.id, session.user.email);
        } catch (err) {
          console.error('Auth change profile fetch error:', err);
        } finally {
          if (isMounted && isFirstLoad) setLoading(false);
        }
      } else {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    // Safety timeout: if still loading after 6 seconds, force stop
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Safety hook triggered - forcing loading to false');
        setLoading(false);
      }
    }, 6000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setUser(null);
    setProfile(null);
    setRole(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
