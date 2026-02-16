/**
 * Connections commands
 * Manage data connections between companies and accounting platforms
 */

import { get, post, del } from '../lib/api.js';
import { formatOutput, success } from '../lib/output.js';
import chalk from 'chalk';

export function connectionsCommand(program) {
  const connections = program
    .command('connections')
    .alias('conn')
    .description('Manage data connections to accounting platforms');

  // List connections for a company
  connections
    .command('list')
    .alias('ls')
    .description('List connections for a company')
    .argument('<companyId>', 'Company ID')
    .option('-p, --page <number>', 'Page number', '1')
    .option('-s, --page-size <number>', 'Page size', '100')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'table')
    .action(async (companyId, options) => {
      const params = {
        page: parseInt(options.page),
        pageSize: parseInt(options.pageSize)
      };

      const data = await get(`/companies/${companyId}/connections`, params);

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'integrationId', header: 'Integration ID' },
        { key: 'sourceId', header: 'Source ID' },
        { key: 'platformName', header: 'Platform' },
        { key: 'linkUrl', header: 'Link URL' },
        {
          key: 'status',
          header: 'Status',
          formatter: (v) => {
            const colors = {
              'Linked': chalk.green,
              'Unlinked': chalk.yellow,
              'Deauthorized': chalk.red,
              'PendingAuth': chalk.yellow
            };
            return (colors[v] || chalk.white)(v);
          }
        },
        { key: 'created', header: 'Created', formatter: (v) => new Date(v).toLocaleDateString() }
      ];

      formatOutput(data.results || [], { format: options.format, columns });
    });

  // Get connection details
  connections
    .command('get')
    .description('Get connection details')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, connectionId, options) => {
      const data = await get(`/companies/${companyId}/connections/${connectionId}`);
      formatOutput(data, { format: options.format });
    });

  // Create connection
  connections
    .command('create')
    .description('Create a new connection')
    .argument('<companyId>', 'Company ID')
    .option('-p, --platform-key <key>', 'Platform key (e.g., gbol for QuickBooks)', 'gbol')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, options) => {
      const data = await post(`/companies/${companyId}/connections`, {
        platformKey: options.platformKey
      }, {
        spinnerText: 'Creating connection...'
      });

      success('Connection created');
      console.log(chalk.yellow('\nNext steps:'));
      console.log(chalk.cyan('  1. Direct user to the linkUrl to authorize the connection'));
      console.log(chalk.cyan('  2. Monitor connection status with: codat connections get'));
      formatOutput(data, { format: options.format });
    });

  // Delete connection
  connections
    .command('delete')
    .alias('rm')
    .description('Delete a connection')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .action(async (companyId, connectionId) => {
      await del(`/companies/${companyId}/connections/${connectionId}`, {
        spinnerText: 'Deleting connection...'
      });

      success('Connection deleted');
    });

  // Unlink connection
  connections
    .command('unlink')
    .description('Unlink a connection (soft delete)')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .action(async (companyId, connectionId) => {
      await post(`/companies/${companyId}/connections/${connectionId}/unlink`, {}, {
        spinnerText: 'Unlinking connection...'
      });

      success('Connection unlinked');
    });
}
