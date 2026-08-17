import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { toAppError } from '@/lib/errors';
import { analytics } from '@/services/analytics';
import { logger } from '@/services/logger';
import { getScenarioRepository } from '@/services/scenarios';
import type { PropertyScenario, ScenarioType } from '@/types/property';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface ScenarioState {
  scenarios: PropertyScenario[];
  status: LoadStatus;
  error: string | null;
  isSaving: boolean;

  load: (userId: string) => Promise<void>;
  save: (
    userId: string,
    draft: {
      propertyId: string;
      name: string;
      scenarioType: ScenarioType;
      assumptions: Record<string, unknown>;
    },
  ) => Promise<PropertyScenario | null>;
  rename: (userId: string, scenarioId: string, name: string) => Promise<boolean>;
  overwrite: (
    userId: string,
    scenarioId: string,
    assumptions: Record<string, unknown>,
  ) => Promise<boolean>;
  remove: (userId: string, scenarioId: string) => Promise<boolean>;
  /** Drops scenarios for a deleted property from local state. */
  forgetProperty: (propertyId: string) => void;
  clear: () => void;
  clearError: () => void;
}

export const useScenarioStore = create<ScenarioState>((set, get) => ({
  scenarios: [],
  status: 'idle',
  error: null,
  isSaving: false,

  async load(userId) {
    if (get().status === 'loading') return;
    set({ status: 'loading', error: null });

    try {
      const scenarios = await getScenarioRepository().list(userId);
      set({ scenarios, status: 'ready' });
    } catch (error) {
      const appError = toAppError(error, 'storage');
      logger.error('Failed to load scenarios', appError.cause ?? appError);
      set({ status: 'error', error: appError.message });
    }
  },

  async save(userId, draft) {
    set({ isSaving: true, error: null });

    try {
      const scenario = await getScenarioRepository().create(userId, draft);
      set({ scenarios: [scenario, ...get().scenarios], isSaving: false });
      analytics.track({
        name: 'scenario_saved',
        propertyId: draft.propertyId,
        scenarioType: draft.scenarioType,
      });
      return scenario;
    } catch (error) {
      const appError = toAppError(error, 'storage');
      logger.error('Failed to save a scenario', appError.cause ?? appError);
      set({ isSaving: false, error: appError.message });
      return null;
    }
  },

  async rename(userId, scenarioId, name) {
    return applyUpdate(set, get, userId, scenarioId, { name });
  },

  async overwrite(userId, scenarioId, assumptions) {
    return applyUpdate(set, get, userId, scenarioId, { assumptions });
  },

  async remove(userId, scenarioId) {
    set({ isSaving: true, error: null });

    try {
      await getScenarioRepository().remove(userId, scenarioId);
      set({
        scenarios: get().scenarios.filter((scenario) => scenario.id !== scenarioId),
        isSaving: false,
      });
      analytics.track({ name: 'scenario_deleted', scenarioId });
      return true;
    } catch (error) {
      const appError = toAppError(error, 'storage');
      logger.error('Failed to delete a scenario', appError.cause ?? appError);
      set({ isSaving: false, error: appError.message });
      return false;
    }
  },

  forgetProperty(propertyId) {
    set({
      scenarios: get().scenarios.filter((scenario) => scenario.propertyId !== propertyId),
    });
  },

  clear() {
    set({ scenarios: [], status: 'idle', error: null });
  },

  clearError() {
    set({ error: null });
  },
}));

/** Shared body for rename and overwrite, which differ only in the patch. */
async function applyUpdate(
  set: (partial: Partial<ScenarioState>) => void,
  get: () => ScenarioState,
  userId: string,
  scenarioId: string,
  patch: { name?: string; assumptions?: Record<string, unknown> },
): Promise<boolean> {
  set({ isSaving: true, error: null });

  try {
    const updated = await getScenarioRepository().update(userId, scenarioId, patch);
    set({
      scenarios: get().scenarios.map((scenario) =>
        scenario.id === scenarioId ? updated : scenario,
      ),
      isSaving: false,
    });
    return true;
  } catch (error) {
    const appError = toAppError(error, 'storage');
    logger.error('Failed to update a scenario', appError.cause ?? appError);
    set({ isSaving: false, error: appError.message });
    return false;
  }
}

/**
 * Scenarios saved against one property and analysis type, newest first.
 *
 * Wrapped in `useShallow` because the selector builds a new array on every
 * call — without it, Zustand's `Object.is` comparison would see a change each
 * render and loop.
 */
export function useScenariosFor(
  propertyId: string | undefined,
  scenarioType: ScenarioType,
): PropertyScenario[] {
  return useScenarioStore(
    useShallow((state) =>
      propertyId
        ? state.scenarios.filter(
            (scenario) =>
              scenario.propertyId === propertyId && scenario.scenarioType === scenarioType,
          )
        : [],
    ),
  );
}
