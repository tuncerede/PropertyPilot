import { env } from '@/lib/config/env';
import { LocalPropertyRepository } from './localPropertyRepository';
import { SupabasePropertyRepository } from './supabasePropertyRepository';
import type { PropertyRepository } from './types';

export type { PropertyRepository } from './types';
export { LocalPropertyRepository } from './localPropertyRepository';
export { SupabasePropertyRepository } from './supabasePropertyRepository';

let instance: PropertyRepository | null = null;

export function getPropertyRepository(): PropertyRepository {
  if (!instance) {
    instance = env.demoMode ? new LocalPropertyRepository() : new SupabasePropertyRepository();
  }
  return instance;
}
