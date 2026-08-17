import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import { Card } from './Card';
import { Text, type TextTone } from './Text';

export interface MetricProps {
  label: string;
  value: string;
  /** Small line under the value, e.g. a formula reminder or a caveat. */
  caption?: string;
  tone?: TextTone;
  size?: 'sm' | 'md' | 'lg';
  /** Shows an info affordance that opens the metric explanation. */
  onExplain?: () => void;
  align?: 'left' | 'center';
}

/** A labelled financial figure. The workhorse of every dashboard. */
export function Metric({
  label,
  value,
  caption,
  tone = 'primary',
  size = 'md',
  onExplain,
  align = 'left',
}: MetricProps) {
  const colors = useColors();
  const variant = size === 'lg' ? 'hero' : size === 'md' ? 'figure' : 'figureSmall';

  return (
    <View style={align === 'center' ? styles.centered : undefined}>
      <View style={[styles.labelRow, align === 'center' ? styles.centeredRow : null]}>
        <Text variant="label" tone="secondary">
          {label}
        </Text>
        {onExplain ? (
          <Pressable
            onPress={onExplain}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={`How ${label} is calculated`}
          >
            <Ionicons name="information-circle-outline" size={15} color={colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>
      <Text variant={variant} tone={tone} tabular align={align === 'center' ? 'center' : undefined}>
        {value}
      </Text>
      {caption ? (
        <Text
          variant="caption"
          tone="tertiary"
          align={align === 'center' ? 'center' : undefined}
          style={styles.caption}
        >
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

/** A metric in its own card, for grid layouts. */
export function MetricCard(props: MetricProps & { style?: object }) {
  const { style, ...metricProps } = props;
  return (
    <Card style={[styles.metricCard, style]} padding="lg">
      <Metric {...metricProps} size={metricProps.size ?? 'sm'} />
    </Card>
  );
}

/** Two-column grid of metric cards that wraps cleanly on narrow screens. */
export function MetricGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

/** A compact label/value row, for breakdowns inside a card. */
export function MetricRow({
  label,
  value,
  tone = 'primary',
  emphasis = false,
  indent = false,
}: {
  label: string;
  value: string;
  tone?: TextTone;
  emphasis?: boolean;
  indent?: boolean;
}) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.row,
        emphasis ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border } : null,
        indent ? styles.indented : null,
      ]}
    >
      <Text
        variant={emphasis ? 'bodyStrong' : 'body'}
        tone={emphasis ? 'primary' : 'secondary'}
        style={styles.rowLabel}
      >
        {label}
      </Text>
      <Text variant={emphasis ? 'bodyStrong' : 'body'} tone={tone} tabular>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  centered: { alignItems: 'center' },
  centeredRow: { justifyContent: 'center' },
  caption: { marginTop: spacing.xxs },
  metricCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 150,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  rowLabel: { flexShrink: 1 },
  indented: { paddingLeft: spacing.md },
});
