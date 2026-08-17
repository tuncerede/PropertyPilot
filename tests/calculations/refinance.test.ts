import { calculatePropertyMetrics } from '@/lib/calculations/metrics';
import { monthlyLoanPayment } from '@/lib/calculations/mortgage';
import { analyzeRefinance } from '@/lib/calculations/refinance';
import { baseProperty, freeAndClearProperty, propertyWith } from '../fixtures';

describe('analyzeRefinance', () => {
  it('computes the new amortizing payment', () => {
    const result = analyzeRefinance(baseProperty, {
      newLoanAmount: 90_000,
      newInterestRate: 0.065,
      newTermYears: 30,
      closingCosts: 3_500,
      rollClosingCostsIntoLoan: false,
    });

    expect(result.newMonthlyPayment).toBeCloseTo(monthlyLoanPayment(90_000, 0.065, 30), 6);
    expect(result.newLoanAmount).toBe(90_000);
  });

  it('reports cash released net of payoff and closing costs', () => {
    const result = analyzeRefinance(baseProperty, {
      newLoanAmount: 90_000,
      newInterestRate: 0.065,
      newTermYears: 30,
      closingCosts: 3_500,
      rollClosingCostsIntoLoan: false,
    });

    expect(result.cashReleased).toBeCloseTo(90_000 - 53_600 - 3_500, 6);
  });

  it('adds rolled-in closing costs to the loan without changing net cash out', () => {
    const rolled = analyzeRefinance(baseProperty, {
      newLoanAmount: 90_000,
      newInterestRate: 0.065,
      newTermYears: 30,
      closingCosts: 3_500,
      rollClosingCostsIntoLoan: true,
    });

    expect(rolled.newLoanAmount).toBe(93_500);
    expect(rolled.cashReleased).toBeCloseTo(90_000 - 53_600, 6);
    expect(rolled.newEquity).toBeCloseTo(125_000 - 93_500, 6);
  });

  it('recomputes cash flow against unchanged NOI', () => {
    const metrics = calculatePropertyMetrics(baseProperty);
    const result = analyzeRefinance(baseProperty, {
      newLoanAmount: 90_000,
      newInterestRate: 0.065,
      newTermYears: 30,
      closingCosts: 3_500,
      rollClosingCostsIntoLoan: false,
    });

    expect(result.newMonthlyCashFlow).toBeCloseTo(
      metrics.monthlyNOI - result.newMonthlyPayment,
      6,
    );
    expect(result.currentMonthlyCashFlow).toBeCloseTo(metrics.monthlyCashFlow, 6);
  });

  it('reports a break-even period when the payment goes down', () => {
    // Same balance, longer term: the payment falls, so closing costs repay.
    const result = analyzeRefinance(baseProperty, {
      newLoanAmount: 53_600,
      newInterestRate: 0.055,
      newTermYears: 30,
      closingCosts: 3_000,
      rollClosingCostsIntoLoan: false,
    });

    expect(result.monthlyPaymentChange).toBeLessThan(0);
    expect(result.breakEvenMonths).not.toBeNull();
    expect(result.breakEvenMonths as number).toBeGreaterThan(0);
  });

  it('reports no break-even when the payment goes up', () => {
    const result = analyzeRefinance(baseProperty, {
      newLoanAmount: 100_000,
      newInterestRate: 0.075,
      newTermYears: 30,
      closingCosts: 3_000,
      rollClosingCostsIntoLoan: false,
    });

    expect(result.monthlyPaymentChange).toBeGreaterThan(0);
    expect(result.breakEvenMonths).toBeNull();
  });

  it('reports no break-even when there are no closing costs', () => {
    const result = analyzeRefinance(baseProperty, {
      newLoanAmount: 53_600,
      newInterestRate: 0.045,
      newTermYears: 30,
      closingCosts: 0,
      rollClosingCostsIntoLoan: false,
    });

    expect(result.breakEvenMonths).toBeNull();
  });

  it('handles a first mortgage on a free-and-clear property', () => {
    const result = analyzeRefinance(freeAndClearProperty, {
      newLoanAmount: 80_000,
      newInterestRate: 0.06,
      newTermYears: 30,
      closingCosts: 2_500,
      rollClosingCostsIntoLoan: false,
    });

    expect(result.currentMonthlyPayment).toBe(0);
    expect(result.cashReleased).toBeCloseTo(80_000 - 2_500, 6);
    expect(result.newEquity).toBeCloseTo(45_000, 6);
    expect(result.newLoanToValue).toBeCloseTo(0.64, 6);
  });

  it('handles a zero-interest loan', () => {
    const result = analyzeRefinance(baseProperty, {
      newLoanAmount: 60_000,
      newInterestRate: 0,
      newTermYears: 10,
      closingCosts: 0,
      rollClosingCostsIntoLoan: false,
    });

    expect(result.newMonthlyPayment).toBeCloseTo(500, 6);
    expect(Number.isFinite(result.newMonthlyCashFlow)).toBe(true);
  });

  it('handles paying the loan off entirely', () => {
    const result = analyzeRefinance(baseProperty, {
      newLoanAmount: 0,
      newInterestRate: 0.06,
      newTermYears: 30,
      closingCosts: 0,
      rollClosingCostsIntoLoan: false,
    });

    expect(result.newMonthlyPayment).toBe(0);
    expect(result.cashReleased).toBeCloseTo(-53_600, 6);
    expect(result.newEquity).toBe(125_000);
  });

  it('returns a null LTV when market value is unavailable', () => {
    const result = analyzeRefinance(propertyWith({ estimatedMarketValue: 0 }), {
      newLoanAmount: 60_000,
      newInterestRate: 0.06,
      newTermYears: 30,
      closingCosts: 0,
      rollClosingCostsIntoLoan: false,
    });

    expect(result.newLoanToValue).toBeNull();
  });
});
