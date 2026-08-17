-- PropertyPilot — local development seed
--
-- Loads the same fictional sample portfolio the app's demo mode uses, so a
-- local Supabase stack has something to look at.
--
--   supabase db reset          # applies migrations, then runs this file
--
-- THIS IS FICTIONAL SAMPLE DATA. The values are illustrative assumptions,
-- not appraisals, listings, or real transactions. Do not load it into a
-- production project.
--
-- Set the target user before running against an existing project. The default
-- below is the first user in auth.users, which is what a fresh local stack
-- gives you after signing up once through the app.

do $$
declare
  target_user uuid;
begin
  select id into target_user from auth.users order by created_at limit 1;

  if target_user is null then
    raise notice 'No auth user found — sign up once, then re-run seed.sql.';
    return;
  end if;

  delete from public.properties where user_id = target_user;

  insert into public.properties (
    user_id, nickname, street_address, city, state, zip_code, property_type,
    unit_count, occupied_units,
    purchase_price, purchase_date, initial_closing_costs, initial_capex,
    original_down_payment,
    has_mortgage, mortgage_balance, mortgage_interest_rate,
    monthly_principal_interest, remaining_term_years,
    monthly_gross_rent, monthly_other_income, vacancy_rate,
    annual_property_tax, annual_insurance, monthly_management_cost,
    management_percentage, annual_repairs_maintenance, monthly_owner_utilities,
    monthly_hoa, monthly_lawn_snow, monthly_other_expenses,
    estimated_market_value, appreciation_rate, rent_growth_rate
  )
  values
    (
      target_user, 'Neufer Duplex', '119 Neufer Ct', 'Erie', 'PA', '16509', 'duplex',
      2, 2,
      94000, '2019-03-15', 2400, 15248.89,
      18800,
      true, 53600, 0.05750,
      697.87, 8,
      1850, 0, 0.05000,
      2000, 1500, 150,
      null, 2400, 0,
      0, 0, 100,
      125000, 0.03000, 0.03000
    ),
    (
      target_user, 'Oak Street', '482 Oak St', 'Erie', 'PA', '16508', 'single_family',
      1, 1,
      148000, '2021-06-01', 3600, 9800,
      29600,
      true, 96000, 0.05250,
      564.61, 26,
      2400, 0, 0.05000,
      3000, 1300, 0,
      0.08000, 1800, 0,
      0, 0, 0,
      210000, 0.03000, 0.03000
    ),
    (
      target_user, 'Maple Duplex', '77 Maple Ave', 'Girard', 'PA', '16417', 'duplex',
      2, 1,
      132000, '2020-09-20', 3100, 6400,
      26400,
      true, 88000, 0.03750,
      464.15, 24,
      1750, 45, 0.05000,
      2600, 1400, 0,
      0.08000, 2100, 0,
      0, 60, 50,
      165000, 0.03000, 0.03000
    ),
    (
      target_user, 'Pine Street', '1204 Pine St', 'Erie', 'PA', '16503', 'triplex',
      3, 2,
      176000, '2017-11-08', 4200, 22500,
      35200,
      true, 60000, 0.03500,
      336.62, 21,
      1950, 0, 0.07000,
      4200, 1800, 195,
      null, 3000, 80,
      0, 75, 130,
      240000, 0.02500, 0.02500
    );

  raise notice 'Seeded 4 sample properties for user %', target_user;
end
$$;
