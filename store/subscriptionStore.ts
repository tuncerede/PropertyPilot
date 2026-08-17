import { create } from 'zustand';
import { propertyLimitFor, tierHasFeature } from '@/constants/subscription';
import { toAppError } from '@/lib/errors';
import { analytics } from '@/services/analytics';
import { logger } from '@/services/logger';
import { getSubscriptionService } from '@/services/subscription';
import type { Feature, SubscriptionPackage, SubscriptionTier } from '@/types/subscription';

interface SubscriptionState {
  tier: SubscriptionTier;
  packages: SubscriptionPackage[];
  isLoading: boolean;
  isPurchasing: boolean;
  isMock: boolean;
  error: string | null;

  configure: (appUserId: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  loadPackages: () => Promise<void>;
  purchase: (packageIdentifier: string) => Promise<boolean>;
  restore: () => Promise<boolean>;
  reset: () => Promise<void>;
  clearError: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  tier: 'free',
  packages: [],
  isLoading: true,
  isPurchasing: false,
  isMock: true,
  error: null,

  async configure(appUserId) {
    const service = getSubscriptionService();
    set({ isLoading: true, isMock: service.isMock });

    try {
      await service.configure(appUserId);
      const tier = await service.getTier();
      set({ tier, isLoading: false });
    } catch (error) {
      logger.error('Subscription configuration failed', error);
      // A subscription problem must never block access to the free tier.
      set({ tier: 'free', isLoading: false });
    }
  },

  async refresh() {
    try {
      const tier = await getSubscriptionService().getTier();
      set({ tier });
    } catch (error) {
      logger.error('Failed to refresh entitlements', error);
    }
  },

  async loadPackages() {
    try {
      const packages = await getSubscriptionService().getPackages();
      set({ packages });
    } catch (error) {
      const appError = toAppError(error, 'subscription');
      logger.error('Failed to load subscription packages', appError.cause ?? appError);
      set({ error: appError.message });
    }
  },

  async purchase(packageIdentifier) {
    set({ isPurchasing: true, error: null });

    try {
      const tier = await getSubscriptionService().purchase(packageIdentifier);
      const selected = get().packages.find((item) => item.identifier === packageIdentifier);

      set({ tier, isPurchasing: false });
      analytics.track({
        name: 'subscription_started',
        tier,
        period: selected?.period ?? 'unknown',
      });
      return true;
    } catch (error) {
      const appError = toAppError(error, 'subscription');
      logger.error('Purchase failed', appError.cause ?? appError);
      set({ isPurchasing: false, error: appError.message });
      return false;
    }
  },

  async restore() {
    set({ isPurchasing: true, error: null });

    try {
      const tier = await getSubscriptionService().restore();
      set({ tier, isPurchasing: false });
      analytics.track({ name: 'subscription_restored', tier });
      return true;
    } catch (error) {
      const appError = toAppError(error, 'subscription');
      set({ isPurchasing: false, error: appError.message });
      return false;
    }
  },

  async reset() {
    try {
      await getSubscriptionService().logOut();
    } catch (error) {
      logger.error('Subscription log out failed', error);
    }
    set({ tier: 'free', packages: [] });
  },

  clearError() {
    set({ error: null });
  },
}));

/** Selector helpers so components never reason about tiers directly. */
export function useEntitlements() {
  const tier = useSubscriptionStore((state) => state.tier);

  return {
    tier,
    can: (feature: Feature) => tierHasFeature(tier, feature),
    propertyLimit: propertyLimitFor(tier),
  };
}
