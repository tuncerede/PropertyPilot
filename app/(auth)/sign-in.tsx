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
import { spacing } from '@/constants/theme';
import { env } from '@/lib/config/env';
import { signInSchema, type SignInValues } from '@/lib/validation/auth';
import { useAuthStore } from '@/store/authStore';

export default function SignInScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const { control, handleSubmit, formState } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit(async (values) => {
    clearError();
    const ok = await signIn(values);
    if (ok) router.replace('/(tabs)/properties');
  });

  return (
    <Screen>
      <PageHeader
        title="Welcome back"
        subtitle="Sign in to see how your properties are doing."
        onBack={() => router.back()}
      />

      {env.demoMode ? (
        <Notice tone="info">
          Demo mode is on. Any email works with a password of at least 6 characters — nothing
          leaves this device.
        </Notice>
      ) : null}

      {error ? <Notice tone="warning" icon="alert-circle-outline">{error}</Notice> : null}

      <View style={styles.form}>
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
              testID="sign-in-email"
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
              autoComplete="current-password"
              secureTextEntry
              error={fieldState.error?.message}
              testID="sign-in-password"
            />
          )}
        />
      </View>

      <View style={styles.actions}>
        <Button
          label="Sign In"
          onPress={onSubmit}
          loading={isSubmitting || formState.isSubmitting}
          testID="sign-in-submit"
        />
        <Button
          label="Forgot password?"
          variant="ghost"
          onPress={() => router.push('/(auth)/forgot-password')}
        />
      </View>

      <View style={styles.footer}>
        <Text variant="body" tone="secondary">
          New to PropertyPilot?
        </Text>
        <Button
          label="Create an account"
          variant="ghost"
          fullWidth={false}
          onPress={() => router.replace('/(auth)/sign-up')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  actions: { gap: spacing.sm },
  footer: { alignItems: 'center', gap: spacing.xs },
});
