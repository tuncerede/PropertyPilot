/**
 * Central home for every tunable number in the analysis layer.
 *
 * Nothing in `lib/calculations` or the UI may hard-code a threshold or a
 * default assumption: they all live here so they can be reviewed, explained
 * to the user, and changed in one place.
 *
 * All rates are decimal fractions (0.07 === 7%).
 */

/** Default assumptions offered when a user opens Sell vs. Hold. All editable. */
export const DEFAULT_ASSUMPTIONS = {
  /** Typical total cost of sale: agent commissions plus seller closing costs. */
  sellingCostPercentage: 0.06,
  /** General inflation applied to fixed operating expenses in projections. */
  expenseInflationRate: 0.03,
  /**
   * Assumed return if the proceeds were invested elsewhere. 7% is a common
   * long-run planning assumption for a diversified portfolio. It is NOT a
   * promise, a guarantee, or a recommendation — the user can change it.
   */
  alternativeInvestmentReturn: 0.07,
  appreciationRate: 0.03,
  rentGrowthRate: 0.03,
  vacancyRate: 0.05,
  projectionYears: 10,
  /** Blended rate used only by the experimental sale-tax estimate. */
  estimatedTaxRate: 0.2,
} as const;

/** Projection horizons offered in the UI. */
export const PROJECTION_HORIZONS = [5, 10, 20] as const;
export type ProjectionHorizon = (typeof PROJECTION_HORIZONS)[number];

/** Horizons available without a paid entitlement. */
export const FREE_PROJECTION_HORIZON: ProjectionHorizon = 5;

/**
 * Provisional heuristics for the property performance badge.
 *
 * These are rules of thumb for drawing attention, not objective investment
 * recommendations, and the app says so wherever the badge appears.
 *
 *   Strong  — positive monthly cash flow AND cash ROE >= 8%
 *   Watch   — positive monthly cash flow AND cash ROE between 4% and 8%
 *   Review  — negative cash flow OR cash ROE < 4%
 */
export const PERFORMANCE_THRESHOLDS = {
  strongReturnOnEquity: 0.08,
  watchReturnOnEquity: 0.04,
} as const;

/** Below this the Sell vs. Hold outcome is presented as a toss-up. */
export const SELL_VS_HOLD_TOSS_UP_DOLLARS = 5_000;
/** ...or when the gap is smaller than this share of the larger outcome. */
export const SELL_VS_HOLD_TOSS_UP_FRACTION = 0.03;

/** Bounds and tolerance for the break-even appreciation search. */
export const BREAK_EVEN_SEARCH = {
  minRate: -0.2,
  maxRate: 0.5,
  maxIterations: 80,
  toleranceDollars: 1,
} as const;

/** Thresholds used to explain *why* a Sell vs. Hold result came out as it did. */
export const EXPLANATION_THRESHOLDS = {
  lowReturnOnEquity: 0.04,
  strongReturnOnEquity: 0.08,
  highEquityShare: 0.6,
  highSellingCostPercentage: 0.07,
  lowMortgageRate: 0.05,
} as const;
