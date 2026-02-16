/**
 * Bills commands
 * Manage bills (accounts payable)
 */

import { get, post } from '../lib/api.js';
import { formatOutput, success } from '../lib/output.js';
import chalk from 'chalk';

export function billsCommand(program) {
  const bills = program
    .command('bills')
    .alias('bill')
    .description('Manage bills (accounts payable)');

  // List bills
  bills
    .command('list')
    .alias('ls')
    .description('List bills for a company')
    .argument('<companyId>', 'Company ID')
    .option('-p, --page <number>', 'Page number', '1')
    .option('-s, --page-size <number>', 'Page size', '100')
    .option('-q, --query <string>', 'Filter query')
    .option('-o, --order-by <string>', 'Order by field')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'table')
    .action(async (companyId, options) => {
      const params = {
        page: parseInt(options.page),
        pageSize: parseInt(options.pageSize)
      };

      if (options.query) params.query = options.query;
      if (options.orderBy) params.orderBy = options.orderBy;

      const data = await get(`/companies/${companyId}/data/bills`, params);

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'reference', header: 'Reference' },
        { key: 'supplierRef.supplierName', header: 'Supplier' },
        { key: 'issueDate', header: 'Issue Date', formatter: (v) => new Date(v).toLocaleDateString() },
        { key: 'dueDate', header: 'Due Date', formatter: (v) => new Date(v).toLocaleDateString() },
        {
          key: 'status',
          header: 'Status',
          formatter: (v) => {
            const colors = {
              'Paid': chalk.green,
              'PartiallyPaid': chalk.yellow,
              'Open': chalk.blue,
              'Draft': chalk.gray,
              'Void': chalk.red
            };
            return (colors[v] || chalk.white)(v);
          }
        },
        {
          key: 'totalAmount',
          header: 'Total',
          formatter: (v) => v != null ? v.toFixed(2) : '—'
        },
        { key: 'currency', header: 'Currency' }
      ];

      formatOutput(data.results || [], { format: options.format, columns });
    });

  // Get bill by ID
  bills
    .command('get')
    .description('Get bill details')
    .argument('<companyId>', 'Company ID')
    .argument('<billId>', 'Bill ID')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, billId, options) => {
      const data = await get(`/companies/${companyId}/data/bills/${billId}`);
      formatOutput(data, { format: options.format });
    });

  // Create bill
  bills
    .command('create')
    .description('Create a new bill')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .requiredOption('--supplier-id <id>', 'Supplier ID')
    .requiredOption('--issue-date <date>', 'Issue date (YYYY-MM-DD)')
    .requiredOption('--due-date <date>', 'Due date (YYYY-MM-DD)')
    .option('--reference <reference>', 'Bill reference/number')
    .option('--currency <currency>', 'Currency code', 'USD')
    .option('--line-items <json>', 'Line items as JSON array')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, connectionId, options) => {
      const payload = {
        supplierRef: { id: options.supplierId },
        issueDate: options.issueDate,
        dueDate: options.dueDate,
        currency: options.currency,
        lineItems: []
      };

      if (options.reference) payload.reference = options.reference;

      if (options.lineItems) {
        try {
          payload.lineItems = JSON.parse(options.lineItems);
        } catch (e) {
          console.error(chalk.red('Error: Invalid JSON for line items'));
          process.exit(1);
        }
      }

      const data = await post(
        `/companies/${companyId}/connections/${connectionId}/push/bills`,
        payload,
        { spinnerText: 'Creating bill...' }
      );

      success('Bill created');
      formatOutput(data, { format: options.format });
    });

  // List bill payments
  bills
    .command('payments')
    .description('List bill payments')
    .argument('<companyId>', 'Company ID')
    .option('-p, --page <number>', 'Page number', '1')
    .option('-s, --page-size <number>', 'Page size', '100')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'table')
    .action(async (companyId, options) => {
      const params = {
        page: parseInt(options.page),
        pageSize: parseInt(options.pageSize)
      };

      const data = await get(`/companies/${companyId}/data/billPayments`, params);

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'supplierRef.supplierName', header: 'Supplier' },
        { key: 'date', header: 'Date', formatter: (v) => new Date(v).toLocaleDateString() },
        {
          key: 'totalAmount',
          header: 'Amount',
          formatter: (v) => v != null ? v.toFixed(2) : '—'
        },
        { key: 'currency', header: 'Currency' }
      ];

      formatOutput(data.results || [], { format: options.format, columns });
    });
}
