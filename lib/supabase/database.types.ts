import type { PropertyType, ScenarioType } from "@/types/property";
import type { SubscriptionTier } from "@/types/subscription";

/**
 * Hand-written database types matching `supabase/migrations`.
 *
 * These can be regenerated with:
 *   npx supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts
 *
 * Numeric columns come back from PostgREST as JS numbers for `numeric` when
 * they fit; the row mappers in `rows.ts` coerce defensively either way.
 */

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: SubscriptionTier;
  created_at: string;
  updated_at: string;
};

export type PropertyRow = {
  id: string;
  user_id: string;
  nickname: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: PropertyType;
  unit_count: number;
  occupied_units: number;

  purchase_price: number;
  purchase_date: string | null;
  initial_closing_costs: number;
  initial_capex: number;
  original_down_payment: number | null;

  has_mortgage: boolean;
  mortgage_balance: number;
  mortgage_interest_rate: number;
  monthly_principal_interest: number;
  remaining_term_years: number;

  monthly_gross_rent: number;
  monthly_other_income: number;
  vacancy_rate: number;

  annual_property_tax: number;
  annual_insurance: number;
  monthly_management_cost: number;
  management_percentage: number | null;
  annual_repairs_maintenance: number;
  monthly_owner_utilities: number;
  monthly_hoa: number;
  monthly_lawn_snow: number;
  monthly_other_expenses: number;

  estimated_market_value: number;
  appreciation_rate: number;
  rent_growth_rate: number;

  created_at: string;
  updated_at: string;
};

export type PropertyScenarioRow = {
  id: string;
  property_id: string;
  user_id: string;
  name: string;
  scenario_type: ScenarioType;
  assumptions: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SubscriptionStateRow = {
  user_id: string;
  revenuecat_customer_id: string | null;
  entitlement: string | null;
  product_identifier: string | null;
  expiration_at: string | null;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, "id" | "email">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      properties: {
        Row: PropertyRow;
        Insert: Omit<PropertyRow, "created_at" | "updated_at"> &
          Partial<Pick<PropertyRow, "created_at" | "updated_at">>;
        Update: Partial<PropertyRow>;
        Relationships: [];
      };
      property_scenarios: {
        Row: PropertyScenarioRow;
        Insert: Omit<PropertyScenarioRow, "created_at" | "updated_at"> &
          Partial<Pick<PropertyScenarioRow, "created_at" | "updated_at">>;
        Update: Partial<PropertyScenarioRow>;
        Relationships: [];
      };
      subscription_state: {
        Row: SubscriptionStateRow;
        Insert: Omit<SubscriptionStateRow, "updated_at"> &
          Partial<Pick<SubscriptionStateRow, "updated_at">>;
        Update: Partial<SubscriptionStateRow>;
        Relationships: [];
      };
    };
    // Empty-map form used by `supabase gen types`; `Record<string, never>`
    // would fail the client's GenericSchema constraint and silently degrade
    // every query result to `never`.
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
