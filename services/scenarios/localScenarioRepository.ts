import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAX_SCENARIOS_PER_PROPERTY } from '@/constants/analysis';
import { AppError } from '@/lib/errors';
import type { PropertyScenario } from '@/types/property';
import { logger } from '../logger';
import type { ScenarioDraft, ScenarioRepository } from './types';

/**
 * On-device scenario storage for demo mode.
 *
 * Unlike properties, scenarios are not seeded: a saved scenario is something
 * the user made, and inventing some would misrepresent their own work back to
 * them.
 */

const STORAGE_KEY = 'propertypilot.demo.scenarios';

function newId(): string {
  return `scenario-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Newest first — the ordering both repositories present. */
function byNewest(a: PropertyScenario, b: PropertyScenario): number {
  return b.createdAt.localeCompare(a.createdAt);
}

export class LocalScenarioRepository implements ScenarioRepository {
  private async readAll(): Promise<PropertyScenario[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw === null ? [] : (JSON.parse(raw) as PropertyScenario[]);
    } catch (error) {
      logger.error('Failed to read saved scenarios', error);
      throw new AppError('storage', 'We could not load your saved scenarios.', error);
    }
  }

  private async writeAll(scenarios: PropertyScenario[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
    } catch (error) {
      logger.error('Failed to write saved scenarios', error);
      throw new AppError('storage', 'We could not save this scenario on this device.', error);
    }
  }

  async list(userId: string): Promise<PropertyScenario[]> {
    const all = await this.readAll();
    return all.map((scenario) => ({ ...scenario, userId })).sort(byNewest);
  }

  async listForProperty(userId: string, propertyId: string): Promise<PropertyScenario[]> {
    const all = await this.list(userId);
    return all.filter((scenario) => scenario.propertyId === propertyId);
  }

  async create(userId: string, draft: ScenarioDraft): Promise<PropertyScenario> {
    const all = await this.readAll();

    const existingForProperty = all.filter(
      (scenario) => scenario.propertyId === draft.propertyId,
    ).length;
    if (existingForProperty >= MAX_SCENARIOS_PER_PROPERTY) {
      throw new AppError(
        'validation',
        `You can save up to ${MAX_SCENARIOS_PER_PROPERTY} scenarios per property. Delete one to make room.`,
      );
    }

    const now = new Date().toISOString();
    const scenario: PropertyScenario = {
      id: newId(),
      propertyId: draft.propertyId,
      userId,
      name: draft.name,
      scenarioType: draft.scenarioType,
      assumptions: draft.assumptions,
      createdAt: now,
      updatedAt: now,
    };

    await this.writeAll([...all, scenario]);
    return scenario;
  }

  async update(
    userId: string,
    scenarioId: string,
    patch: { name?: string; assumptions?: Record<string, unknown> },
  ): Promise<PropertyScenario> {
    const all = await this.readAll();
    const existing = all.find((scenario) => scenario.id === scenarioId);

    if (!existing) {
      throw new AppError('not_found', 'We could not find that scenario.');
    }

    const updated: PropertyScenario = {
      ...existing,
      userId,
      name: patch.name ?? existing.name,
      assumptions: patch.assumptions ?? existing.assumptions,
      updatedAt: new Date().toISOString(),
    };

    await this.writeAll(all.map((scenario) => (scenario.id === scenarioId ? updated : scenario)));
    return updated;
  }

  async remove(_userId: string, scenarioId: string): Promise<void> {
    const all = await this.readAll();
    await this.writeAll(all.filter((scenario) => scenario.id !== scenarioId));
  }

  async removeForProperty(_userId: string, propertyId: string): Promise<void> {
    const all = await this.readAll();
    await this.writeAll(all.filter((scenario) => scenario.propertyId !== propertyId));
  }
}
