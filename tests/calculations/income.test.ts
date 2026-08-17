import { calculateIncome } from '@/lib/calculations/income';

describe('calculateIncome', () => {
  it('applies the vacancy assumption to scheduled income', () => {
    const result = calculateIncome({
      monthlyGrossRent: 1_850,
      monthlyOtherIncome: 0,
      vacancyRate: 0.05,
    });

    expect(result.monthlyScheduledIncome).toBe(1_850);
    expect(result.monthlyVacancyLoss).toBeCloseTo(92.5, 10);
    expect(result.monthlyEffectiveIncome).toBeCloseTo(1_757.5, 10);
  });

  it('includes other monthly income in scheduled income', () => {
    const result = calculateIncome({
      monthlyGrossRent: 1_850,
      monthlyOtherIncome: 150,
      vacancyRate: 0.05,
    });

    expect(result.monthlyScheduledIncome).toBe(2_000);
    expect(result.monthlyVacancyLoss).toBeCloseTo(100, 10);
    expect(result.monthlyEffectiveIncome).toBeCloseTo(1_900, 10);
  });

  it('annualizes to twelve times the monthly figures', () => {
    const result = calculateIncome({
      monthlyGrossRent: 1_000,
      monthlyOtherIncome: 0,
      vacancyRate: 0.1,
    });

    expect(result.annualScheduledIncome).toBe(12_000);
    expect(result.annualVacancyLoss).toBeCloseTo(1_200, 10);
    expect(result.annualEffectiveIncome).toBeCloseTo(10_800, 10);
  });

  it('handles zero vacancy', () => {
    const result = calculateIncome({
      monthlyGrossRent: 1_200,
      monthlyOtherIncome: 0,
      vacancyRate: 0,
    });

    expect(result.monthlyVacancyLoss).toBe(0);
    expect(result.monthlyEffectiveIncome).toBe(1_200);
  });

  it('handles 100% vacancy without producing negative income', () => {
    const result = calculateIncome({
      monthlyGrossRent: 1_200,
      monthlyOtherIncome: 100,
      vacancyRate: 1,
    });

    expect(result.monthlyEffectiveIncome).toBe(0);
  });

  it('clamps a nonsensical vacancy rate above 100%', () => {
    const result = calculateIncome({
      monthlyGrossRent: 1_200,
      monthlyOtherIncome: 0,
      vacancyRate: 1.5,
    });

    expect(result.monthlyEffectiveIncome).toBe(0);
  });

  it('clamps a negative vacancy rate to zero', () => {
    const result = calculateIncome({
      monthlyGrossRent: 1_200,
      monthlyOtherIncome: 0,
      vacancyRate: -0.2,
    });

    expect(result.monthlyEffectiveIncome).toBe(1_200);
  });

  it('returns zeroes for a property with no income', () => {
    const result = calculateIncome({
      monthlyGrossRent: 0,
      monthlyOtherIncome: 0,
      vacancyRate: 0.05,
    });

    expect(result.monthlyEffectiveIncome).toBe(0);
    expect(result.annualEffectiveIncome).toBe(0);
  });
});
