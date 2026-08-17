import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { PageHeader } from '@/components/ui/Section';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { usePropertyStore } from '@/store/propertyStore';

/**
 * What a property route renders when it has no property to show.
 *
 * A deep link or a page reload arrives before the store has finished
 * loading, so an unresolved id is not the same thing as a missing property.
 * This distinguishes the two rather than telling a landlord their property
 * was deleted while it is still being fetched.
 */
export function PropertyRouteState({ title }: { title: string }) {
  const router = useRouter();
  const status = usePropertyStore((state) => state.status);
  const error = usePropertyStore((state) => state.error);

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace('/(tabs)/properties');

  if (status === 'idle' || status === 'loading') {
    return (
      <Screen scroll={false}>
        <PageHeader title={title} onBack={goBack} />
        <LoadingState label="Loading this property…" />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen>
        <PageHeader title={title} onBack={goBack} />
        <ErrorState
          message={error ?? 'We could not load your properties.'}
          onRetry={() => router.replace('/(tabs)/properties')}
          retryLabel="Back to properties"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title={title} onBack={goBack} />
      <ErrorState
        title="Property not found"
        message="This property may have been deleted."
        onRetry={() => router.replace('/(tabs)/properties')}
        retryLabel="Back to properties"
      />
    </Screen>
  );
}
