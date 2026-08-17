import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Section } from '@/components/ui/Section';
import { Notice } from '@/components/ui/States';
import { Text } from '@/components/ui/Text';
import { BRANDING, SHORT_DISCLAIMER } from '@/constants/branding';
import { FEATURE_LABELS, TIER_ORDER, TIERS } from '@/constants/subscription';
import { radius, spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useTheme';
import { analytics } from '@/services/analytics';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import type { Feature, SubscriptionTier } from '@/types/subscription';

/**
 * Paywall.
 *
 * Prices come from the store via RevenueCat whenever an offering has loaded;
 * the constants are only a layout fallback so the screen is never blank. The
 * reason the user arrived is used to lead with the feature they wanted.
 */
export default function PaywallScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ reason?: string; tier?: string }>();

  const packages = useSubscriptionStore((state) => state.packages);
  const loadPackages = useSubscriptionStore((state) => state.loadPackages);
  const purchase = useSubscriptionStore((state) => state.purchase);
  const restore = useSubscriptionStore((state) => state.restore);
  const isPurchasing = useSubscriptionStore((state) => state.isPurchasing);
  const isMock = useSubscriptionStore((state) => state.isMock);
  const currentTier = useSubscriptionStore((state) => state.tier);
  const error = useSubscriptionStore((state) => state.error);

  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    void loadPackages();
    analytics.track({ name: 'paywall_viewed', source: params.reason ?? 'unknown' });
  }, [loadPackages, params.reason]);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/properties');
  };

  const reasonCopy = describeReason(params.reason);

  const priceFor = (tier: SubscriptionTier): string => {
    const match = packages.find((item) => item.tier === tier && item.period === period);
    if (match) return match.priceString;

    const definition = TIERS[tier];
    const fallback =
      period === 'annual' ? definition.fallbackAnnualPrice : definition.fallbackMonthlyPrice;
    return fallback ?? definition.fallbackMonthlyPrice;
  };

  const packageIdFor = (tier: SubscriptionTier): string | null =>
    packages.find((item) => item.tier === tier && item.period === period)?.identifier ?? null;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="title">Make every property earn its place.</Text>
          {reasonCopy ? (
            <Text variant="body" tone="secondary">
              {reasonCopy}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={colors.textTertiary} />
        </Pressable>
      </View>

      {isMock ? (
        <Notice tone="info" icon="flask-outline">
          Demo mode: purchases are simulated so you can try the paid features. No payment is taken.
        </Notice>
      ) : null}

      {error ? (
        <Notice tone="warning" icon="alert-circle-outline">
          {error}
        </Notice>
      ) : null}

      <SegmentedControl
        accessibilityLabel="Billing period"
        options={[
          { value: 'monthly' as const, label: 'Monthly' },
          { value: 'annual' as const, label: 'Annual' },
        ]}
        value={period}
        onChange={setPeriod}
      />

      <View style={styles.plans}>
        {TIER_ORDER.map((tier) => {
          const definition = TIERS[tier];
          const isCurrent = tier === currentTier;
          const isFree = tier === 'free';
          const packageId = packageIdFor(tier);

          return (
            <Card
              key={tier}
              style={[
                styles.plan,
                tier === 'pro' ? { borderColor: colors.brand, borderWidth: 1.5 } : null,
              ]}
            >
              <View style={styles.planHeader}>
                <View style={styles.planHeaderText}>
                  <Text variant="heading">{definition.name}</Text>
                  <Text variant="caption" tone="secondary">
                    {definition.headline}
                  </Text>
                </View>
                {tier === 'pro' ? <Badge label="Most popular" tone="brand" /> : null}
                {isCurrent ? <Badge label="Current" tone="positive" /> : null}
              </View>

              <View style={styles.priceRow}>
                <Text variant="figure" tabular>
                  {isFree ? '$0' : priceFor(tier)}
                </Text>
                {!isFree ? (
                  <Text variant="body" tone="secondary">
                    /{period === 'annual' ? 'year' : 'month'}
                  </Text>
                ) : null}
              </View>

              <View style={styles.highlights}>
                {definition.highlights.map((highlight) => (
                  <View key={highlight} style={styles.highlight}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={isFree ? colors.textTertiary : colors.positive}
                    />
                    <Text variant="body" tone={isFree ? 'secondary' : 'primary'} style={styles.highlightText}>
                      {highlight}
                    </Text>
                  </View>
                ))}
              </View>

              {!isFree && !isCurrent ? (
                <Button
                  label={`Choose ${definition.name}`}
                  loading={isPurchasing}
                  variant={tier === 'pro' ? 'primary' : 'secondary'}
                  onPress={async () => {
                    if (!packageId) return;
                    const ok = await purchase(packageId);
                    if (ok) close();
                  }}
                  disabled={!packageId}
                />
              ) : null}
            </Card>
          );
        })}
      </View>

      <Section>
        <Button
          label="Restore Purchases"
          variant="ghost"
          loading={isPurchasing}
          onPress={async () => {
            const ok = await restore();
            if (ok) close();
          }}
        />
      </Section>

      <View style={styles.legal}>
        <Text variant="caption" tone="tertiary" align="center">
          Prices shown come from the App Store or Google Play. Subscriptions renew automatically
          until cancelled.
        </Text>
        <View style={styles.legalLinks}>
          <Text
            variant="captionStrong"
            tone="brand"
            onPress={() => Linking.openURL(BRANDING.termsUrl).catch(() => {})}
          >
            Terms
          </Text>
          <Text variant="caption" tone="tertiary">
            ·
          </Text>
          <Text
            variant="captionStrong"
            tone="brand"
            onPress={() => Linking.openURL(BRANDING.privacyPolicyUrl).catch(() => {})}
          >
            Privacy
          </Text>
        </View>
        <Text variant="caption" tone="tertiary" align="center">
          {SHORT_DISCLAIMER}
        </Text>
      </View>
    </Screen>
  );
}

function describeReason(reason: string | undefined): string | null {
  if (!reason) return null;

  if (reason === 'property_limit') {
    return 'You have reached the property limit on your current plan. Upgrade to track more.';
  }
  if (reason === 'account') return null;

  const label = FEATURE_LABELS[reason as Feature];
  return label ? `${label} is included with Pro.` : null;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: { flex: 1, gap: spacing.sm },
  plans: { gap: spacing.md },
  plan: { gap: spacing.md },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  planHeaderText: { flex: 1, gap: spacing.xxs },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  highlights: { gap: spacing.sm },
  highlight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  highlightText: { flex: 1 },
  legal: { gap: spacing.sm, alignItems: 'center' },
  legalLinks: { flexDirection: 'row', gap: spacing.sm, borderRadius: radius.sm },
});
