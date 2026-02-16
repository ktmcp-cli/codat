/**
 * Bank Accounts commands
 * Manage bank accounts and transactions
 */

import { get, post } from '../lib/api.js';
import { formatOutput, success } from '../lib/output.js';
import chalk from 'chalk';

export function bankAccountsCommand(program) {
  const bankAccounts = program
    .command('bank-accounts')
    .alias('bank')
    .description('Manage bank accounts');

  // List bank accounts
  bankAccounts
    .command('list')
    .alias('ls')
    .description('List bank accounts for a company')
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

      const data = await get(`/companies/${companyId}/data/bankAccounts`, params);

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'accountName', header: 'Name' },
        { key: 'accountNumber', header: 'Number' },
        { key: 'sortCode', header: 'Sort Code' },
        { key: 'currency', header: 'Currency' },
        {
          key: 'balance',
          header: 'Balance',
          formatter: (v) => v != null ? v.toFixed(2) : '—'
        },
        { key: 'accountType', header: 'Type' }
      ];

      formatOutput(data.results || [], { format: options.format, columns });
    });

  // Get bank account by ID
  bankAccounts
    .command('get')
    .description('Get bank account details')
    .argument('<companyId>', 'Company ID')
    .argument('<accountId>', 'Bank account ID')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, accountId, options) => {
      const data = await get(`/companies/${companyId}/data/bankAccounts/${accountId}`);
      formatOutput(data, { format: options.format });
    });

  // Create bank account
  bankAccounts
    .command('create')
    .description('Create a new bank account')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .requiredOption('-n, --name <name>', 'Account name')
    .option('--account-number <number>', 'Account number')
    .option('--sort-code <code>', 'Sort code')
    .option('--currency <currency>', 'Currency code', 'USD')
    .option('--account-type <type>', 'Account type')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, connectionId, options) => {
      const payload = {
        accountName: options.name,
        currency: options.currency
      };

      if (options.accountNumber) payload.accountNumber = options.accountNumber;
      if (options.sortCode) payload.sortCode = options.sortCode;
      if (options.accountType) payload.accountType = options.accountType;

      const data = await post(
        `/companies/${companyId}/connections/${connectionId}/push/bankAccounts`,
        payload,
        { spinnerText: 'Creating bank account...' }
      );

      success('Bank account created');
      formatOutput(data, { format: options.format });
    });

  // List bank transactions
  bankAccounts
    .command('transactions')
    .alias('txns')
    .description('List bank account transactions')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .argument('<accountId>', 'Bank account ID')
    .option('-p, --page <number>', 'Page number', '1')
    .option('-s, --page-size <number>', 'Page size', '100')
    .option('-q, --query <string>', 'Filter query')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'table')
    .action(async (companyId, connectionId, accountId, options) => {
      const params = {
        page: parseInt(options.page),
        pageSize: parseInt(options.pageSize)
      };

      if (options.query) params.query = options.query;

      const data = await get(
        `/companies/${companyId}/connections/${connectionId}/data/bankAccounts/${accountId}/bankTransactions`,
        params
      );

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'date', header: 'Date', formatter: (v) => new Date(v).toLocaleDateString() },
        { key: 'description', header: 'Description' },
        {
          key: 'amount',
          header: 'Amount',
          formatter: (v, item) => {
            const amount = v != null ? v.toFixed(2) : '—';
            return item.transactionType === 'Credit' ? chalk.green(`+${amount}`) : chalk.red(`-${amount}`);
          }
        },
        { key: 'currency', header: 'Currency' },
        {
          key: 'reconciled',
          header: 'Reconciled',
          formatter: (v) => v ? chalk.green('✓') : '—'
        }
      ];

      formatOutput(data.results || [], { format: options.format, columns });
    });
}
