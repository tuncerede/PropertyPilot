import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { LoadingState } from '@/components/ui/States';
import { useAuthStore } from '@/store/authStore';

/**
 * Entry gate: while the persisted session is being checked we hold on a
 * loading state, then route to the app or to onboarding. Properties is the
 * landing tab after sign-in.
 */
export default function Index() {
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const user = useAuthStore((state) => state.user);

  if (isInitializing) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingState label="Starting PropertyPilot…" />
      </View>
    );
  }

  return <Redirect href={user ? '/(tabs)/properties' : '/(auth)/welcome'} />;
}
