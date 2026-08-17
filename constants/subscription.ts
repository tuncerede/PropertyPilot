import type { Feature, SubscriptionTier } from '@/types/subscription';

/**
 * Subscription configuration.
 *
 * Product identifiers live here (and are overridable by environment) rather
 * than being scattered through components. The UI gates on named FEATURES via
 * `useEntitlements()`, never on a product id.
 *
 * The prices below are for laying out the paywall before store data has
 * loaded. Whatever RevenueCat returns for the live offering is authoritative
 * and replaces them at runtime.
 */

export interface TierDefinition {
  tier: SubscriptionTier;
  name: string;
  propertyLimit: number;
  features: Feature[];
  /** Fallback display price only. The store is the source of truth. */
  fallbackMonthlyPrice: string;
  fallbackAnnualPrice: string | null;
  headline: string;
  highlights: string[];
}

export const PRODUCT_IDS = {
  proMonthly: process.env.EXPO_PUBLIC_PRODUCT_PRO_MONTHLY ?? 'propertypilot_pro_monthly',
  proAnnual: process.env.EXPO_PUBLIC_PRODUCT_PRO_ANNUAL ?? 'propertypilot_pro_annual',
  investorMonthly:
    process.env.EXPO_PUBLIC_PRODUCT_INVESTOR_MONTHLY ?? 'propertypilot_investor_monthly',
  investorAnnual:
    process.env.EXPO_PUBLIC_PRODUCT_INVESTOR_ANNUAL ?? 'propertypilot_investor_annual',
} as const;

export const OFFERING_ID = process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID ?? 'default';

const PRO_FEATURES: Feature[] = [
  'sellVsHold',
  'refinance',
  'portfolioDashboard',
  'scenarioComparison',
  'longRangeProjections',
  'returnOnEquityAnalysis',
  'exportReports',
];

export const TIERS: Record<SubscriptionTier, TierDefinition> = {
  free: {
    tier: 'free',
    name: 'Free',
    propertyLimit: 1,
    features: [],
    fallbackMonthlyPrice: '$0',
    fallbackAnnualPrice: null,
    headline: 'See where one property stands.',
    highlights: ['1 property', 'Cash flow, equity and cap rate', 'Simple 5-year projection'],
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    propertyLimit: 5,
    features: PRO_FEATURES,
    fallbackMonthlyPrice: '$9.99',
    fallbackAnnualPrice: '$99.99',
    headline: 'Decide on every property you own.',
    highlights: [
      '5 properties',
      'Sell vs. Hold analysis',
      'Refinance scenarios',
      'Portfolio dashboard',
      '5, 10 and 20-year projections',
    ],
  },
  investor: {
    tier: 'investor',
    name: 'Investor',
    propertyLimit: 25,
    features: [...PRO_FEATURES, 'portfolioRanking', 'advancedPortfolioAnalytics'],
    fallbackMonthlyPrice: '$19.99',
    fallbackAnnualPrice: '$199.99',
    headline: 'Run the whole portfolio.',
    highlights: [
      '25 properties',
      'Everything in Pro',
      'Portfolio Sell/Hold ranking',
      'Advanced portfolio analytics',
    ],
  },
};

export const TIER_ORDER: SubscriptionTier[] = ['free', 'pro', 'investor'];

/** Human-readable names for the gated features, used in paywall messaging. */
export const FEATURE_LABELS: Record<Feature, string> = {
  sellVsHold: 'Sell vs. Hold analysis',
  refinance: 'Refinance analysis',
  portfolioDashboard: 'Portfolio dashboard',
  scenarioComparison: 'Scenario comparison',
  longRangeProjections: '10 and 20-year projections',
  returnOnEquityAnalysis: 'Return on equity analysis',
  portfolioRanking: 'Portfolio Sell/Hold ranking',
  advancedPortfolioAnalytics: 'Advanced portfolio analytics',
  exportReports: 'Exportable reports',
};

export function propertyLimitFor(tier: SubscriptionTier): number {
  return TIERS[tier].propertyLimit;
}

export function tierHasFeature(tier: SubscriptionTier, feature: Feature): boolean {
  return TIERS[tier].features.includes(feature);
}

/** The cheapest tier that unlocks a given feature, for paywall copy. */
export function minimumTierFor(feature: Feature): SubscriptionTier {
  return TIER_ORDER.find((tier) => tierHasFeature(tier, feature)) ?? 'investor';
}
