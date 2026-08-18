import {
  isPolicyRefusal,
  isTransportFailure,
  looksLikeSupabase,
  looksSecret,
  readBlocked,
  writeBlocked,
} from '../../scripts/lib/http-outcome.mjs';

/**
 * These predicates decide whether the RLS verification scripts report a
 * security check as passing. Getting them wrong means certifying a wide-open
 * database, so every failure mode is tested explicitly.
 */

const err = (message, extra = {}) => ({ message, ...extra });

describe('isTransportFailure', () => {
  it('catches an egress/allowlist denial', () => {
    expect(isTransportFailure(err('Host not in allowlist: x.supabase.co'))).toBe(true);
  });

  it('catches ordinary network errors', () => {
    ['fetch failed', 'ENOTFOUND x', 'ECONNREFUSED', 'socket hang up', 'ETIMEDOUT'].forEach((m) =>
      expect(isTransportFailure(err(m))).toBe(true),
    );
  });

  it('catches a proxy answering with non-JSON, which surfaces as a parse error', () => {
    expect(isTransportFailure(err(`Unexpected token 'H', "Host not i"... is not valid JSON`))).toBe(
      true,
    );
  });

  it('catches a TypeError from fetch', () => {
    expect(isTransportFailure({ name: 'TypeError', message: 'Failed to fetch' })).toBe(true);
  });

  it('does not mistake a policy refusal for a transport failure', () => {
    expect(isTransportFailure(err('new row violates row-level security policy'))).toBe(false);
    expect(isTransportFailure(err('permission denied for table properties'))).toBe(false);
  });

  it('is false for no error at all', () => {
    expect(isTransportFailure(null)).toBe(false);
    expect(isTransportFailure(undefined)).toBe(false);
  });
});

describe('isPolicyRefusal', () => {
  it('recognises the refusals RLS actually produces', () => {
    [
      'new row violates row-level security policy for table "properties"',
      'permission denied for table properties',
      'permission denied (42501)',
    ].forEach((m) => expect(isPolicyRefusal(err(m))).toBe(true));
  });

  it('never treats a transport failure as a policy refusal', () => {
    expect(isPolicyRefusal(err('Host not in allowlist: x.supabase.co'))).toBe(false);
    expect(isPolicyRefusal(err('fetch failed'))).toBe(false);
  });
});

describe('readBlocked', () => {
  it('passes on a genuinely empty result', () => {
    expect(readBlocked([], null)).toBe(true);
    expect(readBlocked(null, null)).toBe(true);
  });

  it('passes when the policy refused the read', () => {
    expect(readBlocked(null, err('permission denied for table properties'))).toBe(true);
  });

  it('FAILS when rows came back — the whole point of the check', () => {
    expect(readBlocked([{ id: 1 }], null)).toBe(false);
  });

  it('FAILS on a transport failure rather than claiming the policy worked', () => {
    expect(readBlocked(null, err('Host not in allowlist: x.supabase.co'))).toBe(false);
    expect(readBlocked(null, err('fetch failed'))).toBe(false);
  });

  it('FAILS on an unrecognised error rather than assuming it was security', () => {
    expect(readBlocked(null, err('column "foo" does not exist'))).toBe(false);
  });
});

describe('writeBlocked', () => {
  it('passes when no rows were affected', () => {
    expect(writeBlocked([], null)).toBe(true);
  });

  it('passes when the policy refused the write', () => {
    expect(writeBlocked(null, err('new row violates row-level security policy'))).toBe(true);
  });

  it('FAILS when a row was actually modified', () => {
    expect(writeBlocked([{ id: 1 }], null)).toBe(false);
  });

  it('FAILS on a transport failure', () => {
    expect(writeBlocked(null, err('Host not in allowlist'))).toBe(false);
  });
});

describe('looksLikeSupabase', () => {
  it('accepts a JSON body, whatever the status', () => {
    expect(looksLikeSupabase(200, '{"swagger":"2.0"}')).toBe(true);
    expect(looksLikeSupabase(401, '{"message":"no api key"}')).toBe(true);
  });

  it('rejects a proxy notice that merely looks like a valid response', () => {
    expect(looksLikeSupabase(403, 'Host not in allowlist: x.supabase.co')).toBe(false);
  });

  it('rejects server errors and non-numeric statuses', () => {
    expect(looksLikeSupabase(502, '{}')).toBe(false);
    expect(looksLikeSupabase(undefined, '{}')).toBe(false);
  });
});

// Fixtures below are fabricated. Never paste a real project key into a test:
// it is committed, pushed, and outlives the file it was convenient in.
describe('looksSecret', () => {
  it('flags both generations of secret key', () => {
    expect(looksSecret('sb_secret_abc123')).toBe(true);
    expect(looksSecret('eyJ...service_role...')).toBe(true);
  });

  it('accepts publishable keys', () => {
    expect(looksSecret('sb_publishable_EXAMPLEONLY_not_a_real_key')).toBe(false);
    expect(looksSecret('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon')).toBe(false);
  });

  it('handles a missing key', () => {
    expect(looksSecret(undefined)).toBe(false);
  });
});
