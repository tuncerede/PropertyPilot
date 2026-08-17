import {
  minimumTierFor,
  propertyLimitFor,
  TIERS,
  tierHasFeature,
} from '@/constants/subscription';
import { MockSubscriptionService } from '@/services/subscription/mockSubscriptionService';
import { FEATURES } from '@/types/subscription';

describe('tier limits', () => {
  it('caps free at one property, pro at five, investor at twenty-five', () => {
    expect(propertyLimitFor('free')).toBe(1);
    expect(propertyLimitFor('pro')).toBe(5);
    expect(propertyLimitFor('investor')).toBe(25);
  });
});

describe('feature gating', () => {
  it('gives the free tier no premium features', () => {
    FEATURES.forEach((feature) => {
      expect(tierHasFeature('free', feature)).toBe(false);
    });
  });

  it('unlocks the headline analyses on pro', () => {
    expect(tierHasFeature('pro', 'sellVsHold')).toBe(true);
    expect(tierHasFeature('pro', 'refinance')).toBe(true);
    expect(tierHasFeature('pro', 'portfolioDashboard')).toBe(true);
    expect(tierHasFeature('pro', 'longRangeProjections')).toBe(true);
  });

  it('reserves portfolio ranking and advanced analytics for investor', () => {
    expect(tierHasFeature('pro', 'portfolioRanking')).toBe(false);
    expect(tierHasFeature('investor', 'portfolioRanking')).toBe(true);
    expect(tierHasFeature('pro', 'advancedPortfolioAnalytics')).toBe(false);
    expect(tierHasFeature('investor', 'advancedPortfolioAnalytics')).toBe(true);
  });

  it('gives investor everything pro has', () => {
    TIERS.pro.features.forEach((feature) => {
      expect(tierHasFeature('investor', feature)).toBe(true);
    });
  });

  it('names the cheapest tier that unlocks each feature', () => {
    expect(minimumTierFor('sellVsHold')).toBe('pro');
    expect(minimumTierFor('portfolioRanking')).toBe('investor');
  });
});

describe('MockSubscriptionService', () => {
  it('reports the tier it was constructed with', async () => {
    const service = new MockSubscriptionService('free');
    await service.configure('user-1');

    expect(service.isMock).toBe(true);
    expect(await service.getTier()).toBe('free');
  });

  it('falls back to free for an unrecognised tier', async () => {
    const service = new MockSubscriptionService('nonsense' as 'free');
    expect(await service.getTier()).toBe('free');
  });

  it('offers a monthly and an annual package for each paid tier', async () => {
    const packages = await new MockSubscriptionService('free').getPackages();

    expect(packages.filter((item) => item.tier === 'pro')).toHaveLength(2);
    expect(packages.filter((item) => item.tier === 'investor')).toHaveLength(2);
    expect(packages.every((item) => item.priceString.startsWith('$'))).toBe(true);
  });

  it('upgrades the tier on a simulated purchase', async () => {
    const service = new MockSubscriptionService('free');

    expect(await service.purchase('pro_monthly')).toBe('pro');
    expect(await service.getTier()).toBe('pro');

    expect(await service.purchase('investor_annual')).toBe('investor');
    expect(await service.getTier()).toBe('investor');
  });

  it('leaves the tier alone for an unknown package', async () => {
    const service = new MockSubscriptionService('pro');

    expect(await service.purchase('does-not-exist')).toBe('pro');
  });

  it('restores the current tier', async () => {
    const service = new MockSubscriptionService('free');
    await service.purchase('pro_annual');

    expect(await service.restore()).toBe('pro');
  });

  it('has no management URL to offer', async () => {
    expect(await new MockSubscriptionService('pro').getManagementUrl()).toBeNull();
  });
});
