import type { MetricExplanation } from '@/components/ui/InfoSheet';
import { PERFORMANCE_EXPLANATION } from '@/lib/calculations/performance';
import {
  formatCurrency,
  formatCurrencyPerMonth,
  formatPercent,
  NOT_AVAILABLE,
} from '@/lib/formatting/number';
import type { PropertyMetrics } from '@/types/analysis';
import type { Property } from '@/types/property';

/**
 * Metric explanations.
 *
 * Every headline figure can show what it means, the formula behind it, and
 * the exact inputs that produced it. The inputs come from the same metrics
 * object the screen renders, so an explanation can never drift from the
 * number it explains.
 */

const ESTIMATE_CAVEAT =
  'This is an estimate based on the figures you entered. It is not financial, tax, or investment advice.';

export function explainCashFlow(
  property: Property,
  metrics: PropertyMetrics,
): MetricExplanation {
  return {
    title: 'Monthly Cash Flow',
    meaning:
      'What is left over each month after collecting rent, paying every operating expense, and making the mortgage payment. This is the money that actually reaches your bank account.',
    formula: 'cash flow = net operating income - principal & interest',
    inputs: [
      { label: 'Effective income', value: formatCurrency(metrics.income.monthlyEffectiveIncome) },
      { label: 'Operating expenses', value: formatCurrency(-metrics.expenses.monthlyTotal) },
      { label: 'Net operating income', value: formatCurrency(metrics.monthlyNOI) },
      { label: 'Principal & interest', value: formatCurrency(-metrics.monthlyDebtService) },
      { label: 'Monthly cash flow', value: formatCurrencyPerMonth(metrics.monthlyCashFlow) },
      { label: 'Annual cash flow', value: formatCurrency(metrics.annualCashFlow) },
    ],
    caveat: property.hasMortgage
      ? ESTIMATE_CAVEAT
      : `This property is recorded as owned free and clear, so there is no debt service. ${ESTIMATE_CAVEAT}`,
  };
}

export function explainNOI(metrics: PropertyMetrics): MetricExplanation {
  return {
    title: 'Net Operating Income',
    meaning:
      'Income after operating expenses but before any mortgage payment. NOI describes the property itself, independent of how you financed it — which is why it is the basis for the cap rate.',
    formula: 'NOI = effective income - operating expenses\n(mortgage payments are excluded)',
    inputs: [
      { label: 'Scheduled rent', value: formatCurrency(metrics.income.monthlyScheduledIncome) },
      { label: 'Vacancy loss', value: formatCurrency(-metrics.income.monthlyVacancyLoss) },
      { label: 'Effective income', value: formatCurrency(metrics.income.monthlyEffectiveIncome) },
      { label: 'Property tax', value: formatCurrency(-metrics.expenses.monthlyPropertyTax) },
      { label: 'Insurance', value: formatCurrency(-metrics.expenses.monthlyInsurance) },
      { label: 'Management', value: formatCurrency(-metrics.expenses.monthlyManagement) },
      { label: 'Repairs & maintenance', value: formatCurrency(-metrics.expenses.monthlyRepairs) },
      { label: 'Other operating costs', value: formatCurrency(
        -(metrics.expenses.monthlyOwnerUtilities +
          metrics.expenses.monthlyHoa +
          metrics.expenses.monthlyLawnSnow +
          metrics.expenses.monthlyOther),
      ) },
      { label: 'Monthly NOI', value: formatCurrency(metrics.monthlyNOI) },
      { label: 'Annual NOI', value: formatCurrency(metrics.annualNOI) },
    ],
    caveat: ESTIMATE_CAVEAT,
  };
}

export function explainEquity(property: Property, metrics: PropertyMetrics): MetricExplanation {
  return {
    title: 'Equity',
    meaning:
      'The share of the property that is yours: what it is worth today, less what you still owe. This is the capital that is tied up in this property rather than working somewhere else.',
    formula: 'equity = estimated market value - mortgage balance',
    inputs: [
      { label: 'Estimated market value', value: formatCurrency(property.estimatedMarketValue) },
      {
        label: 'Mortgage balance',
        value: formatCurrency(property.hasMortgage ? -property.mortgageBalance : 0),
      },
      { label: 'Equity', value: formatCurrency(metrics.equity) },
      { label: 'Loan to value', value: formatPercent(metrics.loanToValue) },
    ],
    caveat:
      'Estimated market value is a figure you provide, not an appraisal. Equity moves with it.',
  };
}

export function explainCapRate(property: Property, metrics: PropertyMetrics): MetricExplanation {
  return {
    title: 'Cap Rate',
    meaning:
      'The return the property produces on its own value, ignoring financing. It is the standard way to compare one property against another, or against what similar properties trade at in your market.',
    formula: 'cap rate = annual NOI ÷ estimated market value',
    inputs: [
      { label: 'Annual NOI', value: formatCurrency(metrics.annualNOI) },
      { label: 'Estimated market value', value: formatCurrency(property.estimatedMarketValue) },
      { label: 'Cap rate', value: formatPercent(metrics.capRate, { decimals: 2 }) },
    ],
    caveat:
      metrics.capRate === null
        ? 'A cap rate needs a market value above zero. Add an estimated value to see it.'
        : ESTIMATE_CAVEAT,
  };
}

export function explainReturnOnEquity(metrics: PropertyMetrics): MetricExplanation {
  return {
    title: 'Cash Return on Current Equity',
    meaning:
      'How hard the equity in this property is working, measured in cash only. If your equity is large and this number is small, that capital may be producing more somewhere else — which is the question Sell vs. Hold answers.',
    formula: 'cash return on equity = annual cash flow ÷ current equity',
    inputs: [
      { label: 'Annual cash flow', value: formatCurrency(metrics.annualCashFlow) },
      { label: 'Current equity', value: formatCurrency(metrics.equity) },
      { label: 'Cash return on equity', value: formatPercent(metrics.returnOnEquity) },
    ],
    caveat:
      'This deliberately counts cash only. Appreciation and principal paydown are shown separately so the two are never mixed together.',
  };
}

export function explainTotalReturn(metrics: PropertyMetrics): MetricExplanation {
  return {
    title: 'Estimated Total Property Return',
    meaning:
      'Cash flow plus two returns you do not receive in cash: assumed appreciation, and the principal your tenants pay down. Useful for the full picture, but only the cash portion pays bills today.',
    formula: 'total return = annual cash flow + estimated appreciation + principal paydown',
    inputs: [
      { label: 'Annual cash flow', value: formatCurrency(metrics.annualCashFlow) },
      { label: 'Estimated appreciation', value: formatCurrency(metrics.estimatedAnnualAppreciation) },
      {
        label: 'Principal paydown',
        value:
          metrics.estimatedAnnualPrincipalPaydown === null
            ? NOT_AVAILABLE
            : formatCurrency(metrics.estimatedAnnualPrincipalPaydown),
      },
      { label: 'Estimated total return', value: formatCurrency(metrics.estimatedTotalAnnualReturn) },
      { label: 'As a % of equity', value: formatPercent(metrics.estimatedTotalReturnOnEquity) },
    ],
    caveat:
      'Appreciation is an assumption you set, not a forecast. Nothing guarantees a property will appreciate.',
  };
}

export function explainCashOnCash(metrics: PropertyMetrics): MetricExplanation {
  return {
    title: 'Cash-on-Cash Return',
    meaning:
      'What the cash you originally put in is earning each year. Unlike return on equity, this looks back at your actual investment rather than at today’s equity.',
    formula: 'cash-on-cash = annual cash flow ÷ initial cash invested',
    inputs: [
      { label: 'Annual cash flow', value: formatCurrency(metrics.annualCashFlow) },
      {
        label: 'Initial cash invested',
        value:
          metrics.initialCashInvested === null
            ? NOT_AVAILABLE
            : formatCurrency(metrics.initialCashInvested),
      },
      { label: 'Cash-on-cash return', value: formatPercent(metrics.cashOnCashReturn) },
    ],
    caveat:
      metrics.initialCashInvested === null
        ? 'Add your original down payment on the Acquisition step to see this.'
        : ESTIMATE_CAVEAT,
  };
}

export function explainPerformance(metrics: PropertyMetrics): MetricExplanation {
  return {
    title: 'Performance Status',
    meaning: PERFORMANCE_EXPLANATION,
    formula: 'based on monthly cash flow and cash return on equity',
    inputs: [
      { label: 'Monthly cash flow', value: formatCurrencyPerMonth(metrics.monthlyCashFlow) },
      { label: 'Cash return on equity', value: formatPercent(metrics.returnOnEquity) },
    ],
    caveat:
      'These are rules of thumb to help you prioritise, not a recommendation to buy, sell or hold anything.',
  };
}
