import { DEFAULT_ASSUMPTIONS } from '@/constants/analysis';
import {
  isScenarioType,
  parseRefinanceInputs,
  parseSellVsHoldAssumptions,
  SCENARIO_TYPE_FOR,
  scenarioNameSchema,
} from '@/lib/validation/scenario';
import { baseAssumptions } from '../fixtures';

describe('parseSellVsHoldAssumptions', () => {
  it('round-trips a complete assumption set unchanged', () => {
    expect(parseSellVsHoldAssumptions(baseAssumptions)).toEqual(baseAssumptions);
  });

  it('fills in every field for an empty object', () => {
    const parsed = parseSellVsHoldAssumptions({});

    expect(parsed.sellingCostPercentage).toBe(DEFAULT_ASSUMPTIONS.sellingCostPercentage);
    expect(parsed.alternativeInvestmentReturn).toBe(
      DEFAULT_ASSUMPTIONS.alternativeInvestmentReturn,
    );
    expect(parsed.projectionYears).toBe(DEFAULT_ASSUMPTIONS.projectionYears);
    expect(parsed.reinvestCashFlow).toBe(false);
    expect(parsed.compareOnAfterSaleBasis).toBe(true);
    expect(parsed.includeEstimatedTaxes).toBe(false);
  });

  it('handles null and undefined without throwing', () => {
    expect(parseSellVsHoldAssumptions(null).projectionYears).toBe(
      DEFAULT_ASSUMPTIONS.projectionYears,
    );
    expect(parseSellVsHoldAssumptions(undefined).projectionYears).toBe(
      DEFAULT_ASSUMPTIONS.projectionYears,
    );
  });

  it('keeps the fields a scenario did have when others are missing', () => {
    // A scenario saved before `reinvestCashFlow` existed.
    const parsed = parseSellVsHoldAssumptions({
      expectedSalePrice: 200_000,
      appreciationRate: 0.045,
      projectionYears: 20,
    });

    expect(parsed.expectedSalePrice).toBe(200_000);
    expect(parsed.appreciationRate).toBeCloseTo(0.045, 10);
    expect(parsed.projectionYears).toBe(20);
    expect(parsed.reinvestCashFlow).toBe(false);
  });

  it('replaces a corrupt field with its default rather than throwing', () => {
    const parsed = parseSellVsHoldAssumptions({
      expectedSalePrice: 'not a number',
      appreciationRate: null,
      reinvestCashFlow: 'yes',
      projectionYears: 999,
    });

    expect(parsed.expectedSalePrice).toBe(0);
    expect(parsed.appreciationRate).toBe(DEFAULT_ASSUMPTIONS.appreciationRate);
    expect(parsed.reinvestCashFlow).toBe(false);
    expect(parsed.projectionYears).toBe(DEFAULT_ASSUMPTIONS.projectionYears);
  });

  it('rejects a non-finite number', () => {
    const parsed = parseSellVsHoldAssumptions({ expectedSalePrice: Number.POSITIVE_INFINITY });
    expect(Number.isFinite(parsed.expectedSalePrice)).toBe(true);
  });

  it('produces a set the engine can consume', () => {
    const parsed = parseSellVsHoldAssumptions({ appreciationRate: 0.02 });

    Object.values(parsed).forEach((value) => {
      if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
    });
  });
});

describe('parseRefinanceInputs', () => {
  it('round-trips a complete input set', () => {
    const inputs = {
      newLoanAmount: 90_000,
      newInterestRate: 0.065,
      newTermYears: 30,
      closingCosts: 3_500,
      rollClosingCostsIntoLoan: true,
    };

    expect(parseRefinanceInputs(inputs)).toEqual(inputs);
  });

  it('defaults an empty object to a usable 30-year loan', () => {
    const parsed = parseRefinanceInputs({});

    expect(parsed.newTermYears).toBe(30);
    expect(parsed.newLoanAmount).toBe(0);
    expect(parsed.rollClosingCostsIntoLoan).toBe(false);
  });

  it('clamps an implausible term back to the default', () => {
    expect(parseRefinanceInputs({ newTermYears: 500 }).newTermYears).toBe(30);
  });
});

describe('scenario naming and types', () => {
  it('requires a non-blank name', () => {
    expect(scenarioNameSchema.safeParse('   ').success).toBe(false);
    expect(scenarioNameSchema.safeParse('Conservative').success).toBe(true);
  });

  it('trims the name it returns', () => {
    const parsed = scenarioNameSchema.safeParse('  Base case  ');
    expect(parsed.success && parsed.data).toBe('Base case');
  });

  it('rejects an overlong name', () => {
    expect(scenarioNameSchema.safeParse('x'.repeat(61)).success).toBe(false);
  });

  it('maps each analysis to a valid scenario type', () => {
    expect(isScenarioType(SCENARIO_TYPE_FOR.sellVsHold)).toBe(true);
    expect(isScenarioType(SCENARIO_TYPE_FOR.refinance)).toBe(true);
    expect(isScenarioType('nonsense')).toBe(false);
  });
});
