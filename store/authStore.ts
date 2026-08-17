import { create } from 'zustand';
import { toAppError } from '@/lib/errors';
import { analytics } from '@/services/analytics';
import { DemoAuthService, getAuthService, type AuthUser } from '@/services/auth';
import { logger } from '@/services/logger';

interface AuthState {
  user: AuthUser | null;
  /** True until the persisted session has been checked at startup. */
  isInitializing: boolean;
  isSubmitting: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signUp: (input: { email: string; password: string; fullName: string }) => Promise<boolean>;
  signIn: (input: { email: string; password: string }) => Promise<boolean>;
  /** Demo-only shortcut from the welcome screen. */
  continueAsDemo: () => Promise<boolean>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isInitializing: true,
  isSubmitting: false,
  error: null,

  async initialize() {
    try {
      const user = await getAuthService().getCurrentUser();
      set({ user, isInitializing: false });
      if (user) analytics.identify(user.id);
    } catch (error) {
      logger.error('Auth initialization failed', error);
      set({ user: null, isInitializing: false });
    }
  },

  async signUp(input) {
    set({ isSubmitting: true, error: null });
    try {
      const user = await getAuthService().signUp(input);
      set({ user, isSubmitting: false });
      analytics.identify(user.id);
      analytics.track({ name: 'account_created', method: user.isDemo ? 'demo' : 'email' });
      return true;
    } catch (error) {
      const appError = toAppError(error, 'auth');
      logger.error('Sign up failed', appError.cause ?? appError);
      set({ isSubmitting: false, error: appError.message });
      return false;
    }
  },

  async signIn(input) {
    set({ isSubmitting: true, error: null });
    try {
      const user = await getAuthService().signIn(input);
      set({ user, isSubmitting: false });
      analytics.identify(user.id);
      analytics.track({ name: 'signed_in', method: user.isDemo ? 'demo' : 'email' });
      return true;
    } catch (error) {
      const appError = toAppError(error, 'auth');
      logger.error('Sign in failed', appError.cause ?? appError);
      set({ isSubmitting: false, error: appError.message });
      return false;
    }
  },

  async continueAsDemo() {
    const service = getAuthService();
    if (!(service instanceof DemoAuthService)) {
      return get().signIn({ email: 'demo@propertypilot.app', password: 'demo-password' });
    }

    set({ isSubmitting: true, error: null });
    try {
      const user = await service.signInAsDemo();
      set({ user, isSubmitting: false });
      analytics.identify(user.id);
      analytics.track({ name: 'signed_in', method: 'demo' });
      return true;
    } catch (error) {
      const appError = toAppError(error, 'auth');
      set({ isSubmitting: false, error: appError.message });
      return false;
    }
  },

  async signOut() {
    try {
      await getAuthService().signOut();
    } catch (error) {
      logger.error('Sign out failed', error);
    } finally {
      analytics.track({ name: 'signed_out' });
      analytics.reset();
      set({ user: null, error: null });
    }
  },

  async sendPasswordReset(email) {
    set({ isSubmitting: true, error: null });
    try {
      await getAuthService().sendPasswordReset(email);
      set({ isSubmitting: false });
      return true;
    } catch (error) {
      const appError = toAppError(error, 'auth');
      set({ isSubmitting: false, error: appError.message });
      return false;
    }
  },

  async deleteAccount() {
    set({ isSubmitting: true, error: null });
    try {
      await getAuthService().deleteAccount();
      analytics.reset();
      set({ user: null, isSubmitting: false });
      return true;
    } catch (error) {
      const appError = toAppError(error, 'auth');
      set({ isSubmitting: false, error: appError.message });
      return false;
    }
  },

  clearError() {
    set({ error: null });
  },
}));
