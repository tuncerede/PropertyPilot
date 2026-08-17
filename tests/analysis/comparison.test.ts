import {
  bestIndexFor as bestIndex,
  buildRefinanceRows,
  buildSellVsHoldRows,
  scenariosShareHorizon,
} from '@/lib/comparison';
import { compareSellVsHold } from '@/lib/calculations/sellVsHold';
import type { PropertyScenario } from '@/types/property';
import { assumptionsWith, baseProperty } from '../fixtures';

function scenario(
  id: string,
  name: string,
  assumptions: Record<string, unknown>,
  scenarioType: PropertyScenario['scenarioType'] = 'sell',
): PropertyScenario {
  return {
    id,
    propertyId: 'p1',
    userId: 'u1',
    name,
    scenarioType,
    assumptions,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

/** Locates a row by label so tests do not depend on row ordering. */
function row(rows: ReturnType<typeof buildSellVsHoldRows>, label: string) {
  const found = rows.find((item) => item.label === label);
  if (!found) throw new Error(`No row labelled "${label}"`);
  return found;
}



describe('buildSellVsHoldRows', () => {
  const conservative = scenario('s1', 'Conservative', assumptionsWith({ appreciationRate: 0.01 }));
  const optimistic = scenario('s2', 'Optimistic', assumptionsWith({ appreciationRate: 0.06 }));

  it('produces one cell per scenario in every row', () => {
    const rows = buildSellVsHoldRows(baseProperty, [conservative, optimistic]);

    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((item) => expect(item.cells).toHaveLength(2));
  });

  it('reports the same figures the analysis screen shows', () => {
    const rows = buildSellVsHoldRows(baseProperty, [conservative]);
    const direct = compareSellVsHold(baseProperty, assumptionsWith({ appreciationRate: 0.01 }));

    expect(row(rows, 'Keep: projected wealth').cells[0]?.value).toBeCloseTo(
      direct.hold.projectedWealth,
      6,
    );
    expect(row(rows, 'Sell + Invest: projected wealth').cells[0]?.value).toBeCloseTo(
      direct.sell.projectedWealth,
      6,
    );
  });

  it('marks the higher projected wealth as the better column', () => {
    const rows = buildSellVsHoldRows(baseProperty, [conservative, optimistic]);
    const keep = row(rows, 'Keep: projected wealth');

    // More appreciation must produce more wealth from keeping.
    expect(keep.cells[1]?.value as number).toBeGreaterThan(keep.cells[0]?.value as number);
    expect(bestIndex(keep)).toBe(1);
  });

  it('leaves assumption rows without a winner', () => {
    const rows = buildSellVsHoldRows(baseProperty, [conservative, optimistic]);

    ['Appreciation', 'Rent growth', 'Alternative return', 'Selling costs'].forEach((label) => {
      expect(row(rows, label).better).toBeUndefined();
    });
  });

  it('names the outcome in plain language', () => {
    const rows = buildSellVsHoldRows(baseProperty, [conservative, optimistic]);
    const outcome = row(rows, 'Ahead');

    outcome.cells.forEach((cell) => {
      expect(['Keep', 'Sell + Invest', 'Too close']).toContain(cell.display);
    });
  });

  it('shows the horizon each scenario was saved with', () => {
    const rows = buildSellVsHoldRows(baseProperty, [
      scenario('a', 'Short', assumptionsWith({ projectionYears: 5 })),
      scenario('b', 'Long', assumptionsWith({ projectionYears: 20 })),
    ]);

    expect(row(rows, 'Horizon').cells.map((cell) => cell.display)).toEqual([
      '5 years',
      '20 years',
    ]);
  });

  it('fills in defaults for a scenario saved before a field existed', () => {
    const rows = buildSellVsHoldRows(baseProperty, [
      scenario('legacy', 'Legacy', { appreciationRate: 0.03 }),
    ]);

    expect(row(rows, 'Reinvest cash flow').cells[0]?.display).toBe('No');
    expect(row(rows, 'Estimated taxes').cells[0]?.display).toBe('Off');
    expect(row(rows, 'Keep: projected wealth').cells[0]?.value).not.toBeNull();
  });

  it('renders an unavailable break-even as a placeholder, not NaN', () => {
    const rows = buildSellVsHoldRows(baseProperty, [
      scenario('x', 'Extreme', assumptionsWith({ alternativeInvestmentReturn: 0.6 })),
    ]);

    expect(row(rows, 'Break-even appreciation').cells[0]?.display).toBe('—');
  });

  it('handles a single scenario without marking a winner', () => {
    const rows = buildSellVsHoldRows(baseProperty, [conservative]);
    expect(bestIndex(row(rows, 'Keep: projected wealth'))).toBeNull();
  });

  it('returns rows with no cells for an empty scenario list', () => {
    const rows = buildSellVsHoldRows(baseProperty, []);
    rows.forEach((item) => expect(item.cells).toHaveLength(0));
  });

  it('never renders NaN or undefined in any cell', () => {
    const rows = buildSellVsHoldRows(baseProperty, [
      conservative,
      optimistic,
      scenario('junk', 'Corrupt', { appreciationRate: 'nonsense', projectionYears: null }),
    ]);

    rows.forEach((item) =>
      item.cells.forEach((cell) => {
        expect(cell.display).not.toMatch(/NaN|undefined|Infinity/);
        if (cell.value !== null) expect(Number.isFinite(cell.value)).toBe(true);
      }),
    );
  });
});

describe('buildRefinanceRows', () => {
  const cheap = scenario(
    'r1',
    'Low rate',
    { newLoanAmount: 90_000, newInterestRate: 0.055, newTermYears: 30, closingCosts: 3_000 },
    'refinance',
  );
  const expensive = scenario(
    'r2',
    'High rate',
    { newLoanAmount: 90_000, newInterestRate: 0.075, newTermYears: 30, closingCosts: 5_000 },
    'refinance',
  );

  it('produces one cell per scenario in every row', () => {
    const rows = buildRefinanceRows(baseProperty, [cheap, expensive]);
    rows.forEach((item) => expect(item.cells).toHaveLength(2));
  });

  it('prefers the lower interest rate and the lower payment', () => {
    const rows = buildRefinanceRows(baseProperty, [cheap, expensive]);

    expect(bestIndex(row(rows, 'Interest rate'))).toBe(0);
    expect(bestIndex(row(rows, 'New payment'))).toBe(0);
  });

  it('prefers the higher cash released and the higher new cash flow', () => {
    const rows = buildRefinanceRows(baseProperty, [cheap, expensive]);

    expect(row(rows, 'Cash released').better).toBe('higher');
    expect(row(rows, 'New monthly cash flow').better).toBe('higher');
    expect(bestIndex(row(rows, 'Cash released'))).toBe(0);
  });

  it('renders a missing break-even as a placeholder', () => {
    const rows = buildRefinanceRows(baseProperty, [
      scenario(
        'nobreakeven',
        'Cash out',
        { newLoanAmount: 110_000, newInterestRate: 0.08, newTermYears: 30, closingCosts: 4_000 },
        'refinance',
      ),
    ]);

    expect(row(rows, 'Break-even months').cells[0]?.display).toBe('—');
  });

  it('never renders NaN or undefined in any cell', () => {
    const rows = buildRefinanceRows(baseProperty, [cheap, expensive]);

    rows.forEach((item) =>
      item.cells.forEach((cell) => {
        expect(cell.display).not.toMatch(/NaN|undefined|Infinity/);
      }),
    );
  });
});

describe('ranking rules', () => {
  it('marks no winner when two figures tie', () => {
    const tied = {
      label: 'Cash after sale today',
      better: 'higher' as const,
      cells: [
        { display: '$101,400', value: 101_400 },
        { display: '$101,400', value: 101_400 },
      ],
    };

    expect(bestIndex(tied)).toBeNull();
  });

  it('still picks a winner when only some columns tie', () => {
    const partial = {
      label: 'x',
      better: 'higher' as const,
      cells: [
        { display: 'a', value: 100 },
        { display: 'b', value: 100 },
        { display: 'c', value: 250 },
      ],
    };

    expect(bestIndex(partial)).toBe(2);
  });

  it('ignores unavailable figures when ranking', () => {
    const withGap = {
      label: 'x',
      better: 'lower' as const,
      cells: [
        { display: '—', value: null },
        { display: '12', value: 12 },
        { display: '30', value: 30 },
      ],
    };

    expect(bestIndex(withGap)).toBe(1);
  });

  it('marks nothing when only one figure is comparable', () => {
    const lonely = {
      label: 'x',
      better: 'higher' as const,
      cells: [
        { display: '—', value: null },
        { display: '12', value: 12 },
      ],
    };

    expect(bestIndex(lonely)).toBeNull();
  });
});

describe('cross-horizon comparisons', () => {
  const tenYear = scenario('a', 'Ten', assumptionsWith({ projectionYears: 10 }));
  const twentyYear = scenario('b', 'Twenty', assumptionsWith({ projectionYears: 20 }));
  const tenYearRicher = scenario(
    'c',
    'Ten richer',
    assumptionsWith({ projectionYears: 10, appreciationRate: 0.07 }),
  );

  it('ranks wealth when every scenario shares a horizon', () => {
    const rows = buildSellVsHoldRows(baseProperty, [tenYear, tenYearRicher]);

    expect(row(rows, 'Keep: projected wealth').better).toBe('higher');
    expect(bestIndex(row(rows, 'Keep: projected wealth'))).toBe(1);
  });

  it('refuses to rank wealth across different horizons', () => {
    const rows = buildSellVsHoldRows(baseProperty, [tenYear, twentyYear]);

    // A 20-year projection is larger for no reason but being longer.
    ['Keep: projected wealth', 'Sell + Invest: projected wealth', 'Projected equity at horizon', 'Accumulated cash flow'].forEach(
      (label) => {
        expect(row(rows, label).better).toBeUndefined();
        expect(bestIndex(row(rows, label))).toBeNull();
      },
    );
  });

  it('still ranks horizon-independent figures across mixed horizons', () => {
    const rows = buildSellVsHoldRows(baseProperty, [tenYear, twentyYear]);

    // Today's sale proceeds do not depend on the projection length.
    expect(row(rows, 'Cash after sale today').better).toBe('higher');
  });

  it('reports whether a set shares a horizon', () => {
    expect(scenariosShareHorizon([tenYear, tenYearRicher])).toBe(true);
    expect(scenariosShareHorizon([tenYear, twentyYear])).toBe(false);
    expect(scenariosShareHorizon([tenYear])).toBe(true);
    expect(scenariosShareHorizon([])).toBe(true);
  });
});
