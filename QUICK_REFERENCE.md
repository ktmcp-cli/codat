# Codat CLI - Quick Reference Card

## Installation
```bash
npm install -g @ktmcp-cli/codat
# OR use directly
node bin/codat.js [command]
```

## Authentication
```bash
codat auth login YOUR_API_KEY
codat auth status
codat auth logout
```

## Common Commands

### Companies
```bash
codat companies list
codat companies create "Company Name"
codat companies get COMPANY_ID
```

### Connections
```bash
codat connections list COMPANY_ID
codat connections create COMPANY_ID --platform-key gbol  # QuickBooks
codat connections create COMPANY_ID --platform-key akxx  # Xero
```

### Invoices
```bash
codat invoices list COMPANY_ID
codat invoices get COMPANY_ID INVOICE_ID
codat invoices list COMPANY_ID --query 'status="Paid"'
codat invoices pdf COMPANY_ID INVOICE_ID
```

### Customers
```bash
codat customers list COMPANY_ID
codat customers get COMPANY_ID CUSTOMER_ID
codat customers create COMPANY_ID CONNECTION_ID --name "Customer Name"
```

### Bills & Suppliers
```bash
codat bills list COMPANY_ID
codat suppliers list COMPANY_ID
codat bills list COMPANY_ID --query 'status="Open"'
```

### Financial Reports
```bash
codat reports balance-sheet COMPANY_ID --periods-to-compare 12
codat reports profit-loss COMPANY_ID --periods-to-compare 12
codat reports cash-flow COMPANY_ID --periods-to-compare 4
codat reports aged-debtors COMPANY_ID
codat reports aged-creditors COMPANY_ID
```

### Bank Accounts
```bash
codat bank-accounts list COMPANY_ID
codat bank-accounts transactions COMPANY_ID CONNECTION_ID ACCOUNT_ID
```

### Other Resources
```bash
codat accounts list COMPANY_ID          # Chart of accounts
codat payments list COMPANY_ID          # Payments
codat journals list COMPANY_ID          # Journals
codat tax-rates list COMPANY_ID         # Tax rates
```

## Output Formats
```bash
--format table    # Human-readable (default)
--format json     # Machine-readable
--format compact  # One-line per item
```

## Query Examples
```bash
# Exact match
--query 'status="Paid"'

# Contains
--query 'customerName~"Acme"'

# Greater/less than
--query 'totalAmount>1000'
--query 'totalAmount<5000'

# Date comparison
--query 'issueDate>2026-01-01'

# Multiple conditions
--query 'status="Open"&&totalAmount>500'
```

## Platform Keys (Common)
| Platform | Key |
|----------|-----|
| QuickBooks Online | `gbol` |
| Xero | `akxx` |
| Sage 50 | `tgff` |
| Sage Intacct | `vjms` |
| FreeAgent | `fbrh` |
| Wave | `wvzu` |
| Zoho Books | `rwuv` |
| MYOB | `pdvj` |

## Scripting Examples

### Export all customers
```bash
codat customers list $COMPANY_ID --format json > customers.json
```

### Count unpaid invoices
```bash
codat invoices list $COMPANY_ID --query 'status!="Paid"' --format json | jq 'length'
```

### Find overdue invoices
```bash
TODAY=$(date +%Y-%m-%d)
codat invoices list $COMPANY_ID --query "status=\"Submitted\"&&dueDate<$TODAY"
```

### Loop through pages
```bash
for page in {1..5}; do
  codat invoices list $COMPANY_ID --page $page --page-size 100 --format json
done
```

## Help Commands
```bash
codat --help
codat [command] --help
codat [command] [subcommand] --help
```

## Configuration
Location: `~/.config/codat-cli/config.json`

Environment variable: `CODAT_API_KEY`

## Error Codes
- 0: Success
- 1: Error (check stderr for details)

## Documentation
- Full guide: `README.md`
- AI agents: `docs/AGENT.md`
- OpenClaw: `docs/OPENCLAW.md`
- Examples: `EXAMPLES.md`

## Support
- API Docs: https://docs.codat.io/accounting-api
- Get API Keys: https://app.codat.io/developers/api-keys
- OpenAPI Spec: https://github.com/codatio/oas

---

**Tip**: Use `--format json` with `jq` for powerful data processing!
