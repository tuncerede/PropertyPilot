import type { SellVsHoldAssumptions } from '@/types/analysis';
import type { PropertyFinancials } from '@/types/property';

/**
 * A deterministic base property used across the calculation tests.
 *
 * It mirrors the demo duplex, whose numbers are hand-checkable:
 *   scheduled income   1,850.00
 *   vacancy loss (5%)     92.50
 *   effective income   1,757.50
 *   operating expenses   741.666…  (166.666… + 125 + 200 + 150 + 100)
 *   monthly NOI        1,015.833…
 *   debt service         697.83
 *   monthly cash flow    318.00…
 *   equity                71,400  (125,000 - 53,600)
 */
export const baseProperty: PropertyFinancials = {
  unitCount: 2,
  occupiedUnits: 2,

  purchasePrice: 94_000,
  purchaseDate: '2019-03-15',
  initialClosingCosts: 2_400,
  initialCapex: 15_248.89,
  originalDownPayment: 18_800,

  hasMortgage: true,
  mortgageBalance: 53_600,
  mortgageInterestRate: 0.0575,
  monthlyPrincipalInterest: 697.83,
  remainingTermYears: 8,

  monthlyGrossRent: 1_850,
  monthlyOtherIncome: 0,
  vacancyRate: 0.05,

  annualPropertyTax: 2_000,
  annualInsurance: 1_500,
  monthlyManagementCost: 150,
  managementPercentage: null,
  annualRepairsMaintenance: 2_400,
  monthlyOwnerUtilities: 0,
  monthlyHoa: 0,
  monthlyLawnSnow: 0,
  monthlyOtherExpenses: 100,

  estimatedMarketValue: 125_000,
  appreciationRate: 0.03,
  rentGrowthRate: 0.03,
};

export function propertyWith(overrides: Partial<PropertyFinancials>): PropertyFinancials {
  return { ...baseProperty, ...overrides };
}

/** A property owned free and clear, bought for cash. */
export const freeAndClearProperty: PropertyFinancials = propertyWith({
  hasMortgage: false,
  mortgageBalance: 0,
  mortgageInterestRate: 0,
  monthlyPrincipalInterest: 0,
  remainingTermYears: 0,
  originalDownPayment: null,
});

export const baseAssumptions: SellVsHoldAssumptions = {
  expectedSalePrice: 125_000,
  sellingCostPercentage: 0.06,
  appreciationRate: 0.03,
  rentGrowthRate: 0.03,
  expenseInflationRate: 0.03,
  alternativeInvestmentReturn: 0.07,
  projectionYears: 10,
  reinvestCashFlow: false,
  compareOnAfterSaleBasis: true,
  includeEstimatedTaxes: false,
  estimatedTaxRate: 0.2,
};

export function assumptionsWith(
  overrides: Partial<SellVsHoldAssumptions>,
): SellVsHoldAssumptions {
  return { ...baseAssumptions, ...overrides };
}
