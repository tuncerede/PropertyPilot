import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Section';
import { Text, toneForValue } from '@/components/ui/Text';
import { spacing } from '@/constants/theme';
import { formatCurrency, formatCurrencyPerMonth } from '@/lib/formatting/number';
import type { PortfolioMetrics } from '@/types/analysis';

/** Compact portfolio roll-up shown above the property list. */
export function PortfolioSummary({ metrics }: { metrics: PortfolioMetrics }) {
  return (
    <Card>
      <Text variant="label" tone="secondary">
        Portfolio
      </Text>

      <View style={styles.row}>
        <Item label="Total value" value={formatCurrency(metrics.totalMarketValue)} />
        <Item label="Total equity" value={formatCurrency(metrics.totalEquity)} />
      </View>

      <Divider />

      <View style={styles.footerRow}>
        <Text variant="body" tone="secondary">
          Monthly cash flow
        </Text>
        <Text variant="figureSmall" tone={toneForValue(metrics.monthlyCashFlow)} tabular>
          {formatCurrencyPerMonth(metrics.monthlyCashFlow)}
        </Text>
      </View>
    </Card>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.item}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text variant="figure" tabular numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  item: { flex: 1, gap: spacing.xxs },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
