import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PropertyRouteState } from '@/components/property/PropertyRouteState';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useInfoSheet } from '@/components/ui/InfoSheet';
import { Metric, MetricCard, MetricGrid, MetricRow } from '@/components/ui/Metric';
import { Screen } from '@/components/ui/Screen';
import { Divider, PageHeader, Section } from '@/components/ui/Section';
import { Notice } from '@/components/ui/States';
import { Text, toneForValue } from '@/components/ui/Text';
import { SHORT_DISCLAIMER } from '@/constants/branding';
import { spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import { assessPerformance } from '@/lib/calculations/performance';
import { confirmDestructive } from '@/lib/confirm';
import {
  explainCapRate,
  explainCashFlow,
  explainCashOnCash,
  explainEquity,
  explainNOI,
  explainPerformance,
  explainReturnOnEquity,
  explainTotalReturn,
} from '@/lib/explanations';
import {
  formatCurrency,
  formatCurrencyPerMonth,
  formatOccupancy,
  formatPercent,
  joinParts,
} from '@/lib/formatting/number';
import { useAuthStore } from '@/store/authStore';
import { useProperty, usePropertyMetrics, usePropertyStore } from '@/store/propertyStore';
import { useEntitlements } from '@/store/subscriptionStore';
import { PROPERTY_TYPE_LABELS } from '@/types/property';

/**
 * The property dashboard.
 *
 * Ordered to answer the app's core question first: what is it worth, what is
 * your equity, what does it pay you, and is that equity working hard enough?
 * Every headline figure opens an explanation of its own maths.
 */
export default function PropertyDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { explain } = useInfoSheet();

  const user = useAuthStore((state) => state.user);
  const property = useProperty(id);
  const metrics = usePropertyMetrics(property);
  const remove = usePropertyStore((state) => state.remove);
  const { can } = useEntitlements();

  if (!property || !metrics) {
    return <PropertyRouteState title="Property" />;
  }

  const assessment = assessPerformance(metrics);
  const subtitle = joinParts([
    PROPERTY_TYPE_LABELS[property.propertyType],
    joinParts([property.streetAddress, property.city, property.state], ', '),
  ]);

  const openGated = (feature: 'sellVsHold' | 'refinance', path: string) => {
    if (can(feature)) {
      router.push(path);
    } else {
      router.push(`/paywall?reason=${feature}`);
    }
  };

  const confirmDelete = () =>
    confirmDestructive({
      title: 'Delete this property?',
      message: 'Its figures and saved scenarios will be removed. This cannot be undone.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        if (!user) return;
        const ok = await remove(user.id, property.id);
        if (ok) router.replace('/(tabs)/properties');
      },
    });

  return (
    <Screen>
      <PageHeader
        title={property.nickname || property.streetAddress || 'Property'}
        subtitle={subtitle}
        onBack={() => router.back()}
      />

      {/* Headline: value, then the three figures that matter most. */}
      <Card>
        <Metric
          label="Estimated Value"
          value={formatCurrency(property.estimatedMarketValue)}
          size="lg"
          caption="A figure you provide — not an appraisal."
        />

        <View style={styles.headlineRow}>
          <View style={styles.headlineItem}>
            <Metric
              label="Equity"
              value={formatCurrency(metrics.equity)}
              size="sm"
              onExplain={() => explain(explainEquity(property, metrics))}
            />
          </View>
          <View style={styles.headlineItem}>
            <Metric
              label="Cash Flow"
              value={formatCurrencyPerMonth(metrics.monthlyCashFlow)}
              tone={toneForValue(metrics.monthlyCashFlow)}
              size="sm"
              onExplain={() => explain(explainCashFlow(property, metrics))}
            />
          </View>
        </View>

        <Divider />

        <View style={styles.statusRow}>
          <View style={styles.statusText}>
            <Metric
              label="Cash Return on Equity"
              value={formatPercent(metrics.returnOnEquity)}
              size="md"
              onExplain={() => explain(explainReturnOnEquity(metrics))}
            />
          </View>
          <View style={styles.statusBadge}>
            <StatusBadge status={assessment.status} size="md" />
          </View>
        </View>
        <Text variant="caption" tone="secondary">
          {assessment.reason}{' '}
          <Text
            variant="captionStrong"
            tone="brand"
            onPress={() => explain(explainPerformance(metrics))}
          >
            How is this decided?
          </Text>
        </Text>
      </Card>

      <Section title="The numbers">
        <MetricGrid>
          <MetricCard
            label="Annual NOI"
            value={formatCurrency(metrics.annualNOI)}
            onExplain={() => explain(explainNOI(metrics))}
          />
          <MetricCard
            label="Cap Rate"
            value={formatPercent(metrics.capRate, { decimals: 2 })}
            onExplain={() => explain(explainCapRate(property, metrics))}
          />
          <MetricCard
            label="Cash-on-Cash"
            value={formatPercent(metrics.cashOnCashReturn)}
            onExplain={() => explain(explainCashOnCash(metrics))}
          />
          <MetricCard
            label="Occupancy"
            value={formatOccupancy(property.occupiedUnits, property.unitCount)}
            caption={formatPercent(metrics.occupancyRate, { decimals: 0 })}
          />
        </MetricGrid>
      </Section>

      <Section title="Monthly breakdown">
        <Card>
          <MetricRow
            label="Scheduled rent"
            value={formatCurrency(metrics.income.monthlyScheduledIncome)}
          />
          <MetricRow
            label={`Vacancy (${formatPercent(property.vacancyRate, { decimals: 0 })})`}
            value={formatCurrency(-metrics.income.monthlyVacancyLoss)}
            indent
          />
          <MetricRow
            label="Effective income"
            value={formatCurrency(metrics.income.monthlyEffectiveIncome)}
            emphasis
          />
          <MetricRow
            label="Operating expenses"
            value={formatCurrency(-metrics.expenses.monthlyTotal)}
          />
          <MetricRow
            label="Net operating income"
            value={formatCurrency(metrics.monthlyNOI)}
            emphasis
          />
          <MetricRow
            label="Principal & interest"
            value={formatCurrency(-metrics.monthlyDebtService)}
          />
          <MetricRow
            label="Monthly cash flow"
            value={formatCurrencyPerMonth(metrics.monthlyCashFlow)}
            tone={toneForValue(metrics.monthlyCashFlow)}
            emphasis
          />
        </Card>
      </Section>

      <Section
        title="Total return"
        description="Cash is only part of the picture. These are kept separate on purpose."
      >
        <Card>
          <MetricRow label="Annual cash flow" value={formatCurrency(metrics.annualCashFlow)} />
          <MetricRow
            label="Assumed appreciation"
            value={formatCurrency(metrics.estimatedAnnualAppreciation)}
          />
          <MetricRow
            label="Principal paydown"
            value={formatCurrency(metrics.estimatedAnnualPrincipalPaydown)}
          />
          <MetricRow
            label="Estimated total return"
            value={formatCurrency(metrics.estimatedTotalAnnualReturn)}
            emphasis
          />
          <View style={styles.explainLink}>
            <Text
              variant="captionStrong"
              tone="brand"
              onPress={() => explain(explainTotalReturn(metrics))}
            >
              How is this calculated?
            </Text>
          </View>
        </Card>
      </Section>

      <Section title="Actions">
        <View style={styles.actions}>
          <Button
            label="Sell vs. Hold"
            icon="git-compare-outline"
            onPress={() => openGated('sellVsHold', `/property/${property.id}/analysis`)}
          />
          <Button
            label="Refinance"
            icon="swap-horizontal-outline"
            variant="secondary"
            onPress={() => openGated('refinance', `/property/${property.id}/refinance`)}
          />
          <Button
            label="Edit Property"
            icon="create-outline"
            variant="secondary"
            onPress={() => router.push(`/property/${property.id}/edit`)}
          />
        </View>
      </Section>

      {metrics.debtServiceCoverageRatio !== null && metrics.debtServiceCoverageRatio < 1 ? (
        <Notice tone="warning" icon="alert-circle-outline">
          Net operating income does not cover the mortgage payment on this property.
        </Notice>
      ) : null}

      <View style={styles.footer}>
        <Text variant="caption" tone="tertiary">
          {SHORT_DISCLAIMER}
        </Text>
        <Text
          variant="captionStrong"
          style={{ color: colors.negative }}
          onPress={confirmDelete}
          accessibilityRole="button"
        >
          <Ionicons name="trash-outline" size={13} /> Delete this property
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headlineRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.lg },
  headlineItem: { flex: 1 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  statusText: { flex: 1, gap: spacing.xxs },
  statusBadge: { alignItems: 'flex-end' },
  actions: { gap: spacing.md },
  explainLink: { marginTop: spacing.md },
  footer: { gap: spacing.md, alignItems: 'center', paddingTop: spacing.md },
});
