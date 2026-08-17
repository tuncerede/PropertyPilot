import type { SubscriptionPackage, SubscriptionTier } from '@/types/subscription';

/**
 * The subscription port.
 *
 * The rest of the app depends on this interface only — never on the
 * RevenueCat SDK — so the mock and the live implementations are
 * interchangeable and the app runs with or without store credentials.
 */
export interface SubscriptionService {
  readonly isMock: boolean;

  /** Called once at startup, and again when the signed-in user changes. */
  configure(appUserId: string | null): Promise<void>;

  /** Current entitlement, resolved from RevenueCat (the source of truth). */
  getTier(): Promise<SubscriptionTier>;

  /** Packages available to purchase, normalized away from the SDK shape. */
  getPackages(): Promise<SubscriptionPackage[]>;

  /** Runs the store purchase flow. Returns the tier after the purchase. */
  purchase(packageIdentifier: string): Promise<SubscriptionTier>;

  /** Restores previous purchases. Returns the tier after restoring. */
  restore(): Promise<SubscriptionTier>;

  /** Deep link to the platform's manage-subscription screen, when available. */
  getManagementUrl(): Promise<string | null>;

  /** Clears any cached identity, e.g. on sign out. */
  logOut(): Promise<void>;
}
