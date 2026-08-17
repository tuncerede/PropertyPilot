import {
  calculateCapRate,
  calculateCashFlow,
  calculateCashOnCashReturn,
  calculateEquity,
  calculateEstimatedAnnualAppreciation,
  calculateInitialCashInvested,
  calculateNOI,
  calculatePropertyMetrics,
  calculateReturnOnEquity,
} from '@/lib/calculations/metrics';
import { baseProperty, freeAndClearProperty, propertyWith } from '../fixtures';

describe('calculateNOI', () => {
  it('subtracts operating expenses from effective income', () => {
    const result = calculateNOI(1_757.5, 741.6666666666);

    expect(result.monthlyNOI).toBeCloseTo(1_015.8333333, 6);
    expect(result.annualNOI).toBeCloseTo(12_190, 4);
  });

  it('excludes debt service — NOI is before financing', () => {
    // Same inputs, whatever the mortgage is: NOI does not see it.
    const withoutDebt = calculatePropertyMetrics(baseProperty);
    const heavyDebt = calculatePropertyMetrics(
      propertyWith({ monthlyPrincipalInterest: 1_500 }),
    );

    expect(heavyDebt.monthlyNOI).toBeCloseTo(withoutDebt.monthlyNOI, 10);
  });

  it('can be negative when expenses exceed income', () => {
    expect(calculateNOI(500, 900).monthlyNOI).toBe(-400);
  });
});

describe('calculateCashFlow', () => {
  it('subtracts principal and interest from NOI', () => {
    const result = calculateCashFlow(1_015.8333333, 697.83);

    expect(result.monthlyCashFlow).toBeCloseTo(318.0033333, 6);
    expect(result.annualCashFlow).toBeCloseTo(3_816.04, 2);
  });

  it('equals NOI when there is no debt service', () => {
    expect(calculateCashFlow(1_015.83, 0).monthlyCashFlow).toBe(1_015.83);
  });

  it('goes negative when debt service exceeds NOI', () => {
    expect(calculateCashFlow(400, 527).monthlyCashFlow).toBeCloseTo(-127, 10);
  });
});

describe('calculateEquity', () => {
  it('is market value less the mortgage balance', () => {
    expect(calculateEquity(125_000, 53_600)).toBe(71_400);
  });

  it('equals the full value with no mortgage', () => {
    expect(calculateEquity(125_000, 0)).toBe(125_000);
  });

  it('reports negative equity rather than clamping it', () => {
    expect(calculateEquity(100_000, 130_000)).toBe(-30_000);
  });

  it('is zero when value and balance match', () => {
    expect(calculateEquity(90_000, 90_000)).toBe(0);
  });
});

describe('calculateCapRate', () => {
  it('divides annual NOI by market value', () => {
    expect(calculateCapRate(12_190, 125_000)).toBeCloseTo(0.09752, 8);
  });

  it('returns null instead of dividing by zero', () => {
    expect(calculateCapRate(12_190, 0)).toBeNull();
  });

  it('returns null for a negative market value', () => {
    expect(calculateCapRate(12_190, -5)).toBeNull();
  });

  it('can be negative when NOI is negative', () => {
    expect(calculateCapRate(-6_000, 120_000)).toBeCloseTo(-0.05, 10);
  });
});

describe('calculateInitialCashInvested', () => {
  it('adds closing costs and capex to the down payment', () => {
    expect(calculateInitialCashInvested(baseProperty)).toBeCloseTo(36_448.89, 6);
  });

  it('treats an unfinanced purchase as all cash', () => {
    expect(calculateInitialCashInvested(freeAndClearProperty)).toBeCloseTo(
      94_000 + 2_400 + 15_248.89,
      6,
    );
  });

  it('returns null when a financed purchase has no recorded down payment', () => {
    expect(
      calculateInitialCashInvested(propertyWith({ originalDownPayment: null })),
    ).toBeNull();
  });

  it('returns null when the total works out to zero', () => {
    expect(
      calculateInitialCashInvested(
        propertyWith({ originalDownPayment: 0, initialClosingCosts: 0, initialCapex: 0 }),
      ),
    ).toBeNull();
  });
});

describe('calculateCashOnCashReturn', () => {
  it('divides annual cash flow by cash invested', () => {
    expect(calculateCashOnCashReturn(3_816, 36_448.89)).toBeCloseTo(0.104695, 6);
  });

  it('returns null when cash invested is unknown', () => {
    expect(calculateCashOnCashReturn(3_816, null)).toBeNull();
  });

  it('returns null when cash invested is zero', () => {
    expect(calculateCashOnCashReturn(3_816, 0)).toBeNull();
  });

  it('is negative for a property that loses money', () => {
    expect(calculateCashOnCashReturn(-1_200, 30_000)).toBeCloseTo(-0.04, 10);
  });
});

describe('calculateReturnOnEquity', () => {
  it('divides annual cash flow by current equity', () => {
    expect(calculateReturnOnEquity(3_816, 71_400)).toBeCloseTo(0.0534454, 7);
  });

  it('returns null when equity is zero', () => {
    expect(calculateReturnOnEquity(3_816, 0)).toBeNull();
  });

  it('returns null when equity is negative — the ratio has no meaning there', () => {
    expect(calculateReturnOnEquity(3_816, -10_000)).toBeNull();
  });
});

describe('calculateEstimatedAnnualAppreciation', () => {
  it('applies the appreciation rate to market value', () => {
    expect(calculateEstimatedAnnualAppreciation(125_000, 0.03)).toBeCloseTo(3_750, 10);
  });

  it('is zero at a zero appreciation assumption', () => {
    expect(calculateEstimatedAnnualAppreciation(125_000, 0)).toBe(0);
  });

  it('is negative under a declining-market assumption', () => {
    expect(calculateEstimatedAnnualAppreciation(125_000, -0.02)).toBeCloseTo(-2_500, 10);
  });
});

describe('calculatePropertyMetrics', () => {
  it('produces the headline figures for the sample duplex', () => {
    const metrics = calculatePropertyMetrics(baseProperty);

    expect(metrics.monthlyNOI).toBeCloseTo(1_015.8333333, 6);
    expect(metrics.annualNOI).toBeCloseTo(12_190, 4);
    expect(metrics.monthlyCashFlow).toBeCloseTo(318.0033333, 6);
    expect(metrics.annualCashFlow).toBeCloseTo(3_816.04, 2);
    expect(metrics.equity).toBe(71_400);
    expect(metrics.capRate).toBeCloseTo(0.09752, 6);
    expect(metrics.returnOnEquity).toBeCloseTo(0.053446, 5);
    expect(metrics.cashOnCashReturn).toBeCloseTo(0.104696, 5);
    expect(metrics.occupancyRate).toBe(1);
  });

  it('keeps appreciation, paydown and cash return separate but reconcilable', () => {
    const metrics = calculatePropertyMetrics(baseProperty);

    expect(metrics.estimatedAnnualAppreciation).toBeCloseTo(3_750, 6);
    expect(metrics.estimatedAnnualPrincipalPaydown).not.toBeNull();
    expect(metrics.estimatedTotalAnnualReturn).toBeCloseTo(
      metrics.annualCashFlow +
        metrics.estimatedAnnualAppreciation +
        (metrics.estimatedAnnualPrincipalPaydown as number),
      6,
    );
    expect(metrics.estimatedTotalAnnualReturn).toBeGreaterThan(metrics.annualCashFlow);
  });

  it('handles a property owned free and clear', () => {
    const metrics = calculatePropertyMetrics(freeAndClearProperty);

    expect(metrics.monthlyDebtService).toBe(0);
    expect(metrics.monthlyCashFlow).toBeCloseTo(metrics.monthlyNOI, 10);
    expect(metrics.equity).toBe(125_000);
    expect(metrics.loanToValue).toBe(0);
    expect(metrics.estimatedAnnualPrincipalPaydown).toBeNull();
    expect(metrics.debtServiceCoverageRatio).toBeNull();
  });

  it('handles a zero market value without NaN or Infinity', () => {
    const metrics = calculatePropertyMetrics(propertyWith({ estimatedMarketValue: 0 }));

    expect(metrics.capRate).toBeNull();
    expect(metrics.loanToValue).toBeNull();
    expect(metrics.equity).toBe(-53_600);
    expect(metrics.returnOnEquity).toBeNull();
    expect(Number.isFinite(metrics.monthlyCashFlow)).toBe(true);
  });

  it('handles an underwater property', () => {
    const metrics = calculatePropertyMetrics(
      propertyWith({ estimatedMarketValue: 40_000, mortgageBalance: 53_600 }),
    );

    expect(metrics.equity).toBe(-13_600);
    expect(metrics.returnOnEquity).toBeNull();
    expect(metrics.estimatedTotalReturnOnEquity).toBeNull();
    expect(metrics.loanToValue).toBeCloseTo(1.34, 6);
  });

  it('handles high vacancy driving cash flow negative', () => {
    const metrics = calculatePropertyMetrics(propertyWith({ vacancyRate: 0.5 }));

    expect(metrics.monthlyCashFlow).toBeLessThan(0);
    expect(metrics.returnOnEquity).toBeLessThan(0);
    expect(Number.isFinite(metrics.monthlyCashFlow)).toBe(true);
  });

  it('handles a vacant property with no income at all', () => {
    const metrics = calculatePropertyMetrics(
      propertyWith({ monthlyGrossRent: 0, monthlyOtherIncome: 0, occupiedUnits: 0 }),
    );

    expect(metrics.income.monthlyEffectiveIncome).toBe(0);
    expect(metrics.expenseRatio).toBeNull();
    expect(metrics.occupancyRate).toBe(0);
    expect(metrics.monthlyNOI).toBeLessThan(0);
  });

  it('handles a zero-interest mortgage', () => {
    const metrics = calculatePropertyMetrics(
      propertyWith({ mortgageInterestRate: 0, monthlyPrincipalInterest: 0, remainingTermYears: 10 }),
    );

    expect(metrics.monthlyDebtService).toBeCloseTo(53_600 / 120, 6);
    expect(metrics.estimatedAnnualPrincipalPaydown).toBeCloseTo(5_360, 6);
  });

  it('never produces NaN for a completely empty property', () => {
    const empty = propertyWith({
      unitCount: 0,
      occupiedUnits: 0,
      purchasePrice: 0,
      initialClosingCosts: 0,
      initialCapex: 0,
      originalDownPayment: null,
      hasMortgage: false,
      mortgageBalance: 0,
      mortgageInterestRate: 0,
      monthlyPrincipalInterest: 0,
      remainingTermYears: 0,
      monthlyGrossRent: 0,
      monthlyOtherIncome: 0,
      vacancyRate: 0,
      annualPropertyTax: 0,
      annualInsurance: 0,
      monthlyManagementCost: 0,
      annualRepairsMaintenance: 0,
      monthlyOwnerUtilities: 0,
      monthlyHoa: 0,
      monthlyLawnSnow: 0,
      monthlyOtherExpenses: 0,
      estimatedMarketValue: 0,
      appreciationRate: 0,
      rentGrowthRate: 0,
    });
    const metrics = calculatePropertyMetrics(empty);

    expect(metrics.monthlyNOI).toBe(0);
    expect(metrics.monthlyCashFlow).toBe(0);
    expect(metrics.equity).toBe(0);
    expect(metrics.capRate).toBeNull();
    expect(metrics.occupancyRate).toBeNull();
    expect(metrics.cashOnCashReturn).toBeNull();
  });
});
