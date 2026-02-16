/**
 * Journals commands
 * Manage journals and journal entries
 */

import { get, post } from '../lib/api.js';
import { formatOutput, success } from '../lib/output.js';
import chalk from 'chalk';

export function journalsCommand(program) {
  const journals = program
    .command('journals')
    .alias('journal')
    .description('Manage journals and journal entries');

  // List journals
  journals
    .command('list')
    .alias('ls')
    .description('List journals for a company')
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

      const data = await get(`/companies/${companyId}/data/journals`, params);

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        { key: 'type', header: 'Type' },
        { key: 'hasChildren', header: 'Has Children', formatter: (v) => v ? chalk.green('Yes') : '—' },
        {
          key: 'status',
          header: 'Status',
          formatter: (v) => v === 'Active' ? chalk.green(v) : chalk.gray(v)
        }
      ];

      formatOutput(data.results || [], { format: options.format, columns });
    });

  // Get journal by ID
  journals
    .command('get')
    .description('Get journal details')
    .argument('<companyId>', 'Company ID')
    .argument('<journalId>', 'Journal ID')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, journalId, options) => {
      const data = await get(`/companies/${companyId}/data/journals/${journalId}`);
      formatOutput(data, { format: options.format });
    });

  // List journal entries
  journals
    .command('entries')
    .description('List journal entries')
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

      const data = await get(`/companies/${companyId}/data/journalEntries`, params);

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'journalRef.name', header: 'Journal' },
        { key: 'postedOn', header: 'Posted On', formatter: (v) => new Date(v).toLocaleDateString() },
        { key: 'description', header: 'Description' },
        { key: 'recordRef.dataType', header: 'Record Type' }
      ];

      formatOutput(data.results || [], { format: options.format, columns });
    });

  // Get journal entry by ID
  journals
    .command('entry')
    .description('Get journal entry details')
    .argument('<companyId>', 'Company ID')
    .argument('<entryId>', 'Journal entry ID')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, entryId, options) => {
      const data = await get(`/companies/${companyId}/data/journalEntries/${entryId}`);
      formatOutput(data, { format: options.format });
    });

  // Create journal entry
  journals
    .command('create-entry')
    .description('Create a new journal entry')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .requiredOption('--journal-id <id>', 'Journal ID')
    .requiredOption('--posted-on <date>', 'Posted date (YYYY-MM-DD)')
    .requiredOption('--lines <json>', 'Journal entry lines as JSON array')
    .option('--description <text>', 'Entry description')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, connectionId, options) => {
      const payload = {
        journalRef: { id: options.journalId },
        postedOn: options.postedOn
      };

      if (options.description) payload.description = options.description;

      try {
        payload.journalLines = JSON.parse(options.lines);
      } catch (e) {
        console.error(chalk.red('Error: Invalid JSON for lines'));
        console.log(chalk.gray('Expected format: [{"accountRef":{"id":"..."},"netAmount":100,"description":"..."}]'));
        process.exit(1);
      }

      const data = await post(
        `/companies/${companyId}/connections/${connectionId}/push/journalEntries`,
        payload,
        { spinnerText: 'Creating journal entry...' }
      );

      success('Journal entry created');
      formatOutput(data, { format: options.format });
    });
}
