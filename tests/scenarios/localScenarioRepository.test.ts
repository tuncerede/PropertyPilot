import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAX_SCENARIOS_PER_PROPERTY } from '@/constants/analysis';
import { AppError } from '@/lib/errors';
import { LocalScenarioRepository } from '@/services/scenarios/localScenarioRepository';

const USER = 'demo-user';
const PROPERTY = 'demo-neufer';

function makeDraft(overrides: Partial<{ propertyId: string; name: string }> = {}) {
  return {
    propertyId: overrides.propertyId ?? PROPERTY,
    name: overrides.name ?? 'Base case',
    scenarioType: 'sell' as const,
    assumptions: { appreciationRate: 0.03, projectionYears: 10 },
  };
}

describe('LocalScenarioRepository', () => {
  let repository: LocalScenarioRepository;

  beforeEach(async () => {
    await AsyncStorage.clear();
    repository = new LocalScenarioRepository();
  });

  it('starts empty — scenarios are never seeded', async () => {
    expect(await repository.list(USER)).toEqual([]);
  });

  it('saves and reads back a scenario', async () => {
    const saved = await repository.create(USER, makeDraft());

    expect(saved.id).toBeTruthy();
    expect(saved.name).toBe('Base case');
    expect(saved.userId).toBe(USER);
    expect(saved.assumptions).toEqual({ appreciationRate: 0.03, projectionYears: 10 });

    const all = await repository.list(USER);
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe(saved.id);
  });

  it('persists across repository instances', async () => {
    await repository.create(USER, makeDraft());

    const reopened = new LocalScenarioRepository();
    expect(await reopened.list(USER)).toHaveLength(1);
  });

  it('filters by property', async () => {
    await repository.create(USER, makeDraft({ propertyId: 'a', name: 'For A' }));
    await repository.create(USER, makeDraft({ propertyId: 'b', name: 'For B' }));

    const forA = await repository.listForProperty(USER, 'a');
    expect(forA).toHaveLength(1);
    expect(forA[0]?.name).toBe('For A');
  });

  it('renames without touching the assumptions', async () => {
    const saved = await repository.create(USER, makeDraft());
    const renamed = await repository.update(USER, saved.id, { name: 'Optimistic' });

    expect(renamed.name).toBe('Optimistic');
    expect(renamed.assumptions).toEqual(saved.assumptions);
  });

  it('overwrites assumptions without touching the name', async () => {
    const saved = await repository.create(USER, makeDraft());
    const updated = await repository.update(USER, saved.id, {
      assumptions: { appreciationRate: 0.06, projectionYears: 20 },
    });

    expect(updated.name).toBe('Base case');
    expect(updated.assumptions).toEqual({ appreciationRate: 0.06, projectionYears: 20 });
    expect(updated.updatedAt >= saved.updatedAt).toBe(true);
  });

  it('rejects an update to a scenario that does not exist', async () => {
    await expect(repository.update(USER, 'missing', { name: 'x' })).rejects.toBeInstanceOf(
      AppError,
    );
  });

  it('deletes a scenario', async () => {
    const saved = await repository.create(USER, makeDraft());
    await repository.remove(USER, saved.id);

    expect(await repository.list(USER)).toEqual([]);
  });

  it('deleting a missing scenario is a no-op', async () => {
    await repository.create(USER, makeDraft());
    await repository.remove(USER, 'missing');

    expect(await repository.list(USER)).toHaveLength(1);
  });

  it('removes every scenario for a deleted property, leaving others alone', async () => {
    await repository.create(USER, makeDraft({ propertyId: 'a', name: 'A1' }));
    await repository.create(USER, makeDraft({ propertyId: 'a', name: 'A2' }));
    await repository.create(USER, makeDraft({ propertyId: 'b', name: 'B1' }));

    await repository.removeForProperty(USER, 'a');

    const remaining = await repository.list(USER);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.name).toBe('B1');
  });

  it('caps the number of scenarios per property', async () => {
    for (let index = 0; index < MAX_SCENARIOS_PER_PROPERTY; index += 1) {
      await repository.create(USER, makeDraft({ name: `Scenario ${index}` }));
    }

    await expect(repository.create(USER, makeDraft({ name: 'One too many' }))).rejects.toThrow(
      /up to 10 scenarios/,
    );
  });

  it('counts the cap per property, not across the portfolio', async () => {
    for (let index = 0; index < MAX_SCENARIOS_PER_PROPERTY; index += 1) {
      await repository.create(USER, makeDraft({ propertyId: 'a', name: `A${index}` }));
    }

    const otherProperty = await repository.create(USER, makeDraft({ propertyId: 'b' }));
    expect(otherProperty.id).toBeTruthy();
  });

  it('returns scenarios newest first', async () => {
    const first = await repository.create(USER, makeDraft({ name: 'First' }));
    // createdAt has millisecond resolution; make the ordering unambiguous.
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await repository.create(USER, makeDraft({ name: 'Second' }));

    const all = await repository.list(USER);
    expect(all[0]?.id).toBe(second.id);
    expect(all[1]?.id).toBe(first.id);
  });
});
