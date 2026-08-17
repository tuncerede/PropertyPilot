import {
  EXPLANATION_THRESHOLDS,
  SELL_VS_HOLD_TOSS_UP_DOLLARS,
  SELL_VS_HOLD_TOSS_UP_FRACTION,
} from '@/constants/analysis';
import type {
  SellVsHoldAssumptions,
  SellVsHoldOutcome,
  SellVsHoldResult,
} from '@/types/analysis';
import type { PropertyFinancials } from '@/types/property';
import { findBreakEvenAppreciationRate } from './breakeven';
import { calculatePropertyMetrics } from './metrics';
import { projectHold, projectSellAndInvest } from './projections';
import { calculateSaleProceeds } from './sale';
import { num, safeDivide } from './units';

/** Sale proceeds implied by a set of Sell vs. Hold assumptions. */
export function saleProceedsFromAssumptions(
  property: PropertyFinancials,
  assumptions: SellVsHoldAssumptions,
) {
  return calculateSaleProceeds({
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
}

/**
 * Projected wealth from holding, under one set of assumptions. Extracted so
 * the break-even solver can re-run it with a different appreciation rate.
 */
export function holdWealthUnder(
  property: PropertyFinancials,
  assumptions: SellVsHoldAssumptions,
): number {
  return projectHold(property, assumptions).projectedWealth;
}

function classifyOutcome(holdWealth: number, sellWealth: number): SellVsHoldOutcome {
  const difference = sellWealth - holdWealth;
  const magnitude = Math.max(Math.abs(holdWealth), Math.abs(sellWealth), 1);
  const isTossUp =
    Math.abs(difference) < SELL_VS_HOLD_TOSS_UP_DOLLARS ||
    Math.abs(difference) / magnitude < SELL_VS_HOLD_TOSS_UP_FRACTION;

  if (isTossUp) return 'toss-up';
  return difference > 0 ? 'sell' : 'hold';
}

/**
 * Plain-language drivers behind the comparison. These explain the maths that
 * was actually run — they are never generated or embellished.
 */
export function explainSellVsHold(
  property: PropertyFinancials,
  assumptions: SellVsHoldAssumptions,
): string[] {
  const metrics = calculatePropertyMetrics(property);
  const factors: string[] = [];

  const roe = metrics.returnOnEquity;
  if (roe !== null && roe < EXPLANATION_THRESHOLDS.lowReturnOnEquity) {
    factors.push('Cash return on the equity tied up in this property is low.');
  } else if (roe !== null && roe >= EXPLANATION_THRESHOLDS.strongReturnOnEquity) {
    factors.push('The equity in this property is producing a strong cash return.');
  }

  if (metrics.monthlyCashFlow < 0) {
    factors.push('The property currently runs a negative monthly cash flow.');
  }

  const equityShare = safeDivide(metrics.equity, num(property.estimatedMarketValue));
  if (equityShare !== null && equityShare >= EXPLANATION_THRESHOLDS.highEquityShare) {
    factors.push('A large share of the property value is unleveraged equity.');
  }

  if (assumptions.alternativeInvestmentReturn > assumptions.appreciationRate) {
    factors.push(
      'The assumed alternative investment return is higher than the assumed appreciation rate.',
    );
  }

  if (assumptions.sellingCostPercentage >= EXPLANATION_THRESHOLDS.highSellingCostPercentage) {
    factors.push('Selling costs are assumed to be high, which reduces sale proceeds.');
  }

  if (assumptions.rentGrowthRate > assumptions.expenseInflationRate) {
    factors.push('Rent is assumed to grow faster than expenses, improving future cash flow.');
  }

  if (
    property.hasMortgage &&
    num(property.mortgageBalance) > 0 &&
    num(property.mortgageInterestRate) < EXPLANATION_THRESHOLDS.lowMortgageRate
  ) {
    factors.push('The existing mortgage carries a below-market rate that is lost on a sale.');
  }

  return factors;
}

/**
 * The signature analysis: keep the property versus sell it and invest the
 * proceeds, over the chosen horizon and under the user's own assumptions.
 *
 * The result never says "you should sell". It reports which path produces the
 * higher projected value under these assumptions, the size of the gap, the
 * factors driving it, and the appreciation rate at which the two paths tie.
 */
export function compareSellVsHold(
  property: PropertyFinancials,
  assumptions: SellVsHoldAssumptions,
): SellVsHoldResult {
  const hold = projectHold(property, assumptions);

  const saleProceeds = saleProceedsFromAssumptions(property, assumptions);
  const sell = projectSellAndInvest(
    saleProceeds,
    assumptions.alternativeInvestmentReturn,
    assumptions.projectionYears,
  );

  const difference = sell.projectedWealth - hold.projectedWealth;

  return {
    assumptions,
    hold,
    sell,
    difference,
    outcome: classifyOutcome(hold.projectedWealth, sell.projectedWealth),
    factors: explainSellVsHold(property, assumptions),
    breakEvenAppreciationRate: findBreakEvenAppreciationRate(property, assumptions),
  };
}
