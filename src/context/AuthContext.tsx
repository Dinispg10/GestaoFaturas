import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapUser = (userData: {
  id: string;
  name: string;
  email: string;
  role: User['role'];
  active: boolean;
}): User => ({
  id: userData.id,
  name: userData.name,
  email: userData.email,
  role: userData.role,
  active: userData.active,
});


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncUserProfile = async (authUser: SupabaseUser | null) => {
    if (!authUser) {
      setUser(null);
      setError(null);
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (userError) {
        throw userError;
      }

      if (!userData) {
        const name = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';

        const { data: inserted, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            name,
            role: 'staff',
            active: true,
          })
          .select('*')
          .single();

        if (insertError || !inserted) {
          throw insertError || new Error('Falha ao provisionar conta');
        }

        setUser(mapUser(inserted));
      } else {
        setUser(mapUser(userData));
      }

      setError(null);
    } catch (err) {
      console.error('[AuthContext] Erro ao sincronizar perfil:', err);
      setUser(null);
      setError('Erro ao carregar utilizador');
    }
  };

  useEffect(() => {
    let mounted = true;

   const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (mounted) {
          await syncUserProfile(session?.user ?? null);
        }
      } catch (err) {
        console.error('[AuthContext] Erro ao inicializar sessão:', err);
        if (mounted) {
          setUser(null);
          setError('Erro ao inicializar sessão');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
     };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (!mounted) return;

      setLoading(true);
      // Evita deadlocks: não fazer await direto dentro do callback de auth
      void (async () => {
        await syncUserProfile(session?.user ?? null);
        if (mounted) {
          setLoading(false);
        }
      })();
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
     if (authError) {
      const normalizedMessage = authError.message.toLowerCase();
      const invalidCredentials =
        normalizedMessage.includes('invalid login credentials') ||
        normalizedMessage.includes('invalid credentials');

      if (invalidCredentials) {
        throw new Error('Credenciais inválidas');
      }

  
    throw new Error(authError.message || 'Erro ao autenticar utilizador');
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setUser(null);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao fazer logout';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signOut,
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
