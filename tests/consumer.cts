import schedule = require('@lp-labs/financial-schedule');
const loan = schedule.createFinancialSchedule({
  principal: 50_000n,
  periods: 4,
  rate: { numerator: 0n, denominator: 1n },
});
void loan.totalPaid;
