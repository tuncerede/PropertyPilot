import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HIT_TARGET, radius, spacing, typography } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  icon,
  fullWidth = true,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;

  const palette: Record<ButtonVariant, { background: string; border: string; text: string }> = {
    primary: { background: colors.brand, border: colors.brand, text: colors.textInverse },
    secondary: { background: colors.surface, border: colors.borderStrong, text: colors.textPrimary },
    ghost: { background: 'transparent', border: 'transparent', text: colors.brand },
    destructive: { background: colors.surface, border: colors.negative, text: colors.negative },
  };

  const tone = palette[variant];

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: tone.background,
          borderColor: tone.border,
          paddingVertical: size === 'lg' ? spacing.lg : spacing.md,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: fullWidth ? spacing.lg : spacing.xl,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={tone.text} />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={18} color={tone.text} /> : null}
            <Text style={[typography.subheading, { color: tone.text }]} numberOfLines={1}>
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: HIT_TARGET,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
