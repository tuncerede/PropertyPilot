import { AppError, toAppError } from '@/lib/errors';
import { getSupabaseClient } from '@/lib/supabase/client';
import { propertyFromRow, propertyToRow } from '@/lib/supabase/rows';
import type { Property, PropertyDraft } from '@/types/property';
import type { PropertyRepository } from './types';

/**
 * Supabase-backed property storage.
 *
 * Every query still filters by `user_id`. Row Level Security is the actual
 * guarantee — see `supabase/migrations` — but filtering here as well keeps
 * the intent explicit and makes an accidental policy regression obvious in
 * testing rather than silent.
 */
export class SupabasePropertyRepository implements PropertyRepository {
  private client() {
    const client = getSupabaseClient();
    if (!client) {
      throw new AppError('storage', 'PropertyPilot is not connected to your account.');
    }
    return client;
  }

  async list(userId: string): Promise<Property[]> {
    try {
      const { data, error } = await this.client()
        .from('properties')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []).map(propertyFromRow);
    } catch (error) {
      throw toAppError(error, 'storage');
    }
  }

  async get(userId: string, propertyId: string): Promise<Property | null> {
    try {
      const { data, error } = await this.client()
        .from('properties')
        .select('*')
        .eq('user_id', userId)
        .eq('id', propertyId)
        .maybeSingle();

      if (error) throw error;
      return data ? propertyFromRow(data) : null;
    } catch (error) {
      throw toAppError(error, 'storage');
    }
  }

  async create(userId: string, draft: PropertyDraft): Promise<Property> {
    try {
      const { data, error } = await this.client()
        .from('properties')
        .insert(propertyToRow(draft, { id: crypto.randomUUID(), userId }))
        .select()
        .single();

      if (error) throw error;
      return propertyFromRow(data);
    } catch (error) {
      throw toAppError(error, 'storage');
    }
  }

  async update(userId: string, propertyId: string, draft: PropertyDraft): Promise<Property> {
    try {
      const { data, error } = await this.client()
        .from('properties')
        .update({
          ...propertyToRow(draft, { id: propertyId, userId }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', propertyId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return propertyFromRow(data);
    } catch (error) {
      throw toAppError(error, 'storage');
    }
  }

  async remove(userId: string, propertyId: string): Promise<void> {
    try {
      const { error } = await this.client()
        .from('properties')
        .delete()
        .eq('id', propertyId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      throw toAppError(error, 'storage');
    }
  }
}
