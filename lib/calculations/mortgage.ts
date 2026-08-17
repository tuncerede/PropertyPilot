import type { AmortizationMonth, AmortizationResult } from '@/types/analysis';
import type { PropertyFinancials } from '@/types/property';
import { MONTHS_PER_YEAR, num } from './units';

export type LoanInputs = Pick<
  PropertyFinancials,
  | 'hasMortgage'
  | 'mortgageBalance'
  | 'mortgageInterestRate'
  | 'monthlyPrincipalInterest'
  | 'remainingTermYears'
>;

/**
 * Standard fully-amortizing loan payment.
 *
 *   payment = principal * [ r(1+r)^n ] / [ (1+r)^n - 1 ]
 *
 * where r is the monthly rate and n the total number of payments.
 * A zero (or effectively zero) interest rate degrades to principal / n.
 * Returns 0 for a non-positive principal or term.
 */
export function monthlyLoanPayment(
  principal: number,
  annualInterestRate: number,
  termYears: number,
): number {
  const p = num(principal);
  const years = num(termYears);
  const n = Math.round(years * MONTHS_PER_YEAR);
  if (p <= 0 || n <= 0) return 0;

  const r = num(annualInterestRate) / MONTHS_PER_YEAR;
  if (Math.abs(r) < 1e-12) {
    return p / n;
  }

  const growth = Math.pow(1 + r, n);
  const denominator = growth - 1;
  if (!Number.isFinite(growth) || denominator === 0) {
    return p / n;
  }

  const payment = (p * (r * growth)) / denominator;
  return Number.isFinite(payment) ? payment : p / n;
}

/**
 * The monthly principal + interest actually used for cash flow.
 *
 * Preference order:
 *   1. The payment the landlord told us they pay.
 *   2. A payment derived from balance / rate / remaining term.
 *   3. Zero (property owned free and clear).
 */
export function resolveMonthlyDebtService(loan: LoanInputs): number {
  if (!loan.hasMortgage) return 0;

  const stated = num(loan.monthlyPrincipalInterest);
  if (stated > 0) return stated;

  return monthlyLoanPayment(loan.mortgageBalance, loan.mortgageInterestRate, loan.remainingTermYears);
}

/**
 * Month-by-month amortization forward from the CURRENT balance.
 *
 * We never approximate the balance linearly: each month accrues interest on
 * the outstanding balance and the remainder of the payment reduces principal.
 * If the payment does not cover the interest the loan is flagged as
 * negatively amortizing and the balance is held flat rather than allowed to
 * spiral (an MVP simplification, surfaced via `isNegativelyAmortizing`).
 */
export function amortize(
  startingBalance: number,
  annualInterestRate: number,
  monthlyPayment: number,
  months: number,
): AmortizationResult {
  const monthCount = Math.max(0, Math.round(num(months)));
  const payment = num(monthlyPayment);
  const monthlyRate = num(annualInterestRate) / MONTHS_PER_YEAR;

  let balance = Math.max(num(startingBalance), 0);
  let totalInterest = 0;
  let totalPrincipal = 0;
  let payoffMonth: number | null = null;
  let isNegativelyAmortizing = false;

  const schedule: AmortizationMonth[] = [];

  for (let month = 1; month <= monthCount; month += 1) {
    if (balance <= 0) {
      schedule.push({ month, payment: 0, interest: 0, principal: 0, endingBalance: 0 });
      continue;
    }

    const interest = balance * monthlyRate;
    let principal = payment - interest;

    if (principal <= 0) {
      isNegativelyAmortizing = true;
      principal = 0;
    }

    let appliedPayment = payment;
    if (principal >= balance) {
      principal = balance;
      appliedPayment = principal + interest;
    }

    balance = Math.max(balance - principal, 0);
    totalInterest += interest;
    totalPrincipal += principal;

    if (balance <= 0 && payoffMonth === null) {
      payoffMonth = month;
    }

    schedule.push({
      month,
      payment: appliedPayment,
      interest,
      principal,
      endingBalance: balance,
    });
  }

  return {
    months: schedule,
    endingBalance: balance,
    totalInterest,
    totalPrincipal,
    isNegativelyAmortizing,
    payoffMonth,
  };
}

/** Remaining balance after `months` of payments. */
export function balanceAfterMonths(
  startingBalance: number,
  annualInterestRate: number,
  monthlyPayment: number,
  months: number,
): number {
  return amortize(startingBalance, annualInterestRate, monthlyPayment, months).endingBalance;
}

/**
 * Principal reduction over the next 12 months, or null when the property has
 * no modelled loan (no balance, or no payment we can amortize with).
 */
export function estimateAnnualPrincipalPaydown(loan: LoanInputs): number | null {
  if (!loan.hasMortgage) return null;

  const balance = num(loan.mortgageBalance);
  const payment = resolveMonthlyDebtService(loan);
  if (balance <= 0 || payment <= 0) return null;

  const result = amortize(balance, loan.mortgageInterestRate, payment, MONTHS_PER_YEAR);
  if (result.isNegativelyAmortizing && result.totalPrincipal === 0) return null;

  return result.totalPrincipal;
}
