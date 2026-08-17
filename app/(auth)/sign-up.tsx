import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField } from '@/components/forms/Field';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { PageHeader } from '@/components/ui/Section';
import { Notice } from '@/components/ui/States';
import { Text } from '@/components/ui/Text';
import { SHORT_DISCLAIMER } from '@/constants/branding';
import { spacing } from '@/constants/theme';
import { env } from '@/lib/config/env';
import { signUpSchema, type SignUpValues } from '@/lib/validation/auth';
import { useAuthStore } from '@/store/authStore';

export default function SignUpScreen() {
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const { control, handleSubmit } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: '', email: '', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit(async (values) => {
    clearError();
    const ok = await signUp(values);
    // Straight into adding the first property — that is the whole point of
    // signing up, and there is nothing to look at until one exists.
    if (ok) router.replace('/property/new?first=1');
  });

  return (
    <Screen>
      <PageHeader
        title="Create your account"
        subtitle="Add your first rental next. It takes a couple of minutes."
        onBack={() => router.back()}
      />

      {env.demoMode ? (
        <Notice tone="info">
          Demo mode is on. Your account and properties stay on this device.
        </Notice>
      ) : null}

      {error ? <Notice tone="warning" icon="alert-circle-outline">{error}</Notice> : null}

      <View style={styles.form}>
        <Controller
          control={control}
          name="fullName"
          render={({ field, fieldState }) => (
            <TextField
              label="Name"
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Alex Rivera"
              autoComplete="name"
              autoCapitalize="words"
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <TextField
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              label="Password"
              value={field.value}
              onChangeText={field.onChange}
              placeholder="At least 6 characters"
              autoCapitalize="none"
              autoComplete="new-password"
              secureTextEntry
              error={fieldState.error?.message}
            />
          )}
        />
      </View>

      <Button label="Create Account" onPress={onSubmit} loading={isSubmitting} />

      <View style={styles.footer}>
        <Text variant="body" tone="secondary">
          Already have an account?
        </Text>
        <Button
          label="Sign in"
          variant="ghost"
          fullWidth={false}
          onPress={() => router.replace('/(auth)/sign-in')}
        />
      </View>

      <Text variant="caption" tone="tertiary" align="center">
        {SHORT_DISCLAIMER}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  footer: { alignItems: 'center', gap: spacing.xs },
});
