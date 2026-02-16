# Codat CLI - Examples & Use Cases

This document provides real-world examples and use cases for the Codat CLI.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Customer Onboarding](#customer-onboarding)
3. [Invoice Management](#invoice-management)
4. [Financial Reporting](#financial-reporting)
5. [Data Export](#data-export)
6. [Automation Scripts](#automation-scripts)
7. [Advanced Queries](#advanced-queries)

## Getting Started

### Initial Setup

```bash
# Install CLI
npm install -g @ktmcp-cli/codat

# Configure authentication
codat auth login your-api-key-here

# Verify authentication
codat auth status

# List your companies
codat companies list
```

## Customer Onboarding

### Scenario: Connect New Customer to QuickBooks

```bash
# Step 1: Create company record
COMPANY_ID=$(codat companies create "Acme Corporation" \
  --description "New customer - Manufacturing" \
  --format json | jq -r '.id')

echo "Company created: $COMPANY_ID"

# Step 2: Create QuickBooks connection
CONNECTION_DATA=$(codat connections create "$COMPANY_ID" \
  --platform-key gbol \
  --format json)

CONNECTION_ID=$(echo "$CONNECTION_DATA" | jq -r '.id')
LINK_URL=$(echo "$CONNECTION_DATA" | jq -r '.linkUrl')

echo "Connection ID: $CONNECTION_ID"
echo "Authorization URL: $LINK_URL"
echo ""
echo "Please send this URL to your customer to authorize the connection."

# Step 3: Poll for connection status
echo "Waiting for authorization..."
while true; do
  STATUS=$(codat connections get "$COMPANY_ID" "$CONNECTION_ID" \
    --format json | jq -r '.status')

  echo "Status: $STATUS"

  if [ "$STATUS" = "Linked" ]; then
    echo "✓ Connection established!"
    break
  elif [ "$STATUS" = "Deauthorized" ]; then
    echo "✗ Connection was denied"
    exit 1
  fi

  sleep 5
done

# Step 4: Verify data access
echo "Testing data access..."
codat accounts list "$COMPANY_ID" --page-size 5
```

### Scenario: Bulk Customer Import

```bash
#!/bin/bash
# import-customers.sh
# Usage: ./import-customers.sh COMPANY_ID CONNECTION_ID customers.csv

COMPANY_ID="$1"
CONNECTION_ID="$2"
CSV_FILE="$3"

if [ -z "$COMPANY_ID" ] || [ -z "$CONNECTION_ID" ] || [ -z "$CSV_FILE" ]; then
  echo "Usage: $0 COMPANY_ID CONNECTION_ID customers.csv"
  exit 1
fi

# CSV format: name,email,phone
tail -n +2 "$CSV_FILE" | while IFS=, read -r name email phone; do
  echo "Creating customer: $name"

  codat customers create "$COMPANY_ID" "$CONNECTION_ID" \
    --name "$name" \
    --email "$email" \
    --phone "$phone" \
    --format json > /dev/null

  if [ $? -eq 0 ]; then
    echo "  ✓ Created"
  else
    echo "  ✗ Failed"
  fi

  # Rate limiting
  sleep 1
done

echo "Import complete!"
```

## Invoice Management

### Scenario: Find Overdue Invoices

```bash
#!/bin/bash
# find-overdue.sh

COMPANY_ID="${1:?Missing company ID}"
TODAY=$(date +%Y-%m-%d)

echo "=== Overdue Invoices Report ==="
echo "Date: $TODAY"
echo ""

# Get unpaid invoices
UNPAID=$(codat invoices list "$COMPANY_ID" \
  --query 'status!="Paid"&&status!="Void"' \
  --format json)

# Filter by due date
OVERDUE=$(echo "$UNPAID" | jq --arg today "$TODAY" \
  '[.[] | select(.dueDate < $today)]')

# Display results
OVERDUE_COUNT=$(echo "$OVERDUE" | jq 'length')
OVERDUE_TOTAL=$(echo "$OVERDUE" | jq '[.[].totalAmount] | add // 0')

echo "Overdue invoices: $OVERDUE_COUNT"
echo "Total overdue amount: \$$OVERDUE_TOTAL"
echo ""

# Show top 10 by amount
echo "Top 10 Overdue Invoices:"
echo "$OVERDUE" | jq -r 'sort_by(.totalAmount) | reverse | .[:10] | .[] |
  "\(.invoiceNumber)\t\(.customerRef.companyName)\t$\(.totalAmount)\t\(.dueDate)"' | \
  column -t -s $'\t'
```

### Scenario: Invoice Aging Report

```bash
#!/bin/bash
# invoice-aging.sh

COMPANY_ID="${1:?Missing company ID}"
TODAY=$(date +%s)

# Get all unpaid invoices
UNPAID=$(codat invoices list "$COMPANY_ID" \
  --query 'status!="Paid"&&status!="Void"' \
  --format json)

# Calculate aging buckets
echo "$UNPAID" | jq -r --arg today "$TODAY" '
  def age_days: ($today | tonumber) - (.dueDate | fromdateiso8601);

  group_by(
    if age_days <= 0 then "Current"
    elif age_days <= 30 then "1-30 Days"
    elif age_days <= 60 then "31-60 Days"
    elif age_days <= 90 then "61-90 Days"
    else "90+ Days"
    end
  ) |
  map({
    bucket: .[0] | age_days |
      if . <= 0 then "Current"
      elif . <= 30 then "1-30 Days"
      elif . <= 60 then "31-60 Days"
      elif . <= 90 then "61-90 Days"
      else "90+ Days"
      end,
    count: length,
    total: map(.totalAmount) | add
  }) |
  sort_by(
    .bucket |
    if . == "Current" then 0
    elif . == "1-30 Days" then 1
    elif . == "31-60 Days" then 2
    elif . == "61-90 Days" then 3
    else 4
    end
  ) |
  .[] | "\(.bucket)\t\(.count)\t$\(.total)"
' | column -t -s $'\t'
```

### Scenario: Create Invoice from Template

```bash
#!/bin/bash
# create-invoice.sh

COMPANY_ID="$1"
CONNECTION_ID="$2"
CUSTOMER_ID="$3"
AMOUNT="$4"
DESCRIPTION="${5:-Professional Services}"

# Calculate dates
ISSUE_DATE=$(date +%Y-%m-%d)
DUE_DATE=$(date -d "+30 days" +%Y-%m-%d)

# Build line items
LINE_ITEMS=$(jq -n \
  --arg desc "$DESCRIPTION" \
  --arg amount "$AMOUNT" \
  '[{
    description: $desc,
    quantity: 1,
    unitAmount: ($amount | tonumber),
    taxAmount: 0
  }]')

# Create invoice
codat invoices create "$COMPANY_ID" "$CONNECTION_ID" \
  --customer-id "$CUSTOMER_ID" \
  --issue-date "$ISSUE_DATE" \
  --due-date "$DUE_DATE" \
  --currency "USD" \
  --line-items "$LINE_ITEMS" \
  --format json

echo "Invoice created"
echo "Issue Date: $ISSUE_DATE"
echo "Due Date: $DUE_DATE"
```

## Financial Reporting

### Scenario: Monthly Financial Dashboard

```bash
#!/bin/bash
# monthly-dashboard.sh

COMPANY_ID="${1:?Missing company ID}"
START_DATE=$(date -d "first day of last month" +%Y-%m-01)

echo "=========================================="
echo "        Monthly Financial Dashboard"
echo "=========================================="
echo "Company: $COMPANY_ID"
echo "Period: $START_DATE"
echo ""

# Balance Sheet Summary
echo "--- Balance Sheet ---"
codat reports balance-sheet "$COMPANY_ID" \
  --period-length 1 \
  --periods-to-compare 3 \
  --start-month "$START_DATE" \
  --format json | jq -r '
    .reportInfo | "
Assets:      $\(.netAssets)
Liabilities: $\(.netLiabilities)
Equity:      $\(.netEquity)
"'

# Profit & Loss Summary
echo "--- Profit & Loss ---"
codat reports profit-loss "$COMPANY_ID" \
  --period-length 1 \
  --periods-to-compare 3 \
  --start-month "$START_DATE" \
  --format json | jq -r '
    .reportInfo | "
Revenue:     $\(.grossProfit)
Expenses:    $\(.totalExpenses)
Net Income:  $\(.netIncome)
"'

# Cash Flow Summary
echo "--- Cash Flow ---"
codat reports cash-flow "$COMPANY_ID" \
  --period-length 1 \
  --periods-to-compare 3 \
  --start-month "$START_DATE" \
  --format json | jq -r '
    .reportInfo | "
Operating:   $\(.operatingActivities)
Investing:   $\(.investingActivities)
Financing:   $\(.financingActivities)
"'

# Accounts Receivable
echo "--- Accounts Receivable ---"
codat reports aged-debtors "$COMPANY_ID" \
  --format json | jq -r '
    [.reports[].amount] | add | "Total Outstanding: $\(.)"
'

# Accounts Payable
echo "--- Accounts Payable ---"
codat reports aged-creditors "$COMPANY_ID" \
  --format json | jq -r '
    [.reports[].amount] | add | "Total Payable: $\(.)"
'

echo ""
echo "=========================================="
```

### Scenario: Year-over-Year Comparison

```bash
#!/bin/bash
# yoy-comparison.sh

COMPANY_ID="${1:?Missing company ID}"

echo "=== Year-over-Year P&L Comparison ==="

# Get 24 months of data
codat reports profit-loss "$COMPANY_ID" \
  --period-length 12 \
  --periods-to-compare 2 \
  --format json | jq -r '
    .reports | map({
      period: .fromDate,
      revenue: .grossProfit,
      expenses: .totalExpenses,
      net_income: .netIncome
    }) | .[] | "
Period:     \(.period)
Revenue:    $\(.revenue)
Expenses:   $\(.expenses)
Net Income: $\(.net_income)
---"'
```

## Data Export

### Scenario: Export All Customers to CSV

```bash
#!/bin/bash
# export-customers.sh

COMPANY_ID="${1:?Missing company ID}"
OUTPUT_FILE="${2:-customers.csv}"

# Header
echo "ID,Name,Email,Phone,Status" > "$OUTPUT_FILE"

# Fetch all customers
PAGE=1
while true; do
  DATA=$(codat customers list "$COMPANY_ID" \
    --page "$PAGE" \
    --page-size 100 \
    --format json)

  # Check if empty
  if [ "$(echo "$DATA" | jq 'length')" -eq 0 ]; then
    break
  fi

  # Convert to CSV
  echo "$DATA" | jq -r '.[] |
    [.id, .customerName, .emailAddress, .phone, .status] |
    @csv' >> "$OUTPUT_FILE"

  PAGE=$((PAGE + 1))
done

echo "Exported to $OUTPUT_FILE"
wc -l "$OUTPUT_FILE"
```

### Scenario: Export Transactions for Analysis

```bash
#!/bin/bash
# export-transactions.sh

COMPANY_ID="${1:?Missing company ID}"
CONNECTION_ID="${2:?Missing connection ID}"
ACCOUNT_ID="${3:?Missing account ID}"
OUTPUT_FILE="${4:-transactions.json}"

echo "Fetching all transactions..."

# Fetch all pages
PAGE=1
ALL_TRANSACTIONS="[]"

while true; do
  PAGE_DATA=$(codat bank-accounts transactions \
    "$COMPANY_ID" "$CONNECTION_ID" "$ACCOUNT_ID" \
    --page "$PAGE" \
    --page-size 100 \
    --format json)

  COUNT=$(echo "$PAGE_DATA" | jq 'length')

  if [ "$COUNT" -eq 0 ]; then
    break
  fi

  # Merge with existing data
  ALL_TRANSACTIONS=$(echo "$ALL_TRANSACTIONS" "$PAGE_DATA" | \
    jq -s '.[0] + .[1]')

  echo "  Page $PAGE: $COUNT transactions"
  PAGE=$((PAGE + 1))
done

# Save to file
echo "$ALL_TRANSACTIONS" > "$OUTPUT_FILE"

echo "Exported $(echo "$ALL_TRANSACTIONS" | jq 'length') transactions to $OUTPUT_FILE"
```

## Automation Scripts

### Scenario: Daily Outstanding Invoices Alert

```bash
#!/bin/bash
# daily-invoice-alert.sh
# Add to cron: 0 9 * * * /path/to/daily-invoice-alert.sh

COMPANY_ID="your-company-id"
THRESHOLD=5000  # Alert if outstanding > $5000

# Get unpaid invoices
UNPAID=$(codat invoices list "$COMPANY_ID" \
  --query 'status!="Paid"' \
  --format json)

TOTAL=$(echo "$UNPAID" | jq '[.[].totalAmount] | add // 0')

# Check threshold
if (( $(echo "$TOTAL > $THRESHOLD" | bc -l) )); then
  COUNT=$(echo "$UNPAID" | jq 'length')

  # Send alert (example: email via sendmail)
  echo "Subject: Outstanding Invoices Alert

You have $COUNT unpaid invoices totaling \$$TOTAL.

This exceeds the threshold of \$$THRESHOLD.

Please review: https://app.codat.io/companies/$COMPANY_ID/invoices
" | sendmail your@email.com

  echo "Alert sent: $COUNT invoices, \$$TOTAL total"
else
  echo "No alert needed: \$$TOTAL outstanding"
fi
```

### Scenario: Weekly Financial Summary Email

```bash
#!/bin/bash
# weekly-summary.sh
# Add to cron: 0 8 * * 1 /path/to/weekly-summary.sh

COMPANY_ID="your-company-id"
EMAIL="your@email.com"

# Generate report
REPORT=$(cat <<EOF
Subject: Weekly Financial Summary

=== Week of $(date +%Y-%m-%d) ===

--- Recent Invoices ---
$(codat invoices list "$COMPANY_ID" --page-size 10 --format compact)

--- Recent Bills ---
$(codat bills list "$COMPANY_ID" --page-size 10 --format compact)

--- Recent Payments ---
$(codat payments list "$COMPANY_ID" --page-size 10 --format compact)

--- Outstanding Summary ---
Invoices: $(codat invoices list "$COMPANY_ID" --query 'status!="Paid"' --format json | jq 'length')
Total Outstanding: \$$(codat invoices list "$COMPANY_ID" --query 'status!="Paid"' --format json | jq '[.[].totalAmount] | add // 0')

---
Generated by Codat CLI
EOF
)

# Send email
echo "$REPORT" | sendmail "$EMAIL"
echo "Weekly summary sent to $EMAIL"
```

## Advanced Queries

### Filter by Date Range

```bash
# Invoices from last month
START_DATE=$(date -d "first day of last month" +%Y-%m-%d)
END_DATE=$(date -d "last day of last month" +%Y-%m-%d)

codat invoices list "$COMPANY_ID" \
  --query "issueDate>=$START_DATE&&issueDate<=$END_DATE"
```

### Complex Multi-Condition Queries

```bash
# Large unpaid invoices over 30 days old
DUE_DATE=$(date -d "30 days ago" +%Y-%m-%d)

codat invoices list "$COMPANY_ID" \
  --query "status=\"Submitted\"&&totalAmount>1000&&dueDate<$DUE_DATE"
```

### Query with Sorting

```bash
# Get top 10 customers by outstanding balance
codat customers list "$COMPANY_ID" \
  --order-by "balance desc" \
  --page-size 10
```

### Fuzzy Search

```bash
# Find customers with "Acme" in name
codat customers list "$COMPANY_ID" \
  --query 'customerName~"Acme"'
```

---

## Tips & Tricks

### 1. Use Shell Variables for IDs

```bash
export COMPANY_ID="company-123"
export CONNECTION_ID="connection-456"

# Now you can omit them in commands
codat invoices list "$COMPANY_ID"
codat customers list "$COMPANY_ID"
```

### 2. Pretty Print JSON with jq

```bash
codat companies list --format json | jq '.'
```

### 3. Extract Specific Fields

```bash
# Get just customer names and emails
codat customers list "$COMPANY_ID" --format json | \
  jq '.[] | {name: .customerName, email: .emailAddress}'
```

### 4. Count Results

```bash
# Count unpaid invoices
codat invoices list "$COMPANY_ID" --query 'status!="Paid"' --format json | \
  jq 'length'
```

### 5. Calculate Totals

```bash
# Sum all invoice amounts
codat invoices list "$COMPANY_ID" --format json | \
  jq '[.[].totalAmount] | add'
```

### 6. Combine Multiple Commands

```bash
# Get customer name from invoice
INVOICE=$(codat invoices get "$COMPANY_ID" "$INVOICE_ID" --format json)
CUSTOMER_ID=$(echo "$INVOICE" | jq -r '.customerRef.id')
codat customers get "$COMPANY_ID" "$CUSTOMER_ID"
```

---

For more examples and use cases, see the [README](./README.md) and [AGENT.md](./docs/AGENT.md).
