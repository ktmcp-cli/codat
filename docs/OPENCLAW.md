# Codat CLI - OpenClaw Integration Guide

This guide explains how to integrate the Codat CLI with OpenClaw (Claude-based agent framework) for automated accounting workflows.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Usage Patterns](#usage-patterns)
5. [Example Workflows](#example-workflows)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

## Overview

OpenClaw agents can leverage the Codat CLI to:
- Access accounting data from multiple platforms
- Automate financial reporting
- Manage customer onboarding flows
- Perform reconciliation tasks
- Generate insights from financial data

The CLI provides a reliable, well-documented interface that OpenClaw agents can call directly via shell execution.

## Installation

### 1. Install Codat CLI

```bash
npm install -g @ktmcp-cli/codat
```

### 2. Verify Installation

```bash
codat --version
codat --help
```

### 3. Configure Authentication

Store API key as an environment variable in your OpenClaw configuration:

```yaml
# openclaw.yml
environment:
  CODAT_API_KEY: ${CODAT_API_KEY}
```

Or configure via CLI:

```bash
codat auth login YOUR_API_KEY
```

## Configuration

### Environment Variables

Set these in your OpenClaw agent environment:

```bash
# Required
export CODAT_API_KEY="your-api-key-here"

# Optional
export CODAT_BASE_URL="https://api.codat.io"  # Default
```

### OpenClaw Agent Configuration

Example agent configuration:

```yaml
# agent.yml
name: accounting-assistant
description: Automated accounting workflows with Codat

capabilities:
  - shell_execution
  - json_parsing
  - data_analysis

tools:
  - name: codat
    type: shell
    command: codat
    description: Codat Accounting API CLI

environment:
  CODAT_API_KEY: ${CODAT_API_KEY}

workflows:
  - name: customer_onboarding
    description: Connect new customer to accounting platform
    steps:
      - create_company
      - create_connection
      - verify_connection

  - name: financial_reporting
    description: Generate comprehensive financial reports
    steps:
      - fetch_balance_sheet
      - fetch_profit_loss
      - fetch_cash_flow
      - generate_report
```

## Usage Patterns

### Pattern 1: Execute Commands

OpenClaw agents can execute CLI commands directly:

```python
# Python example
import subprocess
import json

def list_companies():
    """List all companies using Codat CLI."""
    result = subprocess.run(
        ['codat', 'companies', 'list', '--format', 'json'],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        raise Exception(f"Command failed: {result.stderr}")

    return json.loads(result.stdout)
```

### Pattern 2: Parse JSON Output

Always use `--format json` for machine-readable output:

```python
def get_company_invoices(company_id, status=None):
    """Get invoices for a company, optionally filtered by status."""
    cmd = ['codat', 'invoices', 'list', company_id, '--format', 'json']

    if status:
        cmd.extend(['--query', f'status="{status}"'])

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        raise Exception(f"Failed to fetch invoices: {result.stderr}")

    return json.loads(result.stdout)
```

### Pattern 3: Handle Pagination

For large datasets, iterate through pages:

```python
def get_all_customers(company_id):
    """Fetch all customers across multiple pages."""
    page = 1
    all_customers = []

    while True:
        result = subprocess.run(
            ['codat', 'customers', 'list', company_id,
             '--page', str(page), '--page-size', '100',
             '--format', 'json'],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            break

        data = json.loads(result.stdout)
        if not data:
            break

        all_customers.extend(data)
        page += 1

    return all_customers
```

## Example Workflows

### Workflow 1: Customer Onboarding

```python
class CustomerOnboarding:
    """OpenClaw workflow for onboarding new customers."""

    def __init__(self, company_name, platform_key='gbol'):
        self.company_name = company_name
        self.platform_key = platform_key
        self.company_id = None
        self.connection_id = None

    def create_company(self):
        """Step 1: Create company record."""
        result = subprocess.run(
            ['codat', 'companies', 'create', self.company_name,
             '--format', 'json'],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"Failed to create company: {result.stderr}")

        data = json.loads(result.stdout)
        self.company_id = data['id']
        return self.company_id

    def create_connection(self):
        """Step 2: Create connection to accounting platform."""
        result = subprocess.run(
            ['codat', 'connections', 'create', self.company_id,
             '--platform-key', self.platform_key,
             '--format', 'json'],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"Failed to create connection: {result.stderr}")

        data = json.loads(result.stdout)
        self.connection_id = data['id']
        return data['linkUrl']

    def verify_connection(self, max_attempts=30, delay=5):
        """Step 3: Poll connection status until linked."""
        import time

        for attempt in range(max_attempts):
            result = subprocess.run(
                ['codat', 'connections', 'get',
                 self.company_id, self.connection_id,
                 '--format', 'json'],
                capture_output=True,
                text=True
            )

            if result.returncode == 0:
                data = json.loads(result.stdout)
                if data['status'] == 'Linked':
                    return True

            time.sleep(delay)

        return False

    def run(self):
        """Execute full onboarding workflow."""
        print(f"Creating company: {self.company_name}")
        company_id = self.create_company()
        print(f"Company created: {company_id}")

        print("Creating connection...")
        link_url = self.create_connection()
        print(f"Authorization URL: {link_url}")
        print("Please authorize the connection")

        print("Waiting for connection...")
        if self.verify_connection():
            print("Connection established!")
            return True
        else:
            print("Connection timeout")
            return False
```

### Workflow 2: Financial Analysis

```python
class FinancialAnalysis:
    """OpenClaw workflow for financial analysis."""

    def __init__(self, company_id):
        self.company_id = company_id

    def get_balance_sheet(self, periods=12):
        """Fetch balance sheet data."""
        result = subprocess.run(
            ['codat', 'reports', 'balance-sheet', self.company_id,
             '--period-length', '1',
             '--periods-to-compare', str(periods),
             '--format', 'json'],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"Failed to fetch balance sheet: {result.stderr}")

        return json.loads(result.stdout)

    def get_profit_loss(self, periods=12):
        """Fetch profit & loss data."""
        result = subprocess.run(
            ['codat', 'reports', 'profit-loss', self.company_id,
             '--period-length', '1',
             '--periods-to-compare', str(periods),
             '--format', 'json'],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"Failed to fetch P&L: {result.stderr}")

        return json.loads(result.stdout)

    def analyze_receivables(self):
        """Analyze aged receivables."""
        result = subprocess.run(
            ['codat', 'reports', 'aged-debtors', self.company_id,
             '--format', 'json'],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"Failed to fetch receivables: {result.stderr}")

        data = json.loads(result.stdout)

        # Calculate metrics
        total_outstanding = sum(item['amount'] for item in data['reports'])
        overdue = sum(item['amount'] for item in data['reports']
                     if item['periodStart'] > 30)

        return {
            'total_outstanding': total_outstanding,
            'overdue': overdue,
            'overdue_percentage': (overdue / total_outstanding * 100) if total_outstanding > 0 else 0
        }

    def generate_report(self):
        """Generate comprehensive financial report."""
        balance_sheet = self.get_balance_sheet()
        profit_loss = self.get_profit_loss()
        receivables = self.analyze_receivables()

        report = {
            'company_id': self.company_id,
            'report_date': datetime.now().isoformat(),
            'balance_sheet': balance_sheet,
            'profit_loss': profit_loss,
            'receivables': receivables,
            'summary': {
                'assets': balance_sheet.get('reportInfo', {}).get('netAssets'),
                'liabilities': balance_sheet.get('reportInfo', {}).get('netLiabilities'),
                'revenue': profit_loss.get('reportInfo', {}).get('grossProfit'),
                'expenses': profit_loss.get('reportInfo', {}).get('totalExpenses'),
                'net_income': profit_loss.get('reportInfo', {}).get('netIncome'),
                'outstanding_receivables': receivables['total_outstanding'],
                'overdue_receivables': receivables['overdue']
            }
        }

        return report
```

### Workflow 3: Invoice Management

```python
class InvoiceManager:
    """OpenClaw workflow for invoice management."""

    def __init__(self, company_id):
        self.company_id = company_id

    def get_unpaid_invoices(self):
        """Get all unpaid invoices."""
        result = subprocess.run(
            ['codat', 'invoices', 'list', self.company_id,
             '--query', 'status!="Paid"&&status!="Void"',
             '--format', 'json'],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"Failed to fetch invoices: {result.stderr}")

        return json.loads(result.stdout)

    def find_overdue_invoices(self):
        """Find invoices past their due date."""
        from datetime import date

        unpaid = self.get_unpaid_invoices()
        today = date.today().isoformat()

        overdue = [
            invoice for invoice in unpaid
            if invoice['dueDate'] < today
        ]

        return overdue

    def calculate_outstanding_total(self):
        """Calculate total outstanding invoice amount."""
        unpaid = self.get_unpaid_invoices()
        total = sum(invoice['totalAmount'] for invoice in unpaid)
        return total

    def generate_aging_report(self):
        """Generate invoice aging report."""
        from datetime import date, timedelta

        unpaid = self.get_unpaid_invoices()
        today = date.today()

        buckets = {
            'current': 0,
            '1-30': 0,
            '31-60': 0,
            '61-90': 0,
            '90+': 0
        }

        for invoice in unpaid:
            due_date = date.fromisoformat(invoice['dueDate'])
            days_overdue = (today - due_date).days

            if days_overdue <= 0:
                buckets['current'] += invoice['totalAmount']
            elif days_overdue <= 30:
                buckets['1-30'] += invoice['totalAmount']
            elif days_overdue <= 60:
                buckets['31-60'] += invoice['totalAmount']
            elif days_overdue <= 90:
                buckets['61-90'] += invoice['totalAmount']
            else:
                buckets['90+'] += invoice['totalAmount']

        return buckets
```

### Workflow 4: Data Synchronization

```python
class DataSync:
    """OpenClaw workflow for data synchronization."""

    def __init__(self, company_id, connection_id):
        self.company_id = company_id
        self.connection_id = connection_id

    def sync_customers(self, local_customers):
        """Sync local customer database with Codat."""
        # Get customers from Codat
        result = subprocess.run(
            ['codat', 'customers', 'list', self.company_id,
             '--format', 'json'],
            capture_output=True,
            text=True
        )

        codat_customers = json.loads(result.stdout)

        # Build lookup by email
        codat_by_email = {
            c['emailAddress']: c
            for c in codat_customers
            if c.get('emailAddress')
        }

        # Sync each local customer
        for customer in local_customers:
            if customer['email'] in codat_by_email:
                # Customer exists, update if needed
                codat_customer = codat_by_email[customer['email']]
                if self._needs_update(customer, codat_customer):
                    self._update_customer(codat_customer['id'], customer)
            else:
                # Create new customer
                self._create_customer(customer)

    def _needs_update(self, local, remote):
        """Check if customer needs updating."""
        return (
            local['name'] != remote.get('customerName') or
            local['phone'] != remote.get('phone')
        )

    def _create_customer(self, customer):
        """Create customer in Codat."""
        result = subprocess.run(
            ['codat', 'customers', 'create',
             self.company_id, self.connection_id,
             '--name', customer['name'],
             '--email', customer['email'],
             '--phone', customer.get('phone', ''),
             '--format', 'json'],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            print(f"Failed to create customer: {result.stderr}")
            return None

        return json.loads(result.stdout)

    def _update_customer(self, customer_id, customer):
        """Update customer in Codat."""
        result = subprocess.run(
            ['codat', 'customers', 'update',
             self.company_id, self.connection_id, customer_id,
             '--name', customer['name'],
             '--phone', customer.get('phone', ''),
             '--format', 'json'],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            print(f"Failed to update customer: {result.stderr}")
            return None

        return json.loads(result.stdout)
```

## Error Handling

### Retry Logic

```python
import time

def retry_command(cmd, max_attempts=3, backoff=2):
    """Retry CLI command with exponential backoff."""
    for attempt in range(max_attempts):
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            return result.stdout

        # Parse error
        if '429' in result.stderr:
            # Rate limited
            wait_time = backoff ** attempt
            print(f"Rate limited. Waiting {wait_time}s...")
            time.sleep(wait_time)
        elif '401' in result.stderr:
            # Auth error - don't retry
            raise Exception("Authentication failed")
        else:
            # Other error - retry
            if attempt < max_attempts - 1:
                time.sleep(backoff)

    raise Exception(f"Command failed after {max_attempts} attempts")
```

### Error Classification

```python
class CodatError(Exception):
    """Base exception for Codat CLI errors."""
    pass

class AuthenticationError(CodatError):
    """Authentication failed."""
    pass

class NotFoundError(CodatError):
    """Resource not found."""
    pass

class RateLimitError(CodatError):
    """Rate limit exceeded."""
    pass

def execute_command(cmd):
    """Execute command with proper error handling."""
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        stderr = result.stderr

        if '401' in stderr:
            raise AuthenticationError("Invalid API key")
        elif '404' in stderr:
            raise NotFoundError("Resource not found")
        elif '429' in stderr:
            raise RateLimitError("Rate limit exceeded")
        else:
            raise CodatError(f"Command failed: {stderr}")

    return result.stdout
```

## Best Practices

### 1. Cache Configuration

```python
class CodatClient:
    """Singleton Codat client with cached configuration."""

    _instance = None
    _config = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._load_config()
        return cls._instance

    @classmethod
    def _load_config(cls):
        """Load and cache configuration."""
        result = subprocess.run(
            ['codat', 'auth', 'status'],
            capture_output=True,
            text=True
        )
        cls._config = {
            'authenticated': result.returncode == 0
        }
```

### 2. Use Type Hints

```python
from typing import List, Dict, Optional

def get_invoices(
    company_id: str,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 100
) -> List[Dict]:
    """Get invoices with type hints."""
    # Implementation
    pass
```

### 3. Validate Inputs

```python
def validate_company_id(company_id: str) -> bool:
    """Validate company ID format."""
    import re
    return bool(re.match(r'^[a-f0-9-]+$', company_id))

def get_company(company_id: str):
    """Get company with validation."""
    if not validate_company_id(company_id):
        raise ValueError(f"Invalid company ID: {company_id}")

    # Execute command
    pass
```

### 4. Log All Operations

```python
import logging

logger = logging.getLogger('codat_cli')

def execute_with_logging(cmd):
    """Execute command with detailed logging."""
    logger.info(f"Executing: {' '.join(cmd)}")

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode == 0:
        logger.info("Command successful")
    else:
        logger.error(f"Command failed: {result.stderr}")

    return result
```

### 5. Use Context Managers

```python
class CodatSession:
    """Context manager for Codat CLI operations."""

    def __init__(self, company_id):
        self.company_id = company_id

    def __enter__(self):
        # Verify connection
        self._verify_connection()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Cleanup if needed
        pass

    def _verify_connection(self):
        result = subprocess.run(
            ['codat', 'companies', 'get', self.company_id],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            raise Exception("Company not found")

# Usage
with CodatSession('company-123') as session:
    # Perform operations
    pass
```

## Resources

- [OpenClaw Documentation](#)
- [Codat API Reference](https://docs.codat.io/accounting-api)
- [CLI Agent Guide](./AGENT.md)
- [Main README](../README.md)

---

This guide provides integration patterns for OpenClaw agents using the Codat CLI. For general AI agent patterns, see [AGENT.md](./AGENT.md).
