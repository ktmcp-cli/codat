/**
 * Payments commands
 * Manage payments (customer payments)
 */

import { get, post } from '../lib/api.js';
import { formatOutput, success } from '../lib/output.js';
import chalk from 'chalk';

export function paymentsCommand(program) {
  const payments = program
    .command('payments')
    .alias('payment')
    .description('Manage customer payments');

  // List payments
  payments
    .command('list')
    .alias('ls')
    .description('List payments for a company')
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

      const data = await get(`/companies/${companyId}/data/payments`, params);

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'customerRef.companyName', header: 'Customer' },
        { key: 'date', header: 'Date', formatter: (v) => new Date(v).toLocaleDateString() },
        {
          key: 'totalAmount',
          header: 'Amount',
          formatter: (v) => v != null ? v.toFixed(2) : '—'
        },
        { key: 'currency', header: 'Currency' },
        { key: 'paymentMethodRef.name', header: 'Method' }
      ];

      formatOutput(data.results || [], { format: options.format, columns });
    });

  // Get payment by ID
  payments
    .command('get')
    .description('Get payment details')
    .argument('<companyId>', 'Company ID')
    .argument('<paymentId>', 'Payment ID')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, paymentId, options) => {
      const data = await get(`/companies/${companyId}/data/payments/${paymentId}`);
      formatOutput(data, { format: options.format });
    });

  // Create payment
  payments
    .command('create')
    .description('Create a new payment')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .requiredOption('--customer-id <id>', 'Customer ID')
    .requiredOption('--date <date>', 'Payment date (YYYY-MM-DD)')
    .requiredOption('--amount <amount>', 'Payment amount')
    .option('--currency <currency>', 'Currency code', 'USD')
    .option('--payment-method-id <id>', 'Payment method ID')
    .option('--account-id <id>', 'Bank account ID')
    .option('--reference <reference>', 'Payment reference')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, connectionId, options) => {
      const payload = {
        customerRef: { id: options.customerId },
        date: options.date,
        totalAmount: parseFloat(options.amount),
        currency: options.currency
      };

      if (options.paymentMethodId) {
        payload.paymentMethodRef = { id: options.paymentMethodId };
      }

      if (options.accountId) {
        payload.accountRef = { id: options.accountId };
      }

      if (options.reference) {
        payload.reference = options.reference;
      }

      const data = await post(
        `/companies/${companyId}/connections/${connectionId}/push/payments`,
        payload,
        { spinnerText: 'Creating payment...' }
      );

      success('Payment created');
      formatOutput(data, { format: options.format });
    });

  // List payment methods
  payments
    .command('methods')
    .description('List payment methods')
    .argument('<companyId>', 'Company ID')
    .option('-p, --page <number>', 'Page number', '1')
    .option('-s, --page-size <number>', 'Page size', '100')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'table')
    .action(async (companyId, options) => {
      const params = {
        page: parseInt(options.page),
        pageSize: parseInt(options.pageSize)
      };

      const data = await get(`/companies/${companyId}/data/paymentMethods`, params);

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        { key: 'type', header: 'Type' },
        {
          key: 'status',
          header: 'Status',
          formatter: (v) => v === 'Active' ? chalk.green(v) : chalk.gray(v)
        }
      ];

      formatOutput(data.results || [], { format: options.format, columns });
    });
}
