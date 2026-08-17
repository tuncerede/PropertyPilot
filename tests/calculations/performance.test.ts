import { calculatePropertyMetrics } from '@/lib/calculations/metrics';
import { assessPerformance } from '@/lib/calculations/performance';
import { propertyWith } from '../fixtures';

/** Build metrics whose cash flow and equity land on chosen values. */
function metricsForReturnOnEquity(targetRoe: number) {
  // Equity is fixed at 100,000; solve for the debt service that yields the
  // annual cash flow implied by the target return on equity.
  const property = propertyWith({
    estimatedMarketValue: 150_000,
    mortgageBalance: 50_000,
    hasMortgage: true,
  });
  const withoutDebt = calculatePropertyMetrics({ ...property, monthlyPrincipalInterest: 0 });
  const requiredMonthlyCashFlow = (targetRoe * 100_000) / 12;
  const debtService = withoutDebt.monthlyNOI - requiredMonthlyCashFlow;

  return calculatePropertyMetrics({ ...property, monthlyPrincipalInterest: debtService });
}

describe('assessPerformance', () => {
  it('rates a property Strong at or above the strong threshold', () => {
    const assessment = assessPerformance(metricsForReturnOnEquity(0.12));

    expect(assessment.status).toBe('strong');
    expect(assessment.reason).toContain('12.0%');
  });

  it('rates a property Strong exactly at 8%', () => {
    expect(assessPerformance(metricsForReturnOnEquity(0.08)).status).toBe('strong');
  });

  it('rates a property Watch between the thresholds', () => {
    expect(assessPerformance(metricsForReturnOnEquity(0.054)).status).toBe('watch');
  });

  it('rates a property Watch exactly at 4%', () => {
    expect(assessPerformance(metricsForReturnOnEquity(0.04)).status).toBe('watch');
  });

  it('rates a property Review below 4%', () => {
    expect(assessPerformance(metricsForReturnOnEquity(0.021)).status).toBe('review');
  });

  it('rates negative cash flow as Review regardless of equity', () => {
    const metrics = calculatePropertyMetrics(propertyWith({ monthlyPrincipalInterest: 2_000 }));
    const assessment = assessPerformance(metrics);

    expect(metrics.monthlyCashFlow).toBeLessThan(0);
    expect(assessment.status).toBe('review');
    expect(assessment.reason).toContain('negative');
  });

  it('explains itself when return on equity cannot be measured', () => {
    const metrics = calculatePropertyMetrics(
      propertyWith({ estimatedMarketValue: 40_000, mortgageBalance: 90_000 }),
    );
    const assessment = assessPerformance(metrics);

    expect(metrics.returnOnEquity).toBeNull();
    expect(assessment.factors.join(' ')).toContain('cannot be calculated');
  });

  it('always returns at least one supporting factor', () => {
    const assessment = assessPerformance(metricsForReturnOnEquity(0.06));

    expect(assessment.factors.length).toBeGreaterThan(0);
  });
});
