import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function PropertyLayout() {
  const user = useAuthStore((state) => state.user);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  if (isInitializing) return null;
  if (!user) return <Redirect href="/(auth)/welcome" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
