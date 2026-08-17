import { calculateSaleProceeds } from '@/lib/calculations/sale';
import type { SaleProceedsInputs } from '@/types/analysis';

const baseInputs: SaleProceedsInputs = {
  expectedSalePrice: 125_000,
  sellingCostPercentage: 0.06,
  sellerConcessions: 0,
  otherClosingCosts: 0,
  mortgagePayoff: 53_600,
  capitalImprovementsBasis: 15_248.89,
  originalPurchasePrice: 94_000,
  includeEstimatedTaxes: false,
  estimatedTaxRate: 0.2,
};

describe('calculateSaleProceeds', () => {
  it('computes pre-tax proceeds from price, costs and payoff', () => {
    const result = calculateSaleProceeds(baseInputs);

    expect(result.grossSellingCosts).toBeCloseTo(7_500, 6);
    expect(result.preTaxSaleProceeds).toBeCloseTo(63_900, 6);
    expect(result.netSaleProceeds).toBeCloseTo(63_900, 6);
  });

  it('subtracts seller concessions and other closing costs', () => {
    const result = calculateSaleProceeds({
      ...baseInputs,
      sellerConcessions: 2_500,
      otherClosingCosts: 1_200,
    });

    expect(result.preTaxSaleProceeds).toBeCloseTo(60_200, 6);
  });

  it('leaves the tax estimate null when it is switched off', () => {
    const result = calculateSaleProceeds(baseInputs);

    expect(result.estimatedTaxableGain).toBeNull();
    expect(result.estimatedTaxes).toBeNull();
  });

  it('applies the experimental tax estimate when opted in', () => {
    const result = calculateSaleProceeds({ ...baseInputs, includeEstimatedTaxes: true });

    // 125,000 - 7,500 selling costs - (94,000 + 15,248.89) basis = 8,251.11
    expect(result.estimatedTaxableGain).toBeCloseTo(8_251.11, 6);
    expect(result.estimatedTaxes).toBeCloseTo(1_650.222, 4);
    expect(result.netSaleProceeds).toBeCloseTo(63_900 - 1_650.222, 4);
  });

  it('floors the taxable gain at zero for a sale at a loss', () => {
    const result = calculateSaleProceeds({
      ...baseInputs,
      expectedSalePrice: 80_000,
      includeEstimatedTaxes: true,
    });

    expect(result.estimatedTaxableGain).toBe(0);
    expect(result.estimatedTaxes).toBe(0);
  });

  it('handles a property with no mortgage to pay off', () => {
    const result = calculateSaleProceeds({ ...baseInputs, mortgagePayoff: 0 });

    expect(result.preTaxSaleProceeds).toBeCloseTo(117_500, 6);
  });

  it('reports negative proceeds when the payoff exceeds the sale price', () => {
    const result = calculateSaleProceeds({
      ...baseInputs,
      expectedSalePrice: 50_000,
      mortgagePayoff: 53_600,
    });

    expect(result.preTaxSaleProceeds).toBeCloseTo(-6_600, 6);
  });

  it('handles zero selling costs', () => {
    const result = calculateSaleProceeds({ ...baseInputs, sellingCostPercentage: 0 });

    expect(result.grossSellingCosts).toBe(0);
    expect(result.preTaxSaleProceeds).toBeCloseTo(71_400, 6);
  });

  it('returns zeroed figures for a zero sale price', () => {
    const result = calculateSaleProceeds({
      ...baseInputs,
      expectedSalePrice: 0,
      mortgagePayoff: 0,
    });

    expect(result.preTaxSaleProceeds).toBe(0);
    expect(Number.isFinite(result.netSaleProceeds)).toBe(true);
  });
});
