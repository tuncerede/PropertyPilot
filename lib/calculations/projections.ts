import type {
  HoldProjection,
  HoldProjectionYear,
  SaleProceeds,
  SellAndInvestProjection,
  SellAndInvestProjectionYear,
  SellVsHoldAssumptions,
} from '@/types/analysis';
import type { PropertyFinancials } from '@/types/property';
import { calculateOperatingExpenses, fixedMonthlyOperatingExpenses } from './expenses';
import { calculateIncome } from './income';
import { amortize, resolveMonthlyDebtService } from './mortgage';
import { compound, MONTHS_PER_YEAR, num } from './units';

/** Future value of a lump sum: `present * (1 + rate) ^ years`. */
export function futureValue(present: number, annualRate: number, years: number): number {
  return compound(present, annualRate, years);
}

export type HoldProjectionAssumptions = Pick<
  SellVsHoldAssumptions,
  | 'appreciationRate'
  | 'rentGrowthRate'
  | 'expenseInflationRate'
  | 'projectionYears'
  | 'sellingCostPercentage'
  | 'reinvestCashFlow'
  | 'alternativeInvestmentReturn'
  | 'compareOnAfterSaleBasis'
>;

/**
 * Year-by-year projection of keeping the property.
 *
 * Modelling choices, stated plainly because the user is trusting the maths:
 *
 *  - Property value grows at `appreciationRate`, compounded annually.
 *  - Rent and other income grow at `rentGrowthRate`, compounded annually.
 *    The vacancy assumption is held constant.
 *  - Fixed-dollar operating expenses grow at `expenseInflationRate`.
 *    Percentage-based management is re-derived from that year's effective
 *    income instead of being inflated, because it already scales with rent.
 *  - Debt service comes from a real month-by-month amortization of the
 *    current balance, so the loan pays down (and eventually pays off)
 *    correctly rather than being straight-lined.
 *  - Each year's figures are that year's monthly run-rate times 12.
 *  - Cash flow is accumulated separately from equity. It only compounds when
 *    the user explicitly opts into reinvestment.
 */
export function projectHold(
  property: PropertyFinancials,
  assumptions: HoldProjectionAssumptions,
): HoldProjection {
  const projectionYears = Math.max(1, Math.round(num(assumptions.projectionYears)));

  const baseIncome = calculateIncome(property);
  const baseExpenses = calculateOperatingExpenses(property, baseIncome.monthlyEffectiveIncome);
  const baseFixedExpenses = fixedMonthlyOperatingExpenses(baseExpenses);

  const monthlyDebtService = resolveMonthlyDebtService(property);
  const startingBalance = property.hasMortgage ? Math.max(num(property.mortgageBalance), 0) : 0;
  const schedule = amortize(
    startingBalance,
    property.mortgageInterestRate,
    monthlyDebtService,
    projectionYears * MONTHS_PER_YEAR,
  );

  const years: HoldProjectionYear[] = [];
  let cumulativeCashFlow = 0;

  for (let year = 1; year <= projectionYears; year += 1) {
    const propertyValue = compound(property.estimatedMarketValue, assumptions.appreciationRate, year);

    const monthlyGrossRent = compound(property.monthlyGrossRent, assumptions.rentGrowthRate, year);
    const monthlyOtherIncome = compound(
      property.monthlyOtherIncome,
      assumptions.rentGrowthRate,
      year,
    );

    const income = calculateIncome({
      monthlyGrossRent,
      monthlyOtherIncome,
      vacancyRate: property.vacancyRate,
    });

    const inflatedFixedExpenses = compound(
      baseFixedExpenses,
      assumptions.expenseInflationRate,
      year,
    );
    const managementExpense = baseExpenses.managementIsPercentageBased
      ? Math.max(income.monthlyEffectiveIncome, 0) * num(property.managementPercentage)
      : 0;
    const monthlyOperatingExpenses = inflatedFixedExpenses + managementExpense;

    const annualEffectiveIncome = income.annualEffectiveIncome;
    const annualOperatingExpenses = monthlyOperatingExpenses * MONTHS_PER_YEAR;
    const annualNOI = annualEffectiveIncome - annualOperatingExpenses;

    let annualDebtService = 0;
    for (let month = (year - 1) * MONTHS_PER_YEAR; month < year * MONTHS_PER_YEAR; month += 1) {
      annualDebtService += schedule.months[month]?.payment ?? 0;
    }

    const annualCashFlow = annualNOI - annualDebtService;
    cumulativeCashFlow = assumptions.reinvestCashFlow
      ? cumulativeCashFlow * (1 + num(assumptions.alternativeInvestmentReturn)) + annualCashFlow
      : cumulativeCashFlow + annualCashFlow;

    const mortgageBalance = schedule.months[year * MONTHS_PER_YEAR - 1]?.endingBalance ?? 0;
    const equity = propertyValue - mortgageBalance;

    years.push({
      year,
      propertyValue,
      monthlyGrossRent,
      annualEffectiveIncome,
      annualOperatingExpenses,
      annualNOI,
      annualDebtService,
      annualCashFlow,
      cumulativeCashFlow,
      mortgageBalance,
      equity,
      grossWealth: equity + cumulativeCashFlow,
    });
  }

  const final = years[years.length - 1];
  const finalPropertyValue = final?.propertyValue ?? num(property.estimatedMarketValue);
  const finalMortgageBalance = final?.mortgageBalance ?? startingBalance;
  const finalEquity = final?.equity ?? finalPropertyValue - finalMortgageBalance;

  const exitCosts = assumptions.compareOnAfterSaleBasis
    ? finalPropertyValue * num(assumptions.sellingCostPercentage)
    : 0;

  return {
    years,
    finalYear: projectionYears,
    finalPropertyValue,
    finalMortgageBalance,
    finalEquity,
    cumulativeCashFlow,
    exitCosts,
    projectedWealth: finalEquity - exitCosts + cumulativeCashFlow,
  };
}

/**
 * Sell today and invest the proceeds elsewhere.
 *
 *   investmentFutureValue = startingInvestment * (1 + alternativeReturn) ^ years
 *
 * The alternative return is a user assumption. Nothing here implies that any
 * market return is guaranteed.
 */
export function projectSellAndInvest(
  saleProceeds: SaleProceeds,
  alternativeInvestmentReturn: number,
  projectionYears: number,
): SellAndInvestProjection {
  const totalYears = Math.max(1, Math.round(num(projectionYears)));
  const startingInvestment = saleProceeds.netSaleProceeds;

  const years: SellAndInvestProjectionYear[] = [];
  for (let year = 1; year <= totalYears; year += 1) {
    years.push({
      year,
      investmentValue: futureValue(startingInvestment, alternativeInvestmentReturn, year),
    });
  }

  return {
    startingInvestment,
    years,
    finalYear: totalYears,
    projectedWealth: years[years.length - 1]?.investmentValue ?? startingInvestment,
    saleProceeds,
  };
}
