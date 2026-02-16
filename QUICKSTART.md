# Codat CLI - Quick Start Guide

Get started with the Codat CLI in 5 minutes.

## Installation

```bash
npm install -g @ktmcp-cli/codat
```

## Step 1: Authentication (1 min)

Get your API key from [Codat Dashboard](https://app.codat.io/developers/api-keys), then:

```bash
codat auth login YOUR_API_KEY
```

Verify:

```bash
codat auth status
```

## Step 2: Create a Company (1 min)

```bash
codat companies create "Test Company" --format json
```

Copy the `id` from the response. We'll use it as `COMPANY_ID`.

## Step 3: Create a Connection (2 min)

Connect to a demo accounting platform (or use your real credentials):

```bash
codat connections create COMPANY_ID --platform-key gbol
```

This returns a `linkUrl`. Open it in your browser to authorize the connection.

## Step 4: Fetch Data (1 min)

Once the connection is authorized:

```bash
# List accounts
codat accounts list COMPANY_ID

# List invoices
codat invoices list COMPANY_ID

# List customers
codat customers list COMPANY_ID

# Get balance sheet
codat reports balance-sheet COMPANY_ID --period-length 1 --periods-to-compare 12
```

## Common Commands

### List resources
```bash
codat companies list
codat connections list COMPANY_ID
codat invoices list COMPANY_ID
codat customers list COMPANY_ID
codat bills list COMPANY_ID
codat accounts list COMPANY_ID
```

### Get details
```bash
codat companies get COMPANY_ID
codat invoices get COMPANY_ID INVOICE_ID
codat customers get COMPANY_ID CUSTOMER_ID
```

### Create resources
```bash
codat customers create COMPANY_ID CONNECTION_ID --name "New Customer" --email "email@example.com"

codat invoices create COMPANY_ID CONNECTION_ID \
  --customer-id CUSTOMER_ID \
  --issue-date 2026-02-16 \
  --due-date 2026-03-16
```

### Filter & Query
```bash
codat invoices list COMPANY_ID --query 'status="Paid"'
codat customers list COMPANY_ID --query 'customerName~"Acme"'
```

### Output Formats
```bash
--format table   # Human-readable (default)
--format json    # Machine-readable
--format compact # One-line-per-item
```

## Platform Keys

| Platform | Key | Example |
|----------|-----|---------|
| QuickBooks Online | `gbol` | Most popular |
| Xero | `akxx` | Great for international |
| Sage 50 | `tgff` | UK-focused |
| FreeAgent | `fbrh` | Small business |
| Wave | `wvzu` | Free tier available |

## Next Steps

- Read [EXAMPLES.md](./EXAMPLES.md) for real-world scenarios
- Check [README.md](./README.md) for complete documentation
- See [AGENT.md](./docs/AGENT.md) for AI agent integration

## Troubleshooting

### "API key not configured"
Run `codat auth login YOUR_API_KEY`

### "Company not found"
Verify the company ID with `codat companies list`

### "Connection not linked"
Check connection status with `codat connections get COMPANY_ID CONNECTION_ID`

## Help

Every command has built-in help:

```bash
codat --help
codat companies --help
codat invoices list --help
```

---

You're ready! Start exploring the Codat API through this CLI.
