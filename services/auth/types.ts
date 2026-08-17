export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  /** True for the local demo session, which has no backend account. */
  isDemo: boolean;
}

/**
 * The authentication port. Screens depend on this, never on Supabase Auth
 * directly, which is what lets demo mode present a complete, working app.
 */
export interface AuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  signUp(input: { email: string; password: string; fullName: string }): Promise<AuthUser>;
  signIn(input: { email: string; password: string }): Promise<AuthUser>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  /** Removes the account and all of its data. */
  deleteAccount(): Promise<void>;
  onAuthStateChange(listener: (user: AuthUser | null) => void): () => void;
}
