import { env } from '@/lib/config/env';

/**
 * Developer logging.
 *
 * Technical detail goes here; the user sees only `AppError.message`. In
 * production this is where a crash reporter would be attached — note that
 * property financials must not be included in any payload sent off-device.
 */

type LogContext = Record<string, unknown>;

function shouldLog(): boolean {
  return !env.isProduction;
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (!shouldLog()) return;
    // eslint-disable-next-line no-console
    console.log(`[PropertyPilot] ${message}`, context ?? '');
  },

  warn(message: string, context?: LogContext) {
    if (!shouldLog()) return;
    console.warn(`[PropertyPilot] ${message}`, context ?? '');
  },

  error(message: string, error?: unknown, context?: LogContext) {
    console.error(`[PropertyPilot] ${message}`, error ?? '', context ?? '');
    // A crash reporter (Sentry, Bugsnag, …) would be notified here.
  },
};
