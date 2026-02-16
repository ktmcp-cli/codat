/**
 * Output formatting utilities
 * Handles table, JSON, and compact output formats
 */

import { table } from 'table';
import chalk from 'chalk';
import { getOutputFormat } from './config.js';

/**
 * Format output based on user preference or explicit format
 * @param {Array|Object} data - Data to format
 * @param {Object} options - Formatting options
 */
export function formatOutput(data, options = {}) {
  const format = options.format || getOutputFormat();

  if (format === 'json') {
    outputJson(data, options);
  } else if (format === 'compact') {
    outputCompact(data, options);
  } else {
    outputTable(data, options);
  }
}

/**
 * Output data as JSON
 * @param {*} data - Data to output
 * @param {Object} options - Options (pretty)
 */
export function outputJson(data, options = {}) {
  const { pretty = true } = options;
  console.log(JSON.stringify(data, null, pretty ? 2 : 0));
}

/**
 * Output data in compact format (one line per item)
 * @param {Array|Object} data - Data to output
 * @param {Object} options - Options (fields)
 */
export function outputCompact(data, options = {}) {
  const { fields } = options;
  const items = Array.isArray(data) ? data : [data];

  items.forEach(item => {
    if (fields) {
      const parts = fields.map(field => {
        const value = getNestedValue(item, field);
        return `${field}=${value}`;
      });
      console.log(parts.join(' '));
    } else {
      console.log(JSON.stringify(item));
    }
  });
}

/**
 * Output data as a formatted table
 * @param {Array|Object} data - Data to output
 * @param {Object} options - Options (columns, title)
 */
export function outputTable(data, options = {}) {
  const { columns, title } = options;

  if (!data) {
    console.log(chalk.yellow('No data to display'));
    return;
  }

  const items = Array.isArray(data) ? data : [data];

  if (items.length === 0) {
    console.log(chalk.yellow('No results found'));
    return;
  }

  // If columns not specified, infer from first item
  const tableColumns = columns || inferColumns(items[0]);

  // Build table data
  const tableData = [
    // Header row
    tableColumns.map(col => chalk.bold.cyan(typeof col === 'string' ? col : col.header))
  ];

  // Data rows
  items.forEach(item => {
    const row = tableColumns.map(col => {
      const key = typeof col === 'string' ? col : col.key;
      const formatter = typeof col === 'object' ? col.formatter : null;
      const value = getNestedValue(item, key);

      if (formatter) {
        return formatter(value, item);
      }

      return formatValue(value);
    });
    tableData.push(row);
  });

  // Print title if provided
  if (title) {
    console.log(chalk.bold.white(`\n${title}`));
  }

  // Output table
  console.log(table(tableData, {
    border: {
      topBody: '─',
      topJoin: '┬',
      topLeft: '┌',
      topRight: '┐',
      bottomBody: '─',
      bottomJoin: '┴',
      bottomLeft: '└',
      bottomRight: '┘',
      bodyLeft: '│',
      bodyRight: '│',
      bodyJoin: '│',
      joinBody: '─',
      joinLeft: '├',
      joinRight: '┤',
      joinJoin: '┼'
    }
  }));

  // Show count
  console.log(chalk.gray(`${items.length} result${items.length !== 1 ? 's' : ''}`));
}

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to search
 * @param {string} path - Dot notation path (e.g., 'user.name')
 * @returns {*} Value or undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Infer columns from object keys
 * @param {Object} obj - Object to infer from
 * @returns {Array<string>} Column keys
 */
function inferColumns(obj) {
  if (!obj || typeof obj !== 'object') {
    return ['value'];
  }

  // Get top-level keys, exclude complex objects
  return Object.keys(obj).filter(key => {
    const value = obj[key];
    return value === null || value === undefined ||
           typeof value !== 'object' ||
           Array.isArray(value);
  });
}

/**
 * Format value for display
 * @param {*} value - Value to format
 * @returns {string} Formatted value
 */
function formatValue(value) {
  if (value === null || value === undefined) {
    return chalk.gray('—');
  }

  if (typeof value === 'boolean') {
    return value ? chalk.green('✓') : chalk.red('✗');
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? `[${value.length} items]` : chalk.gray('[]');
  }

  if (typeof value === 'object') {
    return chalk.gray('[object]');
  }

  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 47) + '...';
  }

  return String(value);
}

/**
 * Output success message
 * @param {string} message - Message to display
 */
export function success(message) {
  console.log(chalk.green('✓'), message);
}

/**
 * Output error message
 * @param {string} message - Message to display
 */
export function error(message) {
  console.error(chalk.red('✗'), message);
}

/**
 * Output warning message
 * @param {string} message - Message to display
 */
export function warning(message) {
  console.log(chalk.yellow('⚠'), message);
}

/**
 * Output info message
 * @param {string} message - Message to display
 */
export function info(message) {
  console.log(chalk.blue('ℹ'), message);
}

export default {
  formatOutput,
  outputJson,
  outputCompact,
  outputTable,
  success,
  error,
  warning,
  info
};
