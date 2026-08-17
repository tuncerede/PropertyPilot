import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

/**
 * Loading, empty and error presentations.
 *
 * Every async screen renders one of these instead of a blank view, and raw
 * network or Supabase errors are never shown: `AppError.message` is written
 * for a landlord, while the technical detail goes to the logger.
 */

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  const colors = useColors();

  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator size="large" color={colors.brand} />
      <Text variant="body" tone="secondary" align="center">
        {label}
      </Text>
    </View>
  );
}

/** Grey block used while a specific figure is resolving. */
export function Skeleton({ height = 20, width = '100%' }: { height?: number; width?: number | string }) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.skeleton,
        { height, width: width as number, backgroundColor: colors.skeleton },
      ]}
    />
  );
}

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'home-outline',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colors = useColors();

  return (
    <Card style={styles.emptyCard} padding="xxl">
      <View style={[styles.iconCircle, { backgroundColor: colors.brandMuted }]}>
        <Ionicons name={icon} size={28} color={colors.brand} />
      </View>
      <Text variant="heading" align="center">
        {title}
      </Text>
      <Text variant="body" tone="secondary" align="center">
        {description}
      </Text>
      {actionLabel && onAction ? (
        <View style={styles.emptyAction}>
          <Button label={actionLabel} onPress={onAction} icon="add" />
        </View>
      ) : null}
    </Card>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  const colors = useColors();

  return (
    <Card style={styles.emptyCard} padding="xxl">
      <View style={[styles.iconCircle, { backgroundColor: colors.negativeMuted }]}>
        <Ionicons name="alert-circle-outline" size={28} color={colors.negative} />
      </View>
      <Text variant="heading" align="center">
        {title}
      </Text>
      <Text variant="body" tone="secondary" align="center">
        {message}
      </Text>
      {onRetry ? (
        <View style={styles.emptyAction}>
          <Button label={retryLabel} onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </Card>
  );
}

/** Inline non-blocking message, e.g. a caveat above a result. */
export function Notice({
  tone = 'info',
  icon = 'information-circle-outline',
  children,
}: {
  tone?: 'info' | 'warning' | 'positive';
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  const colors = useColors();

  const palette = {
    info: { background: colors.infoMuted, foreground: colors.infoOnMuted },
    warning: { background: colors.warningMuted, foreground: colors.warningOnMuted },
    positive: { background: colors.positiveMuted, foreground: colors.positiveOnMuted },
  }[tone];

  return (
    <View style={[styles.notice, { backgroundColor: palette.background }]}>
      <Ionicons name={icon} size={16} color={palette.foreground} style={styles.noticeIcon} />
      <Text variant="caption" style={[styles.noticeText, { color: palette.foreground }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.huge,
  },
  skeleton: {
    borderRadius: radius.sm,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAction: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'flex-start',
  },
  noticeIcon: { marginTop: 1 },
  noticeText: { flex: 1 },
});
