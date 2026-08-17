import { Pressable, StyleSheet, View } from 'react-native';
import { HIT_TARGET, radius, spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import { Text } from './Text';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
  /** Renders a lock glyph and routes the press to `onLockedPress`. */
  locked?: boolean;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  onLockedPress?: (value: T) => void;
  accessibilityLabel?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  onLockedPress,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const colors = useColors();

  return (
    <View
      style={[styles.track, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <Pressable
            key={String(option.value)}
            onPress={() =>
              option.locked ? onLockedPress?.(option.value) : onChange(option.value)
            }
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected, disabled: option.locked }}
            accessibilityLabel={option.locked ? `${option.label} (upgrade required)` : option.label}
            style={[
              styles.segment,
              isSelected
                ? { backgroundColor: colors.surface, borderColor: colors.borderStrong }
                : { borderColor: 'transparent' },
            ]}
          >
            <Text
              variant={isSelected ? 'bodyStrong' : 'body'}
              tone={option.locked ? 'tertiary' : isSelected ? 'primary' : 'secondary'}
              numberOfLines={1}
            >
              {option.locked ? `${option.label} 🔒` : option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: HIT_TARGET - 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
