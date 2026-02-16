/**
 * Invoices commands
 * Manage sales invoices
 */

import { get, post, put } from '../lib/api.js';
import { formatOutput, success } from '../lib/output.js';
import chalk from 'chalk';

export function invoicesCommand(program) {
  const invoices = program
    .command('invoices')
    .alias('invoice')
    .description('Manage sales invoices');

  // List invoices
  invoices
    .command('list')
    .alias('ls')
    .description('List invoices for a company')
    .argument('<companyId>', 'Company ID')
    .option('-p, --page <number>', 'Page number', '1')
    .option('-s, --page-size <number>', 'Page size', '100')
    .option('-q, --query <string>', 'Filter query (e.g., status=Paid)')
    .option('-o, --order-by <string>', 'Order by field')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'table')
    .action(async (companyId, options) => {
      const params = {
        page: parseInt(options.page),
        pageSize: parseInt(options.pageSize)
      };

      if (options.query) params.query = options.query;
      if (options.orderBy) params.orderBy = options.orderBy;

      const data = await get(`/companies/${companyId}/data/invoices`, params);

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'invoiceNumber', header: 'Invoice #' },
        { key: 'customerRef.companyName', header: 'Customer' },
        { key: 'issueDate', header: 'Issue Date', formatter: (v) => new Date(v).toLocaleDateString() },
        { key: 'dueDate', header: 'Due Date', formatter: (v) => new Date(v).toLocaleDateString() },
        {
          key: 'status',
          header: 'Status',
          formatter: (v) => {
            const colors = {
              'Paid': chalk.green,
              'PartiallyPaid': chalk.yellow,
              'Submitted': chalk.blue,
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

  // Get invoice by ID
  invoices
    .command('get')
    .description('Get invoice details')
    .argument('<companyId>', 'Company ID')
    .argument('<invoiceId>', 'Invoice ID')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, invoiceId, options) => {
      const data = await get(`/companies/${companyId}/data/invoices/${invoiceId}`);
      formatOutput(data, { format: options.format });
    });

  // Create invoice
  invoices
    .command('create')
    .description('Create a new invoice')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .requiredOption('--customer-id <id>', 'Customer ID')
    .requiredOption('--issue-date <date>', 'Issue date (YYYY-MM-DD)')
    .requiredOption('--due-date <date>', 'Due date (YYYY-MM-DD)')
    .option('--invoice-number <number>', 'Invoice number')
    .option('--currency <currency>', 'Currency code', 'USD')
    .option('--line-items <json>', 'Line items as JSON array')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, connectionId, options) => {
      const payload = {
        customerRef: { id: options.customerId },
        issueDate: options.issueDate,
        dueDate: options.dueDate,
        currency: options.currency,
        lineItems: []
      };

      if (options.invoiceNumber) payload.invoiceNumber = options.invoiceNumber;

      if (options.lineItems) {
        try {
          payload.lineItems = JSON.parse(options.lineItems);
        } catch (e) {
          console.error(chalk.red('Error: Invalid JSON for line items'));
          process.exit(1);
        }
      }

      const data = await post(
        `/companies/${companyId}/connections/${connectionId}/push/invoices`,
        payload,
        { spinnerText: 'Creating invoice...' }
      );

      success('Invoice created');
      formatOutput(data, { format: options.format });
    });

  // Update invoice
  invoices
    .command('update')
    .description('Update an invoice')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .argument('<invoiceId>', 'Invoice ID')
    .option('--status <status>', 'Invoice status')
    .option('--data <json>', 'Full invoice data as JSON')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, connectionId, invoiceId, options) => {
      let payload = {};

      if (options.data) {
        try {
          payload = JSON.parse(options.data);
        } catch (e) {
          console.error(chalk.red('Error: Invalid JSON data'));
          process.exit(1);
        }
      } else if (options.status) {
        payload.status = options.status;
      } else {
        console.error(chalk.red('Error: No updates specified'));
        process.exit(1);
      }

      const data = await put(
        `/companies/${companyId}/connections/${connectionId}/push/invoices/${invoiceId}`,
        payload,
        { spinnerText: 'Updating invoice...' }
      );

      success('Invoice updated');
      formatOutput(data, { format: options.format });
    });

  // Get invoice PDF
  invoices
    .command('pdf')
    .description('Get invoice PDF download link')
    .argument('<companyId>', 'Company ID')
    .argument('<invoiceId>', 'Invoice ID')
    .action(async (companyId, invoiceId) => {
      const data = await get(`/companies/${companyId}/data/invoices/${invoiceId}/pdf`);

      if (data.url) {
        console.log(chalk.green('✓'), 'PDF download link:');
        console.log(chalk.cyan(data.url));
      } else {
        console.log(chalk.yellow('PDF not available for this invoice'));
      }
    });
}
