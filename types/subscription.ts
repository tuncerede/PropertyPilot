/** Subscription domain types. RevenueCat entitlements are the source of truth. */

export const SUBSCRIPTION_TIERS = ['free', 'pro', 'investor'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

/** Entitlement identifiers configured in RevenueCat. */
export const ENTITLEMENTS = {
  pro: 'pro',
  investor: 'investor',
} as const;

export type EntitlementId = (typeof ENTITLEMENTS)[keyof typeof ENTITLEMENTS];

/**
 * Named capabilities the UI gates on. Components ask
 * `useEntitlements().can('sellVsHold')` — they never inspect product ids.
 */
export const FEATURES = [
  'sellVsHold',
  'refinance',
  'portfolioDashboard',
  'scenarioComparison',
  'longRangeProjections',
  'returnOnEquityAnalysis',
  'portfolioRanking',
  'advancedPortfolioAnalytics',
  'exportReports',
] as const;

export type Feature = (typeof FEATURES)[number];

export interface SubscriptionState {
  tier: SubscriptionTier;
  /** RevenueCat app user id, when known. */
  customerId: string | null;
  /** Active store product identifier, when known. */
  productIdentifier: string | null;
  /** ISO timestamp of entitlement expiry, when known. */
  expiresAt: string | null;
  /** True while entitlement state is being (re)loaded. */
  isLoading: boolean;
  /** True when running against the mock service rather than RevenueCat. */
  isMock: boolean;
}

/** A purchasable package, normalized away from the RevenueCat SDK shape. */
export interface SubscriptionPackage {
  identifier: string;
  productIdentifier: string;
  tier: Exclude<SubscriptionTier, 'free'>;
  period: 'monthly' | 'annual';
  /**
   * Localized price string from the store. Always prefer this over any
   * hard-coded price: the store is authoritative for what the user pays.
   */
  priceString: string;
  /** Numeric price in `currencyCode`, for sorting/savings math only. */
  price: number;
  currencyCode: string;
}
