import { env } from '@/lib/config/env';
import { logger } from '../logger';
import { MockSubscriptionService } from './mockSubscriptionService';
import { canUseRevenueCat, RevenueCatService } from './revenueCatService';
import type { SubscriptionService } from './types';

export type { SubscriptionService } from './types';
export { MockSubscriptionService } from './mockSubscriptionService';
export { RevenueCatService } from './revenueCatService';

let instance: SubscriptionService | null = null;

/**
 * Resolves the subscription service for this runtime.
 *
 * Live RevenueCat when credentials and the native SDK are both present;
 * the mock otherwise. The app is always usable either way.
 */
export function getSubscriptionService(): SubscriptionService {
  if (instance) return instance;

  if (!env.demoMode && canUseRevenueCat()) {
    logger.debug('Using the live RevenueCat subscription service');
    instance = new RevenueCatService();
  } else {
    logger.debug('Using the mock subscription service', {
      demoMode: env.demoMode,
      hasCredentials: env.hasRevenueCatCredentials,
    });
    instance = new MockSubscriptionService();
  }

  return instance;
}

/** Test hook: replace the resolved service. */
export function setSubscriptionService(service: SubscriptionService | null) {
  instance = service;
}
