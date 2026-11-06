import {
  createFinancialSchedule,
  type FinancialSchedule,
  type ScheduleOptions,
} from '@lp-labs/financial-schedule';
const options: ScheduleOptions = {
  principal: 10_000n,
  periods: 12,
  rate: { numerator: 1n, denominator: 100n },
};
const schedule: FinancialSchedule = createFinancialSchedule(options);
const payment: bigint = schedule.periodicPayment;
void payment;
