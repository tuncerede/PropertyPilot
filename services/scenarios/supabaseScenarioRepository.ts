import { MAX_SCENARIOS_PER_PROPERTY } from '@/constants/analysis';
import { AppError, toAppError } from '@/lib/errors';
import { getSupabaseClient } from '@/lib/supabase/client';
import { scenarioFromRow } from '@/lib/supabase/rows';
import type { PropertyScenario } from '@/types/property';
import type { ScenarioDraft, ScenarioRepository } from './types';

/**
 * Supabase-backed scenario storage.
 *
 * Queries filter by `user_id` as well as relying on RLS, and the insert
 * policy additionally verifies the parent property belongs to the caller, so
 * a scenario can never be attached to someone else's property.
 */
export class SupabaseScenarioRepository implements ScenarioRepository {
  private client() {
    const client = getSupabaseClient();
    if (!client) {
      throw new AppError('storage', 'PropertyPilot is not connected to your account.');
    }
    return client;
  }

  async list(userId: string): Promise<PropertyScenario[]> {
    try {
      const { data, error } = await this.client()
        .from('property_scenarios')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map(scenarioFromRow);
    } catch (error) {
      throw toAppError(error, 'storage');
    }
  }

  async listForProperty(userId: string, propertyId: string): Promise<PropertyScenario[]> {
    try {
      const { data, error } = await this.client()
        .from('property_scenarios')
        .select('*')
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []).map(scenarioFromRow);
    } catch (error) {
      throw toAppError(error, 'storage');
    }
  }

  async create(userId: string, draft: ScenarioDraft): Promise<PropertyScenario> {
    try {
      const client = this.client();

      const { count, error: countError } = await client
        .from('property_scenarios')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('property_id', draft.propertyId);

      if (countError) throw countError;
      if ((count ?? 0) >= MAX_SCENARIOS_PER_PROPERTY) {
        throw new AppError(
          'validation',
          `You can save up to ${MAX_SCENARIOS_PER_PROPERTY} scenarios per property. Delete one to make room.`,
        );
      }

      const { data, error } = await client
        .from('property_scenarios')
        .insert({
          id: crypto.randomUUID(),
          property_id: draft.propertyId,
          user_id: userId,
          name: draft.name,
          scenario_type: draft.scenarioType,
          assumptions: draft.assumptions,
        })
        .select()
        .single();

      if (error) throw error;
      return scenarioFromRow(data);
    } catch (error) {
      throw toAppError(error, 'storage');
    }
  }

  async update(
    userId: string,
    scenarioId: string,
    patch: { name?: string; assumptions?: Record<string, unknown> },
  ): Promise<PropertyScenario> {
    try {
      const { data, error } = await this.client()
        .from('property_scenarios')
        .update({
          ...(patch.name === undefined ? {} : { name: patch.name }),
          ...(patch.assumptions === undefined ? {} : { assumptions: patch.assumptions }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', scenarioId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return scenarioFromRow(data);
    } catch (error) {
      throw toAppError(error, 'storage');
    }
  }

  async remove(userId: string, scenarioId: string): Promise<void> {
    try {
      const { error } = await this.client()
        .from('property_scenarios')
        .delete()
        .eq('id', scenarioId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      throw toAppError(error, 'storage');
    }
  }

  async removeForProperty(userId: string, propertyId: string): Promise<void> {
    try {
      const { error } = await this.client()
        .from('property_scenarios')
        .delete()
        .eq('property_id', propertyId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      throw toAppError(error, 'storage');
    }
  }
}
