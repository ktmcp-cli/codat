/**
 * Reports commands
 * Access financial reports
 */

import { get } from '../lib/api.js';
import { formatOutput } from '../lib/output.js';

export function reportsCommand(program) {
  const reports = program
    .command('reports')
    .alias('report')
    .description('Access financial reports');

  // Get balance sheet
  reports
    .command('balance-sheet')
    .alias('bs')
    .description('Get balance sheet report')
    .argument('<companyId>', 'Company ID')
    .requiredOption('--period-length <number>', 'Period length (months)')
    .requiredOption('--periods-to-compare <number>', 'Number of periods')
    .option('--start-month <date>', 'Start month (YYYY-MM-DD)')
    .option('-f, --format <format>', 'Output format (table, json)', 'json')
    .action(async (companyId, options) => {
      const params = {
        periodLength: parseInt(options.periodLength),
        periodsToCompare: parseInt(options.periodsToCompare)
      };

      if (options.startMonth) params.startMonth = options.startMonth;

      const data = await get(`/companies/${companyId}/data/financials/balanceSheet`, params);
      formatOutput(data, { format: options.format });
    });

  // Get profit and loss
  reports
    .command('profit-loss')
    .alias('pl')
    .description('Get profit and loss report')
    .argument('<companyId>', 'Company ID')
    .requiredOption('--period-length <number>', 'Period length (months)')
    .requiredOption('--periods-to-compare <number>', 'Number of periods')
    .option('--start-month <date>', 'Start month (YYYY-MM-DD)')
    .option('-f, --format <format>', 'Output format (table, json)', 'json')
    .action(async (companyId, options) => {
      const params = {
        periodLength: parseInt(options.periodLength),
        periodsToCompare: parseInt(options.periodsToCompare)
      };

      if (options.startMonth) params.startMonth = options.startMonth;

      const data = await get(`/companies/${companyId}/data/financials/profitAndLoss`, params);
      formatOutput(data, { format: options.format });
    });

  // Get cash flow statement
  reports
    .command('cash-flow')
    .alias('cf')
    .description('Get cash flow statement')
    .argument('<companyId>', 'Company ID')
    .requiredOption('--period-length <number>', 'Period length (months)')
    .requiredOption('--periods-to-compare <number>', 'Number of periods')
    .option('--start-month <date>', 'Start month (YYYY-MM-DD)')
    .option('-f, --format <format>', 'Output format (table, json)', 'json')
    .action(async (companyId, options) => {
      const params = {
        periodLength: parseInt(options.periodLength),
        periodsToCompare: parseInt(options.periodsToCompare)
      };

      if (options.startMonth) params.startMonth = options.startMonth;

      const data = await get(`/companies/${companyId}/data/financials/cashFlowStatement`, params);
      formatOutput(data, { format: options.format });
    });

  // Get aged debtors report
  reports
    .command('aged-debtors')
    .alias('ar')
    .description('Get aged debtors (accounts receivable) report')
    .argument('<companyId>', 'Company ID')
    .option('--report-date <date>', 'Report date (YYYY-MM-DD)')
    .option('--number-of-periods <number>', 'Number of aging periods')
    .option('--period-length-days <number>', 'Length of each period in days')
    .option('-f, --format <format>', 'Output format (table, json)', 'json')
    .action(async (companyId, options) => {
      const params = {};

      if (options.reportDate) params.reportDate = options.reportDate;
      if (options.numberOfPeriods) params.numberOfPeriods = parseInt(options.numberOfPeriods);
      if (options.periodLengthDays) params.periodLengthDays = parseInt(options.periodLengthDays);

      const data = await get(`/companies/${companyId}/data/aged/debtors`, params);
      formatOutput(data, { format: options.format });
    });

  // Get aged creditors report
  reports
    .command('aged-creditors')
    .alias('ap')
    .description('Get aged creditors (accounts payable) report')
    .argument('<companyId>', 'Company ID')
    .option('--report-date <date>', 'Report date (YYYY-MM-DD)')
    .option('--number-of-periods <number>', 'Number of aging periods')
    .option('--period-length-days <number>', 'Length of each period in days')
    .option('-f, --format <format>', 'Output format (table, json)', 'json')
    .action(async (companyId, options) => {
      const params = {};

      if (options.reportDate) params.reportDate = options.reportDate;
      if (options.numberOfPeriods) params.numberOfPeriods = parseInt(options.numberOfPeriods);
      if (options.periodLengthDays) params.periodLengthDays = parseInt(options.periodLengthDays);

      const data = await get(`/companies/${companyId}/data/aged/creditors`, params);
      formatOutput(data, { format: options.format });
    });
}
