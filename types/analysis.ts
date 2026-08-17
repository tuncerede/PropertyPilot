/** Result types produced by the calculation engine (`lib/calculations`). */

export interface IncomeBreakdown {
  monthlyScheduledIncome: number;
  monthlyVacancyLoss: number;
  monthlyEffectiveIncome: number;
  annualScheduledIncome: number;
  annualVacancyLoss: number;
  annualEffectiveIncome: number;
}

export interface OperatingExpenseBreakdown {
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyManagement: number;
  monthlyRepairs: number;
  monthlyOwnerUtilities: number;
  monthlyHoa: number;
  monthlyLawnSnow: number;
  monthlyOther: number;
  monthlyTotal: number;
  annualTotal: number;
  /** True when management was derived from a percentage of effective income. */
  managementIsPercentageBased: boolean;
}

export interface PropertyMetrics {
  income: IncomeBreakdown;
  expenses: OperatingExpenseBreakdown;

  monthlyNOI: number;
  annualNOI: number;

  monthlyDebtService: number;
  monthlyCashFlow: number;
  annualCashFlow: number;

  equity: number;
  /** Loan-to-value as a decimal fraction, or null when value is unavailable. */
  loanToValue: number | null;

  /** Decimal fraction, or null when market value is 0/unavailable. */
  capRate: number | null;
  /** Estimated cash out of pocket at acquisition, or null when unknown. */
  initialCashInvested: number | null;
  /** Decimal fraction, or null when initial cash invested is unknown/zero. */
  cashOnCashReturn: number | null;
  /**
   * Cash Return on Current Equity = annualCashFlow / equity.
   * Deliberately excludes appreciation and principal paydown.
   */
  returnOnEquity: number | null;

  /** estimatedMarketValue * appreciationRate. An assumption, not a forecast. */
  estimatedAnnualAppreciation: number;
  /** Principal reduction over the next 12 months, or null without a loan model. */
  estimatedAnnualPrincipalPaydown: number | null;
  /** cash flow + appreciation + principal paydown. Kept separate from ROE. */
  estimatedTotalAnnualReturn: number | null;
  /** estimatedTotalAnnualReturn / equity, or null. */
  estimatedTotalReturnOnEquity: number | null;

  /** Occupied / total units as a decimal fraction, or null when unitCount is 0. */
  occupancyRate: number | null;
  /** Operating expenses / effective income, or null when income is 0. */
  expenseRatio: number | null;
  /** monthlyNOI / monthlyDebtService, or null when there is no debt service. */
  debtServiceCoverageRatio: number | null;
}

export type PerformanceStatus = 'strong' | 'watch' | 'review';

export interface PerformanceAssessment {
  status: PerformanceStatus;
  /** Short human-readable reason, e.g. "Cash return on equity is 5.4%". */
  reason: string;
  factors: string[];
}

export interface SaleProceedsInputs {
  expectedSalePrice: number;
  /** Decimal fraction of sale price, e.g. 0.06 for 6%. */
  sellingCostPercentage: number;
  sellerConcessions: number;
  otherClosingCosts: number;
  mortgagePayoff: number;
  /** Capital improvements added to basis. Informational for the tax estimate. */
  capitalImprovementsBasis: number;
  /** Purchase price, used only by the optional tax estimate. */
  originalPurchasePrice: number;
  /** Opt-in, clearly-labelled experimental estimate. */
  includeEstimatedTaxes: boolean;
  /** Blended decimal rate applied to estimated gain when taxes are included. */
  estimatedTaxRate: number;
}

export interface SaleProceeds {
  expectedSalePrice: number;
  grossSellingCosts: number;
  sellerConcessions: number;
  otherClosingCosts: number;
  mortgagePayoff: number;
  preTaxSaleProceeds: number;
  /** Null unless includeEstimatedTaxes is on. Experimental. */
  estimatedTaxableGain: number | null;
  /** Null unless includeEstimatedTaxes is on. Experimental. */
  estimatedTaxes: number | null;
  /** preTaxSaleProceeds less estimated taxes when enabled. */
  netSaleProceeds: number;
}

export interface AmortizationMonth {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  endingBalance: number;
}

export interface AmortizationResult {
  months: AmortizationMonth[];
  endingBalance: number;
  totalInterest: number;
  totalPrincipal: number;
  /** True when the payment does not cover interest, so the loan never amortizes. */
  isNegativelyAmortizing: boolean;
  /** Month index at which the balance reaches zero, or null within the horizon. */
  payoffMonth: number | null;
}

export interface HoldProjectionYear {
  year: number;
  propertyValue: number;
  monthlyGrossRent: number;
  annualEffectiveIncome: number;
  annualOperatingExpenses: number;
  annualNOI: number;
  annualDebtService: number;
  annualCashFlow: number;
  cumulativeCashFlow: number;
  mortgageBalance: number;
  equity: number;
  /** Equity + cumulative cash flow (before any exit costs). */
  grossWealth: number;
}

export interface HoldProjection {
  years: HoldProjectionYear[];
  finalYear: number;
  finalPropertyValue: number;
  finalMortgageBalance: number;
  finalEquity: number;
  cumulativeCashFlow: number;
  /** Selling costs subtracted at the horizon, 0 when comparing gross. */
  exitCosts: number;
  /** finalEquity - exitCosts + cumulativeCashFlow (cash flow may be compounded). */
  projectedWealth: number;
}

export interface SellAndInvestProjectionYear {
  year: number;
  investmentValue: number;
}

export interface SellAndInvestProjection {
  startingInvestment: number;
  years: SellAndInvestProjectionYear[];
  finalYear: number;
  projectedWealth: number;
  saleProceeds: SaleProceeds;
}

export type SellVsHoldAssumptions = {
  expectedSalePrice: number;
  sellingCostPercentage: number;
  appreciationRate: number;
  rentGrowthRate: number;
  expenseInflationRate: number;
  alternativeInvestmentReturn: number;
  projectionYears: number;
  /** Compound retained cash flow at the alternative return instead of holding it idle. */
  reinvestCashFlow: boolean;
  /** Subtract estimated selling costs from hold equity at the horizon (fair comparison). */
  compareOnAfterSaleBasis: boolean;
  includeEstimatedTaxes: boolean;
  estimatedTaxRate: number;
};

export type SellVsHoldOutcome = 'hold' | 'sell' | 'toss-up';

export interface SellVsHoldResult {
  assumptions: SellVsHoldAssumptions;
  hold: HoldProjection;
  sell: SellAndInvestProjection;
  /** sell.projectedWealth - hold.projectedWealth. Positive favours selling. */
  difference: number;
  outcome: SellVsHoldOutcome;
  /** Plain-language drivers behind the result. */
  factors: string[];
  /**
   * Appreciation rate at which holding matches selling, as a decimal
   * fraction. Null when no crossover exists in the searched range.
   */
  breakEvenAppreciationRate: number | null;
}

export type RefinanceInputs = {
  newLoanAmount: number;
  /** Decimal fraction APR. */
  newInterestRate: number;
  newTermYears: number;
  closingCosts: number;
  /** Add closing costs to the new loan instead of paying them in cash. */
  rollClosingCostsIntoLoan: boolean;
};

export interface RefinanceResult {
  newLoanAmount: number;
  newMonthlyPayment: number;
  currentMonthlyPayment: number;
  monthlyPaymentChange: number;
  /** Cash to the borrower at closing. Negative means cash required to close. */
  cashReleased: number;
  newMonthlyCashFlow: number;
  currentMonthlyCashFlow: number;
  monthlyCashFlowChange: number;
  newAnnualCashFlow: number;
  newEquity: number;
  currentEquity: number;
  newLoanToValue: number | null;
  /** Months for monthly savings to repay closing costs, or null when never. */
  breakEvenMonths: number | null;
}

export interface PortfolioMetrics {
  propertyCount: number;
  totalMarketValue: number;
  totalMortgageBalance: number;
  totalEquity: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  annualNOI: number;
  totalUnits: number;
  occupiedUnits: number;
  /** Aggregated, not averaged: totalNOI / totalValue. */
  portfolioCapRate: number | null;
  /** Aggregated: totalAnnualCashFlow / totalEquity. */
  portfolioReturnOnEquity: number | null;
  portfolioLoanToValue: number | null;
  occupancyRate: number | null;
}

export interface RankedProperty {
  propertyId: string;
  nickname: string;
  returnOnEquity: number | null;
  equity: number;
  monthlyCashFlow: number;
  status: PerformanceStatus;
}
