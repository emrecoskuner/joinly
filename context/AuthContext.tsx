import type { Session, User } from '@supabase/supabase-js';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';

type AuthActionResult = {
  error: Error | null;
  session: Session | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const clearInvalidSession = async () => {
      try {
        const { error } = await supabase.auth.signOut({ scope: 'local' });

        if (error) {
          console.log('auth.clearInvalidSession error', error);
        }
      } catch (error) {
        console.log('auth.clearInvalidSession unexpected error', error);
      }
    };

    const applySignedOutState = () => {
      if (!isActive) {
        return;
      }

      setSession(null);
      setUser(null);
      setLoading(false);
    };

    const validateAndApplySession = async (nextSession: Session | null) => {
      if (!nextSession) {
        applySignedOutState();
        return;
      }

      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.log('auth.getUser validation error', error);
          await clearInvalidSession();
          applySignedOutState();
          return;
        }

        const validatedUser = data.user;

        if (!validatedUser || validatedUser.id !== nextSession.user.id) {
          console.log('auth.validateAndApplySession invalid user', Boolean(validatedUser));
          await clearInvalidSession();
          applySignedOutState();
          return;
        }

        if (!isActive) {
          return;
        }

        setSession(nextSession);
        setUser(validatedUser);
        setLoading(false);
      } catch (error) {
        console.log('auth.validateAndApplySession unexpected error', error);
        await clearInvalidSession();
        applySignedOutState();
      }
    };

    const restoreSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.log('auth.getSession error', error);
          applySignedOutState();
          return;
        }

        await validateAndApplySession(data.session ?? null);
      } catch (error) {
        console.log('auth.restoreSession unexpected error', error);
        applySignedOutState();
      }
    };

    void restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log('auth.onAuthStateChange', event, Boolean(nextSession));

      setLoading(true);
      void validateAndApplySession(nextSession);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      signIn: async (email, password) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.log('auth.signIn error', error);
          }

          return {
            error,
            session: data.session ?? null,
          };
        } catch (error) {
          console.log('auth.signIn unexpected error', error);
          return {
            error: toError(error),
            session: null,
          };
        }
      },
      signUp: async (email, password, fullName) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          });

          if (error) {
            console.log('auth.signUp error', error);
          }

          return {
            error,
            session: data.session ?? null,
          };
        } catch (error) {
          console.log('auth.signUp unexpected error', error);
          return {
            error: toError(error),
            session: null,
          };
        }
      },
      signOut: async () => {
        try {
          const { error } = await supabase.auth.signOut();

          if (error) {
            console.log('auth.signOut error', error);
          }

          return {
            error,
            session: null,
          };
        } catch (error) {
          console.log('auth.signOut unexpected error', error);
          return {
            error: toError(error),
            session: null,
          };
        }
      },
    }),
    [loading, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contextValue = useContext(AuthContext);

  if (!contextValue) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return contextValue;
}

function toError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }

  return new Error('Unknown authentication error');
}
