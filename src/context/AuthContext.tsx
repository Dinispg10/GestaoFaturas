import React, { createContext, useContext, useEffect, useState } from 'react';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[AuthContext] Init: setting up auth listener');
    let mounted = true;

    // Aggressive timeout: force loading to false after 3 seconds no matter what
    const forceTimeout = setTimeout(() => {
      if (mounted) {
        console.error('[AuthContext] TIMEOUT: Forcing loading=false after 3s');
        setLoading(false);
      }
    }, 3000);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log(`[AuthContext] onAuthStateChange: event=${event}, hasSession=${!!session}`);

        if (!mounted) return;

        try {
          clearTimeout(forceTimeout);

          if (session?.user && event !== 'SIGNED_OUT') {
            console.log(`[AuthContext] User logged in: ${session.user.email}`);
            
            // Try to get existing user row
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            console.log(`[AuthContext] Fetch user result: error=${userError?.message || 'none'}, data=${!!userData}`);

            if (!userData) {
              console.log(`[AuthContext] No user row, attempting insert...`);
              const name = session.user.user_metadata?.full_name || 'User';
              const { data: inserted, error: insertErr } = await supabase
                .from('users')
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  name,
                  role: 'staff',
                  active: true,
                })
                .select()
                .single();

              console.log(`[AuthContext] Insert result: error=${insertErr?.message || 'none'}, inserted=${!!inserted}`);

              if (inserted) {
                setUser({
                  id: inserted.id,
                  name: inserted.name,
                  email: inserted.email,
                  role: inserted.role,
                  active: inserted.active,
                });
              } else {
                setError('Erro ao provisionar conta');
              }
            } else {
              setUser({
                id: userData.id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                active: userData.active,
              });
            }
            setError(null);
          } else {
            console.log('[AuthContext] No session or signed out');
            setUser(null);
            setError(null);
          }
        } catch (err) {
          console.error('[AuthContext] Error:', err);
          setError('Erro ao carregar');
        } finally {
          if (mounted) {
            setLoading(false);
            console.log('[AuthContext] Set loading=false');
          }
        }
      }
    );

    return () => {
      console.log('[AuthContext] Cleanup');
      mounted = false;
      clearTimeout(forceTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log(`[AuthContext] signIn: ${email}`);
      setLoading(true);
      setError(null);

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log(`[AuthContext] signInWithPassword result: error=${authError?.message || 'none'}, hasSession=${!!data.session}`);

      if (authError) {
        const msg = authError.message || 'Email ou password incorretos';
        setError(msg);
        setLoading(false);
        throw new Error(msg);
      }

      if (!data.session?.user) {
        setError('Falha no login');
        setLoading(false);
        throw new Error('No session');
      }

      // Don't set loading to false here — the onAuthStateChange listener will do it
      console.log('[AuthContext] Waiting for onAuthStateChange to complete auth...');
    } catch (err) {
      console.error('[AuthContext] signIn error:', err);
      setLoading(false);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
