import type { OperatingExpenseBreakdown } from '@/types/analysis';
import type { PropertyFinancials } from '@/types/property';
import { annualToMonthly, monthlyToAnnual, num } from './units';

export type ExpenseInputs = Pick<
  PropertyFinancials,
  | 'annualPropertyTax'
  | 'annualInsurance'
  | 'monthlyManagementCost'
  | 'managementPercentage'
  | 'annualRepairsMaintenance'
  | 'monthlyOwnerUtilities'
  | 'monthlyHoa'
  | 'monthlyLawnSnow'
  | 'monthlyOtherExpenses'
>;

/**
 * Monthly operating expenses.
 *
 * Operating expenses deliberately EXCLUDE mortgage principal + interest —
 * debt service is not an operating expense and must not enter NOI.
 *
 * Management is percentage-based when `managementPercentage` is a positive
 * number, in which case it is charged on effective (collected) income rather
 * than scheduled rent. Otherwise the flat `monthlyManagementCost` is used.
 */
export function calculateOperatingExpenses(
  input: ExpenseInputs,
  monthlyEffectiveIncome: number,
): OperatingExpenseBreakdown {
  const managementPercentage = input.managementPercentage;
  const managementIsPercentageBased =
    typeof managementPercentage === 'number' &&
    Number.isFinite(managementPercentage) &&
    managementPercentage > 0;

  const monthlyManagement = managementIsPercentageBased
    ? Math.max(num(monthlyEffectiveIncome), 0) * num(managementPercentage)
    : num(input.monthlyManagementCost);

  const monthlyPropertyTax = annualToMonthly(input.annualPropertyTax);
  const monthlyInsurance = annualToMonthly(input.annualInsurance);
  const monthlyRepairs = annualToMonthly(input.annualRepairsMaintenance);
  const monthlyOwnerUtilities = num(input.monthlyOwnerUtilities);
  const monthlyHoa = num(input.monthlyHoa);
  const monthlyLawnSnow = num(input.monthlyLawnSnow);
  const monthlyOther = num(input.monthlyOtherExpenses);

  const monthlyTotal =
    monthlyPropertyTax +
    monthlyInsurance +
    monthlyManagement +
    monthlyRepairs +
    monthlyOwnerUtilities +
    monthlyHoa +
    monthlyLawnSnow +
    monthlyOther;

  return {
    monthlyPropertyTax,
    monthlyInsurance,
    monthlyManagement,
    monthlyRepairs,
    monthlyOwnerUtilities,
    monthlyHoa,
    monthlyLawnSnow,
    monthlyOther,
    monthlyTotal,
    annualTotal: monthlyToAnnual(monthlyTotal),
    managementIsPercentageBased,
  };
}

/**
 * The portion of monthly operating expenses that is a fixed dollar amount and
 * therefore grows with general expense inflation in projections. Percentage
 * based management is excluded because it is re-derived from future income.
 */
export function fixedMonthlyOperatingExpenses(breakdown: OperatingExpenseBreakdown): number {
  return breakdown.managementIsPercentageBased
    ? breakdown.monthlyTotal - breakdown.monthlyManagement
    : breakdown.monthlyTotal;
}
