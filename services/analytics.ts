import { logger } from './logger';

/**
 * Analytics abstraction.
 *
 * No provider is wired up yet: events go to the logger in development and
 * nowhere in production. Swapping in Amplitude/PostHog/Firebase later means
 * implementing `AnalyticsProvider` and calling `setAnalyticsProvider` once.
 *
 * PRIVACY RULE, enforced by the payload types below: property financials —
 * values, rents, balances, cash flow — must never be sent. Events carry
 * identifiers, counts and categorical flags only. Anything richer needs a
 * deliberate design decision, not an ad-hoc property on a call site.
 */

export type AnalyticsEvent =
  | { name: 'account_created'; method: 'email' | 'apple' | 'google' | 'demo' }
  | { name: 'signed_in'; method: 'email' | 'apple' | 'google' | 'demo' }
  | { name: 'signed_out' }
  | { name: 'property_created'; propertyType: string; hasMortgage: boolean }
  | { name: 'property_updated'; propertyId: string }
  | { name: 'property_deleted'; propertyId: string }
  | { name: 'sell_hold_opened'; propertyId: string }
  | { name: 'sell_hold_completed'; propertyId: string; horizonYears: number; outcome: string }
  | { name: 'refinance_opened'; propertyId: string }
  | { name: 'scenario_saved'; propertyId: string; scenarioType: string }
  | { name: 'scenario_loaded'; propertyId: string; scenarioType: string }
  | { name: 'scenario_deleted'; scenarioId: string }
  | { name: 'paywall_viewed'; source: string }
  | { name: 'subscription_started'; tier: string; period: string }
  | { name: 'subscription_restored'; tier: string }
  | { name: 'portfolio_viewed'; propertyCount: number };

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): void;
  identify(userId: string): void;
  reset(): void;
}

/** Development provider: logs locally, sends nothing anywhere. */
const consoleProvider: AnalyticsProvider = {
  track(event) {
    const { name, ...properties } = event;
    logger.debug(`analytics: ${name}`, properties);
  },
  identify(userId) {
    logger.debug('analytics: identify', { userId });
  },
  reset() {
    logger.debug('analytics: reset');
  },
};

let provider: AnalyticsProvider = consoleProvider;

export function setAnalyticsProvider(next: AnalyticsProvider) {
  provider = next;
}

export const analytics = {
  track: (event: AnalyticsEvent) => provider.track(event),
  identify: (userId: string) => provider.identify(userId),
  reset: () => provider.reset(),
};
