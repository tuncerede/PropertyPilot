import { PRODUCT_IDS, TIERS } from '@/constants/subscription';
import { env } from '@/lib/config/env';
import type { SubscriptionPackage, SubscriptionTier } from '@/types/subscription';
import { logger } from '../logger';
import type { SubscriptionService } from './types';

/**
 * Mock subscription service used in demo mode and whenever RevenueCat
 * credentials are absent.
 *
 * It exercises exactly the same interface as the live service — purchase,
 * restore and entitlement lookup all work — so paywalls, feature gates and
 * property limits are fully testable before any App Store product exists.
 * Nothing here talks to a store; no money moves.
 */
export class MockSubscriptionService implements SubscriptionService {
  readonly isMock = true;

  private tier: SubscriptionTier;

  constructor(initialTier: SubscriptionTier = env.demoTier) {
    this.tier = TIERS[initialTier] ? initialTier : 'free';
  }

  async configure(appUserId: string | null): Promise<void> {
    logger.debug('MockSubscriptionService configured', { appUserId, tier: this.tier });
  }

  async getTier(): Promise<SubscriptionTier> {
    return this.tier;
  }

  async getPackages(): Promise<SubscriptionPackage[]> {
    return [
      {
        identifier: 'pro_monthly',
        productIdentifier: PRODUCT_IDS.proMonthly,
        tier: 'pro',
        period: 'monthly',
        priceString: '$9.99',
        price: 9.99,
        currencyCode: 'USD',
      },
      {
        identifier: 'pro_annual',
        productIdentifier: PRODUCT_IDS.proAnnual,
        tier: 'pro',
        period: 'annual',
        priceString: '$99.99',
        price: 99.99,
        currencyCode: 'USD',
      },
      {
        identifier: 'investor_monthly',
        productIdentifier: PRODUCT_IDS.investorMonthly,
        tier: 'investor',
        period: 'monthly',
        priceString: '$19.99',
        price: 19.99,
        currencyCode: 'USD',
      },
      {
        identifier: 'investor_annual',
        productIdentifier: PRODUCT_IDS.investorAnnual,
        tier: 'investor',
        period: 'annual',
        priceString: '$199.99',
        price: 199.99,
        currencyCode: 'USD',
      },
    ];
  }

  async purchase(packageIdentifier: string): Promise<SubscriptionTier> {
    const packages = await this.getPackages();
    const selected = packages.find((item) => item.identifier === packageIdentifier);

    this.tier = selected?.tier ?? this.tier;
    logger.debug('MockSubscriptionService purchase', { packageIdentifier, tier: this.tier });

    return this.tier;
  }

  async restore(): Promise<SubscriptionTier> {
    logger.debug('MockSubscriptionService restore', { tier: this.tier });
    return this.tier;
  }

  async getManagementUrl(): Promise<string | null> {
    return null;
  }

  async logOut(): Promise<void> {
    this.tier = env.demoTier;
  }

  /** Test/demo affordance: force a tier without going through a purchase. */
  setTier(tier: SubscriptionTier): void {
    this.tier = tier;
  }
}
