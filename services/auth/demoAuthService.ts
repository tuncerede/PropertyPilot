import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_USER } from '@/constants/demo';
import { AppError } from '@/lib/errors';
import { logger } from '../logger';
import type { AuthService, AuthUser } from './types';

/**
 * Local demo authentication.
 *
 * Accepts any email and a password of at least six characters, and persists
 * the resulting session on the device so that signing out and back in — the
 * MVP success criterion — behaves exactly as it does against Supabase.
 * No credentials are transmitted anywhere and no password is stored.
 */

const SESSION_KEY = 'propertypilot.demo.session';

export class DemoAuthService implements AuthService {
  private listeners = new Set<(user: AuthUser | null) => void>();

  private current: AuthUser | null = null;

  private notify() {
    this.listeners.forEach((listener) => listener(this.current));
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.current) return this.current;

    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      this.current = JSON.parse(raw) as AuthUser;
      return this.current;
    } catch (error) {
      logger.error('Failed to restore the demo session', error);
      return null;
    }
  }

  private async persist(user: AuthUser): Promise<AuthUser> {
    this.current = user;
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
    this.notify();
    return user;
  }

  async signUp(input: { email: string; password: string; fullName: string }): Promise<AuthUser> {
    if (input.password.length < 6) {
      throw new AppError('validation', 'Choose a password with at least 6 characters.');
    }

    return this.persist({
      id: DEMO_USER.id,
      email: input.email.trim().toLowerCase(),
      fullName: input.fullName.trim() || DEMO_USER.fullName,
      isDemo: true,
    });
  }

  async signIn(input: { email: string; password: string }): Promise<AuthUser> {
    if (input.password.length < 6) {
      throw new AppError('auth', 'That password is too short. Demo mode needs 6 characters.');
    }

    const existing = await this.getCurrentUser();

    return this.persist({
      id: DEMO_USER.id,
      email: input.email.trim().toLowerCase(),
      fullName: existing?.fullName ?? DEMO_USER.fullName,
      isDemo: true,
    });
  }

  /** One-tap entry used by the welcome screen's "Explore the demo". */
  async signInAsDemo(): Promise<AuthUser> {
    return this.persist({
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      fullName: DEMO_USER.fullName,
      isDemo: true,
    });
  }

  async signOut(): Promise<void> {
    this.current = null;
    await AsyncStorage.removeItem(SESSION_KEY);
    this.notify();
  }

  async sendPasswordReset(email: string): Promise<void> {
    logger.debug('Demo password reset requested', { email });
  }

  async deleteAccount(): Promise<void> {
    await this.signOut();
  }

  onAuthStateChange(listener: (user: AuthUser | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
