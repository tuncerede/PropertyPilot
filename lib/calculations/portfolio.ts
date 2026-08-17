import type { PortfolioMetrics, PropertyMetrics, RankedProperty } from '@/types/analysis';
import type { Property } from '@/types/property';
import { calculatePropertyMetrics } from './metrics';
import { assessPerformance } from './performance';
import { num, safeDivide } from './units';

export interface PropertyWithMetrics {
  property: Property;
  metrics: PropertyMetrics;
}

export function withMetrics(properties: Property[]): PropertyWithMetrics[] {
  return properties.map((property) => ({ property, metrics: calculatePropertyMetrics(property) }));
}

/**
 * Portfolio roll-up.
 *
 * Percentages are AGGREGATED, never averaged: the portfolio cap rate is total
 * NOI over total value, and portfolio return on equity is total annual cash
 * flow over total equity. Averaging per-property percentages would let a tiny
 * property swing the headline number, which is exactly the mistake this app
 * exists to help the user avoid.
 */
export function calculatePortfolioMetrics(entries: PropertyWithMetrics[]): PortfolioMetrics {
  let totalMarketValue = 0;
  let totalMortgageBalance = 0;
  let monthlyCashFlow = 0;
  let annualNOI = 0;
  let totalUnits = 0;
  let occupiedUnits = 0;

  for (const { property, metrics } of entries) {
    totalMarketValue += num(property.estimatedMarketValue);
    totalMortgageBalance += property.hasMortgage ? num(property.mortgageBalance) : 0;
    monthlyCashFlow += metrics.monthlyCashFlow;
    annualNOI += metrics.annualNOI;
    totalUnits += num(property.unitCount);
    occupiedUnits += num(property.occupiedUnits);
  }

  const totalEquity = totalMarketValue - totalMortgageBalance;
  const annualCashFlow = monthlyCashFlow * 12;

  return {
    propertyCount: entries.length,
    totalMarketValue,
    totalMortgageBalance,
    totalEquity,
    monthlyCashFlow,
    annualCashFlow,
    annualNOI,
    totalUnits,
    occupiedUnits,
    portfolioCapRate: totalMarketValue > 0 ? safeDivide(annualNOI, totalMarketValue) : null,
    portfolioReturnOnEquity: totalEquity > 0 ? safeDivide(annualCashFlow, totalEquity) : null,
    portfolioLoanToValue:
      totalMarketValue > 0 ? safeDivide(totalMortgageBalance, totalMarketValue) : null,
    occupancyRate: totalUnits > 0 ? safeDivide(occupiedUnits, totalUnits) : null,
  };
}

/**
 * Properties ranked by how hard their equity is working, best first.
 *
 * Properties whose return on equity cannot be computed (no positive equity)
 * sort last: they need a look, but they are not comparable on this axis.
 */
export function rankByReturnOnEquity(entries: PropertyWithMetrics[]): RankedProperty[] {
  return entries
    .map(({ property, metrics }) => ({
      propertyId: property.id,
      nickname: property.nickname || property.streetAddress,
      returnOnEquity: metrics.returnOnEquity,
      equity: metrics.equity,
      monthlyCashFlow: metrics.monthlyCashFlow,
      status: assessPerformance(metrics).status,
    }))
    .sort((a, b) => {
      if (a.returnOnEquity === null && b.returnOnEquity === null) return 0;
      if (a.returnOnEquity === null) return 1;
      if (b.returnOnEquity === null) return -1;
      return b.returnOnEquity - a.returnOnEquity;
    });
}
