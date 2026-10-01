// CMS-required TPMO disclaimer counts for Medicare marketing.
//
// ORGANIZATIONS (8), per the agency 2026-09-30:
//   UnitedHealthcare · SelectHealth · Regence BlueCross BlueShield · Cigna
//   Aetna · Molina · Aflac · Devoted Health
//
// PRODUCTS is still unfilled. It is the number of distinct plans those
// organizations offer in the service area, not the number of carriers, and it
// has to be counted against current-plan-year lineups for Davis County.
//
// While PRODUCTS is null the Medicare quote line is not published at all:
// no /quote/medicare/ page and no Medicare option in the wizard. Set it to the
// real count and the line comes back on the next build.
//
// REVIEW EVERY PLAN YEAR. Both counts move when carriers add, drop or
// restructure plans at AEP, and a stale count is still a misstatement.
export const ORGANIZATIONS: number = 8;
export const PRODUCTS: number | null = null;

export const TPMO_READY = PRODUCTS !== null;
