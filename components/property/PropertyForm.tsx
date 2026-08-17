import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CurrencyField,
  DateField,
  IntegerField,
  OptionField,
  PercentField,
  SwitchField,
  TextField,
} from '@/components/forms/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { PageHeader } from '@/components/ui/Section';
import { Notice } from '@/components/ui/States';
import { Text } from '@/components/ui/Text';
import { VALUE_DISCLAIMER } from '@/constants/branding';
import { radius, spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import {
  propertyFormSchema,
  toPropertyDraft,
  type PropertyFormValues,
} from '@/lib/validation/property';
import { PROPERTY_TYPE_LABELS, PROPERTY_TYPES, type PropertyDraft } from '@/types/property';

/**
 * The six-step property entry flow.
 *
 * One idea per screen: identity, acquisition, financing, income, expenses,
 * value. A landlord who only knows rent and the mortgage balance can still
 * finish — every numeric field is optional at the schema level and defaults
 * to zero, so the flow never traps someone behind a field they do not have.
 */

const STEPS = [
  { key: 'property', title: 'Property', subtitle: 'What and where is it?' },
  { key: 'acquisition', title: 'Acquisition', subtitle: 'What did it cost to get in?' },
  { key: 'financing', title: 'Financing', subtitle: 'What do you owe on it?' },
  { key: 'income', title: 'Income', subtitle: 'What does it bring in?' },
  { key: 'expenses', title: 'Expenses', subtitle: 'What does it cost to run?' },
  { key: 'value', title: 'Current Value', subtitle: 'What is it worth today?' },
] as const;

/** Fields validated before a step is allowed to advance. */
const STEP_FIELDS: Record<number, (keyof PropertyFormValues)[]> = {
  0: ['nickname', 'streetAddress', 'city', 'state', 'zipCode', 'propertyType', 'unitCount', 'occupiedUnits'],
  1: ['purchasePrice', 'purchaseDate', 'initialClosingCosts', 'initialCapex', 'originalDownPayment'],
  2: ['mortgageBalance', 'mortgageInterestRate', 'monthlyPrincipalInterest', 'remainingTermYears'],
  3: ['monthlyGrossRent', 'monthlyOtherIncome', 'vacancyRate'],
  4: [
    'annualPropertyTax',
    'annualInsurance',
    'monthlyManagementCost',
    'managementPercentage',
    'annualRepairsMaintenance',
    'monthlyOwnerUtilities',
    'monthlyHoa',
    'monthlyLawnSnow',
    'monthlyOtherExpenses',
  ],
  5: ['estimatedMarketValue', 'appreciationRate', 'rentGrowthRate'],
};

export interface PropertyFormProps {
  initialValues: PropertyFormValues;
  title: string;
  submitLabel: string;
  isSaving: boolean;
  errorMessage?: string | null;
  onSubmit: (draft: PropertyDraft) => void;
  onCancel: () => void;
}

export function PropertyForm({
  initialValues,
  title,
  submitLabel,
  isSaving,
  errorMessage,
  onSubmit,
  onCancel,
}: PropertyFormProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

  const { control, handleSubmit, trigger } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  // useWatch rather than form.watch(): it subscribes to a single field and is
  // safe to memoize, so the financing step re-renders without the whole form.
  const hasMortgage = useWatch({ control, name: 'hasMortgage' });
  const isLastStep = stepIndex === STEPS.length - 1;

  const submit = handleSubmit((values) => onSubmit(toPropertyDraft(values)));

  const goNext = async () => {
    const fields = STEP_FIELDS[stepIndex] ?? [];
    const valid = await trigger(fields);
    if (!valid) return;

    if (isLastStep) {
      await submit();
    } else {
      setStepIndex((current) => current + 1);
    }
  };

  const goBack = () => {
    if (stepIndex === 0) {
      onCancel();
    } else {
      setStepIndex((current) => current - 1);
    }
  };

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            label={isLastStep ? submitLabel : 'Continue'}
            onPress={goNext}
            loading={isSaving}
          />
          <Button
            label={stepIndex === 0 ? 'Cancel' : 'Back'}
            variant="ghost"
            onPress={goBack}
            disabled={isSaving}
          />
        </View>
      }
    >
      <PageHeader title={title} subtitle={`Step ${stepIndex + 1} of ${STEPS.length}`} />

      <StepProgress current={stepIndex} total={STEPS.length} />

      <View style={styles.stepHeader}>
        <Text variant="heading">{step?.title}</Text>
        <Text variant="body" tone="secondary">
          {step?.subtitle}
        </Text>
      </View>

      {errorMessage ? (
        <Notice tone="warning" icon="alert-circle-outline">
          {errorMessage}
        </Notice>
      ) : null}

      <Card>
        {stepIndex === 0 ? <PropertyStep control={control} /> : null}
        {stepIndex === 1 ? <AcquisitionStep control={control} /> : null}
        {stepIndex === 2 ? <FinancingStep control={control} hasMortgage={hasMortgage} /> : null}
        {stepIndex === 3 ? <IncomeStep control={control} /> : null}
        {stepIndex === 4 ? <ExpensesStep control={control} /> : null}
        {stepIndex === 5 ? <ValueStep control={control} /> : null}
      </Card>
    </Screen>
  );
}

function StepProgress({ current, total }: { current: number; total: number }) {
  const colors = useColors();
  const segments = useMemo(() => Array.from({ length: total }, (_, index) => index), [total]);

  return (
    <View style={styles.progress} accessibilityLabel={`Step ${current + 1} of ${total}`}>
      {segments.map((index) => (
        <View
          key={index}
          style={[
            styles.progressSegment,
            { backgroundColor: index <= current ? colors.brand : colors.border },
          ]}
        />
      ))}
    </View>
  );
}

type StepProps = { control: Control<PropertyFormValues> };

function PropertyStep({ control }: StepProps) {
  return (
    <View style={styles.fields}>
      <Controller
        control={control}
        name="nickname"
        render={({ field, fieldState }) => (
          <TextField
            label="Property name"
            hint="Something you'll recognise, like “Neufer Duplex”."
            value={field.value}
            onChangeText={field.onChange}
            placeholder="Neufer Duplex"
            error={fieldState.error?.message}
            testID="property-nickname"
          />
        )}
      />
      <Controller
        control={control}
        name="streetAddress"
        render={({ field, fieldState }) => (
          <TextField
            label="Street address"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            placeholder="119 Neufer Ct"
            autoComplete="street-address"
            error={fieldState.error?.message}
          />
        )}
      />
      <View style={styles.row}>
        <View style={styles.rowItemWide}>
          <Controller
            control={control}
            name="city"
            render={({ field, fieldState }) => (
              <TextField
                label="City"
                value={field.value ?? ''}
                onChangeText={field.onChange}
                placeholder="Erie"
                error={fieldState.error?.message}
              />
            )}
          />
        </View>
        <View style={styles.rowItem}>
          <Controller
            control={control}
            name="state"
            render={({ field, fieldState }) => (
              <TextField
                label="State"
                value={field.value ?? ''}
                onChangeText={field.onChange}
                placeholder="PA"
                autoCapitalize="characters"
                maxLength={20}
                error={fieldState.error?.message}
              />
            )}
          />
        </View>
      </View>
      <Controller
        control={control}
        name="zipCode"
        render={({ field, fieldState }) => (
          <TextField
            label="ZIP code"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            placeholder="16509"
            keyboardType="number-pad"
            maxLength={10}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="propertyType"
        render={({ field }) => (
          <OptionField
            label="Property type"
            value={field.value}
            onChange={field.onChange}
            options={PROPERTY_TYPES.map((type) => ({
              value: type,
              label: PROPERTY_TYPE_LABELS[type],
            }))}
          />
        )}
      />
      <View style={styles.row}>
        <View style={styles.rowItemWide}>
          <Controller
            control={control}
            name="unitCount"
            render={({ field, fieldState }) => (
              <IntegerField
                label="Number of units"
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder="1"
                error={fieldState.error?.message}
              />
            )}
          />
        </View>
        <View style={styles.rowItemWide}>
          <Controller
            control={control}
            name="occupiedUnits"
            render={({ field, fieldState }) => (
              <IntegerField
                label="Occupied units"
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder="1"
                error={fieldState.error?.message}
              />
            )}
          />
        </View>
      </View>
    </View>
  );
}

function AcquisitionStep({ control }: StepProps) {
  return (
    <View style={styles.fields}>
      <Controller
        control={control}
        name="purchasePrice"
        render={({ field, fieldState }) => (
          <CurrencyField
            label="Purchase price"
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="purchaseDate"
        render={({ field, fieldState }) => (
          <DateField
            label="Purchase date"
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="originalDownPayment"
        render={({ field, fieldState }) => (
          <CurrencyField
            label="Original down payment"
            hint="Used for cash-on-cash return. Leave blank if you don't have it."
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="initialClosingCosts"
        render={({ field, fieldState }) => (
          <CurrencyField
            label="Closing costs"
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="initialCapex"
        render={({ field, fieldState }) => (
          <CurrencyField
            label="Rehab / capital investment"
            hint="Money you put into the property beyond the purchase."
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
    </View>
  );
}

function FinancingStep({ control, hasMortgage }: StepProps & { hasMortgage: boolean }) {
  return (
    <View style={styles.fields}>
      <Controller
        control={control}
        name="hasMortgage"
        render={({ field }) => (
          <SwitchField
            label="This property has a mortgage"
            hint="Turn off if you own it free and clear."
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      {hasMortgage ? (
        <>
          <Controller
            control={control}
            name="mortgageBalance"
            render={({ field, fieldState }) => (
              <CurrencyField
                label="Current mortgage balance"
                value={field.value ?? null}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="mortgageInterestRate"
            render={({ field, fieldState }) => (
              <PercentField
                label="Interest rate"
                value={field.value ?? null}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="monthlyPrincipalInterest"
            render={({ field, fieldState }) => (
              <CurrencyField
                label="Monthly principal + interest"
                hint="Just P&I — not escrowed taxes or insurance. Leave blank to calculate it."
                value={field.value ?? null}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="remainingTermYears"
            render={({ field, fieldState }) => (
              <IntegerField
                label="Remaining term (years)"
                value={field.value ?? null}
                onChange={field.onChange}
                placeholder="25"
                error={fieldState.error?.message}
              />
            )}
          />
        </>
      ) : (
        <Notice tone="positive" icon="checkmark-circle-outline">
          No mortgage. Cash flow will equal net operating income.
        </Notice>
      )}
    </View>
  );
}

function IncomeStep({ control }: StepProps) {
  return (
    <View style={styles.fields}>
      <Controller
        control={control}
        name="monthlyGrossRent"
        render={({ field, fieldState }) => (
          <CurrencyField
            label="Monthly gross rent"
            hint="Total rent across all units when fully occupied."
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="monthlyOtherIncome"
        render={({ field, fieldState }) => (
          <CurrencyField
            label="Other monthly income"
            hint="Laundry, parking, storage, pet rent."
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="vacancyRate"
        render={({ field, fieldState }) => (
          <PercentField
            label="Vacancy assumption"
            hint="5% is a common starting point. Adjust to your market."
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
    </View>
  );
}

function ExpensesStep({ control }: StepProps) {
  return (
    <View style={styles.fields}>
      <Controller
        control={control}
        name="annualPropertyTax"
        render={({ field, fieldState }) => (
          <CurrencyField
            label="Property taxes (per year)"
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="annualInsurance"
        render={({ field, fieldState }) => (
          <CurrencyField
            label="Insurance (per year)"
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="annualRepairsMaintenance"
        render={({ field, fieldState }) => (
          <CurrencyField
            label="Repairs & maintenance (per year)"
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="monthlyManagementCost"
        render={({ field, fieldState }) => (
          <CurrencyField
            label="Property management (per month)"
            hint="Leave blank if you use a percentage below."
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="managementPercentage"
        render={({ field, fieldState }) => (
          <PercentField
            label="…or management as a % of collected rent"
            hint="If set, this takes precedence over the monthly amount."
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="monthlyOwnerUtilities"
        render={({ field, fieldState }) => (
          <CurrencyField
            label="Owner-paid utilities (per month)"
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="monthlyHoa"
        render={({ field, fieldState }) => (
          <CurrencyField
            label="HOA (per month)"
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="monthlyLawnSnow"
        render={({ field, fieldState }) => (
          <CurrencyField
            label="Lawn & snow (per month)"
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="monthlyOtherExpenses"
        render={({ field, fieldState }) => (
          <CurrencyField
            label="Other operating expenses (per month)"
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
    </View>
  );
}

function ValueStep({ control }: StepProps) {
  return (
    <View style={styles.fields}>
      <Controller
        control={control}
        name="estimatedMarketValue"
        render={({ field, fieldState }) => (
          <CurrencyField
            label="Estimated current market value"
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      <Notice tone="info">{VALUE_DISCLAIMER}</Notice>

      <Controller
        control={control}
        name="appreciationRate"
        render={({ field, fieldState }) => (
          <PercentField
            label="Expected annual appreciation"
            hint="An assumption you control. 3% is a common default."
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="rentGrowthRate"
        render={({ field, fieldState }) => (
          <PercentField
            label="Expected annual rent growth"
            value={field.value ?? null}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  rowItem: { width: 96 },
  rowItemWide: { flex: 1 },
  stepHeader: { gap: spacing.xs },
  progress: { flexDirection: 'row', gap: spacing.xs },
  progressSegment: { flex: 1, height: 4, borderRadius: radius.pill },
  footer: { gap: spacing.sm },
});
