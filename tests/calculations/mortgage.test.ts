import {
  amortize,
  balanceAfterMonths,
  estimateAnnualPrincipalPaydown,
  monthlyLoanPayment,
  resolveMonthlyDebtService,
} from '@/lib/calculations/mortgage';
import { baseProperty, freeAndClearProperty, propertyWith } from '../fixtures';

describe('monthlyLoanPayment', () => {
  it('matches the standard amortizing payment formula', () => {
    // 200,000 at 6% over 30 years is a widely published $1,199.10.
    expect(monthlyLoanPayment(200_000, 0.06, 30)).toBeCloseTo(1_199.1, 1);
  });

  it('computes the demo loan payment', () => {
    expect(monthlyLoanPayment(53_600, 0.0575, 8)).toBeCloseTo(697.87, 2);
  });

  it('divides principal evenly when the interest rate is zero', () => {
    expect(monthlyLoanPayment(120_000, 0, 10)).toBeCloseTo(1_000, 10);
  });

  it('returns zero for a zero principal', () => {
    expect(monthlyLoanPayment(0, 0.06, 30)).toBe(0);
  });

  it('returns zero for a zero or negative term', () => {
    expect(monthlyLoanPayment(100_000, 0.06, 0)).toBe(0);
    expect(monthlyLoanPayment(100_000, 0.06, -5)).toBe(0);
  });

  it('produces a higher payment for a higher rate', () => {
    expect(monthlyLoanPayment(200_000, 0.07, 30)).toBeGreaterThan(
      monthlyLoanPayment(200_000, 0.05, 30),
    );
  });
});

describe('resolveMonthlyDebtService', () => {
  it('prefers the payment the landlord actually pays', () => {
    expect(resolveMonthlyDebtService(baseProperty)).toBe(697.83);
  });

  it('derives a payment from balance, rate and term when none is stated', () => {
    const property = propertyWith({ monthlyPrincipalInterest: 0 });
    expect(resolveMonthlyDebtService(property)).toBeCloseTo(697.87, 2);
  });

  it('is zero for a property owned free and clear', () => {
    expect(resolveMonthlyDebtService(freeAndClearProperty)).toBe(0);
  });

  it('is zero when the mortgage flag is off even if stale figures remain', () => {
    const property = propertyWith({ hasMortgage: false });
    expect(resolveMonthlyDebtService(property)).toBe(0);
  });
});

describe('amortize', () => {
  it('splits the first payment into interest and principal correctly', () => {
    const result = amortize(200_000, 0.06, 1_199.1, 1);
    const first = result.months[0];

    expect(first?.interest).toBeCloseTo(1_000, 6);
    expect(first?.principal).toBeCloseTo(199.1, 6);
    expect(first?.endingBalance).toBeCloseTo(199_800.9, 6);
  });

  it('pays a 30-year loan off almost exactly at term', () => {
    const payment = monthlyLoanPayment(200_000, 0.06, 30);
    const result = amortize(200_000, 0.06, payment, 360);

    expect(result.endingBalance).toBeCloseTo(0, 2);
    expect(result.payoffMonth).toBe(360);
  });

  it('amortizes a zero-interest loan linearly', () => {
    const result = amortize(12_000, 0, 1_000, 12);

    expect(result.totalInterest).toBe(0);
    expect(result.endingBalance).toBe(0);
    expect(result.totalPrincipal).toBeCloseTo(12_000, 6);
  });

  it('never overshoots into a negative balance', () => {
    const result = amortize(1_000, 0.05, 5_000, 6);

    expect(result.endingBalance).toBe(0);
    expect(result.payoffMonth).toBe(1);
    expect(result.months.every((month) => month.endingBalance >= 0)).toBe(true);
  });

  it('flags a payment that does not cover interest', () => {
    const result = amortize(200_000, 0.06, 500, 12);

    expect(result.isNegativelyAmortizing).toBe(true);
    expect(result.totalPrincipal).toBe(0);
    expect(result.endingBalance).toBe(200_000);
  });

  it('returns an empty schedule for a zero-month horizon', () => {
    const result = amortize(200_000, 0.06, 1_199.1, 0);

    expect(result.months).toHaveLength(0);
    expect(result.endingBalance).toBe(200_000);
  });

  it('handles a zero starting balance', () => {
    const result = amortize(0, 0.06, 1_199.1, 12);

    expect(result.endingBalance).toBe(0);
    expect(result.totalInterest).toBe(0);
  });

  it('reduces the balance monotonically', () => {
    const result = amortize(53_600, 0.0575, 697.83, 96);
    const balances = result.months.map((month) => month.endingBalance);

    balances.forEach((balance, index) => {
      if (index === 0) return;
      expect(balance).toBeLessThanOrEqual(balances[index - 1] as number);
    });
    // The stated payment is rounded to the cent, so a few dollars of the
    // balance survive the scheduled term rather than landing exactly on zero.
    expect(result.endingBalance).toBeLessThan(10);
  });
});

describe('balanceAfterMonths', () => {
  it('reports the remaining balance partway through the term', () => {
    const balance = balanceAfterMonths(53_600, 0.0575, 697.83, 48);

    expect(balance).toBeGreaterThan(0);
    expect(balance).toBeLessThan(53_600);
  });

  it('is not a straight line — a mortgage pays down faster later', () => {
    const start = 200_000;
    const payment = monthlyLoanPayment(start, 0.06, 30);
    const halfway = balanceAfterMonths(start, 0.06, payment, 180);

    // Straight-line would leave 100,000 at the halfway point.
    expect(halfway).toBeGreaterThan(130_000);
  });
});

describe('estimateAnnualPrincipalPaydown', () => {
  it('sums twelve months of principal reduction', () => {
    const paydown = estimateAnnualPrincipalPaydown(baseProperty);

    expect(paydown).not.toBeNull();
    expect(paydown as number).toBeCloseTo(5_433.68, 1);
  });

  it('returns null with no mortgage', () => {
    expect(estimateAnnualPrincipalPaydown(freeAndClearProperty)).toBeNull();
  });

  it('returns null when the balance is zero', () => {
    expect(estimateAnnualPrincipalPaydown(propertyWith({ mortgageBalance: 0 }))).toBeNull();
  });

  it('returns null when the payment cannot amortize the loan', () => {
    const property = propertyWith({
      monthlyPrincipalInterest: 50,
      remainingTermYears: 0,
    });

    expect(estimateAnnualPrincipalPaydown(property)).toBeNull();
  });
});
