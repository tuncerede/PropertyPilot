import {
  calculateOperatingExpenses,
  fixedMonthlyOperatingExpenses,
} from '@/lib/calculations/expenses';
import { baseProperty, propertyWith } from '../fixtures';

describe('calculateOperatingExpenses', () => {
  it('converts annual costs to monthly and sums every operating line', () => {
    const result = calculateOperatingExpenses(baseProperty, 1_757.5);

    expect(result.monthlyPropertyTax).toBeCloseTo(2_000 / 12, 10);
    expect(result.monthlyInsurance).toBeCloseTo(125, 10);
    expect(result.monthlyRepairs).toBeCloseTo(200, 10);
    expect(result.monthlyManagement).toBe(150);
    expect(result.monthlyOther).toBe(100);
    expect(result.monthlyTotal).toBeCloseTo(741.6666666, 6);
    expect(result.annualTotal).toBeCloseTo(8_900, 6);
  });

  it('uses the flat management fee when no percentage is supplied', () => {
    const result = calculateOperatingExpenses(baseProperty, 1_757.5);

    expect(result.managementIsPercentageBased).toBe(false);
    expect(result.monthlyManagement).toBe(150);
  });

  it('charges percentage management on effective income, not scheduled rent', () => {
    const property = propertyWith({ managementPercentage: 0.08, monthlyManagementCost: 150 });
    const result = calculateOperatingExpenses(property, 1_757.5);

    expect(result.managementIsPercentageBased).toBe(true);
    expect(result.monthlyManagement).toBeCloseTo(140.6, 6);
  });

  it('treats a zero management percentage as "not percentage based"', () => {
    const property = propertyWith({ managementPercentage: 0, monthlyManagementCost: 150 });
    const result = calculateOperatingExpenses(property, 1_757.5);

    expect(result.managementIsPercentageBased).toBe(false);
    expect(result.monthlyManagement).toBe(150);
  });

  it('never lets negative effective income produce a negative management fee', () => {
    const property = propertyWith({ managementPercentage: 0.1 });
    const result = calculateOperatingExpenses(property, -500);

    expect(result.monthlyManagement).toBe(0);
  });

  it('returns zero totals when every expense is zero', () => {
    const property = propertyWith({
      annualPropertyTax: 0,
      annualInsurance: 0,
      annualRepairsMaintenance: 0,
      monthlyManagementCost: 0,
      monthlyOtherExpenses: 0,
    });
    const result = calculateOperatingExpenses(property, 1_757.5);

    expect(result.monthlyTotal).toBe(0);
    expect(result.annualTotal).toBe(0);
  });

  it('includes every owner-paid line item', () => {
    const property = propertyWith({
      monthlyOwnerUtilities: 80,
      monthlyHoa: 45,
      monthlyLawnSnow: 60,
    });
    const result = calculateOperatingExpenses(property, 1_757.5);

    expect(result.monthlyTotal).toBeCloseTo(741.6666666 + 80 + 45 + 60, 6);
  });
});

describe('fixedMonthlyOperatingExpenses', () => {
  it('returns the full total when management is a flat fee', () => {
    const result = calculateOperatingExpenses(baseProperty, 1_757.5);
    expect(fixedMonthlyOperatingExpenses(result)).toBeCloseTo(result.monthlyTotal, 10);
  });

  it('excludes percentage-based management so it is not double-inflated', () => {
    const property = propertyWith({ managementPercentage: 0.08 });
    const result = calculateOperatingExpenses(property, 1_757.5);

    expect(fixedMonthlyOperatingExpenses(result)).toBeCloseTo(
      result.monthlyTotal - result.monthlyManagement,
      10,
    );
  });
});
