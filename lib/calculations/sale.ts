import type { SaleProceeds, SaleProceedsInputs } from '@/types/analysis';
import { num } from './units';

/**
 * Estimated cash after a sale.
 *
 *   grossSellingCosts  = expectedSalePrice * sellingCostPercentage
 *   preTaxSaleProceeds = expectedSalePrice
 *                      - grossSellingCosts
 *                      - sellerConcessions
 *                      - otherClosingCosts
 *                      - mortgagePayoff
 *
 * The optional tax figure is an EXPERIMENTAL, deliberately simplistic
 * estimate: a single blended rate applied to (sale price - selling costs -
 * adjusted basis), where adjusted basis is purchase price plus capital
 * improvements. It ignores depreciation recapture, suspended passive losses,
 * state tax, holding period and 1031 treatment, and must never be presented
 * as authoritative. It is off unless the user explicitly turns it on.
 */
export function calculateSaleProceeds(input: SaleProceedsInputs): SaleProceeds {
  const expectedSalePrice = num(input.expectedSalePrice);
  const grossSellingCosts = expectedSalePrice * num(input.sellingCostPercentage);
  const sellerConcessions = num(input.sellerConcessions);
  const otherClosingCosts = num(input.otherClosingCosts);
  const mortgagePayoff = num(input.mortgagePayoff);

  const preTaxSaleProceeds =
    expectedSalePrice - grossSellingCosts - sellerConcessions - otherClosingCosts - mortgagePayoff;

  let estimatedTaxableGain: number | null = null;
  let estimatedTaxes: number | null = null;

  if (input.includeEstimatedTaxes) {
    const adjustedBasis = num(input.originalPurchasePrice) + num(input.capitalImprovementsBasis);
    estimatedTaxableGain = Math.max(
      expectedSalePrice - grossSellingCosts - sellerConcessions - otherClosingCosts - adjustedBasis,
      0,
    );
    estimatedTaxes = estimatedTaxableGain * Math.max(num(input.estimatedTaxRate), 0);
  }

  return {
    expectedSalePrice,
    grossSellingCosts,
    sellerConcessions,
    otherClosingCosts,
    mortgagePayoff,
    preTaxSaleProceeds,
    estimatedTaxableGain,
    estimatedTaxes,
    netSaleProceeds: preTaxSaleProceeds - (estimatedTaxes ?? 0),
  };
}
