import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Divider } from '@/components/ui/Section';
import { Text } from '@/components/ui/Text';
import { radius, spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import { formatCurrency, formatPercent } from '@/lib/formatting/number';
import type { SellVsHoldResult } from '@/types/analysis';

/**
 * The Sell vs. Hold verdict.
 *
 * Deliberately worded as "under these assumptions, X produces the higher
 * projected value" — never "you should sell". The bar comparison is there so
 * the size of the gap reads at a glance, not just its direction.
 */
export function ComparisonResult({ result }: { result: SellVsHoldResult }) {
  const colors = useColors();

  const holdWealth = result.hold.projectedWealth;
  const sellWealth = result.sell.projectedWealth;
  const maxWealth = Math.max(holdWealth, sellWealth, 1);

  const headline =
    result.outcome === 'toss-up'
      ? 'Under these assumptions, the two paths land in much the same place.'
      : result.outcome === 'sell'
        ? 'Under these assumptions, Sell + Invest produces the higher projected financial value.'
        : 'Under these assumptions, keeping the property produces the higher projected financial value.';

  return (
    <Card>
      <Text variant="label" tone="secondary">
        {result.assumptions.projectionYears}-year outlook
      </Text>

      <View style={styles.options}>
        <Outcome
          title="Keep Property"
          wealth={holdWealth}
          share={holdWealth / maxWealth}
          highlighted={result.outcome === 'hold'}
          color={colors.brand}
        />
        <Outcome
          title="Sell + Invest"
          wealth={sellWealth}
          share={sellWealth / maxWealth}
          highlighted={result.outcome === 'sell'}
          color={colors.info}
        />
      </View>

      <Divider />

      <View style={styles.difference}>
        <Text variant="label" tone="secondary">
          Difference
        </Text>
        <Text
          variant="figure"
          tabular
          tone={
            result.outcome === 'toss-up'
              ? 'primary'
              : result.outcome === 'sell'
                ? 'info'
                : 'brand'
          }
        >
          {formatCurrency(Math.abs(result.difference))}
        </Text>
        <Text variant="body" tone="secondary">
          {headline}
        </Text>
      </View>

      {result.breakEvenAppreciationRate !== null ? (
        <View style={[styles.breakEven, { backgroundColor: colors.surfaceMuted }]}>
          <Text variant="captionStrong" tone="secondary">
            Break-even appreciation
          </Text>
          {result.breakEvenAppreciationRate < 0 ? (
            // Phrasing "appreciates -8%" reads as a typo; say it plainly.
            <Text variant="body">
              Keeping the property still matches selling even if it lost about{' '}
              <Text variant="bodyStrong">
                {formatPercent(Math.abs(result.breakEvenAppreciationRate), { decimals: 2 })}
              </Text>{' '}
              of its value a year, against the{' '}
              {formatPercent(result.assumptions.appreciationRate)} growth you assumed.
            </Text>
          ) : (
            <Text variant="body">
              Keeping the property matches selling if it appreciates about{' '}
              <Text variant="bodyStrong">
                {formatPercent(result.breakEvenAppreciationRate, { decimals: 2 })}
              </Text>{' '}
              a year, against the {formatPercent(result.assumptions.appreciationRate)} you assumed.
            </Text>
          )}
        </View>
      ) : (
        <View style={[styles.breakEven, { backgroundColor: colors.surfaceMuted }]}>
          <Text variant="captionStrong" tone="secondary">
            Break-even appreciation
          </Text>
          <Text variant="body">
            No appreciation rate between -20% and 50% a year makes the two paths meet under these
            assumptions.
          </Text>
        </View>
      )}
    </Card>
  );
}

function Outcome({
  title,
  wealth,
  share,
  highlighted,
  color,
}: {
  title: string;
  wealth: number;
  share: number;
  highlighted: boolean;
  color: string;
}) {
  const colors = useColors();
  const width = `${Math.max(Math.min(share, 1), 0.04) * 100}%` as const;

  return (
    <View style={styles.outcome}>
      <View style={styles.outcomeHeader}>
        <Text variant={highlighted ? 'bodyStrong' : 'body'} tone={highlighted ? 'primary' : 'secondary'}>
          {title}
        </Text>
        <Text variant="figureSmall" tabular>
          {formatCurrency(wealth)}
        </Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: colors.surfaceMuted }]}>
        <View style={[styles.barFill, { width, backgroundColor: color }]} />
      </View>
      <Text variant="caption" tone="tertiary">
        Projected wealth
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing.xl, marginTop: spacing.lg, marginBottom: spacing.lg },
  outcome: { gap: spacing.sm },
  outcomeHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  barTrack: { height: 10, borderRadius: radius.pill, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.pill },
  difference: { gap: spacing.xs, marginTop: spacing.lg },
  breakEven: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
});
