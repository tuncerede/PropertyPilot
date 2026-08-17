import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import { Text } from './Text';

export function Section({
  title,
  description,
  action,
  children,
}: {
  title?: string;
  description?: string;
  action?: { label: string; onPress: () => void };
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {title || action ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? <Text variant="label" tone="secondary">{title}</Text> : null}
            {description ? (
              <Text variant="caption" tone="tertiary">
                {description}
              </Text>
            ) : null}
          </View>
          {action ? (
            <Pressable onPress={action.onPress} hitSlop={8} accessibilityRole="button">
              <Text variant="captionStrong" tone="brand">
                {action.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Screen title block, used at the top of each tab. */
export function PageHeader({
  title,
  subtitle,
  onBack,
  trailing,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
}) {
  const colors = useColors();

  return (
    <View style={styles.pageHeader}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={22} color={colors.brand} />
        </Pressable>
      ) : null}
      <View style={styles.pageHeaderText}>
        <Text variant="title" numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body" tone="secondary" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

/** Thin separator between rows inside a card. */
export function Divider() {
  const colors = useColors();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: { flex: 1, gap: spacing.xxs },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  pageHeaderText: { flex: 1, gap: spacing.xs },
  back: { paddingTop: spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
});
