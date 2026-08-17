import { env } from '@/lib/config/env';
import { DemoAuthService } from './demoAuthService';
import { SupabaseAuthService } from './supabaseAuthService';
import type { AuthService } from './types';

export type { AuthService, AuthUser } from './types';
export { DemoAuthService } from './demoAuthService';
export { SupabaseAuthService } from './supabaseAuthService';

let instance: AuthService | null = null;

/** Supabase Auth when configured; the local demo session otherwise. */
export function getAuthService(): AuthService {
  if (!instance) {
    instance = env.demoMode ? new DemoAuthService() : new SupabaseAuthService();
  }
  return instance;
}

export function isDemoAuth(service: AuthService): service is DemoAuthService {
  return service instanceof DemoAuthService;
}
