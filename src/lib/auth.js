/**
 * Authentication utilities for Codat API
 * Handles API key validation and header generation
 */

import { getApiKey } from './config.js';
import chalk from 'chalk';

/**
 * Validate that API key is configured
 * @throws {Error} If API key is not configured
 */
export function requireAuth() {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error(chalk.red('Error: API key not configured'));
    console.error(chalk.yellow('\nPlease set your API key using one of these methods:'));
    console.error(chalk.cyan('  1. codat auth login'));
    console.error(chalk.cyan('  2. export CODAT_API_KEY=your_api_key'));
    console.error(chalk.cyan('  3. codat auth set-key <your_api_key>'));
    console.error(chalk.gray('\nGet your API key from: https://app.codat.io/developers/api-keys'));
    process.exit(1);
  }

  return apiKey;
}

/**
 * Get authentication headers for API requests
 * @returns {Object} Headers object with Authorization
 */
export function getAuthHeaders() {
  const apiKey = requireAuth();

  return {
    'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

/**
 * Get optional authentication headers (doesn't exit if not configured)
 * @returns {Object|null} Headers object or null if not configured
 */
export function getOptionalAuthHeaders() {
  const apiKey = getApiKey();

  if (!apiKey) {
    return null;
  }

  return {
    'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if format appears valid
 */
export function validateApiKeyFormat(apiKey) {
  // Codat API keys are typically UUIDs or similar format
  // Basic validation - not empty and reasonable length
  return apiKey && typeof apiKey === 'string' && apiKey.length >= 20;
}
