import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { HIT_TARGET, radius, spacing, typography } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import {
  formatCurrencyInput,
  inputTextToPercent,
  parseNumericText,
  percentToInputText,
  sanitizeNumericText,
  toEditableNumberText,
} from '@/lib/formatting/input';
import { Text } from '@/components/ui/Text';

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function FieldShell({ label, hint, error, children }: FieldShellProps) {
  return (
    <View style={styles.field}>
      <Text variant="captionStrong" tone="secondary">
        {label}
      </Text>
      {children}
      {error ? (
        <Text variant="caption" tone="negative">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="tertiary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

interface BaseInputProps {
  label: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  testID?: string;
}

export interface TextFieldProps extends BaseInputProps {
  value: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  keyboardType?: TextInputProps['keyboardType'];
  secureTextEntry?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
}

export function TextField({
  label,
  hint,
  error,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = 'sentences',
  autoComplete,
  keyboardType,
  secureTextEntry,
  maxLength,
  autoFocus,
  testID,
}: TextFieldProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <FieldShell label={label} hint={hint} error={error}>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        autoFocus={autoFocus}
        accessibilityLabel={label}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            borderColor: error ? colors.negative : focused ? colors.brand : colors.border,
          },
        ]}
      />
    </FieldShell>
  );
}

interface NumericFieldProps extends BaseInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  allowNegative?: boolean;
}

/**
 * Currency input.
 *
 * While focused the field shows the raw number so editing feels natural; on
 * blur it re-renders with thousands separators. This is what avoids the
 * cursor-jumping that aggressive as-you-type currency formatting causes.
 */
export function CurrencyField({
  label,
  hint,
  error,
  value,
  onChange,
  placeholder = '0',
  allowNegative = false,
  testID,
}: NumericFieldProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  const displayValue = focused ? draft : formatCurrencyInput(value);

  return (
    <FieldShell label={label} hint={hint} error={error}>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.negative : focused ? colors.brand : colors.border,
          },
        ]}
      >
        <Text variant="subheading" tone="tertiary">
          $
        </Text>
        <TextInput
          testID={testID}
          value={displayValue}
          onFocus={() => {
            setDraft(toEditableNumberText(value));
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onChangeText={(text) => {
            const cleaned = sanitizeNumericText(text, allowNegative);
            setDraft(cleaned);
            onChange(parseNumericText(cleaned));
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={allowNegative ? 'numbers-and-punctuation' : 'decimal-pad'}
          inputMode="decimal"
          accessibilityLabel={label}
          style={[styles.bareInput, { color: colors.textPrimary }]}
        />
      </View>
    </FieldShell>
  );
}

/**
 * Percent input. The user types whole percent ("5.5"); the form stores the
 * decimal fraction (0.055).
 */
export function PercentField({
  label,
  hint,
  error,
  value,
  onChange,
  placeholder = '0',
  testID,
}: NumericFieldProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  const displayValue = focused ? draft : percentToInputText(value);

  return (
    <FieldShell label={label} hint={hint} error={error}>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.negative : focused ? colors.brand : colors.border,
          },
        ]}
      >
        <TextInput
          testID={testID}
          value={displayValue}
          onFocus={() => {
            setDraft(percentToInputText(value));
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onChangeText={(text) => {
            const cleaned = sanitizeNumericText(text);
            setDraft(cleaned);
            onChange(inputTextToPercent(cleaned));
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType="decimal-pad"
          inputMode="decimal"
          accessibilityLabel={label}
          style={[styles.bareInput, { color: colors.textPrimary }]}
        />
        <Text variant="subheading" tone="tertiary">
          %
        </Text>
      </View>
    </FieldShell>
  );
}

export function IntegerField({
  label,
  hint,
  error,
  value,
  onChange,
  placeholder = '0',
  testID,
}: NumericFieldProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <FieldShell label={label} hint={hint} error={error}>
      <TextInput
        testID={testID}
        value={value === null ? '' : String(Math.round(value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChangeText={(text) => {
          const cleaned = text.replace(/[^0-9]/g, '');
          onChange(cleaned === '' ? null : Number(cleaned));
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType="number-pad"
        inputMode="numeric"
        accessibilityLabel={label}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            borderColor: error ? colors.negative : focused ? colors.brand : colors.border,
          },
        ]}
      />
    </FieldShell>
  );
}

export interface OptionFieldProps<T extends string> extends BaseInputProps {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}

/** Chip picker — avoids a native picker so it behaves the same everywhere. */
export function OptionField<T extends string>({
  label,
  hint,
  error,
  value,
  onChange,
  options,
}: OptionFieldProps<T>) {
  const colors = useColors();

  return (
    <FieldShell label={label} hint={hint} error={error}>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.brandMuted : colors.surface,
                  borderColor: selected ? colors.brand : colors.border,
                },
              ]}
            >
              <Text variant={selected ? 'bodyStrong' : 'body'} tone={selected ? 'brand' : 'secondary'}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FieldShell>
  );
}

export function SwitchField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={[styles.switchRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
    >
      <View style={styles.switchText}>
        <Text variant="bodyStrong">{label}</Text>
        {hint ? (
          <Text variant="caption" tone="tertiary">
            {hint}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.switchTrack,
          { backgroundColor: value ? colors.brand : colors.borderStrong },
        ]}
      >
        <View
          style={[
            styles.switchThumb,
            { backgroundColor: colors.surface, alignSelf: value ? 'flex-end' : 'flex-start' },
          ]}
        />
      </View>
    </Pressable>
  );
}

/** Date entry as three plain numeric parts — no native picker dependency. */
export function DateField({
  label,
  hint,
  error,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  error?: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  return (
    <FieldShell label={label} hint={hint ?? 'Format: YYYY-MM-DD'} error={error}>
      <TextInput
        value={focused ? draft : (value ?? '')}
        onFocus={() => {
          setDraft(value ?? '');
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
          const normalized = draft.trim();
          onChange(/^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null);
        }}
        onChangeText={setDraft}
        placeholder="2019-03-15"
        placeholderTextColor={colors.textTertiary}
        keyboardType="numbers-and-punctuation"
        accessibilityLabel={label}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            borderColor: error ? colors.negative : focused ? colors.brand : colors.border,
          },
        ]}
      />
    </FieldShell>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    minHeight: HIT_TARGET + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.subheading,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: HIT_TARGET + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  bareInput: {
    flex: 1,
    paddingVertical: spacing.md,
    ...typography.subheading,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: HIT_TARGET,
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: HIT_TARGET + 8,
  },
  switchText: { flex: 1, gap: spacing.xxs },
  switchTrack: {
    width: 50,
    height: 30,
    borderRadius: radius.pill,
    padding: 3,
    justifyContent: 'center',
  },
  switchThumb: { width: 24, height: 24, borderRadius: radius.pill },
});
