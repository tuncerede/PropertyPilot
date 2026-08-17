import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Divider, PageHeader, Section } from '@/components/ui/Section';
import { Notice } from '@/components/ui/States';
import { Text } from '@/components/ui/Text';
import { BRANDING, DISCLAIMER } from '@/constants/branding';
import { DEFAULT_ASSUMPTIONS } from '@/constants/analysis';
import { TIERS } from '@/constants/subscription';
import { spacing } from '@/constants/theme';
import { env } from '@/lib/config/env';
import { useColors } from '@/hooks/useTheme';
import { formatPercent } from '@/lib/formatting/number';
import { getSubscriptionService } from '@/services/subscription';
import { useAuthStore } from '@/store/authStore';
import { usePropertyStore } from '@/store/propertyStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';

export default function AccountScreen() {
  const router = useRouter();
  const colors = useColors();

  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);

  const tier = useSubscriptionStore((state) => state.tier);
  const isMock = useSubscriptionStore((state) => state.isMock);
  const restore = useSubscriptionStore((state) => state.restore);
  const isPurchasing = useSubscriptionStore((state) => state.isPurchasing);
  const resetSubscription = useSubscriptionStore((state) => state.reset);

  const propertyCount = usePropertyStore((state) => state.properties.length);
  const clearProperties = usePropertyStore((state) => state.clear);

  const [restored, setRestored] = useState(false);

  const definition = TIERS[tier];

  const handleSignOut = async () => {
    await signOut();
    clearProperties();
    await resetSubscription();
    router.replace('/(auth)/welcome');
  };

  const handleManageSubscription = async () => {
    const url = await getSubscriptionService().getManagementUrl();

    if (url) {
      await Linking.openURL(url);
      return;
    }

    Alert.alert(
      'Manage subscription',
      isMock
        ? 'Subscriptions are simulated in demo mode. Connect RevenueCat to manage a real subscription here.'
        : 'Manage your subscription in the App Store or Google Play account settings.',
    );
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      'Your properties and analysis will be permanently removed. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteAccount();
            if (ok) {
              clearProperties();
              await resetSubscription();
              router.replace('/(auth)/welcome');
            }
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <PageHeader title="Account" />

      <Card>
        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: colors.brandMuted }]}>
            <Text variant="heading" tone="brand">
              {(user?.fullName ?? user?.email ?? '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.identityText}>
            <Text variant="heading" numberOfLines={1}>
              {user?.fullName ?? 'Landlord'}
            </Text>
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {user?.email ?? 'Not signed in'}
            </Text>
          </View>
        </View>
      </Card>

      <Section title="Subscription">
        <Card>
          <View style={styles.planRow}>
            <View style={styles.planText}>
              <Text variant="label" tone="secondary">
                {BRANDING.appName} {definition.name}
              </Text>
              <Text variant="figureSmall">
                {propertyCount} of {definition.propertyLimit}{' '}
                {definition.propertyLimit === 1 ? 'property' : 'properties'}
              </Text>
            </View>
            {isMock ? <Badge label="Demo" tone="info" /> : null}
          </View>

          <Divider />

          <View style={styles.planActions}>
            {tier !== 'investor' ? (
              <Button
                label={tier === 'free' ? 'See plans' : 'Upgrade'}
                onPress={() => router.push('/paywall?reason=account')}
              />
            ) : null}
            <Button
              label="Manage Subscription"
              variant="secondary"
              onPress={handleManageSubscription}
            />
            <Button
              label="Restore Purchases"
              variant="ghost"
              loading={isPurchasing}
              onPress={async () => {
                const ok = await restore();
                setRestored(ok);
              }}
            />
            {restored ? (
              <Notice tone="positive" icon="checkmark-circle-outline">
                Subscription state restored.
              </Notice>
            ) : null}
          </View>
        </Card>
      </Section>

      <Section
        title="Default assumptions"
        description="Used as the starting point for new analyses. Every one is editable per property."
      >
        <Card>
          <AssumptionRow
            label="Selling costs"
            value={formatPercent(DEFAULT_ASSUMPTIONS.sellingCostPercentage)}
          />
          <AssumptionRow
            label="Expense inflation"
            value={formatPercent(DEFAULT_ASSUMPTIONS.expenseInflationRate)}
          />
          <AssumptionRow
            label="Alternative investment return"
            value={formatPercent(DEFAULT_ASSUMPTIONS.alternativeInvestmentReturn)}
          />
          <AssumptionRow
            label="Appreciation"
            value={formatPercent(DEFAULT_ASSUMPTIONS.appreciationRate)}
          />
          <AssumptionRow
            label="Rent growth"
            value={formatPercent(DEFAULT_ASSUMPTIONS.rentGrowthRate)}
          />
          <AssumptionRow label="Vacancy" value={formatPercent(DEFAULT_ASSUMPTIONS.vacancyRate)} />
        </Card>
      </Section>

      <Section title="Legal">
        <Card>
          <LinkRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            onPress={() => Linking.openURL(BRANDING.privacyPolicyUrl).catch(() => {})}
          />
          <Divider />
          <LinkRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => Linking.openURL(BRANDING.termsUrl).catch(() => {})}
          />
        </Card>

        <Card variant="flat">
          <Text variant="caption" tone="secondary">
            {DISCLAIMER}
          </Text>
        </Card>
      </Section>

      <Section title="Session">
        <View style={styles.sessionActions}>
          <Button label="Sign Out" variant="secondary" icon="log-out-outline" onPress={handleSignOut} />
          <Button label="Delete Account" variant="destructive" onPress={confirmDelete} />
        </View>
      </Section>

      <View style={styles.version}>
        <Text variant="caption" tone="tertiary" align="center">
          {BRANDING.appName} 1.0.0 · {env.appEnv}
          {env.demoMode ? ' · demo mode' : ''}
        </Text>
      </View>
    </Screen>
  );
}

function AssumptionRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.assumptionRow}>
      <Text variant="body" tone="secondary">
        {label}
      </Text>
      <Text variant="bodyStrong" tabular>
        {value}
      </Text>
    </View>
  );
}

function LinkRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={styles.linkRow}
    >
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text variant="body" style={styles.linkLabel}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: { flex: 1, gap: spacing.xxs },
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  planText: { flex: 1, gap: spacing.xs },
  planActions: { gap: spacing.sm, marginTop: spacing.lg },
  assumptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  linkLabel: { flex: 1 },
  sessionActions: { gap: spacing.md },
  version: { paddingTop: spacing.md },
});
