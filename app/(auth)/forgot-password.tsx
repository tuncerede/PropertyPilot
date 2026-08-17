import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField } from '@/components/forms/Field';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { PageHeader } from '@/components/ui/Section';
import { Notice } from '@/components/ui/States';
import { env } from '@/lib/config/env';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/validation/auth';
import { useAuthStore } from '@/store/authStore';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const sendPasswordReset = useAuthStore((state) => state.sendPasswordReset);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);

  const { control, handleSubmit } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit(async (values) => {
    const ok = await sendPasswordReset(values.email);
    setSent(ok);
  });

  return (
    <Screen>
      <PageHeader
        title="Reset your password"
        subtitle="We'll email you a link to set a new one."
        onBack={() => router.back()}
      />

      {env.demoMode ? (
        <Notice tone="info">
          Demo mode does not send email. Sign back in with any password of at least 6 characters.
        </Notice>
      ) : null}

      {sent ? (
        <Notice tone="positive" icon="checkmark-circle-outline">
          If an account exists for that address, a reset link is on its way.
        </Notice>
      ) : null}

      {error ? <Notice tone="warning" icon="alert-circle-outline">{error}</Notice> : null}

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

      <Button label="Send reset link" onPress={onSubmit} loading={isSubmitting} />
      <Button label="Back to sign in" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
