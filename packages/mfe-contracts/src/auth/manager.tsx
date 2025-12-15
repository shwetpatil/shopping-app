/**
 * Shared Authentication State Management
 * Manages auth across all microfrontends
 */

import { mfeEventBus } from '../events/bus';
import type { User } from '../types/user';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthManager {
  private state: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  };

  private tokenKey = 'mfe_auth_token';
  private userKey = 'mfe_user_data';

  initialize(): void {
    // Load from localStorage on init
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(this.tokenKey);
      const userData = localStorage.getItem(this.userKey);

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          this.setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('[Auth] Failed to parse user data:', error);
          this.clearAuth();
        }
      } else {
        this.state.isLoading = false;
      }
    }
  }

  login(user: User, token: string): void {
    this.setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    // Broadcast login event
    mfeEventBus.publish('auth:login', { user, token });
  }

  logout(): void {
    this.clearAuth();
    
    // Broadcast logout event
    mfeEventBus.publish('auth:logout', {});
  }

  updateUser(user: Partial<User>): void {
    if (!this.state.user) return;

    const updatedUser = { ...this.state.user, ...user };
    this.setState({
      ...this.state,
      user: updatedUser,
    });

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
    }
  }

  getToken(): string | null {
    return this.state.token;
  }

  getUser(): User | null {
    return this.state.user;
  }

  isAuthenticated(): boolean {
    return this.state.isAuthenticated;
  }

  getState(): AuthState {
    return { ...this.state };
  }

  private setState(newState: AuthState): void {
    this.state = newState;
  }

  private clearAuth(): void {
    this.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
  }
}

export const authManager = new AuthManager();

/**
 * React Hook for authentication
 */
import { useState, useEffect } from 'react';

export function useAuth(): AuthState & {
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
} {
  const [state, setState] = useState<AuthState>(authManager.getState());

  useEffect(() => {
    // Initialize auth on mount
    authManager.initialize();
    setState(authManager.getState());

    // Listen for auth events
    const handleAuthChange = () => {
      setState(authManager.getState());
    };

    const unsubscribeLogin = mfeEventBus.subscribe('auth:login', handleAuthChange);
    const unsubscribeLogout = mfeEventBus.subscribe('auth:logout', handleAuthChange);

    return () => {
      unsubscribeLogin();
      unsubscribeLogout();
    };
  }, []);

  return {
    ...state,
    login: authManager.login.bind(authManager),
    logout: authManager.logout.bind(authManager),
    updateUser: authManager.updateUser.bind(authManager),
  };
}

/**
 * Higher-Order Component for protected routes
 */
import React, { ComponentType } from 'react';

export function withAuth<P extends object>(
  Component: ComponentType<P>,
  redirectTo: string = '/login'
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        window.location.href = redirectTo;
      }
    }, [isAuthenticated, isLoading]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
