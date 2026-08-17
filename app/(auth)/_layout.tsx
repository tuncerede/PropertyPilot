import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout() {
  const user = useAuthStore((state) => state.user);

  // Someone already signed in has no business on the sign-in screens.
  if (user) return <Redirect href="/(tabs)/properties" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
