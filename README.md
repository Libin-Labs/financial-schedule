# @lp-labs/financial-schedule

Generates level-payment amortization schedules with exact integer minor-unit arithmetic and
explicit rounding. This is a calculation utility, not financial advice.

## Install

```sh
npm install @lp-labs/financial-schedule
```

Node 18+ ESM and CommonJS builds and TypeScript declarations are included. There are no runtime or
peer dependencies.

## Quickstart

```js
import { createFinancialSchedule } from '@lp-labs/financial-schedule';

const schedule = createFinancialSchedule({
  principal: 10_000n,
  periods: 3,
  rate: { numerator: 1n, denominator: 100n },
});
if (schedule.rows.at(-1).closingBalance !== 0n) {
  throw new Error('Schedule must repay the principal');
}
console.log(schedule.totalPaid); // 10201n
```

CommonJS: `const { createFinancialSchedule } = require('@lp-labs/financial-schedule');`.

## API and types

Runtime export: `createFinancialSchedule(options): FinancialSchedule`.

Exported types:

- `PeriodicRate`: `{ numerator: bigint; denominator: bigint }`, a nonnegative rational period rate.
- `ScheduleOptions`: positive bigint `principal`, `periods` from 1 through 1200, and a `rate`.
- `ScheduleRow`: period index and exact bigint opening balance, interest, principal, payment and
  closing balance.
- `FinancialSchedule`: regular `periodicPayment`, `totalInterest`, `totalPaid`, and frozen rows.

Amounts are integer minor units selected by the caller. The package does not define a currency,
precision, calendar, payment dates, taxes, fees, compounding convention beyond the specified
periodic rate, or an interest-rate quote convention.

## Calculation and rounding

The regular installment is calculated from the exact rational annuity formula and rounded upward to
the next minor unit. Each period's interest is computed on its opening balance and rounded
half-up (a positive exact half-minor-unit rounds up). The regular payment is increased, if
necessary, to exceed the first rounded interest amount by at least one minor unit. The final payment
is adjusted to clear the remaining principal plus final interest. Integer rounding can also result
in the balance being cleared before the requested term; in that case, rows stop once the balance is
zero. The returned `periodicPayment` is the regular installment; the last row's `payment` may
differ because of rounding.

```js
import { createFinancialSchedule } from '@lp-labs/financial-schedule';

const schedule = createFinancialSchedule({
  principal: 10n,
  periods: 3,
  rate: { numerator: 0n, denominator: 1n },
});
if (schedule.rows.map((row) => row.payment).join(',') !== '4,4,2') {
  throw new Error('Final installment should clear integer rounding residue');
}
```

## Validation, errors and limits

- Principal is positive; rate numerator is nonnegative; denominator is positive. Each bigint
  parameter is limited to 100 decimal digits.
- Period count is an integer from 1 to 1200, bounding schedule length and exponentiation work.
- Invalid types throw `TypeError`; out-of-range values and a schedule that cannot amortize with
  integer minor units throw `RangeError`.
- Rows and schedule containers are frozen. Exact intermediate arithmetic uses native `bigint`;
  there are no floating-point amount conversions.
- This package does not make recommendations, account for contractual/legal rules, select rates or
  dates, handle payment holidays, balloon structures, fees, taxes, variable rates or missed payments.
  Validate the model and results for your jurisdiction and use case.

All exported API names: `createFinancialSchedule`, `PeriodicRate`, `ScheduleOptions`,
`ScheduleRow`, `FinancialSchedule`.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
