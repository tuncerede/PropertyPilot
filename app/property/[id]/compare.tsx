import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ComparisonMatrix } from '@/components/analysis/ComparisonMatrix';
import { PropertyRouteState } from '@/components/property/PropertyRouteState';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { PageHeader, Section } from '@/components/ui/Section';
import { EmptyState, Notice } from '@/components/ui/States';
import { Text } from '@/components/ui/Text';
import { SHORT_DISCLAIMER } from '@/constants/branding';
import { spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import {
  buildRefinanceRows,
  buildSellVsHoldRows,
  scenariosShareHorizon,
} from '@/lib/comparison';
import { formatLongDate } from '@/lib/formatting/number';
import { SCENARIO_TYPE_FOR } from '@/lib/validation/scenario';
import { useProperty } from '@/store/propertyStore';
import { useScenariosFor } from '@/store/scenarioStore';
import { useEntitlements } from '@/store/subscriptionStore';
import type { ScenarioType } from '@/types/property';

type CompareMode = 'sellVsHold' | 'refinance';

/**
 * Side-by-side scenario comparison.
 *
 * The saved-scenario list on each analysis screen already answers "what did
 * this one conclude?". This answers the harder question: which assumption
 * actually moved the result, and by how much. Every figure comes from the
 * same engine the individual analyses use.
 */
export default function CompareScenariosScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const property = useProperty(id);
  const { can } = useEntitlements();

  const mode: CompareMode = type === 'refinance' ? 'refinance' : 'sellVsHold';
  const scenarioType: ScenarioType =
    mode === 'refinance' ? SCENARIO_TYPE_FOR.refinance : SCENARIO_TYPE_FOR.sellVsHold;

  const scenarios = useScenariosFor(property?.id, scenarioType);

  // Saved newest-first; comparing reads better oldest-first, left to right.
  const ordered = useMemo(() => [...scenarios].reverse(), [scenarios]);

  const rows = useMemo(() => {
    if (!property || ordered.length === 0) return [];
    return mode === 'refinance'
      ? buildRefinanceRows(property, ordered)
      : buildSellVsHoldRows(property, ordered);
  }, [mode, ordered, property]);

  const sameHorizon = useMemo(
    () => mode !== 'sellVsHold' || scenariosShareHorizon(ordered),
    [mode, ordered],
  );

  const columns = useMemo(
    () =>
      ordered.map((scenario) => ({
        id: scenario.id,
        title: scenario.name,
        subtitle: formatLongDate(scenario.createdAt),
      })),
    [ordered],
  );

  if (!property) return <PropertyRouteState title="Compare scenarios" />;

  const analysisPath =
    mode === 'refinance' ? `/property/${property.id}/refinance` : `/property/${property.id}/analysis`;

  if (!can('scenarioComparison')) {
    return (
      <Screen>
        <PageHeader title="Compare scenarios" onBack={() => router.back()} />
        <Card style={styles.lockedCard} padding="xxl">
          <View style={[styles.lockIcon, { backgroundColor: colors.brandMuted }]}>
            <Ionicons name="lock-closed-outline" size={26} color={colors.brand} />
          </View>
          <Text variant="heading" align="center">
            Comparison is a Pro feature
          </Text>
          <Text variant="body" tone="secondary" align="center">
            Put your saved scenarios next to each other and see which assumption actually changed
            the answer.
          </Text>
          <View style={styles.lockedAction}>
            <Button
              label="See plans"
              onPress={() => router.push('/paywall?reason=scenarioComparison')}
            />
          </View>
        </Card>
      </Screen>
    );
  }

  const header = (
    <>
      <PageHeader
        title="Compare scenarios"
        subtitle={property.nickname || property.streetAddress}
        onBack={() => router.back()}
      />
      <SegmentedControl
        accessibilityLabel="Which analysis to compare"
        options={[
          { value: 'sellVsHold' as const, label: 'Sell vs. Hold' },
          { value: 'refinance' as const, label: 'Refinance' },
        ]}
        value={mode}
        onChange={(next) =>
          router.replace(`/property/${property.id}/compare?type=${next === 'refinance' ? 'refinance' : 'sell'}`)
        }
      />
    </>
  );

  if (ordered.length === 0) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="albums-outline"
          title="Nothing saved to compare yet."
          description={`Save a couple of ${mode === 'refinance' ? 'refinance' : 'Sell vs. Hold'} scenarios with different assumptions, then come back to see them side by side.`}
          actionLabel="Open the analysis"
          onAction={() => router.replace(analysisPath)}
        />
      </Screen>
    );
  }

  if (ordered.length === 1) {
    return (
      <Screen>
        {header}
        <EmptyState
          icon="albums-outline"
          title="One scenario is not a comparison."
          description={`"${ordered[0]?.name}" is saved. Change an assumption, save that as a second scenario, and this screen will show you exactly what moved.`}
          actionLabel="Open the analysis"
          onAction={() => router.replace(analysisPath)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {header}

      <Section
        title={`${ordered.length} scenarios`}
        description="Saved oldest to newest, left to right. Scroll sideways to see them all."
      >
        <ComparisonMatrix columns={columns} rows={rows} />
      </Section>

      {mode === 'sellVsHold' && !sameHorizon ? (
        <Notice tone="warning" icon="time-outline">
          These scenarios use different projection horizons, so their wealth figures are not
          directly comparable — a longer projection produces a larger number for that reason
          alone. Those rows are left unmarked. Save them on a matching horizon to rank them.
        </Notice>
      ) : (
        <Notice tone="info">
          A green marker shows the stronger figure in that row. It compares your own assumptions
          against each other — it does not say which assumptions are right.
        </Notice>
      )}

      <Button
        label="Back to the analysis"
        variant="secondary"
        icon="arrow-back"
        onPress={() => router.replace(analysisPath)}
      />

      <Text variant="caption" tone="tertiary">
        {SHORT_DISCLAIMER}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
