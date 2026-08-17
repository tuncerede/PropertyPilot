import { Pressable, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { radius, shadow, spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';

export interface CardProps extends ViewProps {
  /** Removes the default inner padding for cards that manage their own. */
  flush?: boolean;
  /** Flat cards sit inside another card and drop the shadow. */
  variant?: 'raised' | 'flat';
  padding?: keyof typeof spacing;
}

export function Card({
  flush = false,
  variant = 'raised',
  padding = 'lg',
  style,
  children,
  ...rest
}: CardProps) {
  const colors = useColors();

  return (
    <View
      {...rest}
      style={[
        styles.card,
        {
          backgroundColor: variant === 'flat' ? colors.surfaceMuted : colors.surface,
          borderColor: colors.border,
          padding: flush ? 0 : spacing[padding],
        },
        variant === 'raised' ? shadow.card : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export interface PressableCardProps extends CardProps {
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
}

export function PressableCard({
  onPress,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  style,
  children,
  ...rest
}: PressableCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [pressed ? styles.pressed : null, style as ViewStyle]}
    >
      <Card {...rest}>{children}</Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.995 }],
  },
});
