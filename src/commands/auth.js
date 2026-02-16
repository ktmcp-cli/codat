/**
 * Authentication commands
 * Manage API credentials and authentication
 */

import chalk from 'chalk';
import {
  getApiKey,
  setApiKey,
  clearConfig,
  getAllConfig,
  getConfigPath,
  isConfigured
} from '../lib/config.js';
import { validateApiKeyFormat } from '../lib/auth.js';
import { info, success, error } from '../lib/output.js';

export function authCommand(program) {
  const auth = program
    .command('auth')
    .description('Manage authentication and API credentials');

  // Login command
  auth
    .command('login')
    .description('Set up API authentication')
    .argument('[apiKey]', 'Your Codat API key')
    .action((apiKey) => {
      if (!apiKey) {
        console.log(chalk.cyan('\nCodat API Authentication Setup'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log('\nTo get your API key:');
        console.log(chalk.yellow('  1. Go to https://app.codat.io/developers/api-keys'));
        console.log(chalk.yellow('  2. Create a new API key or copy an existing one'));
        console.log(chalk.yellow('  3. Run: codat auth login <your_api_key>'));
        console.log('\nAlternatively, set the CODAT_API_KEY environment variable.');
        return;
      }

      if (!validateApiKeyFormat(apiKey)) {
        error('Invalid API key format');
        console.log(chalk.gray('API key should be at least 20 characters long'));
        process.exit(1);
      }

      setApiKey(apiKey);
      success('API key saved successfully');
      console.log(chalk.gray(`Config location: ${getConfigPath()}`));
    });

  // Set key command (alias for login)
  auth
    .command('set-key')
    .description('Set API key')
    .argument('<apiKey>', 'Your Codat API key')
    .action((apiKey) => {
      if (!validateApiKeyFormat(apiKey)) {
        error('Invalid API key format');
        process.exit(1);
      }

      setApiKey(apiKey);
      success('API key saved successfully');
    });

  // Status command
  auth
    .command('status')
    .description('Show authentication status')
    .action(() => {
      console.log(chalk.cyan('\nAuthentication Status'));
      console.log(chalk.gray('─'.repeat(50)));

      const apiKey = getApiKey();
      const configured = isConfigured();

      if (configured) {
        console.log(chalk.green('✓'), 'Authenticated');
        console.log(chalk.gray('  API Key:'), maskApiKey(apiKey));
        console.log(chalk.gray('  Source:'), process.env.CODAT_API_KEY ? 'Environment' : 'Config file');
        console.log(chalk.gray('  Config:'), getConfigPath());
      } else {
        console.log(chalk.red('✗'), 'Not authenticated');
        console.log(chalk.yellow('\nPlease run: codat auth login'));
      }
    });

  // Logout command
  auth
    .command('logout')
    .description('Remove stored credentials')
    .action(() => {
      if (!isConfigured()) {
        info('No credentials to remove');
        return;
      }

      clearConfig();
      success('Credentials removed');
      console.log(chalk.gray('You can log in again with: codat auth login'));
    });

  // Config command
  auth
    .command('config')
    .description('Show all configuration settings')
    .action(() => {
      const config = getAllConfig();

      console.log(chalk.cyan('\nConfiguration'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.gray('Location:'), getConfigPath());
      console.log('\nSettings:');

      if (Object.keys(config).length === 0) {
        console.log(chalk.yellow('  No configuration set'));
      } else {
        for (const [key, value] of Object.entries(config)) {
          if (key === 'apiKey') {
            console.log(`  ${key}: ${maskApiKey(value)}`);
          } else {
            console.log(`  ${key}: ${value}`);
          }
        }
      }
    });
}

/**
 * Mask API key for display
 * @param {string} apiKey - API key to mask
 * @returns {string} Masked API key
 */
function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 8) {
    return '***';
  }
  const visible = 4;
  return apiKey.substring(0, visible) + '***' + apiKey.substring(apiKey.length - visible);
}
