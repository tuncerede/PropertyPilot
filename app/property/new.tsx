import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PropertyForm } from '@/components/property/PropertyForm';
import { emptyPropertyForm } from '@/lib/validation/property';
import { usePropertyLimit } from '@/hooks/usePropertyLimit';
import { useAuthStore } from '@/store/authStore';
import { usePropertyStore } from '@/store/propertyStore';

export default function NewPropertyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ first?: string }>();
  const user = useAuthStore((state) => state.user);
  const create = usePropertyStore((state) => state.create);
  const isSaving = usePropertyStore((state) => state.isSaving);
  const error = usePropertyStore((state) => state.error);
  const { canAdd, tier } = usePropertyLimit();

  // Guard the route itself, not just the button that leads here.
  useEffect(() => {
    if (!canAdd) router.replace(`/paywall?reason=property_limit&tier=${tier}`);
  }, [canAdd, router, tier]);

  const isFirstProperty = params.first === '1';

  return (
    <PropertyForm
      title={isFirstProperty ? 'Add your first property' : 'Add a property'}
      submitLabel="Save Property"
      initialValues={emptyPropertyForm()}
      isSaving={isSaving}
      errorMessage={error}
      onCancel={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/properties'))}
      onSubmit={async (draft) => {
        if (!user) return;
        const property = await create(user.id, draft);
        if (property) router.replace(`/property/${property.id}`);
      }}
    />
  );
}
