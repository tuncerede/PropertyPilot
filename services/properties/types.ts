import type { Property, PropertyDraft } from '@/types/property';

/**
 * The property persistence port.
 *
 * Two implementations exist: on-device storage for demo mode, and Supabase
 * for real accounts. Screens and stores depend only on this interface.
 */
export interface PropertyRepository {
  list(userId: string): Promise<Property[]>;
  get(userId: string, propertyId: string): Promise<Property | null>;
  create(userId: string, draft: PropertyDraft): Promise<Property>;
  update(userId: string, propertyId: string, draft: PropertyDraft): Promise<Property>;
  remove(userId: string, propertyId: string): Promise<void>;
}
