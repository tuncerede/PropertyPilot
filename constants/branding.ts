/**
 * Single source of truth for product naming and legal copy.
 *
 * Every user-visible mention of the product name comes from here so the
 * branding can be changed in one edit.
 */

export const BRANDING = {
  appName: 'PropertyPilot',
  tagline: 'Know when to hold. Know when to sell.',
  supportEmail: 'support@propertypilot.app',
  websiteUrl: 'https://propertypilot.app',
  privacyPolicyUrl: 'https://propertypilot.app/privacy',
  termsUrl: 'https://propertypilot.app/terms',
  bundleIdentifier: 'com.propertypilot.app',
} as const;

export const ONBOARDING_COPY = {
  headline: 'Is your rental still worth owning?',
  supporting: 'Analyze cash flow, equity, and your Sell vs. Hold decision in minutes.',
  primaryCta: 'Get Started',
  secondaryCta: 'Sign In',
} as const;

export const DISCLAIMER = `${BRANDING.appName} provides estimates and scenario analysis for informational purposes only. It does not provide financial, investment, legal, tax, lending, or real-estate advice. Results depend on assumptions supplied by the user and may differ materially from actual outcomes.`;

export const SHORT_DISCLAIMER =
  'Estimates only, based on your assumptions. Not financial, tax, or investment advice.';

export const VALUE_DISCLAIMER =
  'Estimated value is a figure you provide. It is not an appraisal or a broker price opinion.';
