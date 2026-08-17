import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email address.').email('Enter a valid email address.'),
  password: z.string().min(6, 'Passwords are at least 6 characters.'),
});

export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your name.').max(80),
  email: z.string().trim().min(1, 'Enter your email address.').email('Enter a valid email address.'),
  password: z.string().min(6, 'Choose a password with at least 6 characters.'),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email address.').email('Enter a valid email address.'),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
