# Installation & Setup Guide

Complete guide to installing, configuring, and testing the Codat CLI.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [Post-Installation Setup](#post-installation-setup)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)
6. [Uninstallation](#uninstallation)

## Prerequisites

### Required
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)

### Optional
- **jq**: For JSON processing in scripts (`brew install jq` or `apt-get install jq`)
- **Git**: For installing from source

### Check Your Environment

```bash
# Check Node.js version
node --version
# Should output: v18.x.x or higher

# Check npm version
npm --version
# Should output: 8.x.x or higher
```

If you need to install or upgrade Node.js:
- **macOS**: `brew install node` or download from [nodejs.org](https://nodejs.org/)
- **Linux**: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs`
- **Windows**: Download installer from [nodejs.org](https://nodejs.org/)

## Installation Methods

### Method 1: NPM Global Install (Recommended)

Install the CLI globally so it's available from anywhere:

```bash
npm install -g @ktmcp-cli/codat
```

This installs the `codat` command globally on your system.

**Verify installation:**
```bash
codat --version
codat --help
```

### Method 2: NPM Project Dependency

Install as a project dependency:

```bash
# In your project directory
npm install @ktmcp-cli/codat

# Run via npx
npx codat --help

# Or add to package.json scripts
# "scripts": {
#   "codat": "codat"
# }
npm run codat -- --help
```

### Method 3: Install from Source (Development)

Clone and install from the repository:

```bash
# Clone repository
git clone https://github.com/your-org/codat-cli.git
cd codat-cli

# Install dependencies
npm install

# Link for global use (development mode)
npm link

# Verify
codat --version
```

**For development:**
```bash
# Make changes to the code
# Test immediately
node bin/codat.js --help

# Or use the linked command
codat --help
```

**To unlink:**
```bash
npm unlink -g @ktmcp-cli/codat
```

### Method 4: Docker (Containerized)

Create a Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm link

ENTRYPOINT ["codat"]
CMD ["--help"]
```

Build and run:

```bash
# Build image
docker build -t codat-cli .

# Run
docker run --rm \
  -e CODAT_API_KEY="your-api-key" \
  codat-cli companies list
```

## Post-Installation Setup

### 1. Get Your API Key

1. Go to [Codat Dashboard](https://app.codat.io/developers/api-keys)
2. Sign up or log in
3. Navigate to **Developers** → **API Keys**
4. Create a new API key or copy an existing one

### 2. Configure Authentication

**Option A: Interactive Login**
```bash
codat auth login
# Follow the prompts to enter your API key
```

**Option B: Command Line**
```bash
codat auth login YOUR_API_KEY_HERE
```

**Option C: Environment Variable**
```bash
export CODAT_API_KEY="YOUR_API_KEY_HERE"
```

Add to your shell profile for persistence:
```bash
# For bash
echo 'export CODAT_API_KEY="YOUR_API_KEY_HERE"' >> ~/.bashrc
source ~/.bashrc

# For zsh
echo 'export CODAT_API_KEY="YOUR_API_KEY_HERE"' >> ~/.zshrc
source ~/.zshrc
```

### 3. Verify Authentication

```bash
codat auth status
```

Expected output:
```
Authentication Status
──────────────────────────────────────────────────
✓ Authenticated
  API Key: YOUR****HERE
  Source: Config file
  Config: /Users/you/.config/codat-cli/config.json
```

### 4. Configure Preferences (Optional)

```bash
# Set default output format
codat auth config --output-format json

# Set default page size
codat auth config --page-size 50

# View all settings
codat auth config
```

## Verification

### Test Basic Functionality

```bash
# 1. Check version
codat --version

# 2. View help
codat --help

# 3. Test authentication
codat auth status

# 4. List companies (should return your companies or empty list)
codat companies list

# 5. Test a command with JSON output
codat companies list --format json
```

### Create Test Company

```bash
# Create a test company
codat companies create "Test Company $(date +%s)" --format json

# Copy the company ID from output, then
# List its connections (should be empty)
codat connections list COMPANY_ID
```

### Run Comprehensive Test

```bash
#!/bin/bash
# test-installation.sh

echo "Testing Codat CLI Installation..."

# Test 1: Version
echo -n "1. Version check... "
if codat --version > /dev/null 2>&1; then
  echo "✓"
else
  echo "✗"
  exit 1
fi

# Test 2: Authentication
echo -n "2. Authentication... "
if codat auth status > /dev/null 2>&1; then
  echo "✓"
else
  echo "✗"
  echo "Please configure authentication with: codat auth login"
  exit 1
fi

# Test 3: API Connection
echo -n "3. API connection... "
if codat companies list --format json > /dev/null 2>&1; then
  echo "✓"
else
  echo "✗"
  exit 1
fi

# Test 4: JSON Parsing
echo -n "4. JSON output... "
if codat companies list --format json | jq empty 2>/dev/null; then
  echo "✓"
else
  echo "✗ (jq not installed or invalid JSON)"
fi

echo ""
echo "All tests passed! ✓"
```

## Troubleshooting

### "Command not found: codat"

**Solution 1**: Check npm global bin directory
```bash
npm config get prefix
# Should output something like /usr/local

# Verify codat is installed
ls -la $(npm config get prefix)/bin/codat

# Add to PATH if needed
export PATH="$(npm config get prefix)/bin:$PATH"
```

**Solution 2**: Reinstall globally
```bash
npm uninstall -g @ktmcp-cli/codat
npm install -g @ktmcp-cli/codat
```

**Solution 3**: Use npx
```bash
npx @ktmcp-cli/codat --help
```

### "Permission denied" during installation

**macOS/Linux:**
```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g @ktmcp-cli/codat

# Option 2: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
npm install -g @ktmcp-cli/codat
```

### "API key not configured"

```bash
# Check current status
codat auth status

# If not authenticated, login
codat auth login YOUR_API_KEY

# Or set environment variable
export CODAT_API_KEY="YOUR_API_KEY"
```

### "Cannot find module" errors

```bash
# Reinstall dependencies
cd /path/to/codat-cli
npm install

# If installed globally, reinstall
npm uninstall -g @ktmcp-cli/codat
npm install -g @ktmcp-cli/codat
```

### "Unauthorized" or "401" errors

```bash
# Verify API key
codat auth status

# Test with new key
codat auth logout
codat auth login NEW_API_KEY

# Verify key is valid at https://app.codat.io/developers/api-keys
```

### Rate limit errors

```bash
# Check error message for retry-after time
# Wait the specified time, then retry

# For scripts, add delays between requests
sleep 1  # Wait 1 second between requests
```

## Uninstallation

### Remove Global Installation

```bash
# Uninstall CLI
npm uninstall -g @ktmcp-cli/codat

# Remove configuration (optional)
rm -rf ~/.config/codat-cli/

# Verify removal
codat --version
# Should output: command not found
```

### Remove Project Installation

```bash
# In your project directory
npm uninstall @ktmcp-cli/codat

# Remove from package.json if manually added
```

### Remove from Source

```bash
# Unlink
npm unlink -g @ktmcp-cli/codat

# Remove repository
rm -rf /path/to/codat-cli
```

## Updating

### Update Global Installation

```bash
# Update to latest version
npm update -g @ktmcp-cli/codat

# Or reinstall
npm uninstall -g @ktmcp-cli/codat
npm install -g @ktmcp-cli/codat

# Check new version
codat --version
```

### Update Project Installation

```bash
npm update @ktmcp-cli/codat

# Or specify version
npm install @ktmcp-cli/codat@latest
```

## Platform-Specific Notes

### macOS

**Using Homebrew (if available):**
```bash
# Install Node.js
brew install node

# Install CLI
npm install -g @ktmcp-cli/codat
```

**Permissions:**
- macOS might require admin privileges for global installs
- Consider using `~/.npm-global` approach (see troubleshooting)

### Linux (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install CLI
npm install -g @ktmcp-cli/codat

# If permission issues
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Windows

**Using Node.js installer:**
1. Download from [nodejs.org](https://nodejs.org/)
2. Run installer
3. Open Command Prompt or PowerShell
4. Run: `npm install -g @ktmcp-cli/codat`

**Using Windows Terminal:**
```powershell
# Install
npm install -g @ktmcp-cli/codat

# Run
codat --help
```

**Path issues:**
- Ensure npm global directory is in PATH
- Restart terminal after installation

## Next Steps

After successful installation:

1. **Read Quick Start**: [QUICKSTART.md](./QUICKSTART.md)
2. **Explore Examples**: [EXAMPLES.md](./EXAMPLES.md)
3. **Browse Documentation**: [README.md](./README.md)
4. **Create first company**: `codat companies create "My Company"`

## Support

If you encounter issues not covered here:

1. Check [README.md](./README.md) troubleshooting section
2. Review error messages carefully (they include hints)
3. Verify Node.js and npm versions
4. Try reinstalling with `npm install -g @ktmcp-cli/codat`

---

You're ready to use the Codat CLI! 🚀
