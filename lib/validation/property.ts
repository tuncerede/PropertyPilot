import { z } from 'zod';
import { PROPERTY_TYPES, type PropertyDraft } from '@/types/property';

/**
 * Property form validation.
 *
 * The rule of thumb: block values that are clearly wrong (negative rent, a
 * vacancy assumption over 100%, more occupied units than units), but stay
 * out of the way while a form is half-typed. Numeric fields therefore accept
 * null and are defaulted at submit time — see `toPropertyDraft` — rather
 * than turning red the moment a field is cleared.
 */

const money = (label: string) =>
  z
    .number({ message: `Enter a valid amount for ${label}.` })
    .min(0, `${label} cannot be negative.`)
    .max(1_000_000_000, `${label} looks too large.`)
    .nullable();

const rate = (label: string) =>
  z
    .number({ message: `Enter a valid percentage for ${label}.` })
    .min(-1, `${label} cannot be below -100%.`)
    .max(1, `${label} cannot be above 100%.`)
    .nullable();

export const propertyFormSchema = z
  .object({
    // Step 1 — Property
    nickname: z.string().trim().min(1, 'Give this property a name you will recognise.').max(80),
    streetAddress: z.string().trim().max(160).default(''),
    city: z.string().trim().max(80).default(''),
    state: z.string().trim().max(40).default(''),
    zipCode: z.string().trim().max(12).default(''),
    propertyType: z.enum(PROPERTY_TYPES),
    unitCount: z
      .number({ message: 'Enter the number of units.' })
      .int('Units must be a whole number.')
      .min(1, 'A property has at least one unit.')
      .max(500, 'That is more units than PropertyPilot models.')
      .nullable(),
    occupiedUnits: z
      .number()
      .int('Occupied units must be a whole number.')
      .min(0, 'Occupied units cannot be negative.')
      .max(500)
      .nullable(),

    // Step 2 — Acquisition
    purchasePrice: money('Purchase price'),
    purchaseDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD.')
      .nullable(),
    initialClosingCosts: money('Closing costs'),
    initialCapex: money('Rehab and capital investment'),
    originalDownPayment: money('Original down payment'),

    // Step 3 — Financing
    hasMortgage: z.boolean(),
    mortgageBalance: money('Mortgage balance'),
    mortgageInterestRate: rate('Interest rate'),
    monthlyPrincipalInterest: money('Monthly principal and interest'),
    remainingTermYears: z
      .number()
      .min(0, 'Remaining term cannot be negative.')
      .max(50, 'Remaining term cannot exceed 50 years.')
      .nullable(),

    // Step 4 — Income
    monthlyGrossRent: money('Monthly gross rent'),
    monthlyOtherIncome: money('Other monthly income'),
    vacancyRate: z
      .number()
      .min(0, 'Vacancy cannot be negative.')
      .max(1, 'Vacancy cannot exceed 100%.')
      .nullable(),

    // Step 5 — Expenses
    annualPropertyTax: money('Property taxes'),
    annualInsurance: money('Insurance'),
    monthlyManagementCost: money('Property management'),
    managementPercentage: z
      .number()
      .min(0, 'Management percentage cannot be negative.')
      .max(1, 'Management percentage cannot exceed 100%.')
      .nullable(),
    annualRepairsMaintenance: money('Repairs and maintenance'),
    monthlyOwnerUtilities: money('Owner-paid utilities'),
    monthlyHoa: money('HOA'),
    monthlyLawnSnow: money('Lawn and snow'),
    monthlyOtherExpenses: money('Other operating expenses'),

    // Step 6 — Current value
    estimatedMarketValue: money('Estimated market value'),
    appreciationRate: rate('Expected appreciation'),
    rentGrowthRate: rate('Expected rent growth'),
  })
  .superRefine((values, ctx) => {
    const units = values.unitCount ?? 1;
    const occupied = values.occupiedUnits ?? 0;

    if (occupied > units) {
      ctx.addIssue({
        code: 'custom',
        path: ['occupiedUnits'],
        message: 'Occupied units cannot exceed the number of units.',
      });
    }
  });

export type PropertyFormValues = z.input<typeof propertyFormSchema>;

/** Sensible starting point for a new property. Every value stays editable. */
export function emptyPropertyForm(): PropertyFormValues {
  return {
    nickname: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: 'single_family',
    unitCount: 1,
    occupiedUnits: 1,

    purchasePrice: null,
    purchaseDate: null,
    initialClosingCosts: null,
    initialCapex: null,
    originalDownPayment: null,

    hasMortgage: true,
    mortgageBalance: null,
    mortgageInterestRate: null,
    monthlyPrincipalInterest: null,
    remainingTermYears: null,

    monthlyGrossRent: null,
    monthlyOtherIncome: null,
    vacancyRate: 0.05,

    annualPropertyTax: null,
    annualInsurance: null,
    monthlyManagementCost: null,
    managementPercentage: null,
    annualRepairsMaintenance: null,
    monthlyOwnerUtilities: null,
    monthlyHoa: null,
    monthlyLawnSnow: null,
    monthlyOtherExpenses: null,

    estimatedMarketValue: null,
    appreciationRate: 0.03,
    rentGrowthRate: 0.03,
  };
}

export function propertyToForm(property: PropertyDraft): PropertyFormValues {
  return {
    nickname: property.nickname,
    streetAddress: property.streetAddress,
    city: property.city,
    state: property.state,
    zipCode: property.zipCode,
    propertyType: property.propertyType,
    unitCount: property.unitCount,
    occupiedUnits: property.occupiedUnits,

    purchasePrice: property.purchasePrice,
    purchaseDate: property.purchaseDate,
    initialClosingCosts: property.initialClosingCosts,
    initialCapex: property.initialCapex,
    originalDownPayment: property.originalDownPayment,

    hasMortgage: property.hasMortgage,
    mortgageBalance: property.mortgageBalance,
    mortgageInterestRate: property.mortgageInterestRate,
    monthlyPrincipalInterest: property.monthlyPrincipalInterest,
    remainingTermYears: property.remainingTermYears,

    monthlyGrossRent: property.monthlyGrossRent,
    monthlyOtherIncome: property.monthlyOtherIncome,
    vacancyRate: property.vacancyRate,

    annualPropertyTax: property.annualPropertyTax,
    annualInsurance: property.annualInsurance,
    monthlyManagementCost: property.monthlyManagementCost,
    managementPercentage: property.managementPercentage,
    annualRepairsMaintenance: property.annualRepairsMaintenance,
    monthlyOwnerUtilities: property.monthlyOwnerUtilities,
    monthlyHoa: property.monthlyHoa,
    monthlyLawnSnow: property.monthlyLawnSnow,
    monthlyOtherExpenses: property.monthlyOtherExpenses,

    estimatedMarketValue: property.estimatedMarketValue,
    appreciationRate: property.appreciationRate,
    rentGrowthRate: property.rentGrowthRate,
  };
}

const orZero = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

/** Convert validated form values into the domain shape the engine consumes. */
export function toPropertyDraft(values: PropertyFormValues): PropertyDraft {
  const hasMortgage = values.hasMortgage;

  return {
    nickname: values.nickname.trim(),
    streetAddress: (values.streetAddress ?? '').trim(),
    city: (values.city ?? '').trim(),
    state: (values.state ?? '').trim(),
    zipCode: (values.zipCode ?? '').trim(),
    propertyType: values.propertyType,
    unitCount: Math.max(1, Math.round(orZero(values.unitCount) || 1)),
    occupiedUnits: Math.max(0, Math.round(orZero(values.occupiedUnits))),

    purchasePrice: orZero(values.purchasePrice),
    purchaseDate: values.purchaseDate ?? null,
    initialClosingCosts: orZero(values.initialClosingCosts),
    initialCapex: orZero(values.initialCapex),
    originalDownPayment:
      typeof values.originalDownPayment === 'number' ? values.originalDownPayment : null,

    hasMortgage,
    mortgageBalance: hasMortgage ? orZero(values.mortgageBalance) : 0,
    mortgageInterestRate: hasMortgage ? orZero(values.mortgageInterestRate) : 0,
    monthlyPrincipalInterest: hasMortgage ? orZero(values.monthlyPrincipalInterest) : 0,
    remainingTermYears: hasMortgage ? orZero(values.remainingTermYears) : 0,

    monthlyGrossRent: orZero(values.monthlyGrossRent),
    monthlyOtherIncome: orZero(values.monthlyOtherIncome),
    vacancyRate: orZero(values.vacancyRate),

    annualPropertyTax: orZero(values.annualPropertyTax),
    annualInsurance: orZero(values.annualInsurance),
    monthlyManagementCost: orZero(values.monthlyManagementCost),
    managementPercentage:
      typeof values.managementPercentage === 'number' && values.managementPercentage > 0
        ? values.managementPercentage
        : null,
    annualRepairsMaintenance: orZero(values.annualRepairsMaintenance),
    monthlyOwnerUtilities: orZero(values.monthlyOwnerUtilities),
    monthlyHoa: orZero(values.monthlyHoa),
    monthlyLawnSnow: orZero(values.monthlyLawnSnow),
    monthlyOtherExpenses: orZero(values.monthlyOtherExpenses),

    estimatedMarketValue: orZero(values.estimatedMarketValue),
    appreciationRate: orZero(values.appreciationRate),
    rentGrowthRate: orZero(values.rentGrowthRate),
  };
}
