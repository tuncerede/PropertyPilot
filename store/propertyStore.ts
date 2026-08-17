import { create } from 'zustand';
import { calculatePropertyMetrics } from '@/lib/calculations/metrics';
import {
  calculatePortfolioMetrics,
  rankByReturnOnEquity,
  withMetrics,
  type PropertyWithMetrics,
} from '@/lib/calculations/portfolio';
import { toAppError } from '@/lib/errors';
import { analytics } from '@/services/analytics';
import { logger } from '@/services/logger';
import { getPropertyRepository } from '@/services/properties';
import { getScenarioRepository } from '@/services/scenarios';
import type { PortfolioMetrics, PropertyMetrics, RankedProperty } from '@/types/analysis';
import type { Property, PropertyDraft } from '@/types/property';
import { useScenarioStore } from './scenarioStore';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface PropertyState {
  properties: Property[];
  status: LoadStatus;
  error: string | null;
  isSaving: boolean;

  load: (userId: string) => Promise<void>;
  refresh: (userId: string) => Promise<void>;
  create: (userId: string, draft: PropertyDraft) => Promise<Property | null>;
  update: (userId: string, propertyId: string, draft: PropertyDraft) => Promise<Property | null>;
  remove: (userId: string, propertyId: string) => Promise<boolean>;
  clear: () => void;
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: [],
  status: 'idle',
  error: null,
  isSaving: false,

  async load(userId) {
    if (get().status === 'loading') return;
    set({ status: 'loading', error: null });

    try {
      const properties = await getPropertyRepository().list(userId);
      set({ properties, status: 'ready' });
    } catch (error) {
      const appError = toAppError(error, 'storage');
      logger.error('Failed to load properties', appError.cause ?? appError);
      set({ status: 'error', error: appError.message });
    }
  },

  async refresh(userId) {
    try {
      const properties = await getPropertyRepository().list(userId);
      set({ properties, status: 'ready', error: null });
    } catch (error) {
      const appError = toAppError(error, 'storage');
      logger.error('Failed to refresh properties', appError.cause ?? appError);
      set({ error: appError.message });
    }
  },

  async create(userId, draft) {
    set({ isSaving: true, error: null });

    try {
      const property = await getPropertyRepository().create(userId, draft);
      set({ properties: [...get().properties, property], isSaving: false });
      analytics.track({
        name: 'property_created',
        propertyType: draft.propertyType,
        hasMortgage: draft.hasMortgage,
      });
      return property;
    } catch (error) {
      const appError = toAppError(error, 'storage');
      logger.error('Failed to create a property', appError.cause ?? appError);
      set({ isSaving: false, error: appError.message });
      return null;
    }
  },

  async update(userId, propertyId, draft) {
    set({ isSaving: true, error: null });

    try {
      const property = await getPropertyRepository().update(userId, propertyId, draft);
      set({
        properties: get().properties.map((item) => (item.id === propertyId ? property : item)),
        isSaving: false,
      });
      analytics.track({ name: 'property_updated', propertyId });
      return property;
    } catch (error) {
      const appError = toAppError(error, 'storage');
      logger.error('Failed to update a property', appError.cause ?? appError);
      set({ isSaving: false, error: appError.message });
      return null;
    }
  },

  async remove(userId, propertyId) {
    set({ isSaving: true, error: null });

    try {
      await getPropertyRepository().remove(userId, propertyId);

      // Scenarios belong to the property; leaving them behind would strand
      // rows the user can no longer reach. A failure here must not surface as
      // "delete failed" — the property is already gone.
      try {
        await getScenarioRepository().removeForProperty(userId, propertyId);
      } catch (cleanupError) {
        logger.error('Failed to clean up scenarios for a deleted property', cleanupError);
      }
      useScenarioStore.getState().forgetProperty(propertyId);

      set({
        properties: get().properties.filter((item) => item.id !== propertyId),
        isSaving: false,
      });
      analytics.track({ name: 'property_deleted', propertyId });
      return true;
    } catch (error) {
      const appError = toAppError(error, 'storage');
      logger.error('Failed to delete a property', appError.cause ?? appError);
      set({ isSaving: false, error: appError.message });
      return false;
    }
  },

  clear() {
    set({ properties: [], status: 'idle', error: null });
  },
}));

/**
 * Derived selectors.
 *
 * Metrics are computed here rather than in components so that every screen
 * reads the same numbers from the same engine.
 */

export function useProperty(propertyId: string | undefined): Property | undefined {
  return usePropertyStore((state) =>
    propertyId ? state.properties.find((property) => property.id === propertyId) : undefined,
  );
}

export function usePropertyMetrics(property: Property | undefined): PropertyMetrics | null {
  return property ? calculatePropertyMetrics(property) : null;
}

export function usePropertiesWithMetrics(): PropertyWithMetrics[] {
  const properties = usePropertyStore((state) => state.properties);
  return withMetrics(properties);
}

export function usePortfolioMetrics(): PortfolioMetrics {
  return calculatePortfolioMetrics(usePropertiesWithMetrics());
}

export function useRankedProperties(): RankedProperty[] {
  return rankByReturnOnEquity(usePropertiesWithMetrics());
}
