import { PERFORMANCE_THRESHOLDS } from '@/constants/analysis';
import type { PerformanceAssessment, PropertyMetrics } from '@/types/analysis';
import { formatPercent } from '@/lib/formatting/number';

/**
 * The property performance badge.
 *
 * These are provisional heuristics for drawing the landlord's attention, not
 * objective investment recommendations, and every surface that renders the
 * badge says so and links to this explanation. All thresholds come from
 * `constants/analysis.ts`.
 *
 *   Strong  — positive monthly cash flow AND cash return on equity >= 8%
 *   Watch   — positive monthly cash flow AND cash return on equity 4%–8%
 *   Review  — negative cash flow OR cash return on equity < 4%
 */
export function assessPerformance(metrics: PropertyMetrics): PerformanceAssessment {
  const { monthlyCashFlow, returnOnEquity } = metrics;
  const factors: string[] = [];

  if (monthlyCashFlow < 0) {
    factors.push('Monthly cash flow is negative.');
  } else {
    factors.push('Monthly cash flow is positive.');
  }

  if (returnOnEquity === null) {
    factors.push(
      metrics.equity <= 0
        ? 'There is no positive equity, so cash return on equity cannot be calculated.'
        : 'Cash return on equity is unavailable.',
    );

    return {
      status: monthlyCashFlow < 0 ? 'review' : 'watch',
      reason:
        metrics.equity <= 0
          ? 'Equity is zero or negative, so return on equity cannot be measured.'
          : 'Return on equity is unavailable.',
      factors,
    };
  }

  factors.push(`Cash return on equity is ${formatPercent(returnOnEquity)}.`);

  if (monthlyCashFlow >= 0 && returnOnEquity >= PERFORMANCE_THRESHOLDS.strongReturnOnEquity) {
    return {
      status: 'strong',
      reason: `Positive cash flow and a ${formatPercent(returnOnEquity)} cash return on equity.`,
      factors,
    };
  }

  if (monthlyCashFlow >= 0 && returnOnEquity >= PERFORMANCE_THRESHOLDS.watchReturnOnEquity) {
    return {
      status: 'watch',
      reason: `Positive cash flow, but the equity is only returning ${formatPercent(returnOnEquity)}.`,
      factors,
    };
  }

  return {
    status: 'review',
    reason:
      monthlyCashFlow < 0
        ? 'Cash flow is negative.'
        : `Cash return on equity is below ${formatPercent(PERFORMANCE_THRESHOLDS.watchReturnOnEquity)}.`,
    factors,
  };
}

export const PERFORMANCE_EXPLANATION = [
  'PropertyPilot compares your monthly cash flow with the cash return on the equity you currently have tied up in the property.',
  `Strong — positive cash flow and a cash return on equity of ${formatPercent(PERFORMANCE_THRESHOLDS.strongReturnOnEquity)} or more.`,
  `Watch — positive cash flow with a cash return on equity between ${formatPercent(PERFORMANCE_THRESHOLDS.watchReturnOnEquity)} and ${formatPercent(PERFORMANCE_THRESHOLDS.strongReturnOnEquity)}.`,
  'Review — negative cash flow, or a cash return on equity below the watch threshold.',
  'These are rules of thumb to help you prioritise which property to look at next. They are not investment advice.',
].join('\n\n');
