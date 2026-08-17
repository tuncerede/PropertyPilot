import { useCallback, useMemo, useState } from 'react';
import { analytics } from '@/services/analytics';
import { useAuthStore } from '@/store/authStore';
import { useScenarioStore, useScenariosFor } from '@/store/scenarioStore';
import type { PropertyScenario, ScenarioType } from '@/types/property';

/**
 * Shared save/load plumbing for an analysis screen.
 *
 * Both Sell vs. Hold and Refinance work the same way: a live assumption set
 * on screen, a list of saved scenarios for that property, and a notion of
 * which one is loaded and whether it has been edited since. Keeping that here
 * means the two screens cannot drift apart in behaviour.
 *
 * The screen keeps owning its assumptions — this hook only says which
 * scenario is loaded, whether it is dirty, and how to persist it.
 */
export interface ScenarioEditor<TAssumptions extends Record<string, unknown>> {
  scenarios: PropertyScenario[];
  /** Null when nothing is loaded, or the loaded scenario has been deleted. */
  activeId: string | null;
  /** True when the on-screen assumptions differ from the loaded scenario. */
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
  load: (scenario: PropertyScenario) => void;
  saveNew: (name: string, assumptions: TAssumptions) => void;
  updateActive: (assumptions: TAssumptions) => void;
  rename: (scenarioId: string, name: string) => void;
  remove: (scenarioId: string) => void;
}

/**
 * Assumption sets are flat objects of primitives, so a shallow comparison is
 * exact here — and cheaper and more predictable than a deep diff.
 */
function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
}

export function useScenarioEditor<TAssumptions extends Record<string, unknown>>(options: {
  propertyId: string | undefined;
  scenarioType: ScenarioType;
  /** The assumption set currently on screen. */
  current: TAssumptions | null;
  /** Parses stored JSONB into a complete assumption set. */
  parse: (raw: unknown) => TAssumptions;
  /** Replaces the screen's assumptions when a scenario is loaded. */
  onApply: (assumptions: TAssumptions) => void;
}): ScenarioEditor<TAssumptions> {
  const { propertyId, scenarioType, current, parse, onApply } = options;

  const user = useAuthStore((state) => state.user);
  const scenarios = useScenariosFor(propertyId, scenarioType);
  const isSaving = useScenarioStore((state) => state.isSaving);
  const error = useScenarioStore((state) => state.error);
  const saveScenario = useScenarioStore((state) => state.save);
  const overwriteScenario = useScenarioStore((state) => state.overwrite);
  const renameScenario = useScenarioStore((state) => state.rename);
  const removeScenario = useScenarioStore((state) => state.remove);

  /** The assumptions as they stood when the active scenario was loaded. */
  const [active, setActive] = useState<{ id: string; snapshot: TAssumptions } | null>(null);

  // A scenario deleted on another screen is no longer active here.
  const activeId = active && scenarios.some((item) => item.id === active.id) ? active.id : null;

  const isDirty = useMemo(() => {
    if (!activeId || !active || !current) return false;
    return !shallowEqual(active.snapshot, current);
  }, [active, activeId, current]);

  const load = useCallback(
    (scenario: PropertyScenario) => {
      const parsed = parse(scenario.assumptions);
      setActive({ id: scenario.id, snapshot: parsed });
      onApply(parsed);
      analytics.track({
        name: 'scenario_loaded',
        propertyId: scenario.propertyId,
        scenarioType: scenario.scenarioType,
      });
    },
    [onApply, parse],
  );

  const saveNew = useCallback(
    (name: string, assumptions: TAssumptions) => {
      if (!user || !propertyId) return;

      void saveScenario(user.id, { propertyId, name, scenarioType, assumptions }).then((saved) => {
        if (saved) setActive({ id: saved.id, snapshot: assumptions });
      });
    },
    [propertyId, saveScenario, scenarioType, user],
  );

  const updateActive = useCallback(
    (assumptions: TAssumptions) => {
      if (!user || !activeId) return;

      void overwriteScenario(user.id, activeId, assumptions).then((ok) => {
        if (ok) setActive({ id: activeId, snapshot: assumptions });
      });
    },
    [activeId, overwriteScenario, user],
  );

  const rename = useCallback(
    (scenarioId: string, name: string) => {
      if (user) void renameScenario(user.id, scenarioId, name);
    },
    [renameScenario, user],
  );

  const remove = useCallback(
    (scenarioId: string) => {
      if (!user) return;
      if (active?.id === scenarioId) setActive(null);
      void removeScenario(user.id, scenarioId);
    },
    [active?.id, removeScenario, user],
  );

  return { scenarios, activeId, isDirty, isSaving, error, load, saveNew, updateActive, rename, remove };
}
