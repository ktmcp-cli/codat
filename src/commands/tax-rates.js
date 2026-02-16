/**
 * Tax Rates commands
 * Manage tax rates
 */

import { get } from '../lib/api.js';
import { formatOutput } from '../lib/output.js';
import chalk from 'chalk';

export function taxRatesCommand(program) {
  const taxRates = program
    .command('tax-rates')
    .alias('tax')
    .description('Manage tax rates');

  // List tax rates
  taxRates
    .command('list')
    .alias('ls')
    .description('List tax rates for a company')
    .argument('<companyId>', 'Company ID')
    .option('-p, --page <number>', 'Page number', '1')
    .option('-s, --page-size <number>', 'Page size', '100')
    .option('-q, --query <string>', 'Filter query')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'table')
    .action(async (companyId, options) => {
      const params = {
        page: parseInt(options.page),
        pageSize: parseInt(options.pageSize)
      };

      if (options.query) params.query = options.query;

      const data = await get(`/companies/${companyId}/data/taxRates`, params);

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        {
          key: 'totalTaxRate',
          header: 'Rate (%)',
          formatter: (v) => v != null ? v.toFixed(2) : '—'
        },
        {
          key: 'effectiveTaxRate',
          header: 'Effective Rate (%)',
          formatter: (v) => v != null ? v.toFixed(2) : '—'
        },
        { key: 'code', header: 'Code' },
        {
          key: 'status',
          header: 'Status',
          formatter: (v) => v === 'Active' ? chalk.green(v) : chalk.gray(v)
        }
      ];

      formatOutput(data.results || [], { format: options.format, columns });
    });

  // Get tax rate by ID
  taxRates
    .command('get')
    .description('Get tax rate details')
    .argument('<companyId>', 'Company ID')
    .argument('<taxRateId>', 'Tax rate ID')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, taxRateId, options) => {
      const data = await get(`/companies/${companyId}/data/taxRates/${taxRateId}`);
      formatOutput(data, { format: options.format });
    });
}
