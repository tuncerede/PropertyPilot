import { findBreakEvenAppreciationRate, findBreakEvenSalePrice } from '@/lib/calculations/breakeven';
import { projectHold } from '@/lib/calculations/projections';
import { compareSellVsHold } from '@/lib/calculations/sellVsHold';
import { assumptionsWith, baseAssumptions, baseProperty, propertyWith } from '../fixtures';

describe('compareSellVsHold', () => {
  it('returns both projections and their difference', () => {
    const result = compareSellVsHold(baseProperty, baseAssumptions);

    expect(result.hold.finalYear).toBe(10);
    expect(result.sell.finalYear).toBe(10);
    expect(result.difference).toBeCloseTo(
      result.sell.projectedWealth - result.hold.projectedWealth,
      6,
    );
  });

  it('favours holding when the alternative return is very low', () => {
    const result = compareSellVsHold(
      baseProperty,
      assumptionsWith({ alternativeInvestmentReturn: 0.005 }),
    );

    expect(result.outcome).toBe('hold');
    expect(result.difference).toBeLessThan(0);
  });

  it('favours selling when the alternative return is very high', () => {
    const result = compareSellVsHold(
      baseProperty,
      assumptionsWith({ alternativeInvestmentReturn: 0.2, appreciationRate: 0 }),
    );

    expect(result.outcome).toBe('sell');
    expect(result.difference).toBeGreaterThan(0);
  });

  it('calls a near-tie a toss-up rather than picking a side', () => {
    const holdWealth = projectHold(baseProperty, baseAssumptions).projectedWealth;
    // Solve for the alternative return that lands sell wealth on hold wealth.
    const proceeds = 125_000 - 125_000 * 0.06 - 53_600;
    const matchingReturn = Math.pow(holdWealth / proceeds, 1 / 10) - 1;

    const result = compareSellVsHold(
      baseProperty,
      assumptionsWith({ alternativeInvestmentReturn: matchingReturn }),
    );

    expect(result.outcome).toBe('toss-up');
    expect(Math.abs(result.difference)).toBeLessThan(5_000);
  });

  it('grows the gap with the projection horizon', () => {
    const short = compareSellVsHold(baseProperty, assumptionsWith({ projectionYears: 5 }));
    const long = compareSellVsHold(baseProperty, assumptionsWith({ projectionYears: 20 }));

    expect(Math.abs(long.difference)).toBeGreaterThan(Math.abs(short.difference));
  });

  it('reduces sale proceeds — and therefore the sell case — with higher selling costs', () => {
    const cheap = compareSellVsHold(baseProperty, assumptionsWith({ sellingCostPercentage: 0.02 }));
    const costly = compareSellVsHold(baseProperty, assumptionsWith({ sellingCostPercentage: 0.1 }));

    expect(costly.sell.projectedWealth).toBeLessThan(cheap.sell.projectedWealth);
  });

  it('lowers the sell case when the experimental tax estimate is enabled', () => {
    const withoutTax = compareSellVsHold(baseProperty, baseAssumptions);
    const withTax = compareSellVsHold(
      baseProperty,
      assumptionsWith({ includeEstimatedTaxes: true, estimatedTaxRate: 0.25 }),
    );

    expect(withTax.sell.projectedWealth).toBeLessThan(withoutTax.sell.projectedWealth);
  });

  it('explains the result with factors drawn from the actual inputs', () => {
    const result = compareSellVsHold(baseProperty, baseAssumptions);

    expect(result.factors.length).toBeGreaterThan(0);
    expect(
      result.factors.some((factor) => factor.includes('alternative investment return')),
    ).toBe(true);
  });

  it('flags a negative cash flow property in its explanation', () => {
    const result = compareSellVsHold(
      propertyWith({ monthlyPrincipalInterest: 1_500 }),
      baseAssumptions,
    );

    expect(result.factors.some((factor) => factor.includes('negative monthly cash flow'))).toBe(
      true,
    );
  });
});

describe('findBreakEvenAppreciationRate', () => {
  it('finds the rate at which the two paths tie', () => {
    const rate = findBreakEvenAppreciationRate(baseProperty, baseAssumptions);

    expect(rate).not.toBeNull();

    const atBreakEven = compareSellVsHold(
      baseProperty,
      assumptionsWith({ appreciationRate: rate as number }),
    );
    expect(Math.abs(atBreakEven.difference)).toBeLessThan(50);
  });

  it('returns a rate above the current assumption when selling currently wins', () => {
    const result = compareSellVsHold(baseProperty, baseAssumptions);
    const rate = findBreakEvenAppreciationRate(baseProperty, baseAssumptions);

    if (result.difference > 0 && rate !== null) {
      expect(rate).toBeGreaterThan(baseAssumptions.appreciationRate);
    } else if (rate !== null) {
      expect(rate).toBeLessThanOrEqual(baseAssumptions.appreciationRate);
    }
  });

  it('returns null when holding wins even at the lowest searched appreciation', () => {
    const rate = findBreakEvenAppreciationRate(
      baseProperty,
      assumptionsWith({ alternativeInvestmentReturn: 0 }),
    );

    expect(rate).toBeNull();
  });

  it('returns null when no appreciation rate in the searched range closes the gap', () => {
    const rate = findBreakEvenAppreciationRate(
      baseProperty,
      assumptionsWith({ alternativeInvestmentReturn: 0.6 }),
    );

    expect(rate).toBeNull();
  });

  it('demands more appreciation as the alternative return rises', () => {
    const modest = findBreakEvenAppreciationRate(
      baseProperty,
      assumptionsWith({ alternativeInvestmentReturn: 0.07 }),
    );
    const aggressive = findBreakEvenAppreciationRate(
      baseProperty,
      assumptionsWith({ alternativeInvestmentReturn: 0.12 }),
    );

    expect(modest).not.toBeNull();
    expect(aggressive).not.toBeNull();
    expect(aggressive as number).toBeGreaterThan(modest as number);
  });

  it('is deterministic', () => {
    const first = findBreakEvenAppreciationRate(baseProperty, baseAssumptions);
    const second = findBreakEvenAppreciationRate(baseProperty, baseAssumptions);

    expect(first).toBe(second);
  });
});

describe('findBreakEvenSalePrice', () => {
  it('finds the sale price at which selling matches holding', () => {
    const price = findBreakEvenSalePrice(baseProperty, baseAssumptions);

    expect(price).not.toBeNull();

    const atBreakEven = compareSellVsHold(
      baseProperty,
      assumptionsWith({ expectedSalePrice: price as number }),
    );
    expect(Math.abs(atBreakEven.difference)).toBeLessThan(50);
  });

  it('is a positive, plausible number', () => {
    const price = findBreakEvenSalePrice(baseProperty, baseAssumptions);

    expect(price as number).toBeGreaterThan(0);
    expect(Number.isFinite(price as number)).toBe(true);
  });
});
