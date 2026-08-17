import type { IncomeBreakdown } from '@/types/analysis';
import type { PropertyFinancials } from '@/types/property';
import { clamp, monthlyToAnnual, num } from './units';

export type IncomeInputs = Pick<
  PropertyFinancials,
  'monthlyGrossRent' | 'monthlyOtherIncome' | 'vacancyRate'
>;

/**
 * Effective (collected) rental income.
 *
 *   monthlyScheduledIncome = monthlyGrossRent + monthlyOtherIncome
 *   monthlyVacancyLoss     = monthlyScheduledIncome * vacancyRate
 *   monthlyEffectiveIncome = monthlyScheduledIncome - monthlyVacancyLoss
 *
 * `vacancyRate` is a decimal fraction and is clamped to [0, 1]: a vacancy
 * assumption above 100% is not meaningful and must never produce negative
 * effective income.
 */
export function calculateIncome(input: IncomeInputs): IncomeBreakdown {
  const monthlyScheduledIncome = num(input.monthlyGrossRent) + num(input.monthlyOtherIncome);
  const vacancyRate = clamp(num(input.vacancyRate), 0, 1);
  const monthlyVacancyLoss = monthlyScheduledIncome * vacancyRate;
  const monthlyEffectiveIncome = monthlyScheduledIncome - monthlyVacancyLoss;

  return {
    monthlyScheduledIncome,
    monthlyVacancyLoss,
    monthlyEffectiveIncome,
    annualScheduledIncome: monthlyToAnnual(monthlyScheduledIncome),
    annualVacancyLoss: monthlyToAnnual(monthlyVacancyLoss),
    annualEffectiveIncome: monthlyToAnnual(monthlyEffectiveIncome),
  };
}
