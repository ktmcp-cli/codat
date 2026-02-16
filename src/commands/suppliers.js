/**
 * Suppliers commands
 * Manage supplier records
 */

import { get, post, put } from '../lib/api.js';
import { formatOutput, success } from '../lib/output.js';
import chalk from 'chalk';

export function suppliersCommand(program) {
  const suppliers = program
    .command('suppliers')
    .alias('supplier')
    .description('Manage suppliers');

  // List suppliers
  suppliers
    .command('list')
    .alias('ls')
    .description('List suppliers for a company')
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

      const data = await get(`/companies/${companyId}/data/suppliers`, params);

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'supplierName', header: 'Name' },
        { key: 'contactName', header: 'Contact' },
        { key: 'emailAddress', header: 'Email' },
        { key: 'phone', header: 'Phone' },
        {
          key: 'status',
          header: 'Status',
          formatter: (v) => v === 'Active' ? chalk.green(v) : chalk.gray(v)
        }
      ];

      formatOutput(data.results || [], { format: options.format, columns });
    });

  // Get supplier by ID
  suppliers
    .command('get')
    .description('Get supplier details')
    .argument('<companyId>', 'Company ID')
    .argument('<supplierId>', 'Supplier ID')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, supplierId, options) => {
      const data = await get(`/companies/${companyId}/data/suppliers/${supplierId}`);
      formatOutput(data, { format: options.format });
    });

  // Create supplier
  suppliers
    .command('create')
    .description('Create a new supplier')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .requiredOption('-n, --name <name>', 'Supplier name')
    .option('--contact-name <name>', 'Contact name')
    .option('--email <email>', 'Email address')
    .option('--phone <phone>', 'Phone number')
    .option('--address <json>', 'Address as JSON object')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, connectionId, options) => {
      const payload = {
        supplierName: options.name
      };

      if (options.contactName) payload.contactName = options.contactName;
      if (options.email) payload.emailAddress = options.email;
      if (options.phone) payload.phone = options.phone;

      if (options.address) {
        try {
          payload.addresses = [JSON.parse(options.address)];
        } catch (e) {
          console.error(chalk.red('Error: Invalid JSON for address'));
          process.exit(1);
        }
      }

      const data = await post(
        `/companies/${companyId}/connections/${connectionId}/push/suppliers`,
        payload,
        { spinnerText: 'Creating supplier...' }
      );

      success('Supplier created');
      formatOutput(data, { format: options.format });
    });

  // Update supplier
  suppliers
    .command('update')
    .description('Update a supplier')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .argument('<supplierId>', 'Supplier ID')
    .option('-n, --name <name>', 'Supplier name')
    .option('--contact-name <name>', 'Contact name')
    .option('--email <email>', 'Email address')
    .option('--phone <phone>', 'Phone number')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, connectionId, supplierId, options) => {
      const payload = {};

      if (options.name) payload.supplierName = options.name;
      if (options.contactName) payload.contactName = options.contactName;
      if (options.email) payload.emailAddress = options.email;
      if (options.phone) payload.phone = options.phone;

      if (Object.keys(payload).length === 0) {
        console.error(chalk.red('Error: No fields to update'));
        process.exit(1);
      }

      const data = await put(
        `/companies/${companyId}/connections/${connectionId}/push/suppliers/${supplierId}`,
        payload,
        { spinnerText: 'Updating supplier...' }
      );

      success('Supplier updated');
      formatOutput(data, { format: options.format });
    });
}
