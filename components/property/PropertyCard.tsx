import { StyleSheet, View } from 'react-native';
import { StatusBadge } from '@/components/ui/Badge';
import { PressableCard } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Section';
import { Text, toneForValue, type TextTone } from '@/components/ui/Text';
import { spacing } from '@/constants/theme';
import { assessPerformance } from '@/lib/calculations/performance';
import {
  formatCurrency,
  formatCurrencyPerMonth,
  formatOccupancy,
  formatPercent,
  joinParts,
} from '@/lib/formatting/number';
import type { PropertyMetrics } from '@/types/analysis';
import { PROPERTY_TYPE_LABELS, type Property } from '@/types/property';

/**
 * The property row on the Properties tab.
 *
 * Leads with the four figures the app exists to answer — value, equity, cash
 * flow and what the equity is actually earning — plus the status badge, so
 * the main insight is visible without opening anything.
 */
export function PropertyCard({
  property,
  metrics,
  onPress,
}: {
  property: Property;
  metrics: PropertyMetrics;
  onPress: () => void;
}) {
  const assessment = assessPerformance(metrics);
  const location = joinParts([
    PROPERTY_TYPE_LABELS[property.propertyType],
    joinParts([property.city, property.state], ', '),
  ]);

  return (
    <PressableCard
      onPress={onPress}
      accessibilityLabel={`${property.nickname || property.streetAddress}. ${assessment.reason}`}
      accessibilityHint="Opens the property dashboard"
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="heading" numberOfLines={1}>
            {property.nickname || property.streetAddress || 'Untitled property'}
          </Text>
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {location || 'Location not set'}
          </Text>
        </View>
        <StatusBadge status={assessment.status} />
      </View>

      <Divider />

      <View style={styles.figures}>
        <Figure label="Value" value={formatCurrency(property.estimatedMarketValue)} />
        <Figure label="Equity" value={formatCurrency(metrics.equity)} />
        <Figure
          label="Cash Flow"
          value={formatCurrencyPerMonth(metrics.monthlyCashFlow)}
          tone={toneForValue(metrics.monthlyCashFlow)}
        />
        <Figure label="Return on Equity" value={formatPercent(metrics.returnOnEquity)} />
      </View>

      <Text variant="caption" tone="tertiary">
        {formatOccupancy(property.occupiedUnits, property.unitCount)} units occupied
      </Text>
    </PressableCard>
  );
}

function Figure({
  label,
  value,
  tone = 'primary',
}: {
  label: string;
  value: string;
  tone?: TextTone;
}) {
  return (
    <View style={styles.figure}>
      <Text variant="label" tone="secondary">
        {label}
      </Text>
      <Text variant="figureSmall" tone={tone} tabular numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerText: { flex: 1, gap: spacing.xxs },
  figures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  figure: { width: '50%', gap: spacing.xxs, paddingRight: spacing.sm },
});
