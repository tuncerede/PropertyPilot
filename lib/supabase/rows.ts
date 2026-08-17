import type { Property, PropertyDraft } from '@/types/property';
import type { PropertyRow } from './database.types';

/**
 * Mapping between snake_case database rows and camelCase domain objects.
 *
 * Numeric columns are coerced defensively: PostgREST can return `numeric` as
 * a string depending on driver and precision, and a string leaking into the
 * calculation engine would silently produce garbage.
 */

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : fallback;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
}

export function propertyFromRow(row: PropertyRow): Property {
  return {
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname,
    streetAddress: row.street_address,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code,
    propertyType: row.property_type,
    unitCount: toNumber(row.unit_count, 1),
    occupiedUnits: toNumber(row.occupied_units),

    purchasePrice: toNumber(row.purchase_price),
    purchaseDate: row.purchase_date,
    initialClosingCosts: toNumber(row.initial_closing_costs),
    initialCapex: toNumber(row.initial_capex),
    originalDownPayment: toNullableNumber(row.original_down_payment),

    hasMortgage: Boolean(row.has_mortgage),
    mortgageBalance: toNumber(row.mortgage_balance),
    mortgageInterestRate: toNumber(row.mortgage_interest_rate),
    monthlyPrincipalInterest: toNumber(row.monthly_principal_interest),
    remainingTermYears: toNumber(row.remaining_term_years),

    monthlyGrossRent: toNumber(row.monthly_gross_rent),
    monthlyOtherIncome: toNumber(row.monthly_other_income),
    vacancyRate: toNumber(row.vacancy_rate),

    annualPropertyTax: toNumber(row.annual_property_tax),
    annualInsurance: toNumber(row.annual_insurance),
    monthlyManagementCost: toNumber(row.monthly_management_cost),
    managementPercentage: toNullableNumber(row.management_percentage),
    annualRepairsMaintenance: toNumber(row.annual_repairs_maintenance),
    monthlyOwnerUtilities: toNumber(row.monthly_owner_utilities),
    monthlyHoa: toNumber(row.monthly_hoa),
    monthlyLawnSnow: toNumber(row.monthly_lawn_snow),
    monthlyOtherExpenses: toNumber(row.monthly_other_expenses),

    estimatedMarketValue: toNumber(row.estimated_market_value),
    appreciationRate: toNumber(row.appreciation_rate),
    rentGrowthRate: toNumber(row.rent_growth_rate),

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function propertyToRow(
  draft: PropertyDraft,
  identity: { id: string; userId: string },
): Omit<PropertyRow, 'created_at' | 'updated_at'> {
  return {
    id: identity.id,
    user_id: identity.userId,
    nickname: draft.nickname,
    street_address: draft.streetAddress,
    city: draft.city,
    state: draft.state,
    zip_code: draft.zipCode,
    property_type: draft.propertyType,
    unit_count: draft.unitCount,
    occupied_units: draft.occupiedUnits,

    purchase_price: draft.purchasePrice,
    purchase_date: draft.purchaseDate,
    initial_closing_costs: draft.initialClosingCosts,
    initial_capex: draft.initialCapex,
    original_down_payment: draft.originalDownPayment,

    has_mortgage: draft.hasMortgage,
    mortgage_balance: draft.mortgageBalance,
    mortgage_interest_rate: draft.mortgageInterestRate,
    monthly_principal_interest: draft.monthlyPrincipalInterest,
    remaining_term_years: draft.remainingTermYears,

    monthly_gross_rent: draft.monthlyGrossRent,
    monthly_other_income: draft.monthlyOtherIncome,
    vacancy_rate: draft.vacancyRate,

    annual_property_tax: draft.annualPropertyTax,
    annual_insurance: draft.annualInsurance,
    monthly_management_cost: draft.monthlyManagementCost,
    management_percentage: draft.managementPercentage,
    annual_repairs_maintenance: draft.annualRepairsMaintenance,
    monthly_owner_utilities: draft.monthlyOwnerUtilities,
    monthly_hoa: draft.monthlyHoa,
    monthly_lawn_snow: draft.monthlyLawnSnow,
    monthly_other_expenses: draft.monthlyOtherExpenses,

    estimated_market_value: draft.estimatedMarketValue,
    appreciation_rate: draft.appreciationRate,
    rent_growth_rate: draft.rentGrowthRate,
  };
}
