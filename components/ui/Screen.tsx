import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';

const MAX_CONTENT_WIDTH = 720;

export interface ScreenProps {
  children: React.ReactNode;
  /** Wraps content in a ScrollView. Turn off for screens with their own list. */
  scroll?: boolean;
  /** Adds bottom padding clear of the tab bar / home indicator. */
  padBottom?: boolean;
  contentStyle?: ViewStyle;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Content pinned below the scroll area, e.g. a primary action. */
  footer?: React.ReactNode;
}

/**
 * Page container: background colour, safe areas, keyboard avoidance and a
 * readable max width so the layout does not stretch awkwardly on web or
 * tablets.
 */
export function Screen({
  children,
  scroll = true,
  padBottom = true,
  contentStyle,
  onRefresh,
  refreshing = false,
  footer,
}: ScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const paddingBottom = padBottom ? spacing.xxxl + insets.bottom : spacing.lg;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, { paddingBottom }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined
      }
    >
      <View style={styles.constrain}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.content, { paddingBottom }, contentStyle]}>
      <View style={[styles.constrain, styles.flex]}>{children}</View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
      {footer ? (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: spacing.lg + insets.bottom,
            },
          ]}
        >
          <View style={styles.constrain}>{footer}</View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  constrain: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
