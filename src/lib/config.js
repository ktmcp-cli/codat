/**
 * Configuration management for Codat CLI
 * Handles API credentials and user preferences
 */

import Conf from 'conf';

const config = new Conf({
  projectName: 'codat-cli',
  schema: {
    apiKey: {
      type: 'string',
      description: 'Codat API key for authentication'
    },
    baseUrl: {
      type: 'string',
      default: 'https://api.codat.io',
      description: 'Base URL for Codat API'
    },
    defaultPageSize: {
      type: 'number',
      default: 100,
      description: 'Default page size for list operations'
    },
    outputFormat: {
      type: 'string',
      default: 'table',
      enum: ['table', 'json', 'compact'],
      description: 'Default output format'
    }
  }
});

/**
 * Get API key from config or environment
 * @returns {string|null} API key or null if not set
 */
export function getApiKey() {
  return config.get('apiKey') || process.env.CODAT_API_KEY || null;
}

/**
 * Set API key in config
 * @param {string} apiKey - The API key to store
 */
export function setApiKey(apiKey) {
  config.set('apiKey', apiKey);
}

/**
 * Get base URL for API requests
 * @returns {string} Base URL
 */
export function getBaseUrl() {
  return config.get('baseUrl') || 'https://api.codat.io';
}

/**
 * Set base URL (useful for testing or custom deployments)
 * @param {string} url - Base URL to use
 */
export function setBaseUrl(url) {
  config.set('baseUrl', url);
}

/**
 * Get default page size
 * @returns {number} Page size
 */
export function getDefaultPageSize() {
  return config.get('defaultPageSize') || 100;
}

/**
 * Set default page size
 * @param {number} size - Page size to use
 */
export function setDefaultPageSize(size) {
  config.set('defaultPageSize', size);
}

/**
 * Get output format preference
 * @returns {string} Output format (table, json, compact)
 */
export function getOutputFormat() {
  return config.get('outputFormat') || 'table';
}

/**
 * Set output format preference
 * @param {string} format - Output format to use
 */
export function setOutputFormat(format) {
  if (!['table', 'json', 'compact'].includes(format)) {
    throw new Error('Invalid output format. Must be: table, json, or compact');
  }
  config.set('outputFormat', format);
}

/**
 * Check if API key is configured
 * @returns {boolean} True if API key is set
 */
export function isConfigured() {
  return !!getApiKey();
}

/**
 * Clear all configuration
 */
export function clearConfig() {
  config.clear();
}

/**
 * Get all configuration
 * @returns {object} Configuration object
 */
export function getAllConfig() {
  return config.store;
}

/**
 * Get config file path
 * @returns {string} Path to config file
 */
export function getConfigPath() {
  return config.path;
}

export default config;
