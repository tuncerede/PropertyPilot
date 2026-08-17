import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { BRANDING, ONBOARDING_COPY, SHORT_DISCLAIMER } from '@/constants/branding';
import { radius, spacing } from '@/constants/theme';
import { env } from '@/lib/config/env';
import { useColors } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';

const HIGHLIGHTS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'cash-outline', label: 'See real cash flow, not just rent' },
  { icon: 'trending-up-outline', label: 'Know what your equity is earning' },
  { icon: 'git-compare-outline', label: 'Compare selling against holding' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const continueAsDemo = useAuthStore((state) => state.continueAsDemo);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: colors.brand }]}>
          <Ionicons name="navigate" size={30} color={colors.textInverse} />
        </View>

        <Text variant="title" align="center">
          {BRANDING.appName}
        </Text>
        <Text variant="caption" tone="secondary" align="center">
          {BRANDING.tagline}
        </Text>
      </View>

      <View style={styles.pitch}>
        <Text variant="hero" align="center">
          {ONBOARDING_COPY.headline}
        </Text>
        <Text variant="body" tone="secondary" align="center">
          {ONBOARDING_COPY.supporting}
        </Text>
      </View>

      <View style={styles.highlights}>
        {HIGHLIGHTS.map((highlight) => (
          <View key={highlight.label} style={styles.highlight}>
            <View style={[styles.highlightIcon, { backgroundColor: colors.brandMuted }]}>
              <Ionicons name={highlight.icon} size={18} color={colors.brand} />
            </View>
            <Text variant="body" style={styles.highlightLabel}>
              {highlight.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          label={ONBOARDING_COPY.primaryCta}
          onPress={() => router.push('/(auth)/sign-up')}
          testID="welcome-get-started"
        />
        <Button
          label={ONBOARDING_COPY.secondaryCta}
          variant="secondary"
          onPress={() => router.push('/(auth)/sign-in')}
        />
        {env.demoMode ? (
          <Button
            label="Explore with sample data"
            variant="ghost"
            loading={isSubmitting}
            onPress={async () => {
              const ok = await continueAsDemo();
              if (ok) router.replace('/(tabs)/properties');
            }}
          />
        ) : null}
      </View>

      <Text variant="caption" tone="tertiary" align="center">
        {SHORT_DISCLAIMER}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center', gap: spacing.xxl, paddingTop: spacing.huge },
  hero: { alignItems: 'center', gap: spacing.sm },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  pitch: { gap: spacing.md, paddingHorizontal: spacing.sm },
  highlights: { gap: spacing.md },
  highlight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  highlightIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightLabel: { flex: 1 },
  actions: { gap: spacing.md },
});
