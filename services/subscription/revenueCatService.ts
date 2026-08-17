import { OFFERING_ID, PRODUCT_IDS } from '@/constants/subscription';
import { env } from '@/lib/config/env';
import { AppError, toAppError } from '@/lib/errors';
import { ENTITLEMENTS, type SubscriptionPackage, type SubscriptionTier } from '@/types/subscription';
import { logger } from '../logger';
import type { SubscriptionService } from './types';

/**
 * Live RevenueCat implementation.
 *
 * The SDK is required lazily so that a build without native RevenueCat (Expo
 * Go, web, CI) can still import this module and simply fall back to the mock
 * — the app must never fail to start over a missing store SDK.
 *
 * RevenueCat entitlements are the source of truth for what a user has paid
 * for. The `subscription_state` table in Supabase is cached metadata only.
 */

type PurchasesModule = typeof import('react-native-purchases');

let cachedModule: PurchasesModule | null = null;

function loadPurchases(): PurchasesModule | null {
  if (cachedModule) return cachedModule;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('react-native-purchases') as PurchasesModule;
    return cachedModule;
  } catch (error) {
    logger.warn('react-native-purchases is unavailable in this runtime', { error });
    return null;
  }
}

/** True when the live service can actually run here. */
export function canUseRevenueCat(): boolean {
  return env.hasRevenueCatCredentials && loadPurchases() !== null;
}

function tierFromEntitlements(activeEntitlementIds: string[]): SubscriptionTier {
  if (activeEntitlementIds.includes(ENTITLEMENTS.investor)) return 'investor';
  if (activeEntitlementIds.includes(ENTITLEMENTS.pro)) return 'pro';
  return 'free';
}

function tierForProduct(productIdentifier: string): SubscriptionPackage['tier'] {
  return productIdentifier === PRODUCT_IDS.investorMonthly ||
    productIdentifier === PRODUCT_IDS.investorAnnual
    ? 'investor'
    : 'pro';
}

export class RevenueCatService implements SubscriptionService {
  readonly isMock = false;

  private configured = false;

  private requireSdk(): PurchasesModule {
    const sdk = loadPurchases();
    if (!sdk) {
      throw new AppError(
        'subscription',
        'Subscriptions are not available in this build of the app.',
      );
    }
    return sdk;
  }

  async configure(appUserId: string | null): Promise<void> {
    const sdk = this.requireSdk();

    try {
      await sdk.default.configure({
        apiKey: env.revenueCatApiKey,
        appUserID: appUserId ?? null,
      });
      this.configured = true;
      logger.debug('RevenueCat configured', { appUserId });
    } catch (error) {
      throw toAppError(error, 'subscription');
    }
  }

  async getTier(): Promise<SubscriptionTier> {
    const sdk = this.requireSdk();

    try {
      const customerInfo = await sdk.default.getCustomerInfo();
      return tierFromEntitlements(Object.keys(customerInfo.entitlements.active));
    } catch (error) {
      // Entitlement lookup failing must not lock a paying user out of the
      // app's free surface, so fall back to free and log the detail.
      logger.error('Failed to read RevenueCat entitlements', error);
      return 'free';
    }
  }

  async getPackages(): Promise<SubscriptionPackage[]> {
    const sdk = this.requireSdk();

    try {
      const offerings = await sdk.default.getOfferings();
      const offering = offerings.all[OFFERING_ID] ?? offerings.current;
      if (!offering) return [];

      return offering.availablePackages.map((item) => ({
        identifier: item.identifier,
        productIdentifier: item.product.identifier,
        tier: tierForProduct(item.product.identifier),
        period: item.packageType === 'ANNUAL' ? 'annual' : 'monthly',
        // Always the store's own localized string — never a hard-coded price.
        priceString: item.product.priceString,
        price: item.product.price,
        currencyCode: item.product.currencyCode,
      }));
    } catch (error) {
      throw toAppError(error, 'subscription');
    }
  }

  async purchase(packageIdentifier: string): Promise<SubscriptionTier> {
    const sdk = this.requireSdk();

    try {
      const offerings = await sdk.default.getOfferings();
      const offering = offerings.all[OFFERING_ID] ?? offerings.current;
      const target = offering?.availablePackages.find(
        (item) => item.identifier === packageIdentifier,
      );

      if (!target) {
        throw new AppError('subscription', 'That plan is not available right now.');
      }

      const { customerInfo } = await sdk.default.purchasePackage(target);
      return tierFromEntitlements(Object.keys(customerInfo.entitlements.active));
    } catch (error) {
      throw toAppError(error, 'subscription');
    }
  }

  async restore(): Promise<SubscriptionTier> {
    const sdk = this.requireSdk();

    try {
      const customerInfo = await sdk.default.restorePurchases();
      return tierFromEntitlements(Object.keys(customerInfo.entitlements.active));
    } catch (error) {
      throw toAppError(error, 'subscription');
    }
  }

  async getManagementUrl(): Promise<string | null> {
    if (!this.configured) return null;
    const sdk = this.requireSdk();

    try {
      const customerInfo = await sdk.default.getCustomerInfo();
      return customerInfo.managementURL ?? null;
    } catch (error) {
      logger.error('Failed to read the RevenueCat management URL', error);
      return null;
    }
  }

  async logOut(): Promise<void> {
    if (!this.configured) return;
    const sdk = this.requireSdk();

    try {
      await sdk.default.logOut();
    } catch (error) {
      logger.error('RevenueCat log out failed', error);
    }
  }
}
