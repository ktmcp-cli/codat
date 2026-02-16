/**
 * Customers commands
 * Manage customer records
 */

import { get, post, put } from '../lib/api.js';
import { formatOutput, success } from '../lib/output.js';
import chalk from 'chalk';

export function customersCommand(program) {
  const customers = program
    .command('customers')
    .alias('customer')
    .description('Manage customers');

  // List customers
  customers
    .command('list')
    .alias('ls')
    .description('List customers for a company')
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

      const data = await get(`/companies/${companyId}/data/customers`, params);

      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'customerName', header: 'Name' },
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

  // Get customer by ID
  customers
    .command('get')
    .description('Get customer details')
    .argument('<companyId>', 'Company ID')
    .argument('<customerId>', 'Customer ID')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, customerId, options) => {
      const data = await get(`/companies/${companyId}/data/customers/${customerId}`);
      formatOutput(data, { format: options.format });
    });

  // Create customer
  customers
    .command('create')
    .description('Create a new customer')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .requiredOption('-n, --name <name>', 'Customer name')
    .option('--contact-name <name>', 'Contact name')
    .option('--email <email>', 'Email address')
    .option('--phone <phone>', 'Phone number')
    .option('--address <json>', 'Address as JSON object')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, connectionId, options) => {
      const payload = {
        customerName: options.name
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
        `/companies/${companyId}/connections/${connectionId}/push/customers`,
        payload,
        { spinnerText: 'Creating customer...' }
      );

      success('Customer created');
      formatOutput(data, { format: options.format });
    });

  // Update customer
  customers
    .command('update')
    .description('Update a customer')
    .argument('<companyId>', 'Company ID')
    .argument('<connectionId>', 'Connection ID')
    .argument('<customerId>', 'Customer ID')
    .option('-n, --name <name>', 'Customer name')
    .option('--contact-name <name>', 'Contact name')
    .option('--email <email>', 'Email address')
    .option('--phone <phone>', 'Phone number')
    .option('-f, --format <format>', 'Output format (table, json, compact)', 'json')
    .action(async (companyId, connectionId, customerId, options) => {
      const payload = {};

      if (options.name) payload.customerName = options.name;
      if (options.contactName) payload.contactName = options.contactName;
      if (options.email) payload.emailAddress = options.email;
      if (options.phone) payload.phone = options.phone;

      if (Object.keys(payload).length === 0) {
        console.error(chalk.red('Error: No fields to update'));
        process.exit(1);
      }

      const data = await put(
        `/companies/${companyId}/connections/${connectionId}/push/customers/${customerId}`,
        payload,
        { spinnerText: 'Updating customer...' }
      );

      success('Customer updated');
      formatOutput(data, { format: options.format });
    });
}
