import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, PressableCard } from '@/components/ui/Card';
import { Metric, MetricCard, MetricGrid, MetricRow } from '@/components/ui/Metric';
import { Screen } from '@/components/ui/Screen';
import { PageHeader, Section } from '@/components/ui/Section';
import { EmptyState, Notice } from '@/components/ui/States';
import { Text, toneForValue } from '@/components/ui/Text';
import { SHORT_DISCLAIMER } from '@/constants/branding';
import { spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import { usePropertyLimit } from '@/hooks/usePropertyLimit';
import {
  formatCurrency,
  formatCurrencyPerMonth,
  formatOccupancy,
  formatPercent,
} from '@/lib/formatting/number';
import { analytics } from '@/services/analytics';
import {
  usePortfolioMetrics,
  usePropertyStore,
  useRankedProperties,
} from '@/store/propertyStore';
import { useEntitlements } from '@/store/subscriptionStore';

/**
 * Portfolio dashboard (Pro and above).
 *
 * The ranking is the point: it answers "where is my equity working hardest,
 * and where is it not?" — which is the portfolio-level version of the
 * question every property dashboard asks.
 */
export default function PortfolioScreen() {
  const router = useRouter();
  const colors = useColors();
  const metrics = usePortfolioMetrics();
  const ranked = useRankedProperties();
  const propertyCount = usePropertyStore((state) => state.properties.length);
  const { can } = useEntitlements();
  const { requestAdd } = usePropertyLimit();

  const canViewPortfolio = can('portfolioDashboard');

  useEffect(() => {
    if (canViewPortfolio) analytics.track({ name: 'portfolio_viewed', propertyCount });
  }, [canViewPortfolio, propertyCount]);

  if (!canViewPortfolio) {
    return (
      <Screen>
        <PageHeader title="Portfolio" subtitle="See every property in one place." />
        <Card style={styles.lockedCard} padding="xxl">
          <View style={[styles.lockIcon, { backgroundColor: colors.brandMuted }]}>
            <Ionicons name="lock-closed-outline" size={26} color={colors.brand} />
          </View>
          <Text variant="heading" align="center">
            Portfolio is a Pro feature
          </Text>
          <Text variant="body" tone="secondary" align="center">
            Roll every property into one view, and rank them by how hard their equity is working.
          </Text>
          <View style={styles.lockedAction}>
            <Button
              label="See plans"
              onPress={() => router.push('/paywall?reason=portfolioDashboard')}
            />
          </View>
        </Card>
      </Screen>
    );
  }

  if (propertyCount === 0) {
    return (
      <Screen>
        <PageHeader title="Portfolio" />
        <EmptyState
          icon="stats-chart-outline"
          title="Nothing to roll up yet."
          description="Add a property and your portfolio totals will appear here."
          actionLabel="Add Property"
          onAction={requestAdd}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        title="Portfolio"
        subtitle={`${metrics.propertyCount} ${metrics.propertyCount === 1 ? 'property' : 'properties'} · ${formatOccupancy(metrics.occupiedUnits, metrics.totalUnits)} units occupied`}
      />

      <Card>
        <Metric
          label="Portfolio Value"
          value={formatCurrency(metrics.totalMarketValue)}
          size="lg"
        />
        <View style={styles.headlineRow}>
          <View style={styles.headlineItem}>
            <Metric label="Total Equity" value={formatCurrency(metrics.totalEquity)} size="sm" />
          </View>
          <View style={styles.headlineItem}>
            <Metric
              label="Monthly Cash Flow"
              value={formatCurrencyPerMonth(metrics.monthlyCashFlow)}
              tone={toneForValue(metrics.monthlyCashFlow)}
              size="sm"
            />
          </View>
        </View>
      </Card>

      <Section
        title="Aggregate metrics"
        description="Totals, not averages — a small property cannot skew these."
      >
        <MetricGrid>
          <MetricCard label="Annual NOI" value={formatCurrency(metrics.annualNOI)} />
          <MetricCard
            label="Annual Cash Flow"
            value={formatCurrency(metrics.annualCashFlow)}
            tone={toneForValue(metrics.annualCashFlow)}
          />
          <MetricCard
            label="Portfolio Cap Rate"
            value={formatPercent(metrics.portfolioCapRate, { decimals: 2 })}
            caption="Total NOI ÷ total value"
          />
          <MetricCard
            label="Return on Equity"
            value={formatPercent(metrics.portfolioReturnOnEquity)}
            caption="Total cash flow ÷ total equity"
          />
        </MetricGrid>
      </Section>

      <Section
        title="Best use of equity"
        description="Ranked by cash return on the equity each property ties up."
      >
        <Card>
          {ranked.map((entry, index) => (
            <View key={entry.propertyId}>
              <PressableCard
                variant="flat"
                onPress={() => router.push(`/property/${entry.propertyId}`)}
                accessibilityLabel={`${entry.nickname}, ${formatPercent(entry.returnOnEquity)} return on equity`}
                style={index > 0 ? styles.rankSpaced : undefined}
              >
                <View style={styles.rankRow}>
                  <Text variant="figureSmall" tone="tertiary" tabular style={styles.rankNumber}>
                    {index + 1}
                  </Text>
                  <View style={styles.rankText}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {entry.nickname}
                    </Text>
                    <Text variant="caption" tone="secondary">
                      {formatCurrency(entry.equity)} equity ·{' '}
                      {formatCurrencyPerMonth(entry.monthlyCashFlow)}
                    </Text>
                  </View>
                  <View style={styles.rankRight}>
                    <Text variant="figureSmall" tabular>
                      {formatPercent(entry.returnOnEquity)}
                    </Text>
                    <StatusBadge status={entry.status} />
                  </View>
                </View>
              </PressableCard>
            </View>
          ))}
        </Card>

        <Notice tone="info">
          A low return on equity is a prompt to look closer, not a signal to sell. Open Sell vs.
          Hold on a property to test it against your own assumptions.
        </Notice>
      </Section>

      <Section title="Leverage">
        <Card>
          <MetricRow
            label="Total mortgage balance"
            value={formatCurrency(metrics.totalMortgageBalance)}
          />
          <MetricRow label="Total equity" value={formatCurrency(metrics.totalEquity)} />
          <MetricRow
            label="Portfolio loan to value"
            value={formatPercent(metrics.portfolioLoanToValue)}
            emphasis
          />
        </Card>
      </Section>

      <Text variant="caption" tone="tertiary">
        {SHORT_DISCLAIMER}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headlineRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xl },
  headlineItem: { flex: 1 },
  rankSpaced: { marginTop: spacing.sm },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rankNumber: { width: 24 },
  rankText: { flex: 1, gap: spacing.xxs },
  rankRight: { alignItems: 'flex-end', gap: spacing.xs },
  lockedCard: { alignItems: 'center', gap: spacing.md },
  lockIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedAction: { alignSelf: 'stretch', marginTop: spacing.sm },
});
