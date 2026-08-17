import type { PropertyMetrics } from '@/types/analysis';
import type { PropertyFinancials } from '@/types/property';
import { calculateOperatingExpenses } from './expenses';
import { calculateIncome } from './income';
import { estimateAnnualPrincipalPaydown, resolveMonthlyDebtService } from './mortgage';
import { monthlyToAnnual, num, safeDivide } from './units';

/**
 * Net operating income. Debt service is intentionally excluded.
 *
 *   monthlyNOI = monthlyEffectiveIncome - monthlyOperatingExpenses
 */
export function calculateNOI(monthlyEffectiveIncome: number, monthlyOperatingExpenses: number) {
  const monthlyNOI = num(monthlyEffectiveIncome) - num(monthlyOperatingExpenses);
  return { monthlyNOI, annualNOI: monthlyToAnnual(monthlyNOI) };
}

/**
 *   monthlyCashFlow = monthlyNOI - monthlyPrincipalInterest
 */
export function calculateCashFlow(monthlyNOI: number, monthlyDebtService: number) {
  const monthlyCashFlow = num(monthlyNOI) - num(monthlyDebtService);
  return { monthlyCashFlow, annualCashFlow: monthlyToAnnual(monthlyCashFlow) };
}

/**
 *   equity = estimatedMarketValue - mortgageBalance
 *
 * Negative equity is a valid, meaningful result and is returned as-is.
 */
export function calculateEquity(estimatedMarketValue: number, mortgageBalance: number): number {
  return num(estimatedMarketValue) - num(mortgageBalance);
}

/**
 *   capRate = annualNOI / estimatedMarketValue
 *
 * Returns null when market value is zero or unavailable rather than dividing
 * by zero.
 */
export function calculateCapRate(annualNOI: number, estimatedMarketValue: number): number | null {
  const value = num(estimatedMarketValue);
  if (value <= 0) return null;
  return safeDivide(num(annualNOI), value);
}

export type InitialCashInputs = Pick<
  PropertyFinancials,
  'originalDownPayment' | 'initialClosingCosts' | 'initialCapex' | 'purchasePrice' | 'hasMortgage'
>;

/**
 * Estimated cash out of pocket at acquisition.
 *
 *   initialCashInvested = originalDownPayment + initialClosingCosts + initialCapex
 *
 * When the down payment is unknown we can still be exact in one case: a
 * property bought without financing was bought for cash, so the purchase
 * price is the down payment. Otherwise we return null — a guessed denominator
 * would make cash-on-cash return quietly wrong.
 */
export function calculateInitialCashInvested(input: InitialCashInputs): number | null {
  const extras = num(input.initialClosingCosts) + num(input.initialCapex);

  const down =
    typeof input.originalDownPayment === 'number' && Number.isFinite(input.originalDownPayment)
      ? input.originalDownPayment
      : input.hasMortgage
        ? null
        : num(input.purchasePrice);

  if (down === null) return null;

  const total = num(down) + extras;
  return total > 0 ? total : null;
}

/**
 *   cashOnCashReturn = annualCashFlow / initialCashInvested
 *
 * Null when initial cash invested is unknown or zero.
 */
export function calculateCashOnCashReturn(
  annualCashFlow: number,
  initialCashInvested: number | null,
): number | null {
  if (initialCashInvested === null || initialCashInvested <= 0) return null;
  return safeDivide(num(annualCashFlow), initialCashInvested);
}

/**
 * Cash Return on Current Equity.
 *
 *   returnOnEquity = annualCashFlow / currentEquity
 *
 * This is deliberately cash-only: appreciation and principal paydown are
 * reported separately so the two ideas are never silently mixed. Null when
 * equity is zero or negative (the ratio has no useful meaning there).
 */
export function calculateReturnOnEquity(
  annualCashFlow: number,
  currentEquity: number,
): number | null {
  if (num(currentEquity) <= 0) return null;
  return safeDivide(num(annualCashFlow), num(currentEquity));
}

/** estimatedMarketValue * appreciationRate — an assumption, not a forecast. */
export function calculateEstimatedAnnualAppreciation(
  estimatedMarketValue: number,
  appreciationRate: number,
): number {
  return num(estimatedMarketValue) * num(appreciationRate);
}

/**
 * The single entry point the UI uses. Everything a property dashboard shows
 * comes from here, so a metric is never recomputed inline in a component.
 */
export function calculatePropertyMetrics(property: PropertyFinancials): PropertyMetrics {
  const income = calculateIncome(property);
  const expenses = calculateOperatingExpenses(property, income.monthlyEffectiveIncome);

  const { monthlyNOI, annualNOI } = calculateNOI(
    income.monthlyEffectiveIncome,
    expenses.monthlyTotal,
  );

  const monthlyDebtService = resolveMonthlyDebtService(property);
  const { monthlyCashFlow, annualCashFlow } = calculateCashFlow(monthlyNOI, monthlyDebtService);

  const mortgageBalance = property.hasMortgage ? num(property.mortgageBalance) : 0;
  const marketValue = num(property.estimatedMarketValue);
  const equity = calculateEquity(marketValue, mortgageBalance);

  const capRate = calculateCapRate(annualNOI, marketValue);
  const initialCashInvested = calculateInitialCashInvested(property);
  const cashOnCashReturn = calculateCashOnCashReturn(annualCashFlow, initialCashInvested);
  const returnOnEquity = calculateReturnOnEquity(annualCashFlow, equity);

  const estimatedAnnualAppreciation = calculateEstimatedAnnualAppreciation(
    marketValue,
    property.appreciationRate,
  );
  const estimatedAnnualPrincipalPaydown = estimateAnnualPrincipalPaydown(property);

  const estimatedTotalAnnualReturn =
    annualCashFlow + estimatedAnnualAppreciation + (estimatedAnnualPrincipalPaydown ?? 0);

  const unitCount = num(property.unitCount);
  const occupiedUnits = num(property.occupiedUnits);

  return {
    income,
    expenses,
    monthlyNOI,
    annualNOI,
    monthlyDebtService,
    monthlyCashFlow,
    annualCashFlow,
    equity,
    loanToValue: marketValue > 0 ? safeDivide(mortgageBalance, marketValue) : null,
    capRate,
    initialCashInvested,
    cashOnCashReturn,
    returnOnEquity,
    estimatedAnnualAppreciation,
    estimatedAnnualPrincipalPaydown,
    estimatedTotalAnnualReturn,
    estimatedTotalReturnOnEquity:
      equity > 0 ? safeDivide(estimatedTotalAnnualReturn, equity) : null,
    occupancyRate: unitCount > 0 ? safeDivide(occupiedUnits, unitCount) : null,
    expenseRatio:
      income.monthlyEffectiveIncome > 0
        ? safeDivide(expenses.monthlyTotal, income.monthlyEffectiveIncome)
        : null,
    debtServiceCoverageRatio:
      monthlyDebtService > 0 ? safeDivide(monthlyNOI, monthlyDebtService) : null,
  };
}
