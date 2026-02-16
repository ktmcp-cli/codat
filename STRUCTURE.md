# Project Structure

```
@ktmcp-cli/codat/
│
├── bin/
│   └── codat.js                    # CLI entry point (executable)
│
├── src/
│   ├── commands/                   # Command modules
│   │   ├── auth.js                 # Authentication commands
│   │   ├── companies.js            # Company management
│   │   ├── connections.js          # Connection management
│   │   ├── accounts.js             # Chart of accounts
│   │   ├── invoices.js             # Invoice operations
│   │   ├── customers.js            # Customer management
│   │   ├── bills.js                # Bill operations
│   │   ├── suppliers.js            # Supplier management
│   │   ├── payments.js             # Payment operations
│   │   ├── journals.js             # Journal and journal entries
│   │   ├── reports.js              # Financial reports
│   │   ├── bank-accounts.js        # Bank account operations
│   │   └── tax-rates.js            # Tax rate information
│   │
│   └── lib/                        # Shared utilities
│       ├── api.js                  # HTTP client, error handling
│       ├── auth.js                 # Authentication helpers
│       ├── config.js               # Configuration management
│       └── output.js               # Output formatting
│
├── docs/                           # Additional documentation
│   ├── AGENT.md                    # AI agent integration guide
│   └── OPENCLAW.md                 # OpenClaw integration guide
│
├── package.json                    # Project metadata and dependencies
├── .gitignore                      # Git ignore patterns
├── LICENSE                         # MIT License
│
├── README.md                       # Main documentation (5,800+ lines)
├── QUICKSTART.md                   # 5-minute getting started guide
├── EXAMPLES.md                     # Real-world examples and scripts
├── PROJECT_SUMMARY.md              # Project overview and statistics
└── STRUCTURE.md                    # This file
```

## File Details

### Entry Point
- **bin/codat.js** (60 lines)
  - Imports Commander.js
  - Registers all command modules
  - Displays help if no arguments

### Command Modules (src/commands/)
Each command module follows this pattern:
- Exports a function that registers commands with Commander
- Implements list, get, create, update, delete operations
- Handles options and arguments
- Formats output based on user preference

| File | Lines | Description |
|------|-------|-------------|
| auth.js | 120 | Login, logout, status, config management |
| companies.js | 90 | Company CRUD operations |
| connections.js | 110 | Connection management, linking |
| accounts.js | 120 | Chart of accounts, transactions |
| invoices.js | 150 | Invoice operations, PDF download |
| customers.js | 120 | Customer CRUD operations |
| bills.js | 130 | Bill operations, payments |
| suppliers.js | 120 | Supplier CRUD operations |
| payments.js | 110 | Payment operations, methods |
| journals.js | 130 | Journals, journal entries |
| reports.js | 120 | Financial reports (5 types) |
| bank-accounts.js | 130 | Bank accounts, transactions |
| tax-rates.js | 70 | Tax rate information |

### Library Modules (src/lib/)

| File | Lines | Description |
|------|-------|-------------|
| api.js | 250 | HTTP client with axios, error handling, pagination |
| auth.js | 80 | Authentication validation, header generation |
| config.js | 150 | Configuration management with Conf library |
| output.js | 300 | Table/JSON/compact formatting, colored output |

### Documentation

| File | Lines | Description |
|------|-------|-------------|
| README.md | 5,800+ | Complete user manual |
| QUICKSTART.md | 100+ | 5-minute tutorial |
| EXAMPLES.md | 600+ | Real-world scripts |
| AGENT.md | 800+ | AI agent patterns |
| OPENCLAW.md | 900+ | OpenClaw integration |
| PROJECT_SUMMARY.md | 400+ | Project overview |
| STRUCTURE.md | 200+ | This file |

## Code Organization Principles

### 1. Separation of Concerns
- **Commands**: User interface, argument parsing, command logic
- **Library**: Reusable utilities, API client, output formatting
- **Entry Point**: Command registration, routing

### 2. Consistency
- All commands follow the same pattern
- Consistent option names (--format, --page, --query)
- Uniform error handling
- Standard output formats

### 3. Modularity
- Each command in its own file
- Shared logic in lib/
- Easy to add new commands
- Easy to modify existing commands

### 4. Extensibility
- Simple to add new commands
- Easy to support new API endpoints
- Pluggable output formatters
- Configurable error handlers

## Adding a New Command

To add a new command (e.g., "items"):

1. **Create command module**: `src/commands/items.js`
```javascript
export function itemsCommand(program) {
  const items = program
    .command('items')
    .description('Manage items');

  items
    .command('list')
    .argument('<companyId>', 'Company ID')
    .action(async (companyId) => {
      const data = await get(`/companies/${companyId}/data/items`);
      formatOutput(data.results);
    });

  // Add more subcommands...
}
```

2. **Register in entry point**: `bin/codat.js`
```javascript
import { itemsCommand } from '../src/commands/items.js';
// ...
itemsCommand(program);
```

3. **Test the command**:
```bash
node bin/codat.js items list COMPANY_ID
```

## Configuration Files

### Runtime Configuration
Location: `~/.config/codat-cli/config.json`

```json
{
  "apiKey": "your-api-key",
  "baseUrl": "https://api.codat.io",
  "defaultPageSize": 100,
  "outputFormat": "table"
}
```

### Package Configuration
File: `package.json`

```json
{
  "name": "@ktmcp-cli/codat",
  "version": "1.0.0",
  "bin": {
    "codat": "./bin/codat.js"
  },
  "type": "module"
}
```

## Dependencies Graph

```
bin/codat.js
├── commander (CLI framework)
├── src/commands/*.js (all command modules)
│   ├── src/lib/api.js
│   │   ├── axios (HTTP client)
│   │   ├── ora (progress indicators)
│   │   └── src/lib/auth.js
│   │       └── src/lib/config.js
│   │           └── conf (config management)
│   └── src/lib/output.js
│       ├── chalk (colors)
│       └── table (table formatting)
```

## Build Process

The CLI doesn't require a build step (pure JavaScript/ESM):

1. Install dependencies: `npm install`
2. Link for development: `npm link`
3. Run: `codat --help`

For distribution:

1. Publish to npm: `npm publish`
2. Users install: `npm install -g @ktmcp-cli/codat`
3. Binary available globally as `codat`

## Testing Structure (Recommended)

```
tests/
├── unit/
│   ├── lib/
│   │   ├── api.test.js
│   │   ├── auth.test.js
│   │   ├── config.test.js
│   │   └── output.test.js
│   └── commands/
│       ├── companies.test.js
│       ├── invoices.test.js
│       └── ...
├── integration/
│   ├── authentication.test.js
│   ├── companies.test.js
│   └── ...
└── e2e/
    ├── onboarding.test.js
    ├── reporting.test.js
    └── ...
```

## Development Workflow

1. **Make changes**: Edit files in `src/`
2. **Test locally**: `node bin/codat.js [command]`
3. **Test as installed**: `npm link` then `codat [command]`
4. **Update docs**: Modify relevant .md files
5. **Version bump**: Update `package.json` version
6. **Publish**: `npm publish`

## File Size Summary

| Category | Files | Approx. Lines |
|----------|-------|---------------|
| Commands | 13 | 1,500 |
| Library | 4 | 780 |
| Entry Point | 1 | 60 |
| Documentation | 7 | 9,000+ |
| Config | 3 | 50 |
| **Total** | **28** | **11,400+** |

---

This structure provides a scalable, maintainable foundation for the Codat CLI with clear separation between UI, business logic, and documentation.
