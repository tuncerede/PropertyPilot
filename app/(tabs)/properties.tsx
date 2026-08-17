import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { PageHeader, Section } from '@/components/ui/Section';
import { EmptyState, ErrorState, LoadingState, Notice } from '@/components/ui/States';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/constants/theme';
import { env } from '@/lib/config/env';
import { usePropertyLimit } from '@/hooks/usePropertyLimit';
import { useAuthStore } from '@/store/authStore';
import {
  usePortfolioMetrics,
  usePropertiesWithMetrics,
  usePropertyStore,
} from '@/store/propertyStore';

/** The landing screen after sign-in. */
export default function PropertiesScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const status = usePropertyStore((state) => state.status);
  const error = usePropertyStore((state) => state.error);
  const load = usePropertyStore((state) => state.load);
  const refresh = usePropertyStore((state) => state.refresh);

  const entries = usePropertiesWithMetrics();
  const portfolio = usePortfolioMetrics();
  const { canAdd, count, limit, tierName, requestAdd } = usePropertyLimit();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await refresh(user.id);
    setRefreshing(false);
  }, [refresh, user]);

  if (status === 'loading' || status === 'idle') {
    return (
      <Screen scroll={false}>
        <PageHeader title="My Properties" />
        <LoadingState label="Loading your properties…" />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen>
        <PageHeader title="My Properties" />
        <ErrorState
          message={error ?? 'We could not load your properties.'}
          onRetry={() => user && load(user.id)}
        />
      </Screen>
    );
  }

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <PageHeader
        title="My Properties"
        subtitle={
          entries.length === 0
            ? 'Add a rental to see what it earns.'
            : // "4 of 1 on Free" is nonsense; say what the plan allows instead.
              count > limit
              ? `${count} ${count === 1 ? 'property' : 'properties'} · ${tierName} includes ${limit}`
              : `${count} of ${limit} on ${tierName}`
        }
      />

      {env.demoMode ? (
        <Notice tone="info" icon="flask-outline">
          Demo mode: sample data on this device. Figures are illustrative assumptions, not
          appraisals.
        </Notice>
      ) : null}

      {entries.length === 0 ? (
        <EmptyState
          icon="home-outline"
          title="Your portfolio starts here."
          description="Add your first rental to see its cash flow, equity, and investment return."
          actionLabel="Add Property"
          onAction={requestAdd}
        />
      ) : (
        <>
          <PortfolioSummary metrics={portfolio} />

          <Section title="Properties">
            <View style={styles.list}>
              {entries.map(({ property, metrics }) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  metrics={metrics}
                  onPress={() => router.push(`/property/${property.id}`)}
                />
              ))}
            </View>
          </Section>

          <View style={styles.addBlock}>
            <Button label="Add Property" icon="add" onPress={requestAdd} variant="secondary" />
            {!canAdd ? (
              <Text variant="caption" tone="tertiary" align="center">
                {tierName} includes {limit} {limit === 1 ? 'property' : 'properties'}. Upgrade to
                track more.
              </Text>
            ) : null}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  addBlock: { gap: spacing.sm },
});
