# Codat CLI - AI Agent Usage Guide

This guide provides patterns and best practices for AI agents (like Claude, GPT-4, etc.) to effectively use the Codat CLI.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Authentication Patterns](#authentication-patterns)
3. [Common Workflows](#common-workflows)
4. [Output Processing](#output-processing)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

## Quick Reference

### Essential Commands

```bash
# Authentication
codat auth login <api-key>
codat auth status

# Core Resources
codat companies list
codat connections list <company-id>
codat invoices list <company-id>
codat customers list <company-id>
codat bills list <company-id>
codat suppliers list <company-id>
codat accounts list <company-id>
codat payments list <company-id>

# Reports
codat reports balance-sheet <company-id> --period-length 1 --periods-to-compare 12
codat reports profit-loss <company-id> --period-length 1 --periods-to-compare 12
```

### Output Formats

- `--format table` - Human-readable (default)
- `--format json` - Machine-readable, parse with `jq`
- `--format compact` - One line per item

## Authentication Patterns

### Pattern 1: Check Authentication First

Always verify authentication before running commands:

```bash
# Check if authenticated
if codat auth status 2>&1 | grep -q "Authenticated"; then
  # Proceed with commands
  codat companies list
else
  # Request API key
  echo "Please provide your Codat API key"
fi
```

### Pattern 2: Use Environment Variables

For temporary sessions, prefer environment variables:

```bash
export CODAT_API_KEY="your-api-key"
codat companies list
```

### Pattern 3: Secure Key Storage

For persistent usage, store securely:

```bash
codat auth login "$API_KEY"
# Key is now stored in ~/.config/codat-cli/
```

## Common Workflows

### Workflow 1: Customer Onboarding

Connect a new customer to their accounting platform:

```bash
# Step 1: Create company
COMPANY_ID=$(codat companies create "Customer Name" --format json | jq -r '.id')

# Step 2: Create connection (e.g., QuickBooks)
CONNECTION_DATA=$(codat connections create "$COMPANY_ID" --platform-key gbol --format json)
LINK_URL=$(echo "$CONNECTION_DATA" | jq -r '.linkUrl')

# Step 3: Present linkUrl to customer
echo "Please authorize at: $LINK_URL"

# Step 4: Poll connection status
while true; do
  STATUS=$(codat connections get "$COMPANY_ID" "$CONNECTION_ID" --format json | jq -r '.status')
  if [ "$STATUS" = "Linked" ]; then
    echo "Connection successful!"
    break
  fi
  sleep 5
done
```

### Workflow 2: Invoice Analysis

Analyze outstanding invoices:

```bash
COMPANY_ID="company-123"

# Get all unpaid invoices
UNPAID=$(codat invoices list "$COMPANY_ID" \
  --query 'status!="Paid"&&status!="Void"' \
  --format json)

# Calculate total outstanding
TOTAL=$(echo "$UNPAID" | jq '[.[].totalAmount] | add')

# Find overdue invoices (due date < today)
TODAY=$(date +%Y-%m-%d)
OVERDUE=$(echo "$UNPAID" | jq --arg today "$TODAY" \
  '[.[] | select(.dueDate < $today)]')

# Generate report
echo "Outstanding invoices: $(echo "$UNPAID" | jq 'length')"
echo "Total outstanding: $TOTAL"
echo "Overdue invoices: $(echo "$OVERDUE" | jq 'length')"
```

### Workflow 3: Financial Report Generation

Create a comprehensive financial report:

```bash
COMPANY_ID="company-123"
REPORT_DATE=$(date +%Y-%m-%d)

echo "=== Financial Report for $REPORT_DATE ==="

# Balance Sheet
echo -e "\n## Balance Sheet"
codat reports balance-sheet "$COMPANY_ID" \
  --period-length 1 \
  --periods-to-compare 3 \
  --format json | jq '{
    date: .reportDate,
    assets: .reportInfo.netAssets,
    liabilities: .reportInfo.netLiabilities,
    equity: .reportInfo.netEquity
  }'

# Profit & Loss
echo -e "\n## Profit & Loss"
codat reports profit-loss "$COMPANY_ID" \
  --period-length 1 \
  --periods-to-compare 3 \
  --format json | jq '{
    date: .reportDate,
    revenue: .reportInfo.grossProfit,
    expenses: .reportInfo.totalExpenses,
    netIncome: .reportInfo.netIncome
  }'

# Cash Flow
echo -e "\n## Cash Flow"
codat reports cash-flow "$COMPANY_ID" \
  --period-length 1 \
  --periods-to-compare 3 \
  --format json | jq '{
    date: .reportDate,
    operating: .reportInfo.operatingActivities,
    investing: .reportInfo.investingActivities,
    financing: .reportInfo.financingActivities
  }'
```

### Workflow 4: Bulk Customer Creation

Import multiple customers:

```bash
COMPANY_ID="company-123"
CONNECTION_ID="connection-456"

# Read from CSV (name,email,phone)
while IFS=, read -r name email phone; do
  echo "Creating customer: $name"

  codat customers create "$COMPANY_ID" "$CONNECTION_ID" \
    --name "$name" \
    --email "$email" \
    --phone "$phone" \
    --format json

  # Rate limiting: wait between requests
  sleep 1
done < customers.csv
```

### Workflow 5: Reconciliation Report

Generate bank reconciliation report:

```bash
COMPANY_ID="company-123"
CONNECTION_ID="connection-456"
ACCOUNT_ID="account-789"

# Get bank transactions
TRANSACTIONS=$(codat bank-accounts transactions \
  "$COMPANY_ID" "$CONNECTION_ID" "$ACCOUNT_ID" \
  --format json)

# Separate reconciled vs unreconciled
RECONCILED=$(echo "$TRANSACTIONS" | jq '[.[] | select(.reconciled == true)]')
UNRECONCILED=$(echo "$TRANSACTIONS" | jq '[.[] | select(.reconciled == false)]')

# Calculate totals
RECONCILED_TOTAL=$(echo "$RECONCILED" | jq '[.[].amount] | add')
UNRECONCILED_TOTAL=$(echo "$UNRECONCILED" | jq '[.[].amount] | add')

echo "=== Bank Reconciliation Report ==="
echo "Reconciled: $(echo "$RECONCILED" | jq 'length') transactions ($RECONCILED_TOTAL)"
echo "Unreconciled: $(echo "$UNRECONCILED" | jq 'length') transactions ($UNRECONCILED_TOTAL)"
```

## Output Processing

### Using jq for JSON

```bash
# Extract specific fields
codat customers list "$COMPANY_ID" --format json | \
  jq '.[] | {id, name: .customerName, email: .emailAddress}'

# Filter by condition
codat invoices list "$COMPANY_ID" --format json | \
  jq '.[] | select(.totalAmount > 1000)'

# Sort results
codat invoices list "$COMPANY_ID" --format json | \
  jq 'sort_by(.dueDate)'

# Calculate aggregates
codat invoices list "$COMPANY_ID" --format json | \
  jq '[.[].totalAmount] | add'
```

### Using grep/awk for Compact Format

```bash
# Extract IDs only
codat customers list "$COMPANY_ID" --format compact | \
  grep -oP 'id=\K[^ ]+'

# Filter by status
codat invoices list "$COMPANY_ID" --format compact | \
  grep 'status=Paid'

# Extract and sum amounts
codat invoices list "$COMPANY_ID" --format compact | \
  awk -F'totalAmount=' '{sum+=$2} END {print sum}'
```

## Error Handling

### Pattern 1: Check Exit Codes

```bash
if codat companies get "$COMPANY_ID" --format json > /dev/null 2>&1; then
  echo "Company exists"
else
  echo "Company not found or error occurred"
  exit 1
fi
```

### Pattern 2: Capture and Parse Errors

```bash
ERROR_OUTPUT=$(codat invoices create "$COMPANY_ID" "$CONNECTION_ID" \
  --customer-id "$CUSTOMER_ID" \
  --issue-date "$DATE" \
  --due-date "$DUE_DATE" 2>&1)

if [ $? -ne 0 ]; then
  if echo "$ERROR_OUTPUT" | grep -q "401"; then
    echo "Authentication failed. Please check API key."
  elif echo "$ERROR_OUTPUT" | grep -q "404"; then
    echo "Resource not found. Check IDs."
  elif echo "$ERROR_OUTPUT" | grep -q "429"; then
    echo "Rate limited. Waiting before retry..."
    sleep 60
  else
    echo "Unknown error: $ERROR_OUTPUT"
  fi
  exit 1
fi
```

### Pattern 3: Retry with Backoff

```bash
function retry_with_backoff {
  local max_attempts=5
  local attempt=1
  local delay=2

  while [ $attempt -le $max_attempts ]; do
    if "$@"; then
      return 0
    fi

    echo "Attempt $attempt failed. Retrying in ${delay}s..."
    sleep $delay
    delay=$((delay * 2))
    attempt=$((attempt + 1))
  done

  echo "Failed after $max_attempts attempts"
  return 1
}

# Usage
retry_with_backoff codat invoices list "$COMPANY_ID" --format json
```

## Best Practices

### 1. Always Use JSON Format for Parsing

```bash
# Good: Parse JSON
DATA=$(codat customers list "$COMPANY_ID" --format json)
CUSTOMER_ID=$(echo "$DATA" | jq -r '.[0].id')

# Bad: Parse table output
DATA=$(codat customers list "$COMPANY_ID")
CUSTOMER_ID=$(echo "$DATA" | awk '{print $1}' | tail -n +3 | head -n 1)
```

### 2. Cache Company and Connection IDs

```bash
# Cache frequently used IDs
export COMPANY_ID="company-123"
export CONNECTION_ID="connection-456"

# Use in subsequent commands
codat invoices list "$COMPANY_ID"
codat customers list "$COMPANY_ID"
```

### 3. Use Queries Instead of Client-Side Filtering

```bash
# Good: Server-side filter
codat invoices list "$COMPANY_ID" --query 'status="Paid"' --format json

# Bad: Client-side filter (slower, more data transfer)
codat invoices list "$COMPANY_ID" --format json | jq '.[] | select(.status == "Paid")'
```

### 4. Respect Rate Limits

```bash
# Add delays between bulk operations
for customer in $CUSTOMERS; do
  codat customers create "$COMPANY_ID" "$CONNECTION_ID" --name "$customer"
  sleep 1  # Wait 1 second between requests
done
```

### 5. Validate Data Before API Calls

```bash
# Check required fields exist
if [ -z "$CUSTOMER_ID" ] || [ -z "$ISSUE_DATE" ] || [ -z "$DUE_DATE" ]; then
  echo "Error: Missing required fields"
  exit 1
fi

# Validate date format
if ! date -d "$ISSUE_DATE" >/dev/null 2>&1; then
  echo "Error: Invalid date format"
  exit 1
fi

# Then make the API call
codat invoices create "$COMPANY_ID" "$CONNECTION_ID" \
  --customer-id "$CUSTOMER_ID" \
  --issue-date "$ISSUE_DATE" \
  --due-date "$DUE_DATE"
```

### 6. Use Descriptive Variable Names

```bash
# Good
COMPANY_ID="company-123"
PRIMARY_CUSTOMER_ID="customer-456"
INVOICE_ISSUE_DATE="2026-01-15"

# Bad
C="company-123"
ID="customer-456"
DATE="2026-01-15"
```

### 7. Handle Pagination for Large Datasets

```bash
# Fetch all pages (use with caution for very large datasets)
PAGE=1
ALL_RESULTS=""

while true; do
  PAGE_RESULTS=$(codat invoices list "$COMPANY_ID" \
    --page "$PAGE" \
    --page-size 100 \
    --format json)

  # Check if page has results
  COUNT=$(echo "$PAGE_RESULTS" | jq 'length')
  if [ "$COUNT" -eq 0 ]; then
    break
  fi

  # Append to results
  ALL_RESULTS="$ALL_RESULTS$PAGE_RESULTS"
  PAGE=$((PAGE + 1))
done
```

### 8. Document Your Workflows

```bash
#!/bin/bash
# Workflow: Generate monthly financial summary
# Purpose: Creates a summary of key financial metrics for the previous month
# Usage: ./monthly-summary.sh COMPANY_ID
# Dependencies: jq, codat CLI

COMPANY_ID="${1:?Missing company ID}"
PREVIOUS_MONTH=$(date -d "last month" +%Y-%m-01)

# ... rest of script
```

## Platform-Specific Notes

### QuickBooks Online (gbol)
- Supports full CRUD operations
- Real-time data sync
- Strong support for invoices and bills

### Xero (akxx)
- Excellent reporting capabilities
- Strong multi-currency support
- Real-time webhooks available

### Sage (tgff, vjms)
- May have delayed sync
- Some read-only limitations
- Check data freshness before relying on it

## Common Pitfalls

### 1. Not Checking Connection Status
Always verify the connection is "Linked" before fetching data:

```bash
STATUS=$(codat connections get "$COMPANY_ID" "$CONNECTION_ID" --format json | jq -r '.status')
if [ "$STATUS" != "Linked" ]; then
  echo "Connection not active: $STATUS"
  exit 1
fi
```

### 2. Ignoring Data Freshness
Check when data was last synced:

```bash
LAST_SYNC=$(codat companies get "$COMPANY_ID" --format json | jq -r '.dataConnections[0].lastSync')
echo "Data last synced: $LAST_SYNC"
```

### 3. Hardcoding IDs
Use variables and make scripts reusable:

```bash
# Bad
codat invoices list company-123 --format json

# Good
COMPANY_ID="${1:?Missing company ID}"
codat invoices list "$COMPANY_ID" --format json
```

## Debugging

### Enable Verbose Output

```bash
# Show HTTP request/response details (if supported)
CODAT_DEBUG=1 codat invoices list "$COMPANY_ID"
```

### Test with Small Page Sizes

```bash
# Test with limited results first
codat invoices list "$COMPANY_ID" --page-size 1 --format json
```

### Validate JSON Structure

```bash
# Check if response is valid JSON
codat invoices list "$COMPANY_ID" --format json | jq empty
```

## Resources

- [Codat API Reference](https://docs.codat.io/accounting-api)
- [Query Syntax](https://docs.codat.io/using-the-api/querying)
- [Platform Coverage](https://docs.codat.io/integrations/accounting/overview)
- [jq Manual](https://stedolan.github.io/jq/manual/)

---

This guide is designed to help AI agents effectively use the Codat CLI. For human usage patterns, see the main [README.md](../README.md).
