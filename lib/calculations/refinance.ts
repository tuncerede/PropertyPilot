import type { RefinanceInputs, RefinanceResult } from '@/types/analysis';
import type { PropertyFinancials } from '@/types/property';
import { calculatePropertyMetrics } from './metrics';
import { monthlyLoanPayment } from './mortgage';
import { monthlyToAnnual, num, safeDivide } from './units';

/**
 * Refinance analysis against the property's current position.
 *
 *   newMonthlyPayment  = amortizing payment on the new loan
 *   cashReleased       = newLoanAmount - currentPayoff - closingCosts
 *                        (closing costs excluded when rolled into the loan)
 *   newMonthlyCashFlow = monthlyNOI - newMonthlyPayment
 *   newEquity          = estimatedMarketValue - newLoanAmount
 *
 * Break-even is reported only when the refinance actually lowers the payment:
 * a cash-out refinance that raises the payment has no payment-savings
 * break-even, and inventing one would be misleading.
 */
export function analyzeRefinance(
  property: PropertyFinancials,
  input: RefinanceInputs,
): RefinanceResult {
  const metrics = calculatePropertyMetrics(property);

  const closingCosts = Math.max(num(input.closingCosts), 0);
  const requestedLoanAmount = Math.max(num(input.newLoanAmount), 0);
  const newLoanAmount = input.rollClosingCostsIntoLoan
    ? requestedLoanAmount + closingCosts
    : requestedLoanAmount;

  const newMonthlyPayment = monthlyLoanPayment(
    newLoanAmount,
    input.newInterestRate,
    input.newTermYears,
  );

  // Closing costs are settled at closing either way — from the loan proceeds
  // when rolled in, or out of pocket when not — so they always reduce the
  // cash the borrower walks away with.
  const currentPayoff = property.hasMortgage ? num(property.mortgageBalance) : 0;
  const cashReleased = newLoanAmount - currentPayoff - closingCosts;

  const newMonthlyCashFlow = metrics.monthlyNOI - newMonthlyPayment;
  const monthlyPaymentChange = newMonthlyPayment - metrics.monthlyDebtService;
  const monthlySavings = -monthlyPaymentChange;

  const marketValue = num(property.estimatedMarketValue);

  return {
    newLoanAmount,
    newMonthlyPayment,
    currentMonthlyPayment: metrics.monthlyDebtService,
    monthlyPaymentChange,
    cashReleased,
    newMonthlyCashFlow,
    currentMonthlyCashFlow: metrics.monthlyCashFlow,
    monthlyCashFlowChange: newMonthlyCashFlow - metrics.monthlyCashFlow,
    newAnnualCashFlow: monthlyToAnnual(newMonthlyCashFlow),
    newEquity: marketValue - newLoanAmount,
    currentEquity: metrics.equity,
    newLoanToValue: marketValue > 0 ? safeDivide(newLoanAmount, marketValue) : null,
    breakEvenMonths:
      monthlySavings > 0 && closingCosts > 0 ? Math.ceil(closingCosts / monthlySavings) : null,
  };
}
