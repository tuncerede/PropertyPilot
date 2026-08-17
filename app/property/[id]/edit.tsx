import { useLocalSearchParams, useRouter } from 'expo-router';
import { PropertyForm } from '@/components/property/PropertyForm';
import { PropertyRouteState } from '@/components/property/PropertyRouteState';
import { propertyToForm } from '@/lib/validation/property';
import { useAuthStore } from '@/store/authStore';
import { useProperty, usePropertyStore } from '@/store/propertyStore';

export default function EditPropertyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const property = useProperty(id);
  const update = usePropertyStore((state) => state.update);
  const isSaving = usePropertyStore((state) => state.isSaving);
  const error = usePropertyStore((state) => state.error);

  if (!property) return <PropertyRouteState title="Edit property" />;

  return (
    <PropertyForm
      title="Edit property"
      submitLabel="Save Changes"
      initialValues={propertyToForm(property)}
      isSaving={isSaving}
      errorMessage={error}
      onCancel={() => router.back()}
      onSubmit={async (draft) => {
        if (!user) return;
        const saved = await update(user.id, property.id, draft);
        if (saved) router.back();
      }}
    />
  );
}
