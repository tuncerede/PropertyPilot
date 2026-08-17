import {
  emptyPropertyForm,
  propertyFormSchema,
  propertyToForm,
  toPropertyDraft,
} from '@/lib/validation/property';
import { DEMO_PRIMARY_PROPERTY } from '@/constants/demo';

describe('propertyFormSchema', () => {
  it('accepts a minimal property with only a name', () => {
    const result = propertyFormSchema.safeParse({ ...emptyPropertyForm(), nickname: 'Test' });
    expect(result.success).toBe(true);
  });

  it('requires a name', () => {
    const result = propertyFormSchema.safeParse(emptyPropertyForm());
    expect(result.success).toBe(false);
  });

  it('tolerates blank numeric fields so a half-typed form stays valid', () => {
    const result = propertyFormSchema.safeParse({
      ...emptyPropertyForm(),
      nickname: 'Test',
      purchasePrice: null,
      monthlyGrossRent: null,
      estimatedMarketValue: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative money', () => {
    const result = propertyFormSchema.safeParse({
      ...emptyPropertyForm(),
      nickname: 'Test',
      monthlyGrossRent: -100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a vacancy assumption above 100%', () => {
    const result = propertyFormSchema.safeParse({
      ...emptyPropertyForm(),
      nickname: 'Test',
      vacancyRate: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects more occupied units than units', () => {
    const result = propertyFormSchema.safeParse({
      ...emptyPropertyForm(),
      nickname: 'Test',
      unitCount: 2,
      occupiedUnits: 3,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['occupiedUnits']);
    }
  });

  it('rejects an unparseable purchase date', () => {
    const result = propertyFormSchema.safeParse({
      ...emptyPropertyForm(),
      nickname: 'Test',
      purchaseDate: '15/03/2019',
    });
    expect(result.success).toBe(false);
  });
});

describe('toPropertyDraft', () => {
  it('defaults blank numeric fields to zero rather than NaN', () => {
    const draft = toPropertyDraft({ ...emptyPropertyForm(), nickname: 'Test' });

    expect(draft.purchasePrice).toBe(0);
    expect(draft.monthlyGrossRent).toBe(0);
    expect(draft.estimatedMarketValue).toBe(0);
    expect(Object.values(draft).every((value) => !Number.isNaN(value))).toBe(true);
  });

  it('zeroes every loan field when there is no mortgage', () => {
    const draft = toPropertyDraft({
      ...emptyPropertyForm(),
      nickname: 'Test',
      hasMortgage: false,
      mortgageBalance: 50_000,
      mortgageInterestRate: 0.06,
      monthlyPrincipalInterest: 400,
      remainingTermYears: 20,
    });

    expect(draft.mortgageBalance).toBe(0);
    expect(draft.mortgageInterestRate).toBe(0);
    expect(draft.monthlyPrincipalInterest).toBe(0);
    expect(draft.remainingTermYears).toBe(0);
  });

  it('treats a zero management percentage as "not set"', () => {
    const draft = toPropertyDraft({
      ...emptyPropertyForm(),
      nickname: 'Test',
      managementPercentage: 0,
    });

    expect(draft.managementPercentage).toBeNull();
  });

  it('keeps a real management percentage', () => {
    const draft = toPropertyDraft({
      ...emptyPropertyForm(),
      nickname: 'Test',
      managementPercentage: 0.08,
    });

    expect(draft.managementPercentage).toBeCloseTo(0.08, 10);
  });

  it('preserves a null down payment instead of coercing it to zero', () => {
    const draft = toPropertyDraft({ ...emptyPropertyForm(), nickname: 'Test' });
    expect(draft.originalDownPayment).toBeNull();
  });

  it('trims whitespace from text fields', () => {
    const draft = toPropertyDraft({
      ...emptyPropertyForm(),
      nickname: '  Neufer Duplex  ',
      city: '  Erie ',
    });

    expect(draft.nickname).toBe('Neufer Duplex');
    expect(draft.city).toBe('Erie');
  });

  it('forces at least one unit', () => {
    const draft = toPropertyDraft({ ...emptyPropertyForm(), nickname: 'Test', unitCount: 0 });
    expect(draft.unitCount).toBe(1);
  });
});

describe('propertyToForm round trip', () => {
  it('survives a form → draft → form round trip unchanged', () => {
    const form = propertyToForm(DEMO_PRIMARY_PROPERTY);
    const parsed = propertyFormSchema.safeParse(form);
    expect(parsed.success).toBe(true);

    const draft = toPropertyDraft(form);

    expect(draft.nickname).toBe(DEMO_PRIMARY_PROPERTY.nickname);
    expect(draft.estimatedMarketValue).toBe(DEMO_PRIMARY_PROPERTY.estimatedMarketValue);
    expect(draft.mortgageBalance).toBe(DEMO_PRIMARY_PROPERTY.mortgageBalance);
    expect(draft.vacancyRate).toBe(DEMO_PRIMARY_PROPERTY.vacancyRate);
    expect(draft.originalDownPayment).toBe(DEMO_PRIMARY_PROPERTY.originalDownPayment);
  });
});
