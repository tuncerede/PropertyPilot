import type { User } from '@supabase/supabase-js';
import { AppError, toAppError } from '@/lib/errors';
import { getSupabaseClient } from '@/lib/supabase/client';
import { logger } from '../logger';
import type { AuthService, AuthUser } from './types';

/** Supabase Auth implementation, used whenever credentials are configured. */
export class SupabaseAuthService implements AuthService {
  private client() {
    const client = getSupabaseClient();
    if (!client) {
      throw new AppError('auth', 'PropertyPilot is not connected to an account server.');
    }
    return client;
  }

  private toAuthUser(user: User | null): AuthUser | null {
    if (!user) return null;

    const fullName = user.user_metadata?.full_name;

    return {
      id: user.id,
      email: user.email ?? '',
      fullName: typeof fullName === 'string' ? fullName : null,
      isDemo: false,
    };
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data, error } = await this.client().auth.getSession();
      if (error) throw error;
      return this.toAuthUser(data.session?.user ?? null);
    } catch (error) {
      logger.error('Failed to read the Supabase session', error);
      return null;
    }
  }

  async signUp(input: { email: string; password: string; fullName: string }): Promise<AuthUser> {
    try {
      const { data, error } = await this.client().auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: { data: { full_name: input.fullName.trim() } },
      });
      if (error) throw error;

      const user = this.toAuthUser(data.user);
      if (!user) {
        // Email confirmation is on: there is no session yet.
        throw new AppError(
          'auth',
          'Check your email to confirm your account, then sign in.',
        );
      }
      return user;
    } catch (error) {
      throw toAppError(error, 'auth');
    }
  }

  async signIn(input: { email: string; password: string }): Promise<AuthUser> {
    try {
      const { data, error } = await this.client().auth.signInWithPassword({
        email: input.email.trim(),
        password: input.password,
      });
      if (error) throw error;

      const user = this.toAuthUser(data.user);
      if (!user) throw new AppError('auth', 'We could not sign you in. Please try again.');
      return user;
    } catch (error) {
      throw toAppError(error, 'auth');
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await this.client().auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw toAppError(error, 'auth');
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      const { error } = await this.client().auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
    } catch (error) {
      throw toAppError(error, 'auth');
    }
  }

  /**
   * Account deletion.
   *
   * Deleting an auth user requires the service-role key, which must never
   * live in this app. The production path is a Supabase Edge Function that
   * holds that key server-side; until it is deployed, the client removes the
   * user's own rows (permitted by RLS) and signs them out.
   */
  async deleteAccount(): Promise<void> {
    const client = this.client();

    try {
      const { data } = await client.auth.getUser();
      const userId = data.user?.id;
      if (!userId) throw new AppError('auth', 'You are not signed in.');

      await client.from('property_scenarios').delete().eq('user_id', userId);
      await client.from('properties').delete().eq('user_id', userId);
      await client.from('subscription_state').delete().eq('user_id', userId);
      await client.from('profiles').delete().eq('id', userId);

      await client.auth.signOut();
    } catch (error) {
      throw toAppError(error, 'auth');
    }
  }

  onAuthStateChange(listener: (user: AuthUser | null) => void): () => void {
    const client = getSupabaseClient();
    if (!client) return () => {};

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      listener(this.toAuthUser(session?.user ?? null));
    });

    return () => data.subscription.unsubscribe();
  }
}
