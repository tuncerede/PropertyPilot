import { BREAK_EVEN_SEARCH } from '@/constants/analysis';
import type { SellVsHoldAssumptions } from '@/types/analysis';
import type { PropertyFinancials } from '@/types/property';
import { projectHold, projectSellAndInvest } from './projections';
import { calculateSaleProceeds } from './sale';
import { num } from './units';

function sellWealthUnder(
  property: PropertyFinancials,
  assumptions: SellVsHoldAssumptions,
): number {
  const proceeds = calculateSaleProceeds({
    expectedSalePrice: assumptions.expectedSalePrice,
    sellingCostPercentage: assumptions.sellingCostPercentage,
    sellerConcessions: 0,
    otherClosingCosts: 0,
    mortgagePayoff: property.hasMortgage ? num(property.mortgageBalance) : 0,
    capitalImprovementsBasis: num(property.initialCapex),
    originalPurchasePrice: num(property.purchasePrice) + num(property.initialClosingCosts),
    includeEstimatedTaxes: assumptions.includeEstimatedTaxes,
    estimatedTaxRate: assumptions.estimatedTaxRate,
  });

  return projectSellAndInvest(
    proceeds,
    assumptions.alternativeInvestmentReturn,
    assumptions.projectionYears,
  ).projectedWealth;
}

/**
 * "What appreciation rate would make holding competitive?"
 *
 * Solves for the property appreciation rate at which projected Hold wealth
 * equals projected Sell + Invest wealth. Hold wealth is monotonically
 * increasing in the appreciation rate (a higher rate can only raise the
 * future value and therefore the terminal equity), so a bisection search is
 * both correct and cheap. There is no tidy closed form once amortization,
 * percentage-based management and exit costs are in the model, so a numerical
 * method is the honest choice.
 *
 * Returns the rate as a decimal fraction, or null when the two paths do not
 * cross anywhere in the searched range (for example, a property whose cash
 * flow is so far underwater that no plausible appreciation catches up).
 */
export function findBreakEvenAppreciationRate(
  property: PropertyFinancials,
  assumptions: SellVsHoldAssumptions,
): number | null {
  const sellWealth = sellWealthUnder(property, assumptions);

  const gapAt = (appreciationRate: number): number =>
    projectHold(property, { ...assumptions, appreciationRate }).projectedWealth - sellWealth;

  let low: number = BREAK_EVEN_SEARCH.minRate;
  let high: number = BREAK_EVEN_SEARCH.maxRate;

  const gapLow = gapAt(low);
  const gapHigh = gapAt(high);

  if (!Number.isFinite(gapLow) || !Number.isFinite(gapHigh)) return null;
  // No sign change in the searched range means the paths never cross.
  if (gapLow > 0 || gapHigh < 0) return null;

  for (let iteration = 0; iteration < BREAK_EVEN_SEARCH.maxIterations; iteration += 1) {
    const mid = (low + high) / 2;
    const gap = gapAt(mid);

    if (Math.abs(gap) <= BREAK_EVEN_SEARCH.toleranceDollars) return mid;

    if (gap < 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * "What sale price makes selling better?"
 *
 * The mirror image of the appreciation break-even: the sale price at which
 * Sell + Invest first matches Hold. Sell wealth rises monotonically with the
 * sale price, so the same bisection applies. Bounded between zero and three
 * times the expected sale price.
 */
export function findBreakEvenSalePrice(
  property: PropertyFinancials,
  assumptions: SellVsHoldAssumptions,
): number | null {
  const holdWealth = projectHold(property, assumptions).projectedWealth;

  const gapAt = (expectedSalePrice: number): number =>
    sellWealthUnder(property, { ...assumptions, expectedSalePrice }) - holdWealth;

  let low = 0;
  let high = Math.max(num(assumptions.expectedSalePrice) * 3, num(property.estimatedMarketValue) * 3, 1);

  if (gapAt(low) > 0 || gapAt(high) < 0) return null;

  for (let iteration = 0; iteration < BREAK_EVEN_SEARCH.maxIterations; iteration += 1) {
    const mid = (low + high) / 2;
    const gap = gapAt(mid);

    if (Math.abs(gap) <= BREAK_EVEN_SEARCH.toleranceDollars) return mid;

    if (gap < 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}
