/**
 * Error handling.
 *
 * Users never see a raw Supabase, network or SDK error. Everything that
 * crosses a service boundary is converted into an `AppError` whose `message`
 * is written for a landlord, while the original is kept in `cause` for the
 * logger.
 */

export type AppErrorCode =
  | 'network'
  | 'auth'
  | 'not_found'
  | 'permission'
  | 'validation'
  | 'subscription'
  | 'storage'
  | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  override readonly cause: unknown;

  constructor(code: AppErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
  }
}

const FRIENDLY_MESSAGES: Record<AppErrorCode, string> = {
  network: 'We could not reach PropertyPilot. Check your connection and try again.',
  auth: 'We could not sign you in. Please check your email and password.',
  not_found: 'We could not find that property.',
  permission: 'You do not have access to that.',
  validation: 'Some of the details need another look.',
  subscription: 'We could not update your subscription. Please try again.',
  storage: 'We could not save your changes. Please try again.',
  unknown: 'Something went wrong. Please try again.',
};

export function friendlyMessage(code: AppErrorCode): string {
  return FRIENDLY_MESSAGES[code];
}

/** Normalize anything thrown into an AppError with a presentable message. */
export function toAppError(error: unknown, fallbackCode: AppErrorCode = 'unknown'): AppError {
  if (error instanceof AppError) return error;

  const raw = error instanceof Error ? error.message : String(error);
  const lowered = raw.toLowerCase();

  if (lowered.includes('network') || lowered.includes('fetch failed')) {
    return new AppError('network', FRIENDLY_MESSAGES.network, error);
  }
  if (lowered.includes('invalid login') || lowered.includes('credentials')) {
    return new AppError('auth', FRIENDLY_MESSAGES.auth, error);
  }
  if (lowered.includes('row level security') || lowered.includes('not authorized')) {
    return new AppError('permission', FRIENDLY_MESSAGES.permission, error);
  }

  return new AppError(fallbackCode, FRIENDLY_MESSAGES[fallbackCode], error);
}
