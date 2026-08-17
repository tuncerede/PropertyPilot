import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ComparisonResult } from '@/components/analysis/ComparisonResult';
import { ScenarioBar } from '@/components/analysis/ScenarioBar';
import { PropertyRouteState } from '@/components/property/PropertyRouteState';
import { ProjectionTable } from '@/components/analysis/ProjectionTable';
import { CurrencyField, PercentField, SwitchField } from '@/components/forms/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetricRow } from '@/components/ui/Metric';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { PageHeader, Section } from '@/components/ui/Section';
import { Notice } from '@/components/ui/States';
import { Text } from '@/components/ui/Text';
import { DISCLAIMER } from '@/constants/branding';
import {
  DEFAULT_ASSUMPTIONS,
  FREE_PROJECTION_HORIZON,
  PROJECTION_HORIZONS,
} from '@/constants/analysis';
import { spacing } from '@/constants/theme';
import { compareSellVsHold } from '@/lib/calculations/sellVsHold';
import { SCENARIO_TYPE_FOR, parseSellVsHoldAssumptions } from '@/lib/validation/scenario';
import { useScenarioEditor } from '@/hooks/useScenarioEditor';
import { formatCurrency, formatPercent } from '@/lib/formatting/number';
import { analytics } from '@/services/analytics';
import { useProperty } from '@/store/propertyStore';
import { useEntitlements } from '@/store/subscriptionStore';
import type { SellVsHoldAssumptions } from '@/types/analysis';
import type { PropertyScenario } from '@/types/property';

/**
 * Sell vs. Hold.
 *
 * Verdict first, assumptions underneath, working at the bottom. Every
 * assumption is the user's to change, and the screen recomputes live so the
 * effect of each one is immediately visible.
 */
export default function SellVsHoldScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const property = useProperty(id);
  const { can } = useEntitlements();

  const canUseLongHorizons = can('longRangeProjections');

  /**
   * Assumptions are held as overrides on top of defaults derived from the
   * property itself, so the screen has a complete set on its very first
   * render — no effect, no flash of an empty comparison.
   */
  const [overrides, setOverrides] = useState<Partial<SellVsHoldAssumptions>>({});

  const assumptions = useMemo<SellVsHoldAssumptions | null>(() => {
    if (!property) return null;

    return {
      expectedSalePrice: property.estimatedMarketValue,
      sellingCostPercentage: DEFAULT_ASSUMPTIONS.sellingCostPercentage,
      appreciationRate: property.appreciationRate,
      rentGrowthRate: property.rentGrowthRate,
      expenseInflationRate: DEFAULT_ASSUMPTIONS.expenseInflationRate,
      alternativeInvestmentReturn: DEFAULT_ASSUMPTIONS.alternativeInvestmentReturn,
      projectionYears: canUseLongHorizons
        ? DEFAULT_ASSUMPTIONS.projectionYears
        : FREE_PROJECTION_HORIZON,
      reinvestCashFlow: false,
      compareOnAfterSaleBasis: true,
      includeEstimatedTaxes: false,
      estimatedTaxRate: DEFAULT_ASSUMPTIONS.estimatedTaxRate,
      ...overrides,
    };
  }, [canUseLongHorizons, overrides, property]);

  const applyScenario = useCallback(
    (loaded: SellVsHoldAssumptions) => setOverrides(loaded),
    [],
  );

  const editor = useScenarioEditor<SellVsHoldAssumptions>({
    propertyId: property?.id,
    scenarioType: SCENARIO_TYPE_FOR.sellVsHold,
    current: assumptions,
    parse: parseSellVsHoldAssumptions,
    onApply: applyScenario,
  });

  useEffect(() => {
    if (property) analytics.track({ name: 'sell_hold_opened', propertyId: property.id });
  }, [property]);

  const result = useMemo(
    () => (property && assumptions ? compareSellVsHold(property, assumptions) : null),
    [assumptions, property],
  );

  /**
   * One-line outcome for each saved scenario, so the list is a comparison
   * rather than a set of opaque names. Recomputed only when the saved set or
   * the property changes — not while the user is typing.
   */
  const describeScenario = useMemo(() => {
    if (!property) return undefined;

    const summaries = new Map<string, string>();
    for (const scenario of editor.scenarios) {
      const saved = compareSellVsHold(property, parseSellVsHoldAssumptions(scenario.assumptions));
      const label =
        saved.outcome === 'toss-up'
          ? 'Too close to call'
          : saved.outcome === 'sell'
            ? `Sell + Invest ahead by ${formatCurrency(Math.abs(saved.difference))}`
            : `Keeping ahead by ${formatCurrency(Math.abs(saved.difference))}`;
      summaries.set(scenario.id, `${saved.assumptions.projectionYears} yr · ${label}`);
    }

    return (scenario: PropertyScenario) => summaries.get(scenario.id) ?? null;
  }, [editor.scenarios, property]);

  useEffect(() => {
    if (property && result) {
      analytics.track({
        name: 'sell_hold_completed',
        propertyId: property.id,
        horizonYears: result.assumptions.projectionYears,
        outcome: result.outcome,
      });
    }
    // Only report once per horizon/outcome change, not on every keystroke.
  }, [property, result?.assumptions.projectionYears, result?.outcome]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!property) return <PropertyRouteState title="Sell vs. Hold" />;

  if (!assumptions || !result) {
    return (
      <Screen>
        <PageHeader title="Sell vs. Hold" onBack={() => router.back()} />
      </Screen>
    );
  }

  const update = (patch: Partial<SellVsHoldAssumptions>) =>
    setOverrides((current) => ({ ...current, ...patch }));

  return (
    <Screen>
      <PageHeader
        title="Sell vs. Hold"
        subtitle={property.nickname || property.streetAddress}
        onBack={() => router.back()}
      />

      <SegmentedControl
        accessibilityLabel="Projection horizon"
        options={PROJECTION_HORIZONS.map((years) => ({
          value: years,
          label: `${years} years`,
          locked: years !== FREE_PROJECTION_HORIZON && !canUseLongHorizons,
        }))}
        value={assumptions.projectionYears}
        onChange={(years) => update({ projectionYears: years })}
        onLockedPress={() => router.push('/paywall?reason=longRangeProjections')}
      />

      <ComparisonResult result={result} />

      <ScenarioBar
        scenarios={editor.scenarios}
        activeId={editor.activeId}
        isDirty={editor.isDirty}
        isSaving={editor.isSaving}
        error={editor.error}
        describe={describeScenario}
        onLoad={editor.load}
        onSaveNew={(name) => editor.saveNew(name, assumptions)}
        onUpdateActive={() => editor.updateActive(assumptions)}
        onRename={editor.rename}
        onDelete={editor.remove}
      />

      {editor.scenarios.length >= 2 ? (
        <Button
          label={`Compare ${editor.scenarios.length} scenarios`}
          variant="secondary"
          icon="albums-outline"
          onPress={() =>
            can('scenarioComparison')
              ? router.push(`/property/${property.id}/compare?type=sell`)
              : router.push('/paywall?reason=scenarioComparison')
          }
        />
      ) : null}

      {result.factors.length > 0 ? (
        <Section title="Why?">
          <Card>
            {result.factors.map((factor, index) => (
              <View key={factor} style={[styles.factor, index > 0 ? styles.factorSpaced : null]}>
                <Text variant="body" tone="secondary">
                  •
                </Text>
                <Text variant="body" style={styles.factorText}>
                  {factor}
                </Text>
              </View>
            ))}
          </Card>
        </Section>
      ) : null}

      <Section title="If you sell today">
        <Card>
          <MetricRow
            label="Expected sale price"
            value={formatCurrency(result.sell.saleProceeds.expectedSalePrice)}
          />
          <MetricRow
            label={`Selling costs (${formatPercent(assumptions.sellingCostPercentage)})`}
            value={formatCurrency(-result.sell.saleProceeds.grossSellingCosts)}
            indent
          />
          <MetricRow
            label="Mortgage payoff"
            value={formatCurrency(-result.sell.saleProceeds.mortgagePayoff)}
            indent
          />
          {result.sell.saleProceeds.estimatedTaxes !== null ? (
            <MetricRow
              label="Estimated taxes (experimental)"
              value={formatCurrency(-result.sell.saleProceeds.estimatedTaxes)}
              indent
            />
          ) : null}
          <MetricRow
            label="Estimated cash after sale"
            value={formatCurrency(result.sell.saleProceeds.netSaleProceeds)}
            emphasis
          />
        </Card>
      </Section>

      <Section title="If you keep it">
        <Card>
          <MetricRow
            label={`Property value in year ${assumptions.projectionYears}`}
            value={formatCurrency(result.hold.finalPropertyValue)}
          />
          <MetricRow
            label="Remaining mortgage"
            value={formatCurrency(-result.hold.finalMortgageBalance)}
            indent
          />
          <MetricRow label="Projected equity" value={formatCurrency(result.hold.finalEquity)} />
          {result.hold.exitCosts > 0 ? (
            <MetricRow
              label="Less estimated selling costs at exit"
              value={formatCurrency(-result.hold.exitCosts)}
              indent
            />
          ) : null}
          <MetricRow
            label="Accumulated cash flow"
            value={formatCurrency(result.hold.cumulativeCashFlow)}
          />
          <MetricRow
            label="Projected wealth"
            value={formatCurrency(result.hold.projectedWealth)}
            emphasis
          />
        </Card>
      </Section>

      <Section title="Assumptions" description="Everything here is yours to change.">
        <Card>
          <View style={styles.fields}>
            <CurrencyField
              label="Expected sale price"
              value={assumptions.expectedSalePrice}
              onChange={(value) => update({ expectedSalePrice: value ?? 0 })}
            />
            <PercentField
              label="Selling costs"
              hint="Agent commissions plus seller closing costs."
              value={assumptions.sellingCostPercentage}
              onChange={(value) => update({ sellingCostPercentage: value ?? 0 })}
            />
            <PercentField
              label="Property appreciation"
              value={assumptions.appreciationRate}
              onChange={(value) => update({ appreciationRate: value ?? 0 })}
            />
            <PercentField
              label="Annual rent growth"
              value={assumptions.rentGrowthRate}
              onChange={(value) => update({ rentGrowthRate: value ?? 0 })}
            />
            <PercentField
              label="Annual expense inflation"
              value={assumptions.expenseInflationRate}
              onChange={(value) => update({ expenseInflationRate: value ?? 0 })}
            />
            <PercentField
              label="Alternative investment return"
              hint="What you assume the proceeds would earn elsewhere. Not a guaranteed return."
              value={assumptions.alternativeInvestmentReturn}
              onChange={(value) => update({ alternativeInvestmentReturn: value ?? 0 })}
            />

            <SwitchField
              label="Reinvest the cash flow you keep"
              hint="Compound retained cash flow at the alternative return instead of holding it idle."
              value={assumptions.reinvestCashFlow}
              onChange={(value) => update({ reinvestCashFlow: value })}
            />
            <SwitchField
              label="Compare after selling costs"
              hint="Subtract estimated selling costs from the hold case too, so both sides are net of a sale."
              value={assumptions.compareOnAfterSaleBasis}
              onChange={(value) => update({ compareOnAfterSaleBasis: value })}
            />
            <SwitchField
              label="Include estimated taxes (experimental)"
              hint="A single blended rate on the estimated gain. Ignores depreciation recapture, passive losses, state tax and 1031 treatment."
              value={assumptions.includeEstimatedTaxes}
              onChange={(value) => update({ includeEstimatedTaxes: value })}
            />
            {assumptions.includeEstimatedTaxes ? (
              <>
                <PercentField
                  label="Blended tax rate"
                  value={assumptions.estimatedTaxRate}
                  onChange={(value) => update({ estimatedTaxRate: value ?? 0 })}
                />
                <Notice tone="warning" icon="flask-outline">
                  This tax figure is a rough placeholder, not a tax calculation. Talk to a tax
                  professional before acting on it.
                </Notice>
              </>
            ) : null}
          </View>
        </Card>
      </Section>

      <Section title="Year by year">
        <ProjectionTable hold={result.hold} sell={result.sell} />
      </Section>

      <Text variant="caption" tone="tertiary">
        {DISCLAIMER}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.lg },
  factor: { flexDirection: 'row', gap: spacing.sm },
  factorSpaced: { marginTop: spacing.md },
  factorText: { flex: 1 },
});
