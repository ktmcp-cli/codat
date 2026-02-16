/**
 * Companies commands
 * Manage companies (customer records) in Codat
 */

import { get, post, put, del } from '../lib/api.js';
import { formatOutput, success } from '../lib/output.js';

export function companiesCommand(program) {
  const companies = program
    .command('companies')
    .alias('company')
    .description('Manage companies (customer records)');

  // List companies
  companies
    .command('list')
    .alias('ls')
    .description('List all companies')
    .option('-p, --page <number>', 'Page number', '1')
    .option('-s, --page-size <number>', 'Page size', '100')
    .option('-q, --query <string>', 'Filter query')
    .option('-o, --order-by <string>', 'Order by field')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'table')
    .action(async (options) => {
      const params = {
        page: parseInt(options.page),
        pageSize: parseInt(options.pageSize)
      };

      if (options.query) params.query = options.query;
      if (options.orderBy) params.orderBy = options.orderBy;

      const data = await get('/companies', params);

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        { key: 'platform', header: 'Platform' },
        { key: 'dataConnections', header: 'Connections', formatter: (v) => v?.length || 0 },
        { key: 'created', header: 'Created', formatter: (v) => v ? new Date(v).toLocaleDateString() : '—' }
      ];

      formatOutput(data.results || [], { format: options.format, columns });
    });

  // Get company by ID
  companies
    .command('get')
    .description('Get company details')
    .argument('<companyId>', 'Company ID')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, options) => {
      const data = await get(`/companies/${companyId}`);
      formatOutput(data, { format: options.format });
    });

  // Create company
  companies
    .command('create')
    .description('Create a new company')
    .argument('<name>', 'Company name')
    .option('-d, --description <text>', 'Company description')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (name, options) => {
      const payload = { name };
      if (options.description) payload.description = options.description;

      const data = await post('/companies', payload, {
        spinnerText: 'Creating company...'
      });

      success(`Company created: ${data.id}`);
      formatOutput(data, { format: options.format });
    });

  // Update company
  companies
    .command('update')
    .description('Update company details')
    .argument('<companyId>', 'Company ID')
    .option('-n, --name <name>', 'Company name')
    .option('-d, --description <text>', 'Company description')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, options) => {
      const payload = {};
      if (options.name) payload.name = options.name;
      if (options.description) payload.description = options.description;

      if (Object.keys(payload).length === 0) {
        console.error('Error: No fields to update');
        process.exit(1);
      }

      const data = await put(`/companies/${companyId}`, payload, {
        spinnerText: 'Updating company...'
      });

      success('Company updated');
      formatOutput(data, { format: options.format });
    });

  // Delete company
  companies
    .command('delete')
    .alias('rm')
    .description('Delete a company')
    .argument('<companyId>', 'Company ID')
    .action(async (companyId) => {
      await del(`/companies/${companyId}`, {
        spinnerText: 'Deleting company...'
      });

      success('Company deleted');
    });
}
