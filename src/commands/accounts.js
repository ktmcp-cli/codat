/**
 * Accounts commands
 * Manage chart of accounts data
 */

import { get, post } from '../lib/api.js';
import { formatOutput, success } from '../lib/output.js';
import chalk from 'chalk';

export function accountsCommand(program) {
  const accounts = program
    .command('accounts')
    .alias('account')
    .description('Manage chart of accounts');

  // List accounts
  accounts
    .command('list')
    .alias('ls')
    .description('List accounts for a company')
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

      const data = await get(`/companies/${companyId}/data/accounts`, params);

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'nominalCode', header: 'Code' },
        { key: 'name', header: 'Name' },
        { key: 'type', header: 'Type' },
        {
          key: 'status',
          header: 'Status',
          formatter: (v) => v === 'Active' ? chalk.green(v) : chalk.yellow(v)
        },
        {
          key: 'currentBalance',
          header: 'Balance',
          formatter: (v) => v != null ? v.toFixed(2) : '—'
        },
        { key: 'currency', header: 'Currency' }
      ];

      formatOutput(data.results || [], { format: options.format, columns });
    });

  // Get account by ID
  accounts
    .command('get')
    .description('Get account details')
    .argument('<companyId>', 'Company ID')
    .argument('<accountId>', 'Account ID')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, accountId, options) => {
      const data = await get(`/companies/${companyId}/data/accounts/${accountId}`);
      formatOutput(data, { format: options.format });
    });

  // Create account
  accounts
    .command('create')
    .description('Create a new account')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .requiredOption('-n, --name <name>', 'Account name')
    .requiredOption('-t, --type <type>', 'Account type (Asset, Liability, Equity, Income, Expense)')
    .option('-c, --nominal-code <code>', 'Nominal/account code')
    .option('--currency <currency>', 'Currency code (e.g., USD)', 'USD')
    .option('-d, --description <text>', 'Account description')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, connectionId, options) => {
      const payload = {
        name: options.name,
        type: options.type,
        currency: options.currency
      };

      if (options.nominalCode) payload.nominalCode = options.nominalCode;
      if (options.description) payload.description = options.description;

      const data = await post(
        `/companies/${companyId}/connections/${connectionId}/push/accounts`,
        payload,
        { spinnerText: 'Creating account...' }
      );

      success('Account created');
      formatOutput(data, { format: options.format });
    });

  // List account transactions
  accounts
    .command('transactions')
    .alias('txns')
    .description('List transactions for an account')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .option('-p, --page <number>', 'Page number', '1')
    .option('-s, --page-size <number>', 'Page size', '100')
    .option('-q, --query <string>', 'Filter query')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'table')
    .action(async (companyId, connectionId, options) => {
      const params = {
        page: parseInt(options.page),
        pageSize: parseInt(options.pageSize)
      };

      if (options.query) params.query = options.query;

      const data = await get(
        `/companies/${companyId}/connections/${connectionId}/data/accountTransactions`,
        params
      );

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'transactionId', header: 'Transaction' },
        { key: 'date', header: 'Date', formatter: (v) => new Date(v).toLocaleDateString() },
        { key: 'status', header: 'Status' },
        { key: 'currency', header: 'Currency' },
        {
          key: 'totalAmount',
          header: 'Amount',
          formatter: (v) => v != null ? v.toFixed(2) : '—'
        }
      ];

      formatOutput(data.results || [], { format: options.format, columns });
    });
}
