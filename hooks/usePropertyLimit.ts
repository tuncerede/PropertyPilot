import { useRouter } from 'expo-router';
import { propertyLimitFor, TIERS } from '@/constants/subscription';
import { usePropertyStore } from '@/store/propertyStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';

/**
 * Property-count gating.
 *
 * Free is capped at 1, Pro at 5, Investor at 25 (see
 * `constants/subscription.ts`). `requestAdd` is the single entry point for
 * "user wants another property": it either navigates to the add flow or to
 * the paywall, so no screen re-implements the limit.
 */
export function usePropertyLimit() {
  const router = useRouter();
  const tier = useSubscriptionStore((state) => state.tier);
  const count = usePropertyStore((state) => state.properties.length);

  const limit = propertyLimitFor(tier);
  const canAdd = count < limit;

  return {
    tier,
    tierName: TIERS[tier].name,
    count,
    limit,
    canAdd,
    remaining: Math.max(limit - count, 0),
    requestAdd: () => {
      if (canAdd) {
        router.push('/property/new');
      } else {
        router.push(`/paywall?reason=property_limit&tier=${tier}`);
      }
    },
  };
}
