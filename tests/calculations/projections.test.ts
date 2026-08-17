import { futureValue, projectHold, projectSellAndInvest } from '@/lib/calculations/projections';
import { calculateSaleProceeds } from '@/lib/calculations/sale';
import { assumptionsWith, baseAssumptions, baseProperty, propertyWith } from '../fixtures';

describe('futureValue', () => {
  it('compounds annually', () => {
    expect(futureValue(100_000, 0.07, 10)).toBeCloseTo(196_715.1357, 4);
  });

  it('returns the present value at a zero rate', () => {
    expect(futureValue(100_000, 0, 10)).toBe(100_000);
  });

  it('returns the present value over a zero horizon', () => {
    expect(futureValue(100_000, 0.07, 0)).toBe(100_000);
  });

  it('shrinks under a negative rate', () => {
    expect(futureValue(100_000, -0.05, 3)).toBeCloseTo(85_737.5, 4);
  });

  it('stays finite for absurd inputs', () => {
    expect(Number.isFinite(futureValue(100_000, -5, 10))).toBe(true);
  });
});

describe('projectHold', () => {
  it('produces one row per projected year', () => {
    const projection = projectHold(baseProperty, assumptionsWith({ projectionYears: 10 }));

    expect(projection.years).toHaveLength(10);
    expect(projection.years[0]?.year).toBe(1);
    expect(projection.years[9]?.year).toBe(10);
    expect(projection.finalYear).toBe(10);
  });

  it('appreciates the property value by compounding', () => {
    const projection = projectHold(baseProperty, assumptionsWith({ projectionYears: 5 }));

    expect(projection.years[0]?.propertyValue).toBeCloseTo(125_000 * 1.03, 6);
    expect(projection.finalPropertyValue).toBeCloseTo(125_000 * Math.pow(1.03, 5), 6);
  });

  it('grows rent by compounding at the rent growth rate', () => {
    const projection = projectHold(baseProperty, assumptionsWith({ projectionYears: 3 }));

    expect(projection.years[0]?.monthlyGrossRent).toBeCloseTo(1_850 * 1.03, 6);
    expect(projection.years[2]?.monthlyGrossRent).toBeCloseTo(1_850 * Math.pow(1.03, 3), 6);
  });

  it('amortizes the loan properly rather than straight-lining it', () => {
    const projection = projectHold(baseProperty, assumptionsWith({ projectionYears: 8 }));
    const balances = projection.years.map((year) => year.mortgageBalance);

    balances.forEach((balance, index) => {
      if (index === 0) return;
      expect(balance).toBeLessThan(balances[index - 1] as number);
    });
    // The demo loan has 8 years left, so it is all but retired at the horizon.
    expect(projection.finalMortgageBalance).toBeLessThan(10);
  });

  it('stops charging debt service once the loan is paid off', () => {
    const projection = projectHold(baseProperty, assumptionsWith({ projectionYears: 12 }));

    expect(projection.years[11]?.annualDebtService).toBeCloseTo(0, 6);
    expect(projection.years[11]?.annualCashFlow).toBeGreaterThan(
      projection.years[0]?.annualCashFlow as number,
    );
  });

  it('charges no debt service for a property owned free and clear', () => {
    const projection = projectHold(
      propertyWith({ hasMortgage: false, mortgageBalance: 0, monthlyPrincipalInterest: 0 }),
      baseAssumptions,
    );

    expect(projection.years.every((year) => year.annualDebtService === 0)).toBe(true);
    expect(projection.finalMortgageBalance).toBe(0);
  });

  it('accumulates cash flow without compounding it by default', () => {
    const projection = projectHold(baseProperty, assumptionsWith({ projectionYears: 3 }));
    const summed = projection.years.reduce((total, year) => total + year.annualCashFlow, 0);

    expect(projection.cumulativeCashFlow).toBeCloseTo(summed, 6);
  });

  it('compounds retained cash flow when reinvestment is switched on', () => {
    const plain = projectHold(baseProperty, assumptionsWith({ projectionYears: 10 }));
    const reinvested = projectHold(
      baseProperty,
      assumptionsWith({ projectionYears: 10, reinvestCashFlow: true }),
    );

    expect(reinvested.cumulativeCashFlow).toBeGreaterThan(plain.cumulativeCashFlow);
  });

  it('inflates fixed operating expenses over time', () => {
    const projection = projectHold(
      baseProperty,
      assumptionsWith({ projectionYears: 5, rentGrowthRate: 0, expenseInflationRate: 0.04 }),
    );

    expect(projection.years[4]?.annualOperatingExpenses).toBeGreaterThan(
      projection.years[0]?.annualOperatingExpenses as number,
    );
  });

  it('keeps equity as value minus balance in every year', () => {
    const projection = projectHold(baseProperty, assumptionsWith({ projectionYears: 6 }));

    projection.years.forEach((year) => {
      expect(year.equity).toBeCloseTo(year.propertyValue - year.mortgageBalance, 6);
    });
  });

  it('subtracts exit costs when comparing on an after-sale basis', () => {
    const net = projectHold(baseProperty, assumptionsWith({ compareOnAfterSaleBasis: true }));
    const gross = projectHold(baseProperty, assumptionsWith({ compareOnAfterSaleBasis: false }));

    expect(gross.exitCosts).toBe(0);
    expect(net.exitCosts).toBeCloseTo(net.finalPropertyValue * 0.06, 6);
    expect(net.projectedWealth).toBeLessThan(gross.projectedWealth);
  });

  it('separates equity from accumulated cash flow in projected wealth', () => {
    const projection = projectHold(
      baseProperty,
      assumptionsWith({ projectionYears: 10, compareOnAfterSaleBasis: false }),
    );

    expect(projection.projectedWealth).toBeCloseTo(
      projection.finalEquity + projection.cumulativeCashFlow,
      6,
    );
  });

  it('produces higher wealth under a higher appreciation assumption', () => {
    const low = projectHold(baseProperty, assumptionsWith({ appreciationRate: 0.01 }));
    const high = projectHold(baseProperty, assumptionsWith({ appreciationRate: 0.06 }));

    expect(high.projectedWealth).toBeGreaterThan(low.projectedWealth);
  });

  it('handles a zero-appreciation, zero-growth flat world', () => {
    const projection = projectHold(
      baseProperty,
      assumptionsWith({
        projectionYears: 5,
        appreciationRate: 0,
        rentGrowthRate: 0,
        expenseInflationRate: 0,
      }),
    );

    expect(projection.finalPropertyValue).toBeCloseTo(125_000, 6);
    expect(projection.years[0]?.monthlyGrossRent).toBeCloseTo(1_850, 6);
  });

  it('clamps a zero-year horizon to a single year rather than crashing', () => {
    const projection = projectHold(baseProperty, assumptionsWith({ projectionYears: 0 }));

    expect(projection.years).toHaveLength(1);
    expect(Number.isFinite(projection.projectedWealth)).toBe(true);
  });

  it('stays finite for an underwater, cash-flow-negative property', () => {
    const projection = projectHold(
      propertyWith({
        estimatedMarketValue: 40_000,
        mortgageBalance: 90_000,
        monthlyPrincipalInterest: 1_400,
        monthlyGrossRent: 600,
      }),
      baseAssumptions,
    );

    expect(Number.isFinite(projection.projectedWealth)).toBe(true);
    expect(projection.years.every((year) => Number.isFinite(year.equity))).toBe(true);
  });
});

describe('projectSellAndInvest', () => {
  const proceeds = calculateSaleProceeds({
    expectedSalePrice: 125_000,
    sellingCostPercentage: 0.06,
    sellerConcessions: 0,
    otherClosingCosts: 0,
    mortgagePayoff: 53_600,
    capitalImprovementsBasis: 0,
    originalPurchasePrice: 94_000,
    includeEstimatedTaxes: false,
    estimatedTaxRate: 0.2,
  });

  it('starts from the net sale proceeds', () => {
    const projection = projectSellAndInvest(proceeds, 0.07, 10);

    expect(projection.startingInvestment).toBeCloseTo(63_900, 6);
  });

  it('compounds at the alternative investment return', () => {
    const projection = projectSellAndInvest(proceeds, 0.07, 10);

    expect(projection.projectedWealth).toBeCloseTo(63_900 * Math.pow(1.07, 10), 4);
    expect(projection.years).toHaveLength(10);
  });

  it('does not grow at a zero assumed return', () => {
    const projection = projectSellAndInvest(proceeds, 0, 20);

    expect(projection.projectedWealth).toBeCloseTo(63_900, 6);
  });

  it('produces a longer horizon with a larger result', () => {
    const short = projectSellAndInvest(proceeds, 0.07, 5);
    const long = projectSellAndInvest(proceeds, 0.07, 20);

    expect(long.projectedWealth).toBeGreaterThan(short.projectedWealth);
  });
});
