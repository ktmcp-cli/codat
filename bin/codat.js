#!/usr/bin/env node

const { showWelcomeMessage } = require('../src/lib/welcome');
showWelcomeMessage('codat');

/**
 * Codat Accounting API CLI
 * Main entry point for the command-line interface
 */

import { program } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Import command modules
import { authCommand } from '../src/commands/auth.js';
import { companiesCommand } from '../src/commands/companies.js';
import { connectionsCommand } from '../src/commands/connections.js';
import { accountsCommand } from '../src/commands/accounts.js';
import { invoicesCommand } from '../src/commands/invoices.js';
import { customersCommand } from '../src/commands/customers.js';
import { billsCommand } from '../src/commands/bills.js';
import { suppliersCommand } from '../src/commands/suppliers.js';
import { paymentsCommand } from '../src/commands/payments.js';
import { journalsCommand } from '../src/commands/journals.js';
import { reportsCommand } from '../src/commands/reports.js';
import { bankAccountsCommand } from '../src/commands/bank-accounts.js';
import { taxRatesCommand } from '../src/commands/tax-rates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8')
);

program
  .name('codat')
  .description('CLI for Codat Accounting API - unified accounting data from 20+ platforms')
  .version(packageJson.version);

// Register commands
authCommand(program);
companiesCommand(program);
connectionsCommand(program);
accountsCommand(program);
invoicesCommand(program);
customersCommand(program);
billsCommand(program);
suppliersCommand(program);
paymentsCommand(program);
journalsCommand(program);
reportsCommand(program);
bankAccountsCommand(program);
taxRatesCommand(program);

// Parse arguments
program.parse(process.argv);

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
