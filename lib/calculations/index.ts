/**
 * PropertyPilot financial calculation engine.
 *
 * Every function exported here is pure, synchronous and free of React,
 * navigation, storage and network concerns. UI code must import metrics from
 * this module rather than re-deriving a formula inline — that is what keeps
 * the numbers on every screen consistent and testable.
 *
 * Units: money in dollars, rates as decimal fractions (0.05 === 5%).
 * See `types/property.ts` for the full convention.
 */

export * from './units';
export * from './income';
export * from './expenses';
export * from './mortgage';
export * from './metrics';
export * from './sale';
export * from './projections';
export * from './sellVsHold';
export * from './breakeven';
export * from './refinance';
export * from './performance';
export * from './portfolio';
