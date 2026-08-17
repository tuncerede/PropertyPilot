import { analyzeRefinance } from '@/lib/calculations/refinance';
import { compareSellVsHold } from '@/lib/calculations/sellVsHold';
import {
  formatCurrency,
  formatCurrencyPerMonth,
  formatPercent,
  NOT_AVAILABLE,
} from '@/lib/formatting/number';
import { parseRefinanceInputs, parseSellVsHoldAssumptions } from '@/lib/validation/scenario';
import type { PropertyFinancials, PropertyScenario } from '@/types/property';

export interface ComparisonCell {
  display: string;
  /** Null when the figure is unavailable; such cells never win a row. */
  value: number | null;
  /** A subset of the UI text tones; the matrix passes it straight through. */
  tone?: 'primary' | 'secondary' | 'brand' | 'info' | 'positive' | 'negative';
}

export interface ComparisonRow {
  label: string;
  cells: ComparisonCell[];
  /** Marks the winning column. Omit for rows where "best" is meaningless. */
  better?: 'higher' | 'lower';
  emphasis?: boolean;
}

export interface ComparisonColumn {
  id: string;
  title: string;
  subtitle?: string;
}

/**
 * Which column wins a row, or null when the row has no winner: no direction
 * set, or fewer than two comparable figures.
 */
export function bestIndexFor(row: ComparisonRow): number | null {
  if (!row.better) return null;

  const comparable = row.cells
    .map((cell, index) => ({ value: cell.value, index }))
    .filter((entry): entry is { value: number; index: number } =>
      entry.value !== null && Number.isFinite(entry.value),
    );

  if (comparable.length < 2) return null;

  const ranked = [...comparable].sort((a, b) =>
    row.better === 'higher' ? b.value - a.value : a.value - b.value,
  );

  const [first, second] = ranked;
  if (!first || !second) return null;

  // A tie has no winner — marking one of two identical figures as better is
  // simply wrong, and it is the kind of wrong a landlord would act on.
  return first.value === second.value ? null : first.index;
}

/** True when every scenario projects to the same number of years. */
export function scenariosShareHorizon(
  scenarios: PropertyScenario[],
): boolean {
  const horizons = new Set(
    scenarios.map((scenario) => parseSellVsHoldAssumptions(scenario.assumptions).projectionYears),
  );
  return horizons.size <= 1;
}

function sharesHorizon(results: { assumptions: { projectionYears: number } }[]): boolean {
  return new Set(results.map((result) => result.assumptions.projectionYears)).size <= 1;
}

const OUTCOME_LABELS: Record<string, string> = {
  hold: 'Keep',
  sell: 'Sell + Invest',
  'toss-up': 'Too close',
};

/**
 * Turns saved scenarios into comparison rows.
 *
 * Kept out of the screen so the comparison is built from the same engine
 * results the individual analyses show — a scenario can never read one way on
 * its own screen and another way in the comparison.
 *
 * `better` is only set where one direction is unambiguously preferable to the
 * landlord. Appreciation and rent-growth assumptions, for example, are inputs
 * the user chose, not outcomes to win at, so they carry no winner.
 */
export function buildSellVsHoldRows(
  property: PropertyFinancials,
  scenarios: PropertyScenario[],
): ComparisonRow[] {
  const results = scenarios.map((scenario) =>
    compareSellVsHold(property, parseSellVsHoldAssumptions(scenario.assumptions)),
  );

  /**
   * Wealth figures are only comparable when every scenario runs to the same
   * horizon. A 20-year projection beats a 5-year one for no reason other than
   * being longer, so ranking them against each other would be meaningless.
   */
  const outcomeRank: 'higher' | undefined = sharesHorizon(results) ? 'higher' : undefined;

  return [
    {
      label: 'Ahead',
      emphasis: true,
      cells: results.map((result) => ({
        display: OUTCOME_LABELS[result.outcome] ?? result.outcome,
        value: null,
        tone:
          result.outcome === 'toss-up'
            ? ('secondary' as const)
            : result.outcome === 'sell'
              ? ('info' as const)
              : ('brand' as const),
      })),
    },
    {
      label: 'By how much',
      emphasis: true,
      cells: results.map((result) => ({
        display: formatCurrency(Math.abs(result.difference)),
        value: null,
      })),
    },
    {
      label: 'Horizon',
      cells: results.map((result) => ({
        display: `${result.assumptions.projectionYears} years`,
        value: null,
      })),
    },
    {
      label: 'Keep: projected wealth',
      better: outcomeRank,
      cells: results.map((result) => ({
        display: formatCurrency(result.hold.projectedWealth),
        value: result.hold.projectedWealth,
      })),
    },
    {
      label: 'Sell + Invest: projected wealth',
      better: outcomeRank,
      cells: results.map((result) => ({
        display: formatCurrency(result.sell.projectedWealth),
        value: result.sell.projectedWealth,
      })),
    },
    {
      label: 'Cash after sale today',
      better: 'higher',
      cells: results.map((result) => ({
        display: formatCurrency(result.sell.saleProceeds.netSaleProceeds),
        value: result.sell.saleProceeds.netSaleProceeds,
      })),
    },
    {
      label: 'Projected equity at horizon',
      better: outcomeRank,
      cells: results.map((result) => ({
        display: formatCurrency(result.hold.finalEquity),
        value: result.hold.finalEquity,
      })),
    },
    {
      label: 'Accumulated cash flow',
      better: outcomeRank,
      cells: results.map((result) => ({
        display: formatCurrency(result.hold.cumulativeCashFlow),
        value: result.hold.cumulativeCashFlow,
      })),
    },
    {
      label: 'Break-even appreciation',
      cells: results.map((result) => ({
        display:
          result.breakEvenAppreciationRate === null
            ? NOT_AVAILABLE
            : formatPercent(result.breakEvenAppreciationRate, { decimals: 2 }),
        value: null,
      })),
    },
    {
      label: 'Expected sale price',
      cells: results.map((result) => ({
        display: formatCurrency(result.assumptions.expectedSalePrice),
        value: null,
      })),
    },
    {
      label: 'Selling costs',
      cells: results.map((result) => ({
        display: formatPercent(result.assumptions.sellingCostPercentage),
        value: null,
      })),
    },
    {
      label: 'Appreciation',
      cells: results.map((result) => ({
        display: formatPercent(result.assumptions.appreciationRate),
        value: null,
      })),
    },
    {
      label: 'Rent growth',
      cells: results.map((result) => ({
        display: formatPercent(result.assumptions.rentGrowthRate),
        value: null,
      })),
    },
    {
      label: 'Expense inflation',
      cells: results.map((result) => ({
        display: formatPercent(result.assumptions.expenseInflationRate),
        value: null,
      })),
    },
    {
      label: 'Alternative return',
      cells: results.map((result) => ({
        display: formatPercent(result.assumptions.alternativeInvestmentReturn),
        value: null,
      })),
    },
    {
      label: 'Reinvest cash flow',
      cells: results.map((result) => ({
        display: result.assumptions.reinvestCashFlow ? 'Yes' : 'No',
        value: null,
      })),
    },
    {
      label: 'Estimated taxes',
      cells: results.map((result) => ({
        display: result.assumptions.includeEstimatedTaxes
          ? `On (${formatPercent(result.assumptions.estimatedTaxRate)})`
          : 'Off',
        value: null,
      })),
    },
  ];
}

export function buildRefinanceRows(
  property: PropertyFinancials,
  scenarios: PropertyScenario[],
): ComparisonRow[] {
  const inputs = scenarios.map((scenario) => parseRefinanceInputs(scenario.assumptions));
  const results = inputs.map((input) => analyzeRefinance(property, input));

  return [
    {
      label: 'Cash released',
      emphasis: true,
      better: 'higher',
      cells: results.map((result) => ({
        display: formatCurrency(result.cashReleased),
        value: result.cashReleased,
      })),
    },
    {
      label: 'New monthly cash flow',
      emphasis: true,
      better: 'higher',
      cells: results.map((result) => ({
        display: formatCurrencyPerMonth(result.newMonthlyCashFlow),
        value: result.newMonthlyCashFlow,
      })),
    },
    {
      label: 'New loan amount',
      cells: results.map((result) => ({
        display: formatCurrency(result.newLoanAmount),
        value: null,
      })),
    },
    {
      label: 'Interest rate',
      better: 'lower',
      cells: inputs.map((input) => ({
        display: formatPercent(input.newInterestRate, { decimals: 2 }),
        value: input.newInterestRate,
      })),
    },
    {
      label: 'Term',
      cells: inputs.map((input) => ({
        display: `${Math.round(input.newTermYears)} years`,
        value: null,
      })),
    },
    {
      label: 'New payment',
      better: 'lower',
      cells: results.map((result) => ({
        display: formatCurrency(result.newMonthlyPayment),
        value: result.newMonthlyPayment,
      })),
    },
    {
      label: 'Payment change',
      better: 'lower',
      cells: results.map((result) => ({
        display: formatCurrencyPerMonth(result.monthlyPaymentChange),
        value: result.monthlyPaymentChange,
      })),
    },
    {
      label: 'New equity',
      better: 'higher',
      cells: results.map((result) => ({
        display: formatCurrency(result.newEquity),
        value: result.newEquity,
      })),
    },
    {
      label: 'New loan to value',
      better: 'lower',
      cells: results.map((result) => ({
        display: formatPercent(result.newLoanToValue),
        value: result.newLoanToValue,
      })),
    },
    {
      label: 'Closing costs',
      better: 'lower',
      cells: inputs.map((input) => ({
        display: formatCurrency(input.closingCosts),
        value: input.closingCosts,
      })),
    },
    {
      label: 'Break-even months',
      better: 'lower',
      cells: results.map((result) => ({
        display:
          result.breakEvenMonths === null ? NOT_AVAILABLE : `${result.breakEvenMonths} months`,
        value: result.breakEvenMonths,
      })),
    },
  ];
}
