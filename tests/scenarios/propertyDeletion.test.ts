import AsyncStorage from '@react-native-async-storage/async-storage';
import { getScenarioRepository } from '@/services/scenarios';
import { usePropertyStore } from '@/store/propertyStore';
import { useScenarioStore } from '@/store/scenarioStore';
import type { Property } from '@/types/property';
import { baseProperty } from '../fixtures';

/**
 * Deleting a property must take its scenarios with it — otherwise the user
 * accumulates rows they can no longer reach from any screen.
 */

const USER = 'demo-user';

const mockRemoveProperty = jest.fn(async () => {});

jest.mock('@/services/properties', () => ({
  getPropertyRepository: () => ({
    list: jest.fn(async () => []),
    get: jest.fn(async () => null),
    create: jest.fn(),
    update: jest.fn(),
    remove: mockRemoveProperty,
  }),
}));

function property(id: string): Property {
  return {
    ...baseProperty,
    id,
    userId: USER,
    nickname: id,
    streetAddress: '1 Test St',
    city: 'Erie',
    state: 'PA',
    zipCode: '16501',
    propertyType: 'duplex',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

describe('deleting a property', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    mockRemoveProperty.mockClear();
    usePropertyStore.setState({
      properties: [property('keep-me'), property('delete-me')],
      status: 'ready',
      error: null,
      isSaving: false,
    });
    useScenarioStore.getState().clear();
  });

  it('removes the property and its scenarios, leaving other properties alone', async () => {
    const repository = getScenarioRepository();

    const doomed = await repository.create(USER, {
      propertyId: 'delete-me',
      name: 'Doomed',
      scenarioType: 'sell',
      assumptions: { projectionYears: 10 },
    });
    const survivor = await repository.create(USER, {
      propertyId: 'keep-me',
      name: 'Survivor',
      scenarioType: 'sell',
      assumptions: { projectionYears: 10 },
    });

    await useScenarioStore.getState().load(USER);
    expect(useScenarioStore.getState().scenarios).toHaveLength(2);

    const ok = await usePropertyStore.getState().remove(USER, 'delete-me');

    expect(ok).toBe(true);
    expect(mockRemoveProperty).toHaveBeenCalledWith(USER, 'delete-me');

    // Gone from the property list…
    expect(usePropertyStore.getState().properties.map((item) => item.id)).toEqual(['keep-me']);

    // …gone from in-memory scenario state…
    const remaining = useScenarioStore.getState().scenarios;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.id).toBe(survivor.id);

    // …and gone from storage, so it does not come back on reload.
    const persisted = await repository.list(USER);
    expect(persisted.map((item) => item.id)).toEqual([survivor.id]);
    expect(persisted.some((item) => item.id === doomed.id)).toBe(false);
  });

  it('still reports success when scenario cleanup fails', async () => {
    const repository = getScenarioRepository();
    const cleanup = jest
      .spyOn(repository, 'removeForProperty')
      .mockRejectedValueOnce(new Error('storage is full'));

    const ok = await usePropertyStore.getState().remove(USER, 'delete-me');

    // The property is genuinely gone; a cleanup failure must not be reported
    // to the user as a failed delete.
    expect(cleanup).toHaveBeenCalled();
    expect(ok).toBe(true);
    expect(usePropertyStore.getState().error).toBeNull();
    expect(usePropertyStore.getState().properties.map((item) => item.id)).toEqual(['keep-me']);

    cleanup.mockRestore();
  });
});
