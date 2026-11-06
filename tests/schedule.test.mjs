import assert from 'node:assert/strict';
import test from 'node:test';
import { createFinancialSchedule } from '../dist/esm/index.js';

test('builds a known level-payment amortization schedule exactly', () => {
  const result = createFinancialSchedule({
    principal: 10_000n,
    periods: 3,
    rate: { numerator: 1n, denominator: 100n },
  });
  assert.equal(result.periodicPayment, 3_401n);
  assert.deepEqual(
    result.rows.map(({ interest, principal, payment, closingBalance }) => [
      interest,
      principal,
      payment,
      closingBalance,
    ]),
    [
      [100n, 3_301n, 3_401n, 6_699n],
      [67n, 3_334n, 3_401n, 3_365n],
      [34n, 3_365n, 3_399n, 0n],
    ],
  );
  assert.equal(result.totalInterest, 201n);
  assert.equal(result.totalPaid, 10_201n);
});

test('uses upward payment rounding and adjusts the final installment at zero rate', () => {
  const result = createFinancialSchedule({
    principal: 10n,
    periods: 3,
    rate: { numerator: 0n, denominator: 7n },
  });
  assert.equal(result.periodicPayment, 4n);
  assert.deepEqual(
    result.rows.map((row) => row.payment),
    [4n, 4n, 2n],
  );
  assert.equal(
    result.rows.reduce((sum, row) => sum + row.principal, 0n),
    10n,
  );
});

test('rounds positive half-minor interest half-up', () => {
  const result = createFinancialSchedule({
    principal: 1n,
    periods: 1,
    rate: { numerator: 1n, denominator: 2n },
  });
  assert.equal(result.rows[0].interest, 1n);
  assert.equal(result.totalPaid, 2n);
});

test('bumps installments when rounded interest would otherwise prevent amortization', () => {
  const result = createFinancialSchedule({
    principal: 1n,
    periods: 3,
    rate: { numerator: 1n, denominator: 2n },
  });
  assert.equal(result.periodicPayment, 2n);
  assert.equal(result.rows.length, 1);
  assert.deepEqual(result.rows[0], {
    period: 1,
    openingBalance: 1n,
    interest: 1n,
    principal: 1n,
    payment: 2n,
    closingBalance: 0n,
  });
});

test('accepts very large exact minor units without number conversion', () => {
  const principal = 10n ** 90n + 5n;
  const result = createFinancialSchedule({
    principal,
    periods: 1,
    rate: { numerator: 0n, denominator: 1n },
  });
  assert.equal(result.rows[0].principal, principal);
  assert.equal(result.totalPaid, principal);
});

test('returns frozen summary and rows', () => {
  const result = createFinancialSchedule({
    principal: 100n,
    periods: 2,
    rate: { numerator: 0n, denominator: 1n },
  });
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.rows), true);
  assert.equal(Object.isFrozen(result.rows[0]), true);
});

test('rejects malformed or out-of-range inputs', () => {
  assert.throws(() => createFinancialSchedule(null), TypeError);
  assert.throws(
    () =>
      createFinancialSchedule({
        principal: 0n,
        periods: 1,
        rate: { numerator: 0n, denominator: 1n },
      }),
    RangeError,
  );
  assert.throws(
    () =>
      createFinancialSchedule({
        principal: 1n,
        periods: 0,
        rate: { numerator: 0n, denominator: 1n },
      }),
    RangeError,
  );
  assert.throws(
    () =>
      createFinancialSchedule({
        principal: 1n,
        periods: 1201,
        rate: { numerator: 0n, denominator: 1n },
      }),
    RangeError,
  );
  assert.throws(
    () =>
      createFinancialSchedule({
        principal: 1n,
        periods: 1,
        rate: { numerator: 1n, denominator: 0n },
      }),
    RangeError,
  );
  assert.throws(
    () =>
      createFinancialSchedule({
        principal: 1n,
        periods: 1,
        rate: { numerator: -1n, denominator: 1n },
      }),
    RangeError,
  );
});
