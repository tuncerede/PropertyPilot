import { StyleSheet, View } from 'react-native';
import { radius, spacing, typography } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import type { PerformanceStatus } from '@/types/analysis';
import { Text } from './Text';

export type BadgeTone = 'positive' | 'warning' | 'negative' | 'info' | 'neutral' | 'brand';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: 'sm' | 'md';
}

export function Badge({ label, tone = 'neutral', size = 'sm' }: BadgeProps) {
  const colors = useColors();

  const palette: Record<BadgeTone, { background: string; text: string }> = {
    positive: { background: colors.positiveMuted, text: colors.positiveOnMuted },
    warning: { background: colors.warningMuted, text: colors.warningOnMuted },
    negative: { background: colors.negativeMuted, text: colors.negativeOnMuted },
    info: { background: colors.infoMuted, text: colors.infoOnMuted },
    brand: { background: colors.brandMuted, text: colors.brandOnMuted },
    neutral: { background: colors.surfaceMuted, text: colors.textSecondary },
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette[tone].background,
          paddingVertical: size === 'md' ? spacing.sm : spacing.xs,
          paddingHorizontal: size === 'md' ? spacing.md : spacing.sm,
        },
      ]}
    >
      <Text style={[typography.label, { color: palette[tone].text }]}>{label}</Text>
    </View>
  );
}

const STATUS_LABELS: Record<PerformanceStatus, string> = {
  strong: 'Strong',
  watch: 'Watch',
  review: 'Review',
};

const STATUS_TONES: Record<PerformanceStatus, BadgeTone> = {
  strong: 'positive',
  watch: 'warning',
  review: 'negative',
};

export function StatusBadge({
  status,
  size = 'sm',
}: {
  status: PerformanceStatus;
  size?: 'sm' | 'md';
}) {
  return <Badge label={STATUS_LABELS[status]} tone={STATUS_TONES[status]} size={size} />;
}

export { STATUS_LABELS, STATUS_TONES };

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
});
