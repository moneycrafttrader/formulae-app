export interface FormulaResult {
  pivot?: number;
  r1: number;
  r2: number;
  r3: number;
  r4: number;
  s1: number;
  s2: number;
  s3: number;
  s4: number;
}

/* -----------------------------------------------------------
   CLASSIC PIVOT FORMULAS  (Matches PivotPointCalculator EXACTLY)
------------------------------------------------------------ */
export function calculateClassic(O: number, H: number, L: number, C: number): FormulaResult {
  const PP = (H + L + C) / 3;
  const range = H - L;

  return {
    pivot: PP,
    r1: (2 * PP) - L,
    s1: (2 * PP) - H,
    r2: PP + range,
    s2: PP - range,
    r3: PP + 2 * range,
    s3: PP - 2 * range,
    r4: PP + 3 * range,
    s4: PP - 3 * range,
  };
}

/* -----------------------------------------------------------
   CAMARILLA FORMULAS (MATCHES pivotpointcalculator.com EXACTLY)
------------------------------------------------------------ */
export function calculateCamarilla(O: number, H: number, L: number, C: number): FormulaResult {
  const range = H - L;

  // Camarilla multipliers
  const m1 = 1.1 / 12;
  const m2 = 1.1 / 6;
  const m3 = 1.1 / 4;
  const m4 = 1.1 / 2;

  return {
    pivot: (H + L + C) / 3,

    r1: C + range * m1,
    r2: C + range * m2,
    r3: C + range * m3,
    r4: C + range * m4,

    s1: C - range * m1,
    s2: C - range * m2,
    s3: C - range * m3,
    s4: C - range * m4,
  };
}
