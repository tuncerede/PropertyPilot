import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text, toneForValue } from '@/components/ui/Text';
import { spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import { formatCompactCurrency, formatCurrency } from '@/lib/formatting/number';
import type { HoldProjection, SellAndInvestProjection } from '@/types/analysis';

/**
 * Year-by-year detail behind the comparison.
 *
 * The verdict comes first on the screen; this is here for the landlord who
 * wants to check the working. It scrolls horizontally rather than shrinking
 * the figures into illegibility.
 */
export function ProjectionTable({
  hold,
  sell,
}: {
  hold: HoldProjection;
  sell: SellAndInvestProjection;
}) {
  const colors = useColors();

  return (
    <Card flush>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View
            style={[
              styles.row,
              styles.headerRow,
              { backgroundColor: colors.surfaceMuted, borderBottomColor: colors.border },
            ]}
          >
            <Cell width={48}>
              <Text variant="label" tone="secondary">
                Yr
              </Text>
            </Cell>
            <Cell width={96}>
              <Text variant="label" tone="secondary">
                Value
              </Text>
            </Cell>
            <Cell width={96}>
              <Text variant="label" tone="secondary">
                Equity
              </Text>
            </Cell>
            <Cell width={104}>
              <Text variant="label" tone="secondary">
                Cash flow
              </Text>
            </Cell>
            <Cell width={104}>
              <Text variant="label" tone="secondary">
                Hold total
              </Text>
            </Cell>
            <Cell width={104}>
              <Text variant="label" tone="secondary">
                Sell + invest
              </Text>
            </Cell>
          </View>

          {hold.years.map((year, index) => (
            <View
              key={year.year}
              style={[
                styles.row,
                { borderBottomColor: colors.border },
                index % 2 === 1 ? { backgroundColor: colors.surfaceMuted } : null,
              ]}
            >
              <Cell width={48}>
                <Text variant="captionStrong" tabular>
                  {year.year}
                </Text>
              </Cell>
              <Cell width={96}>
                <Text variant="caption" tabular>
                  {formatCompactCurrency(year.propertyValue)}
                </Text>
              </Cell>
              <Cell width={96}>
                <Text variant="caption" tabular>
                  {formatCompactCurrency(year.equity)}
                </Text>
              </Cell>
              <Cell width={104}>
                <Text variant="caption" tabular tone={toneForValue(year.annualCashFlow)}>
                  {formatCurrency(year.annualCashFlow)}
                </Text>
              </Cell>
              <Cell width={104}>
                <Text variant="caption" tabular>
                  {formatCompactCurrency(year.grossWealth)}
                </Text>
              </Cell>
              <Cell width={104}>
                <Text variant="caption" tabular>
                  {formatCompactCurrency(sell.years[index]?.investmentValue)}
                </Text>
              </Cell>
            </View>
          ))}
        </View>
      </ScrollView>
    </Card>
  );
}

function Cell({ width, children }: { width: number; children: React.ReactNode }) {
  return <View style={[styles.cell, { width }]}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: { borderBottomWidth: 1 },
  cell: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
});
