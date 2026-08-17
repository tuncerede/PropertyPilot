import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InfoSheetProvider } from '@/components/ui/InfoSheet';
import { lightPalette } from '@/constants/theme';
import { ThemeProvider } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { usePropertyStore } from '@/store/propertyStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen may already be hidden during fast refresh; not fatal.
});

/**
 * TanStack Query is wired up for future server state (valuation lookups,
 * shared scenarios). Property data currently flows through the Zustand
 * stores, which own the repository calls.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const user = useAuthStore((state) => state.user);
  const configureSubscription = useSubscriptionStore((state) => state.configure);
  const loadProperties = usePropertyStore((state) => state.load);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    void configureSubscription(user?.id ?? null);
  }, [configureSubscription, user?.id]);

  /**
   * Properties are loaded here rather than in the tabs layout so that a deep
   * link — or a page reload on web — into `/property/[id]` has data, instead
   * of rendering "property not found" against an empty store.
   */
  useEffect(() => {
    if (user) void loadProperties(user.id);
  }, [loadProperties, user]);

  useEffect(() => {
    if (!isInitializing) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isInitializing]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider scheme="light">
            <InfoSheetProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: lightPalette.background },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="property" />
                <Stack.Screen
                  name="paywall"
                  options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
                />
              </Stack>
            </InfoSheetProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
