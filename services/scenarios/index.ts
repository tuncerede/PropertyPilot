import { env } from '@/lib/config/env';
import { LocalScenarioRepository } from './localScenarioRepository';
import { SupabaseScenarioRepository } from './supabaseScenarioRepository';
import type { ScenarioRepository } from './types';

export type { ScenarioDraft, ScenarioRepository } from './types';
export { LocalScenarioRepository } from './localScenarioRepository';
export { SupabaseScenarioRepository } from './supabaseScenarioRepository';

let instance: ScenarioRepository | null = null;

export function getScenarioRepository(): ScenarioRepository {
  if (!instance) {
    instance = env.demoMode ? new LocalScenarioRepository() : new SupabaseScenarioRepository();
  }
  return instance;
}
