import { z } from 'zod';
import { DEFAULT_ASSUMPTIONS } from '@/constants/analysis';
import type { RefinanceInputs, SellVsHoldAssumptions } from '@/types/analysis';
import { SCENARIO_TYPES, type ScenarioType } from '@/types/property';

/**
 * Scenario assumption schemas.
 *
 * Assumptions are stored as JSONB, which means a row written by an older
 * build of the app can come back missing fields a newer build expects. Every
 * field therefore has a default and is `.catch()`-guarded: a stored scenario
 * always parses into a complete, usable assumption set rather than throwing
 * and losing the user's saved work.
 *
 * The trade-off is deliberate — a scenario silently gaining a sensible
 * default for a field that did not exist when it was saved is far better than
 * an analysis the user can no longer open.
 */

const rate = (fallback: number) => z.number().finite().catch(fallback);
const money = (fallback: number) => z.number().finite().catch(fallback);

export const sellVsHoldAssumptionsSchema = z.object({
  expectedSalePrice: money(0).default(0),
  sellingCostPercentage: rate(DEFAULT_ASSUMPTIONS.sellingCostPercentage).default(
    DEFAULT_ASSUMPTIONS.sellingCostPercentage,
  ),
  appreciationRate: rate(DEFAULT_ASSUMPTIONS.appreciationRate).default(
    DEFAULT_ASSUMPTIONS.appreciationRate,
  ),
  rentGrowthRate: rate(DEFAULT_ASSUMPTIONS.rentGrowthRate).default(
    DEFAULT_ASSUMPTIONS.rentGrowthRate,
  ),
  expenseInflationRate: rate(DEFAULT_ASSUMPTIONS.expenseInflationRate).default(
    DEFAULT_ASSUMPTIONS.expenseInflationRate,
  ),
  alternativeInvestmentReturn: rate(DEFAULT_ASSUMPTIONS.alternativeInvestmentReturn).default(
    DEFAULT_ASSUMPTIONS.alternativeInvestmentReturn,
  ),
  projectionYears: z.number().int().min(1).max(50).catch(DEFAULT_ASSUMPTIONS.projectionYears)
    .default(DEFAULT_ASSUMPTIONS.projectionYears),
  reinvestCashFlow: z.boolean().catch(false).default(false),
  compareOnAfterSaleBasis: z.boolean().catch(true).default(true),
  includeEstimatedTaxes: z.boolean().catch(false).default(false),
  estimatedTaxRate: rate(DEFAULT_ASSUMPTIONS.estimatedTaxRate).default(
    DEFAULT_ASSUMPTIONS.estimatedTaxRate,
  ),
});

export const refinanceInputsSchema = z.object({
  newLoanAmount: money(0).default(0),
  newInterestRate: rate(0.065).default(0.065),
  newTermYears: z.number().min(0).max(50).catch(30).default(30),
  closingCosts: money(0).default(0),
  rollClosingCostsIntoLoan: z.boolean().catch(false).default(false),
});

export const scenarioNameSchema = z
  .string()
  .trim()
  .min(1, 'Give this scenario a name.')
  .max(60, 'Keep the name under 60 characters.');

/**
 * Which scenario type each analysis saves under.
 *
 * The database enum is `hold | sell | refinance` (per the product spec). A
 * saved Sell vs. Hold analysis is one assumption set that drives both sides
 * of the comparison, and it is stored as `sell`; `hold` is reserved for a
 * future hold-only projection. Keeping the mapping in one named place stops
 * that choice from being re-guessed at each call site.
 */
export const SCENARIO_TYPE_FOR = {
  sellVsHold: 'sell',
  refinance: 'refinance',
} as const satisfies Record<string, ScenarioType>;

export function isScenarioType(value: unknown): value is ScenarioType {
  return typeof value === 'string' && (SCENARIO_TYPES as readonly string[]).includes(value);
}

/** Parse stored assumptions into a complete Sell vs. Hold set. */
export function parseSellVsHoldAssumptions(raw: unknown): SellVsHoldAssumptions {
  return sellVsHoldAssumptionsSchema.parse(raw ?? {});
}

/** Parse stored assumptions into a complete refinance input set. */
export function parseRefinanceInputs(raw: unknown): RefinanceInputs {
  return refinanceInputsSchema.parse(raw ?? {});
}
