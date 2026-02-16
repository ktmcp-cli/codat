# Codat Accounting API CLI

<p align="center">
  <img src="banner.png" alt="KTMCP Banner" width="100%">
</p>


A production-ready command-line interface for the [Codat Accounting API](https://www.codat.io/accounting-api/), providing unified access to accounting data from 20+ platforms including QuickBooks, Xero, Sage, FreeAgent, and more.

## Features

- **Unified API Access**: Connect to 20+ accounting platforms through a single interface
- **Comprehensive Coverage**: Full support for companies, connections, accounts, invoices, bills, payments, customers, suppliers, journals, reports, and more
- **Multiple Output Formats**: Table, JSON, and compact formats for different use cases
- **Rich CLI Experience**: Colorized output, progress indicators, and helpful error messages
- **Configuration Management**: Secure credential storage and user preferences
- **Pagination Support**: Efficient handling of large datasets
- **Query & Filter**: Powerful filtering and sorting capabilities

## Why CLI > MCP

While Model Context Protocol (MCP) servers provide a structured way to expose APIs to AI models, CLIs offer several distinct advantages:

### 1. **Direct Human Control**
- CLIs are designed for human operators with immediate feedback
- No abstraction layer between you and the API
- Full visibility into what commands are being executed

### 2. **Composability & Scripting**
- Easily chain commands with pipes and shell operators
- Integrate with existing shell scripts and automation workflows
- Use standard Unix tools (grep, awk, jq) for post-processing
- Build complex workflows without writing code

### 3. **Debugging & Transparency**
- See exactly what's happening with each API call
- Control error handling and retry logic explicitly
- Test API endpoints interactively during development
- Inspect raw responses with JSON output format

### 4. **Performance**
- No server process overhead
- Direct HTTP requests without middleware
- Batch operations with shell loops
- Minimal memory footprint

### 5. **Portability**
- Works anywhere Node.js runs (no server setup required)
- Easy to distribute and install via npm
- No persistent services or background processes
- Simple to version and deploy

### 6. **Learning & Documentation**
- Built-in help text for every command
- Self-documenting through `--help` flags
- Examples visible in usage patterns
- Easier to understand than protocol specifications

### Example: CLI vs MCP

**CLI Approach:**
```bash
# List all customers, filter by email, format as JSON
codat customers list company-123 --query 'emailAddress="test@example.com"' --format json | jq '.[] | {name, email}'
```

**MCP Approach:**
```
1. Start MCP server
2. Configure client connection
3. Send JSON-RPC request
4. Parse nested response structure
5. Handle protocol-level errors
6. Transform data for consumption
```

## Installation

### NPM (Recommended)
```bash
npm install -g @ktmcp-cli/codat
```

### From Source
```bash
git clone <repository-url>
cd codat
npm install
npm link
```

## Quick Start

### 1. Authentication

Get your API key from [Codat Dashboard](https://app.codat.io/developers/api-keys):

```bash
# Set API key
codat auth login YOUR_API_KEY

# Or use environment variable
export CODAT_API_KEY=YOUR_API_KEY

# Check authentication status
codat auth status
```

### 2. Create a Company

```bash
# Create a company (represents your customer)
codat companies create "Acme Corp" --description "Main customer account"
```

### 3. Create a Connection

```bash
# Connect to QuickBooks Online
codat connections create COMPANY_ID --platform-key gbol

# The response includes a linkUrl - direct your user there to authorize
```

### 4. Fetch Data

```bash
# List invoices
codat invoices list COMPANY_ID --format table

# Get customer details
codat customers get COMPANY_ID CUSTOMER_ID --format json

# View balance sheet report
codat reports balance-sheet COMPANY_ID --period-length 1 --periods-to-compare 12
```

## Usage Examples

### Companies

```bash
# List all companies
codat companies list --page 1 --page-size 50

# Get company details
codat companies get COMPANY_ID

# Update company
codat companies update COMPANY_ID --name "New Name"

# Delete company
codat companies delete COMPANY_ID
```

### Connections

```bash
# List connections for a company
codat connections list COMPANY_ID

# Create connection to QuickBooks
codat connections create COMPANY_ID --platform-key gbol

# Create connection to Xero
codat connections create COMPANY_ID --platform-key akxx

# Delete connection
codat connections delete COMPANY_ID CONNECTION_ID
```

### Accounts (Chart of Accounts)

```bash
# List all accounts
codat accounts list COMPANY_ID --format table

# Get account details
codat accounts get COMPANY_ID ACCOUNT_ID

# Create new account
codat accounts create COMPANY_ID CONNECTION_ID \
  --name "Office Supplies" \
  --type Expense \
  --nominal-code "6100" \
  --currency USD
```

### Invoices

```bash
# List invoices with status filter
codat invoices list COMPANY_ID --query 'status="Paid"'

# Get invoice details
codat invoices get COMPANY_ID INVOICE_ID

# Create invoice
codat invoices create COMPANY_ID CONNECTION_ID \
  --customer-id CUSTOMER_ID \
  --issue-date 2026-01-15 \
  --due-date 2026-02-15 \
  --line-items '[{"description":"Consulting","quantity":10,"unitAmount":150,"accountRef":{"id":"123"}}]'

# Get invoice PDF
codat invoices pdf COMPANY_ID INVOICE_ID
```

### Customers

```bash
# List all customers
codat customers list COMPANY_ID

# Filter customers
codat customers list COMPANY_ID --query 'customerName~"Acme"'

# Create customer
codat customers create COMPANY_ID CONNECTION_ID \
  --name "New Customer Inc" \
  --contact-name "John Doe" \
  --email john@example.com \
  --phone "+1234567890"

# Update customer
codat customers update COMPANY_ID CONNECTION_ID CUSTOMER_ID \
  --email newemail@example.com
```

### Bills & Suppliers

```bash
# List bills
codat bills list COMPANY_ID --query 'status="Open"'

# List suppliers
codat suppliers list COMPANY_ID

# Create bill
codat bills create COMPANY_ID CONNECTION_ID \
  --supplier-id SUPPLIER_ID \
  --issue-date 2026-01-15 \
  --due-date 2026-02-15 \
  --line-items '[{"description":"Office Rent","quantity":1,"unitAmount":2500,"accountRef":{"id":"456"}}]'
```

### Payments

```bash
# List payments
codat payments list COMPANY_ID

# List payment methods
codat payments methods COMPANY_ID

# Create payment
codat payments create COMPANY_ID CONNECTION_ID \
  --customer-id CUSTOMER_ID \
  --date 2026-01-20 \
  --amount 1500.00 \
  --currency USD \
  --payment-method-id METHOD_ID
```

### Journals

```bash
# List journals
codat journals list COMPANY_ID

# List journal entries
codat journals entries COMPANY_ID

# Create journal entry
codat journals create-entry COMPANY_ID CONNECTION_ID \
  --journal-id JOURNAL_ID \
  --posted-on 2026-01-31 \
  --lines '[{"accountRef":{"id":"123"},"netAmount":100,"description":"Adjustment"}]'
```

### Bank Accounts

```bash
# List bank accounts
codat bank-accounts list COMPANY_ID

# List bank transactions
codat bank-accounts transactions COMPANY_ID CONNECTION_ID ACCOUNT_ID

# Create bank account
codat bank-accounts create COMPANY_ID CONNECTION_ID \
  --name "Business Checking" \
  --account-number "12345678" \
  --currency USD
```

### Reports

```bash
# Balance Sheet
codat reports balance-sheet COMPANY_ID \
  --period-length 1 \
  --periods-to-compare 12 \
  --start-month 2026-01-01

# Profit & Loss
codat reports profit-loss COMPANY_ID \
  --period-length 1 \
  --periods-to-compare 12

# Cash Flow Statement
codat reports cash-flow COMPANY_ID \
  --period-length 3 \
  --periods-to-compare 4

# Aged Debtors (AR)
codat reports aged-debtors COMPANY_ID \
  --report-date 2026-02-16 \
  --number-of-periods 4 \
  --period-length-days 30

# Aged Creditors (AP)
codat reports aged-creditors COMPANY_ID \
  --report-date 2026-02-16 \
  --number-of-periods 4 \
  --period-length-days 30
```

### Tax Rates

```bash
# List tax rates
codat tax-rates list COMPANY_ID

# Get tax rate details
codat tax-rates get COMPANY_ID TAX_RATE_ID
```

## Output Formats

### Table Format (Default)
```bash
codat customers list COMPANY_ID
# Outputs a formatted ASCII table
```

### JSON Format
```bash
codat customers list COMPANY_ID --format json
# Outputs raw JSON for programmatic use
```

### Compact Format
```bash
codat customers list COMPANY_ID --format compact
# Outputs one line per item (great for scripting)
```

## Query & Filter Syntax

Use the `--query` option to filter results:

```bash
# Exact match
--query 'status="Paid"'

# Contains
--query 'customerName~"Acme"'

# Greater than
--query 'totalAmount>1000'

# Less than
--query 'totalAmount<5000'

# Multiple conditions (AND)
--query 'status="Open"&&totalAmount>500'

# Date comparison
--query 'issueDate>2026-01-01'
```

## Platform Keys

Common platform keys for creating connections:

| Platform | Key | Description |
|----------|-----|-------------|
| QuickBooks Online | `gbol` | Intuit QuickBooks Online |
| Xero | `akxx` | Xero Accounting |
| Sage 50 | `tgff` | Sage 50 (UK) |
| Sage Intacct | `vjms` | Sage Intacct |
| FreeAgent | `fbrh` | FreeAgent |
| Wave | `wvzu` | Wave Accounting |
| Zoho Books | `rwuv` | Zoho Books |
| MYOB | `pdvj` | MYOB AccountRight |

See [Codat documentation](https://docs.codat.io/accounting-api/overview) for the full list.

## Configuration

Configuration is stored in `~/.config/codat-cli/`:

```bash
# View all configuration
codat auth config

# View config file location
codat auth status

# Clear configuration
codat auth logout
```

### Environment Variables

- `CODAT_API_KEY`: API key (overrides stored config)

## Error Handling

The CLI provides clear error messages with helpful hints:

```bash
# 401 Unauthorized
Error: Invalid API key or authentication failed
Hint: Check your API key with codat auth status

# 404 Not Found
Error: Resource not found

# 429 Rate Limited
Error: Too many requests. Please try again later.
Retry after: 60 seconds

# 400 Bad Request
Error: Invalid request parameters
Details: [validation errors shown here]
```

## Scripting Examples

### Batch Export Invoices
```bash
#!/bin/bash
COMPANY_ID="your-company-id"

# Get all paid invoices as JSON
codat invoices list $COMPANY_ID \
  --query 'status="Paid"' \
  --format json \
  --page-size 100 > paid_invoices.json

# Extract invoice numbers
jq -r '.[].invoiceNumber' paid_invoices.json
```

### Monitor Outstanding Invoices
```bash
#!/bin/bash
COMPANY_ID="your-company-id"

# Get unpaid invoices over 30 days old
DATE_30_DAYS_AGO=$(date -d "30 days ago" +%Y-%m-%d)

codat invoices list $COMPANY_ID \
  --query "status=\"Submitted\"&&dueDate<$DATE_30_DAYS_AGO" \
  --format table
```

### Daily Financial Summary
```bash
#!/bin/bash
COMPANY_ID="your-company-id"

echo "=== Daily Financial Summary ==="
echo ""

echo "Recent Invoices:"
codat invoices list $COMPANY_ID --page-size 5 --format compact

echo ""
echo "Recent Bills:"
codat bills list $COMPANY_ID --page-size 5 --format compact

echo ""
echo "Recent Payments:"
codat payments list $COMPANY_ID --page-size 5 --format compact
```

## Development

### Project Structure
```
codat/
├── bin/
│   └── codat.js          # CLI entry point
├── src/
│   ├── commands/         # Command modules
│   │   ├── auth.js
│   │   ├── companies.js
│   │   ├── connections.js
│   │   ├── accounts.js
│   │   ├── invoices.js
│   │   ├── customers.js
│   │   ├── bills.js
│   │   ├── suppliers.js
│   │   ├── payments.js
│   │   ├── journals.js
│   │   ├── reports.js
│   │   ├── bank-accounts.js
│   │   └── tax-rates.js
│   └── lib/              # Shared utilities
│       ├── api.js        # API client
│       ├── auth.js       # Authentication
│       ├── config.js     # Configuration
│       └── output.js     # Output formatting
├── docs/
│   ├── AGENT.md          # AI agent usage guide
│   └── OPENCLAW.md       # OpenClaw integration
├── package.json
└── README.md
```

### Running from Source
```bash
npm install
node bin/codat.js --help
```

### Adding New Commands
1. Create new command file in `src/commands/`
2. Import and register in `bin/codat.js`
3. Follow existing patterns for consistency

## Troubleshooting

### API Key Not Working
```bash
# Check status
codat auth status

# Re-authenticate
codat auth logout
codat auth login NEW_API_KEY
```

### Connection Issues
```bash
# Verify base URL
codat auth config

# Test with a simple command
codat companies list --page-size 1
```

### Rate Limiting
Codat API has rate limits. If you hit them:
- Wait for the retry-after period
- Reduce page size
- Add delays between requests in scripts

## Resources

- [Codat Documentation](https://docs.codat.io/)
- [Codat API Reference](https://docs.codat.io/accounting-api)
- [Get API Keys](https://app.codat.io/developers/api-keys)
- [Supported Platforms](https://docs.codat.io/integrations/accounting/overview)
- [OpenAPI Spec](https://github.com/codatio/oas)

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [Create an issue](#)
- Codat Support: https://codat.io/support
- API Documentation: https://docs.codat.io/

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Note**: This CLI is a third-party tool and is not officially maintained by Codat. For official SDKs, see [Codat's GitHub](https://github.com/codatio).
