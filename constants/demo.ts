import { monthlyLoanPayment } from '@/lib/calculations/mortgage';
import type { Property, PropertyDraft } from '@/types/property';

/**
 * Demo portfolio.
 *
 * This is FICTIONAL SAMPLE DATA used so that PropertyPilot is fully
 * demonstrable before any Supabase or RevenueCat credentials exist. None of
 * these figures is an appraisal, a listing, or a real transaction. Values,
 * rents and expenses are illustrative assumptions.
 *
 * Mortgage payments are derived from each loan's balance, rate and remaining
 * term rather than typed in, so the sample data stays internally consistent
 * with the amortization the engine runs.
 */

const DEMO_USER_ID = 'demo-user';

interface DemoSeed extends Omit<PropertyDraft, 'monthlyPrincipalInterest'> {
  id: string;
  createdAt: string;
}

const seeds: DemoSeed[] = [
  {
    id: 'demo-neufer',
    nickname: 'Neufer Duplex',
    streetAddress: '119 Neufer Ct',
    city: 'Erie',
    state: 'PA',
    zipCode: '16509',
    propertyType: 'duplex',
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
    createdAt: '2024-01-12T15:04:00.000Z',
  },
  {
    id: 'demo-oak',
    nickname: 'Oak Street',
    streetAddress: '482 Oak St',
    city: 'Erie',
    state: 'PA',
    zipCode: '16508',
    propertyType: 'single_family',
    unitCount: 1,
    occupiedUnits: 1,

    purchasePrice: 148_000,
    purchaseDate: '2021-06-01',
    initialClosingCosts: 3_600,
    initialCapex: 9_800,
    originalDownPayment: 29_600,

    hasMortgage: true,
    mortgageBalance: 96_000,
    mortgageInterestRate: 0.0525,
    remainingTermYears: 26,

    monthlyGrossRent: 2_400,
    monthlyOtherIncome: 0,
    vacancyRate: 0.05,

    annualPropertyTax: 3_000,
    annualInsurance: 1_300,
    monthlyManagementCost: 0,
    managementPercentage: 0.08,
    annualRepairsMaintenance: 1_800,
    monthlyOwnerUtilities: 0,
    monthlyHoa: 0,
    monthlyLawnSnow: 0,
    monthlyOtherExpenses: 0,

    estimatedMarketValue: 210_000,
    appreciationRate: 0.03,
    rentGrowthRate: 0.03,
    createdAt: '2024-02-02T15:04:00.000Z',
  },
  {
    id: 'demo-maple',
    nickname: 'Maple Duplex',
    streetAddress: '77 Maple Ave',
    city: 'Girard',
    state: 'PA',
    zipCode: '16417',
    propertyType: 'duplex',
    unitCount: 2,
    occupiedUnits: 1,

    purchasePrice: 132_000,
    purchaseDate: '2020-09-20',
    initialClosingCosts: 3_100,
    initialCapex: 6_400,
    originalDownPayment: 26_400,

    hasMortgage: true,
    mortgageBalance: 88_000,
    mortgageInterestRate: 0.0375,
    remainingTermYears: 24,

    monthlyGrossRent: 1_750,
    monthlyOtherIncome: 45,
    vacancyRate: 0.05,

    annualPropertyTax: 2_600,
    annualInsurance: 1_400,
    monthlyManagementCost: 0,
    managementPercentage: 0.08,
    annualRepairsMaintenance: 2_100,
    monthlyOwnerUtilities: 0,
    monthlyHoa: 0,
    monthlyLawnSnow: 60,
    monthlyOtherExpenses: 50,

    estimatedMarketValue: 165_000,
    appreciationRate: 0.03,
    rentGrowthRate: 0.03,
    createdAt: '2024-03-18T15:04:00.000Z',
  },
  {
    id: 'demo-pine',
    nickname: 'Pine Street',
    streetAddress: '1204 Pine St',
    city: 'Erie',
    state: 'PA',
    zipCode: '16503',
    propertyType: 'triplex',
    unitCount: 3,
    occupiedUnits: 2,

    purchasePrice: 176_000,
    purchaseDate: '2017-11-08',
    initialClosingCosts: 4_200,
    initialCapex: 22_500,
    originalDownPayment: 35_200,

    hasMortgage: true,
    mortgageBalance: 60_000,
    mortgageInterestRate: 0.035,
    remainingTermYears: 21,

    monthlyGrossRent: 1_950,
    monthlyOtherIncome: 0,
    vacancyRate: 0.07,

    annualPropertyTax: 4_200,
    annualInsurance: 1_800,
    monthlyManagementCost: 195,
    managementPercentage: null,
    annualRepairsMaintenance: 3_000,
    monthlyOwnerUtilities: 80,
    monthlyHoa: 0,
    monthlyLawnSnow: 75,
    monthlyOtherExpenses: 130,

    estimatedMarketValue: 240_000,
    appreciationRate: 0.025,
    rentGrowthRate: 0.025,
    createdAt: '2024-04-05T15:04:00.000Z',
  },
];

function toProperty(seed: DemoSeed): Property {
  const { id, createdAt, ...draft } = seed;
  return {
    ...draft,
    id,
    userId: DEMO_USER_ID,
    monthlyPrincipalInterest: Number(
      monthlyLoanPayment(
        draft.mortgageBalance,
        draft.mortgageInterestRate,
        draft.remainingTermYears,
      ).toFixed(2),
    ),
    createdAt,
    updatedAt: createdAt,
  };
}

/** The full demo portfolio, used for Pro/Investor demo accounts. */
export const DEMO_PROPERTIES: Property[] = seeds.map(toProperty);

/** The single sample property a demo Free account starts with. */
export const DEMO_PRIMARY_PROPERTY: Property = toProperty(seeds[0] as DemoSeed);

export const DEMO_USER = {
  id: DEMO_USER_ID,
  email: 'demo@propertypilot.app',
  fullName: 'Demo Landlord',
} as const;

export const DEMO_DATA_NOTICE =
  'This is fictional sample data for demonstration. Values shown are assumptions, not appraisals.';
