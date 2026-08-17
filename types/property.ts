/**
 * Core property domain types.
 *
 * UNITS CONVENTION (applies to every type and calculation in PropertyPilot):
 *
 *   - Every monetary value is a plain JS number of DOLLARS (not cents).
 *   - Every field whose name ends in `Rate`, `Percentage`, or `Growth` is a
 *     DECIMAL FRACTION. 5% is stored, passed and computed as `0.05`.
 *     Conversion to a display string (`"5.0%"`) happens only in
 *     `lib/formatting`, never inside a calculation.
 *   - Fields named `monthly*` are per-month amounts, `annual*` are per-year.
 *   - Dates are ISO-8601 date strings (`YYYY-MM-DD`) or full ISO timestamps.
 */

export const PROPERTY_TYPES = [
  'single_family',
  'duplex',
  'triplex',
  'fourplex',
  'multifamily',
  'other',
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  single_family: 'Single Family',
  duplex: 'Duplex',
  triplex: 'Triplex',
  fourplex: 'Fourplex',
  multifamily: 'Multifamily',
  other: 'Other',
};

/**
 * The financial subset of a property. Every calculation in
 * `lib/calculations` accepts this shape (or a narrower one) so that the
 * engine never depends on identity, ownership or persistence concerns.
 */
export interface PropertyFinancials {
  // --- Units -------------------------------------------------------------
  unitCount: number;
  occupiedUnits: number;

  // --- Acquisition -------------------------------------------------------
  purchasePrice: number;
  /** ISO date (YYYY-MM-DD) or null when unknown. */
  purchaseDate: string | null;
  initialClosingCosts: number;
  /** Capital improvements made at/after acquisition. */
  initialCapex: number;
  /**
   * Cash put down at purchase. Optional: when null we fall back to treating
   * an unfinanced purchase as all-cash, and otherwise report
   * cash-on-cash return as unavailable rather than guessing.
   */
  originalDownPayment: number | null;

  // --- Financing ---------------------------------------------------------
  hasMortgage: boolean;
  mortgageBalance: number;
  /** Decimal fraction, e.g. 0.065 for 6.5% APR. */
  mortgageInterestRate: number;
  /** Principal + interest only. Excludes escrowed taxes and insurance. */
  monthlyPrincipalInterest: number;
  remainingTermYears: number;

  // --- Income ------------------------------------------------------------
  monthlyGrossRent: number;
  monthlyOtherIncome: number;
  /** Decimal fraction, e.g. 0.05 for a 5% vacancy assumption. */
  vacancyRate: number;

  // --- Operating expenses ------------------------------------------------
  annualPropertyTax: number;
  annualInsurance: number;
  /** Flat monthly management fee. Used only when managementPercentage is null. */
  monthlyManagementCost: number;
  /** Decimal fraction of effective income, e.g. 0.08. Takes precedence when set. */
  managementPercentage: number | null;
  annualRepairsMaintenance: number;
  monthlyOwnerUtilities: number;
  monthlyHoa: number;
  monthlyLawnSnow: number;
  monthlyOtherExpenses: number;

  // --- Valuation ---------------------------------------------------------
  /** User-supplied estimate. This is NOT an appraisal. */
  estimatedMarketValue: number;
  /** Decimal fraction, e.g. 0.03 for 3%/yr. */
  appreciationRate: number;
  /** Decimal fraction, e.g. 0.03 for 3%/yr. */
  rentGrowthRate: number;
}

export interface PropertyIdentity {
  nickname: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: PropertyType;
}

export interface Property extends PropertyIdentity, PropertyFinancials {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/** Everything needed to create a property; the store supplies id/user/timestamps. */
export type PropertyDraft = PropertyIdentity & PropertyFinancials;

export const SCENARIO_TYPES = ['hold', 'sell', 'refinance'] as const;
export type ScenarioType = (typeof SCENARIO_TYPES)[number];

export interface PropertyScenario<TAssumptions = Record<string, unknown>> {
  id: string;
  propertyId: string;
  userId: string;
  name: string;
  scenarioType: ScenarioType;
  assumptions: TAssumptions;
  createdAt: string;
  updatedAt: string;
}
