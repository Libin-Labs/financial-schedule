export interface PeriodicRate {
  numerator: bigint;
  denominator: bigint;
}

export interface ScheduleOptions {
  principal: bigint;
  periods: number;
  rate: PeriodicRate;
}

export interface ScheduleRow {
  readonly period: number;
  readonly openingBalance: bigint;
  readonly interest: bigint;
  readonly principal: bigint;
  readonly payment: bigint;
  readonly closingBalance: bigint;
}

export interface FinancialSchedule {
  readonly periodicPayment: bigint;
  readonly totalInterest: bigint;
  readonly totalPaid: bigint;
  readonly rows: readonly ScheduleRow[];
}

function integerRatio(value: bigint, name: string, positive: boolean): void {
  if (typeof value !== 'bigint') throw new TypeError(`${name} must be a bigint.`);
  if (positive ? value <= 0n : value < 0n) {
    throw new RangeError(`${name} must be ${positive ? 'positive' : 'nonnegative'}.`);
  }
  if (value.toString().length > 100) throw new RangeError(`${name} exceeds 100 digits.`);
}

function ceilDivide(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  return numerator % denominator === 0n ? quotient : quotient + 1n;
}

function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  return quotient + (remainder * 2n >= denominator ? 1n : 0n);
}

function fixedPayment(principal: bigint, rate: PeriodicRate, periods: number): bigint {
  if (rate.numerator === 0n) return ceilDivide(principal, BigInt(periods));
  const factor = rate.denominator + rate.numerator;
  const compounded = factor ** BigInt(periods);
  const base = rate.denominator ** BigInt(periods);
  return ceilDivide(
    principal * rate.numerator * compounded,
    rate.denominator * (compounded - base),
  );
}

/**
 * Creates a level-payment amortization schedule using exact integer minor units.
 * Interest rounds half-up per period; the regular payment rounds upward, and the final
 * payment is adjusted to clear the remaining balance. A schedule may close early when integer
 * rounding makes the regular installment larger than the amount due.
 */
export function createFinancialSchedule(options: ScheduleOptions): FinancialSchedule {
  if (!options || typeof options !== 'object') throw new TypeError('options must be an object.');
  integerRatio(options.principal, 'principal', true);
  if (!Number.isSafeInteger(options.periods) || options.periods < 1 || options.periods > 1200) {
    throw new RangeError('periods must be an integer from 1 to 1200.');
  }
  if (!options.rate || typeof options.rate !== 'object')
    throw new TypeError('rate must be an object.');
  integerRatio(options.rate.numerator, 'rate.numerator', false);
  integerRatio(options.rate.denominator, 'rate.denominator', true);

  const rate = { ...options.rate };
  const initialInterest = roundHalfUp(options.principal * rate.numerator, rate.denominator);
  const periodicPayment = [
    fixedPayment(options.principal, rate, options.periods),
    initialInterest + 1n,
  ].reduce((maximum, value) => (value > maximum ? value : maximum));
  const rows: ScheduleRow[] = [];
  let balance = options.principal;
  let totalInterest = 0n;
  let totalPaid = 0n;
  for (let period = 1; period <= options.periods; period++) {
    const openingBalance = balance;
    const interest = roundHalfUp(openingBalance * rate.numerator, rate.denominator);
    const due = openingBalance + interest;
    const scheduledPayment = period === options.periods ? due : periodicPayment;
    const payment = scheduledPayment > due ? due : scheduledPayment;
    if (payment < interest) {
      throw new RangeError('The selected rate and term do not amortize with integer minor units.');
    }
    const principal = payment - interest;
    if (principal > openingBalance) {
      throw new RangeError('The computed payment would repay principal before the final period.');
    }
    balance = openingBalance - principal;
    rows.push(
      Object.freeze({
        period,
        openingBalance,
        interest,
        principal,
        payment,
        closingBalance: balance,
      }),
    );
    totalInterest += interest;
    totalPaid += payment;
    if (balance === 0n) break;
  }
  if (balance !== 0n) throw new RangeError('Schedule did not repay the principal.');
  return Object.freeze({
    periodicPayment,
    totalInterest,
    totalPaid,
    rows: Object.freeze(rows),
  });
}
