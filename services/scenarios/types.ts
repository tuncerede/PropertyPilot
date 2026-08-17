import type { PropertyScenario, ScenarioType } from '@/types/property';

export interface ScenarioDraft {
  propertyId: string;
  name: string;
  scenarioType: ScenarioType;
  assumptions: Record<string, unknown>;
}

/**
 * The scenario persistence port.
 *
 * Mirrors `PropertyRepository`: an on-device implementation for demo mode and
 * a Supabase one for real accounts, so saved scenarios work with or without
 * credentials.
 */
export interface ScenarioRepository {
  /** Every scenario the user has saved, newest first. */
  list(userId: string): Promise<PropertyScenario[]>;
  /** Scenarios saved against one property, newest first. */
  listForProperty(userId: string, propertyId: string): Promise<PropertyScenario[]>;
  create(userId: string, draft: ScenarioDraft): Promise<PropertyScenario>;
  /** Overwrites name and assumptions on an existing scenario. */
  update(
    userId: string,
    scenarioId: string,
    patch: { name?: string; assumptions?: Record<string, unknown> },
  ): Promise<PropertyScenario>;
  remove(userId: string, scenarioId: string): Promise<void>;
  /**
   * Removes every scenario for a property, called when the property is
   * deleted. Postgres would cascade this anyway; doing it explicitly keeps
   * the two implementations behaving identically.
   */
  removeForProperty(userId: string, propertyId: string): Promise<void>;
}
