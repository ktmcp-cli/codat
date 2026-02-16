/**
 * Core API client for Codat Accounting API
 * Handles HTTP requests, error handling, and response formatting
 */

import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';
import { getBaseUrl } from './config.js';
import { getAuthHeaders } from './auth.js';

/**
 * Create an axios instance with default configuration
 */
function createClient() {
  return axios.create({
    baseURL: getBaseUrl(),
    timeout: 30000,
    headers: getAuthHeaders()
  });
}

/**
 * Handle API errors consistently
 * @param {Error} error - Axios error object
 */
function handleApiError(error) {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    switch (status) {
      case 400:
        console.error(chalk.red('Bad Request:'), data.message || data.error || 'Invalid request parameters');
        break;
      case 401:
        console.error(chalk.red('Unauthorized:'), 'Invalid API key or authentication failed');
        console.error(chalk.yellow('Hint: Check your API key with'), chalk.cyan('codat auth status'));
        break;
      case 403:
        console.error(chalk.red('Forbidden:'), 'You do not have permission to access this resource');
        break;
      case 404:
        console.error(chalk.red('Not Found:'), 'Resource not found');
        break;
      case 429:
        console.error(chalk.red('Rate Limited:'), 'Too many requests. Please try again later.');
        if (data['Retry-After']) {
          console.error(chalk.yellow(`Retry after: ${data['Retry-After']} seconds`));
        }
        break;
      case 500:
      case 502:
      case 503:
        console.error(chalk.red('Server Error:'), 'Codat API is experiencing issues');
        console.error(chalk.yellow('Please try again later'));
        break;
      default:
        console.error(chalk.red(`HTTP ${status}:`), data.message || data.error || 'Unknown error');
    }

    // Show detailed error if available
    if (data.details || data.validation) {
      console.error(chalk.gray('\nDetails:'), JSON.stringify(data.details || data.validation, null, 2));
    }
  } else if (error.request) {
    // Request made but no response received
    console.error(chalk.red('Network Error:'), 'No response from server');
    console.error(chalk.yellow('Check your internet connection and try again'));
  } else {
    // Error setting up request
    console.error(chalk.red('Error:'), error.message);
  }

  process.exit(1);
}

/**
 * Make a GET request to the API
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @param {Object} options - Additional options (showSpinner, spinnerText)
 * @returns {Promise<Object>} Response data
 */
export async function get(endpoint, params = {}, options = {}) {
  const { showSpinner = true, spinnerText = 'Fetching data...' } = options;
  const spinner = showSpinner ? ora(spinnerText).start() : null;

  try {
    const client = createClient();
    const response = await client.get(endpoint, { params });

    if (spinner) spinner.succeed('Done');
    return response.data;
  } catch (error) {
    if (spinner) spinner.fail('Request failed');
    handleApiError(error);
  }
}

/**
 * Make a POST request to the API
 * @param {string} endpoint - API endpoint path
 * @param {Object} data - Request body
 * @param {Object} options - Additional options (showSpinner, spinnerText)
 * @returns {Promise<Object>} Response data
 */
export async function post(endpoint, data = {}, options = {}) {
  const { showSpinner = true, spinnerText = 'Creating resource...' } = options;
  const spinner = showSpinner ? ora(spinnerText).start() : null;

  try {
    const client = createClient();
    const response = await client.post(endpoint, data);

    if (spinner) spinner.succeed('Done');
    return response.data;
  } catch (error) {
    if (spinner) spinner.fail('Request failed');
    handleApiError(error);
  }
}

/**
 * Make a PUT request to the API
 * @param {string} endpoint - API endpoint path
 * @param {Object} data - Request body
 * @param {Object} options - Additional options (showSpinner, spinnerText)
 * @returns {Promise<Object>} Response data
 */
export async function put(endpoint, data = {}, options = {}) {
  const { showSpinner = true, spinnerText = 'Updating resource...' } = options;
  const spinner = showSpinner ? ora(spinnerText).start() : null;

  try {
    const client = createClient();
    const response = await client.put(endpoint, data);

    if (spinner) spinner.succeed('Done');
    return response.data;
  } catch (error) {
    if (spinner) spinner.fail('Request failed');
    handleApiError(error);
  }
}

/**
 * Make a DELETE request to the API
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Additional options (showSpinner, spinnerText)
 * @returns {Promise<Object>} Response data
 */
export async function del(endpoint, options = {}) {
  const { showSpinner = true, spinnerText = 'Deleting resource...' } = options;
  const spinner = showSpinner ? ora(spinnerText).start() : null;

  try {
    const client = createClient();
    const response = await client.delete(endpoint);

    if (spinner) spinner.succeed('Done');
    return response.data;
  } catch (error) {
    if (spinner) spinner.fail('Request failed');
    handleApiError(error);
  }
}

/**
 * Fetch all pages of a paginated endpoint
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} All results combined
 */
export async function getAllPages(endpoint, params = {}, options = {}) {
  const { showSpinner = true, maxPages = 10 } = options;
  const spinner = showSpinner ? ora('Fetching all pages...').start() : null;

  const allResults = [];
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore && page <= maxPages) {
      const client = createClient();
      const response = await client.get(endpoint, {
        params: { ...params, page, pageSize: params.pageSize || 100 }
      });

      const data = response.data;
      allResults.push(...(data.results || []));

      if (spinner) {
        spinner.text = `Fetching page ${page}... (${allResults.length} items)`;
      }

      // Check if there are more pages
      hasMore = data._links?.next?.href != null;
      page++;
    }

    if (spinner) spinner.succeed(`Fetched ${allResults.length} items`);
    return allResults;
  } catch (error) {
    if (spinner) spinner.fail('Request failed');
    handleApiError(error);
  }
}

/**
 * Build query string from filter object
 * @param {Object} filters - Filter object
 * @returns {string} Query string
 */
export function buildQuery(filters) {
  if (!filters || Object.keys(filters).length === 0) {
    return '';
  }

  const conditions = [];
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'string') {
        conditions.push(`${key}="${value}"`);
      } else {
        conditions.push(`${key}=${value}`);
      }
    }
  }

  return conditions.join('&&');
}

export default {
  get,
  post,
  put,
  del,
  getAllPages,
  buildQuery
};
