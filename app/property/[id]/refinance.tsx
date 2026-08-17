import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PropertyRouteState } from '@/components/property/PropertyRouteState';
import { CurrencyField, IntegerField, PercentField, SwitchField } from '@/components/forms/Field';
import { Card } from '@/components/ui/Card';
import { Metric, MetricRow } from '@/components/ui/Metric';
import { Screen } from '@/components/ui/Screen';
import { PageHeader, Section } from '@/components/ui/Section';
import { Notice } from '@/components/ui/States';
import { Text, toneForValue } from '@/components/ui/Text';
import { SHORT_DISCLAIMER } from '@/constants/branding';
import { spacing } from '@/constants/theme';
import { analyzeRefinance } from '@/lib/calculations/refinance';
import {
  formatCurrency,
  formatCurrencyPerMonth,
  formatPercent,
  NOT_AVAILABLE,
} from '@/lib/formatting/number';
import { analytics } from '@/services/analytics';
import { useProperty } from '@/store/propertyStore';
import type { RefinanceInputs } from '@/types/analysis';

export default function RefinanceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const property = useProperty(id);

  /**
   * Held as overrides on top of defaults derived from the property, so the
   * screen renders a complete scenario immediately rather than filling
   * itself in from an effect on the second pass.
   */
  const [overrides, setOverrides] = useState<Partial<RefinanceInputs>>({});

  const inputs = useMemo<RefinanceInputs | null>(() => {
    if (!property) return null;

    return {
      // A 75% LTV cash-out is a common starting point; fully editable.
      newLoanAmount: Math.round(property.estimatedMarketValue * 0.75),
      newInterestRate: property.mortgageInterestRate > 0 ? property.mortgageInterestRate : 0.065,
      newTermYears: 30,
      closingCosts: 3_500,
      rollClosingCostsIntoLoan: false,
      ...overrides,
    };
  }, [overrides, property]);

  useEffect(() => {
    if (property) analytics.track({ name: 'refinance_opened', propertyId: property.id });
  }, [property]);

  const result = useMemo(
    () => (property && inputs ? analyzeRefinance(property, inputs) : null),
    [inputs, property],
  );

  if (!property) return <PropertyRouteState title="Refinance" />;

  if (!inputs || !result) {
    return (
      <Screen>
        <PageHeader title="Refinance" onBack={() => router.back()} />
      </Screen>
    );
  }

  const update = (patch: Partial<RefinanceInputs>) =>
    setOverrides((current) => ({ ...current, ...patch }));

  return (
    <Screen>
      <PageHeader
        title="Refinance"
        subtitle={property.nickname || property.streetAddress}
        onBack={() => router.back()}
      />

      <Card>
        <Metric
          label="Cash released at closing"
          value={formatCurrency(result.cashReleased)}
          tone={toneForValue(result.cashReleased)}
          size="lg"
          caption={
            result.cashReleased < 0
              ? 'Negative means you would bring cash to closing.'
              : 'After paying off the current loan and closing costs.'
          }
        />
      </Card>

      <Section title="What changes">
        <Card>
          <MetricRow
            label="Current payment"
            value={formatCurrencyPerMonth(-result.currentMonthlyPayment)}
          />
          <MetricRow
            label="New payment"
            value={formatCurrencyPerMonth(-result.newMonthlyPayment)}
          />
          <MetricRow
            label="Change"
            value={formatCurrencyPerMonth(-result.monthlyPaymentChange)}
            tone={toneForValue(-result.monthlyPaymentChange)}
            emphasis
          />
          <MetricRow
            label="Current cash flow"
            value={formatCurrencyPerMonth(result.currentMonthlyCashFlow)}
          />
          <MetricRow
            label="New cash flow"
            value={formatCurrencyPerMonth(result.newMonthlyCashFlow)}
            tone={toneForValue(result.newMonthlyCashFlow)}
          />
          <MetricRow
            label="New annual cash flow"
            value={formatCurrency(result.newAnnualCashFlow)}
            tone={toneForValue(result.newAnnualCashFlow)}
            emphasis
          />
          <MetricRow label="Current equity" value={formatCurrency(result.currentEquity)} />
          <MetricRow label="New equity" value={formatCurrency(result.newEquity)} />
          <MetricRow label="New loan to value" value={formatPercent(result.newLoanToValue)} />
          <MetricRow
            label="Break-even on closing costs"
            value={
              result.breakEvenMonths === null
                ? NOT_AVAILABLE
                : `${result.breakEvenMonths} months`
            }
            emphasis
          />
        </Card>

        {result.breakEvenMonths === null && result.monthlyPaymentChange > 0 ? (
          <Notice tone="info">
            This refinance raises the payment, so there is no payment-savings break-even. The
            trade is cash out now against lower monthly cash flow.
          </Notice>
        ) : null}
      </Section>

      <Section title="New loan">
        <Card>
          <View style={styles.fields}>
            <CurrencyField
              label="New loan amount"
              value={inputs.newLoanAmount}
              onChange={(value) => update({ newLoanAmount: value ?? 0 })}
            />
            <PercentField
              label="New interest rate"
              value={inputs.newInterestRate}
              onChange={(value) => update({ newInterestRate: value ?? 0 })}
            />
            <IntegerField
              label="New loan term (years)"
              value={inputs.newTermYears}
              onChange={(value) => update({ newTermYears: value ?? 0 })}
            />
            <CurrencyField
              label="Estimated closing costs"
              value={inputs.closingCosts}
              onChange={(value) => update({ closingCosts: value ?? 0 })}
            />
            <SwitchField
              label="Roll closing costs into the loan"
              hint="Adds the costs to the balance instead of paying them at closing."
              value={inputs.rollClosingCostsIntoLoan}
              onChange={(value) => update({ rollClosingCostsIntoLoan: value })}
            />
          </View>
        </Card>
      </Section>

      <Text variant="caption" tone="tertiary">
        Estimates only. Actual rates, terms and costs come from a lender. {SHORT_DISCLAIMER}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.lg },
});
