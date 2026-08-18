/**
 * Telling "the policy refused this" apart from "the request never arrived".
 *
 * This is the load-bearing distinction in both verification scripts. Treating
 * any error as proof of blocking is the trap: a network failure, an
 * intercepting proxy or an expired token would then make every hostile check
 * pass, and the script would cheerfully certify a wide-open database.
 *
 * An earlier version of the preflight did exactly that — it reported four
 * tables "present", RLS "active" and the auth endpoint "reachable" while every
 * single request was being refused by a network policy. Hence these are
 * separate, tested functions rather than inline boolean expressions.
 */

/** The request did not reach Supabase, so its result proves nothing. */
export function isTransportFailure(error) {
  if (!error) return false;

  const text = [error.message, error.details, error.cause?.message]
    .filter(Boolean)
    .join(' ');

  if (
    /fetch failed|network|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|socket hang up|allowlist|egress|proxy|certificate|TLS|self.signed/i.test(
      text,
    )
  ) {
    return true;
  }

  // Supabase always answers in JSON. A parse error means something other than
  // Supabase replied — an interception proxy returning a plain-text notice,
  // typically with an otherwise plausible status code.
  if (/not valid JSON|Unexpected token|JSON\.parse|Unexpected end of/i.test(text)) {
    return true;
  }

  return error.name === 'TypeError';
}

/** PostgREST refusing on policy grounds — the outcome a hostile check wants. */
export function isPolicyRefusal(error) {
  if (!error || isTransportFailure(error)) return false;
  return /permission|denied|42501|violates row-level security|not authorized|JWT/i.test(
    error.message ?? '',
  );
}

/** A cross-user read is blocked only if it came back genuinely empty or was refused. */
export function readBlocked(data, error) {
  if (isTransportFailure(error)) return false;
  if (error) return isPolicyRefusal(error);
  return Array.isArray(data) ? data.length === 0 : data === null || data === undefined;
}

/** A cross-user write is blocked only if it touched no rows or was refused. */
export function writeBlocked(data, error) {
  if (isTransportFailure(error)) return false;
  if (error) return isPolicyRefusal(error);
  return (data?.length ?? 0) === 0;
}

/**
 * A response body identifies the far end far better than its status code: a
 * blocking proxy returns a well-formed 403 of its own.
 */
export function looksLikeSupabase(status, body) {
  if (typeof status !== 'number' || status >= 500) return false;
  try {
    JSON.parse(body);
    return true;
  } catch {
    return false;
  }
}

/** Both key generations have an unmistakable secret counterpart. */
export function looksSecret(key) {
  return /service_role/.test(key ?? '') || /^sb_secret_/.test(key ?? '');
}
