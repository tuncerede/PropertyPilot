import { calculatePortfolioMetrics, rankByReturnOnEquity, withMetrics } from '@/lib/calculations/portfolio';
import { DEMO_PROPERTIES } from '@/constants/demo';
import type { Property } from '@/types/property';
import { baseProperty } from '../fixtures';

function asProperty(id: string, overrides: Partial<Property> = {}): Property {
  return {
    ...baseProperty,
    id,
    userId: 'test-user',
    nickname: id,
    streetAddress: '1 Test St',
    city: 'Erie',
    state: 'PA',
    zipCode: '16501',
    propertyType: 'duplex',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('calculatePortfolioMetrics', () => {
  it('returns zeroed metrics for an empty portfolio', () => {
    const metrics = calculatePortfolioMetrics([]);

    expect(metrics.propertyCount).toBe(0);
    expect(metrics.totalMarketValue).toBe(0);
    expect(metrics.totalEquity).toBe(0);
    expect(metrics.portfolioCapRate).toBeNull();
    expect(metrics.portfolioReturnOnEquity).toBeNull();
    expect(metrics.occupancyRate).toBeNull();
  });

  it('sums values, balances and cash flow across properties', () => {
    const entries = withMetrics([asProperty('a'), asProperty('b')]);
    const metrics = calculatePortfolioMetrics(entries);

    expect(metrics.propertyCount).toBe(2);
    expect(metrics.totalMarketValue).toBe(250_000);
    expect(metrics.totalMortgageBalance).toBe(107_200);
    expect(metrics.totalEquity).toBe(142_800);
    expect(metrics.monthlyCashFlow).toBeCloseTo(636.0066666, 5);
  });

  it('aggregates the cap rate rather than averaging per-property rates', () => {
    const small = asProperty('small', { estimatedMarketValue: 50_000 });
    const large = asProperty('large', { estimatedMarketValue: 500_000 });
    const entries = withMetrics([small, large]);
    const metrics = calculatePortfolioMetrics(entries);

    const naiveAverage =
      ((entries[0]?.metrics.capRate ?? 0) + (entries[1]?.metrics.capRate ?? 0)) / 2;

    expect(metrics.portfolioCapRate).toBeCloseTo(metrics.annualNOI / 550_000, 10);
    expect(metrics.portfolioCapRate).not.toBeCloseTo(naiveAverage, 4);
  });

  it('aggregates return on equity as total cash flow over total equity', () => {
    const entries = withMetrics([asProperty('a'), asProperty('b')]);
    const metrics = calculatePortfolioMetrics(entries);

    expect(metrics.portfolioReturnOnEquity).toBeCloseTo(
      metrics.annualCashFlow / metrics.totalEquity,
      10,
    );
  });

  it('rolls up occupancy across units', () => {
    const entries = withMetrics([
      asProperty('a', { unitCount: 2, occupiedUnits: 2 }),
      asProperty('b', { unitCount: 4, occupiedUnits: 1 }),
    ]);
    const metrics = calculatePortfolioMetrics(entries);

    expect(metrics.totalUnits).toBe(6);
    expect(metrics.occupiedUnits).toBe(3);
    expect(metrics.occupancyRate).toBeCloseTo(0.5, 10);
  });

  it('returns a null portfolio ROE when total equity is not positive', () => {
    const entries = withMetrics([
      asProperty('a', { estimatedMarketValue: 40_000, mortgageBalance: 60_000 }),
    ]);
    const metrics = calculatePortfolioMetrics(entries);

    expect(metrics.totalEquity).toBeLessThan(0);
    expect(metrics.portfolioReturnOnEquity).toBeNull();
  });

  it('ignores the balance of a property marked as owned free and clear', () => {
    const entries = withMetrics([asProperty('a', { hasMortgage: false })]);
    const metrics = calculatePortfolioMetrics(entries);

    expect(metrics.totalMortgageBalance).toBe(0);
    expect(metrics.totalEquity).toBe(125_000);
  });
});

describe('rankByReturnOnEquity', () => {
  it('orders properties best-first by cash return on equity', () => {
    const ranked = rankByReturnOnEquity(withMetrics(DEMO_PROPERTIES));
    const rates = ranked.map((entry) => entry.returnOnEquity as number);

    expect(ranked).toHaveLength(DEMO_PROPERTIES.length);
    rates.forEach((rate, index) => {
      if (index === 0) return;
      expect(rate).toBeLessThanOrEqual(rates[index - 1] as number);
    });
  });

  it('sorts properties with no measurable return on equity last', () => {
    const ranked = rankByReturnOnEquity(
      withMetrics([
        asProperty('underwater', { estimatedMarketValue: 40_000, mortgageBalance: 90_000 }),
        asProperty('healthy'),
      ]),
    );

    expect(ranked[0]?.propertyId).toBe('healthy');
    expect(ranked[1]?.returnOnEquity).toBeNull();
  });

  it('attaches a performance status to each ranked property', () => {
    const ranked = rankByReturnOnEquity(withMetrics(DEMO_PROPERTIES));

    ranked.forEach((entry) => {
      expect(['strong', 'watch', 'review']).toContain(entry.status);
    });
  });

  it('falls back to the street address when a nickname is missing', () => {
    const ranked = rankByReturnOnEquity(
      withMetrics([asProperty('x', { nickname: '', streetAddress: '9 Fallback Rd' })]),
    );

    expect(ranked[0]?.nickname).toBe('9 Fallback Rd');
  });
});
