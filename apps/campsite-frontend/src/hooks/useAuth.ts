'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { UserRole } from '@campsite/shared';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
  refreshTokens,
  requestPasswordReset,
  confirmPasswordReset,
  getGoogleLoginUrl,
  type AuthUser,
} from '@/lib/api/auth';
import {
  getAccessToken,
  clearTokens,
  isTokenExpired,
  hasValidTokens,
} from '@/lib/auth/token';

// Create a simplified user type that matches what components expect
interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
  };
}

// Create a simplified session type
interface Session {
  access_token: string;
  user: User;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  error: Error | null;
}

interface UseAuthReturn extends AuthState {
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
}

// Convert AuthUser to the simplified User type
function authUserToUser(authUser: AuthUser): User {
  return {
    id: authUser.id,
    email: authUser.email,
    user_metadata: {
      full_name: authUser.full_name || undefined,
      phone: authUser.phone || undefined,
    },
  };
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: 'user',
    loading: true,
    error: null,
  });

  // Track if we're currently refreshing to avoid multiple refresh calls
  const isRefreshing = useRef(false);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Check if we have valid tokens
        if (!hasValidTokens()) {
          // Try to refresh if we have a refresh token but expired access token
          const accessToken = getAccessToken();
          if (accessToken && isTokenExpired()) {
            const refreshed = await refreshTokens();
            if (!refreshed) {
              if (isMounted) {
                setState({
                  user: null,
                  session: null,
                  role: 'user',
                  loading: false,
                  error: null,
                });
              }
              return;
            }
          } else if (!accessToken) {
            if (isMounted) {
              setState({
                user: null,
                session: null,
                role: 'user',
                loading: false,
                error: null,
              });
            }
            return;
          }
        }

        // Get user data from API
        const authUser = await getMe();

        if (!isMounted) return;

        if (authUser) {
          const user = authUserToUser(authUser);
          const accessToken = getAccessToken();

          setState({
            user,
            session: accessToken ? { access_token: accessToken, user } : null,
            role: authUser.role,
            loading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            session: null,
            role: 'user',
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error as Error,
          }));
        }
      }
    };

    initializeAuth();

    // Set up token refresh interval (refresh 1 minute before expiry)
    const setupRefreshInterval = () => {
      // Clear existing interval
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }

      // Check every 30 seconds if token needs refresh
      refreshInterval.current = setInterval(async () => {
        if (isTokenExpired(60000) && !isRefreshing.current) {
          isRefreshing.current = true;
          try {
            await refreshTokens();
          } catch (error) {
            console.error('Token refresh failed:', error);
          } finally {
            isRefreshing.current = false;
          }
        }
      }, 30000);
    };

    setupRefreshInterval();

    return () => {
      isMounted = false;
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, phone?: string) => {
      try {
        const response = await apiRegister({
          email,
          password,
          full_name: fullName,
          phone: phone || undefined,
        });

        // If we got a session back (email confirmation disabled), update state
        if (response.session && response.user) {
          const user = authUserToUser(response.user);
          setState({
            user,
            session: { access_token: response.session.access_token, user },
            role: response.user.role,
            loading: false,
            error: null,
          });
        }

        return { error: null };
      } catch (error) {
        return { error: error as Error };
      }
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await apiLogin(email, password);

        const user = authUserToUser(response.user);
        setState({
          user,
          session: { access_token: response.session.access_token, user },
          role: response.user.role,
          loading: false,
          error: null,
        });

        return { error: null };
      } catch (error) {
        return { error: error as Error };
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      // Redirect to backend OAuth endpoint
      const redirectUrl = getGoogleLoginUrl(window.location.href);
      window.location.href = redirectUrl;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();

      setState({
        user: null,
        session: null,
        role: 'user',
        loading: false,
        error: null,
      });

      return { error: null };
    } catch (error) {
      // Even if logout fails, clear local state
      clearTokens();
      setState({
        user: null,
        session: null,
        role: 'user',
        loading: false,
        error: null,
      });
      return { error: error as Error };
    }
  }, []);

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        await requestPasswordReset(email);
        return { error: null };
      } catch (error) {
        return { error: error as Error };
      }
    },
    []
  );

  const updatePassword = useCallback(
    async (newPassword: string) => {
      try {
        await confirmPasswordReset(newPassword);
        return { error: null };
      } catch (error) {
        return { error: error as Error };
      }
    },
    []
  );

  const refreshSession = useCallback(async () => {
    const success = await refreshTokens();
    if (success) {
      const authUser = await getMe();
      if (authUser) {
        const user = authUserToUser(authUser);
        const accessToken = getAccessToken();
        setState({
          user,
          session: accessToken ? { access_token: accessToken, user } : null,
          role: authUser.role,
          loading: false,
          error: null,
        });
      }
    }
  }, []);

  return {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
  };
}
