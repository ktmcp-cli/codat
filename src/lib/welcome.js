const fs = require('fs');
const path = require('path');
const os = require('os');

function showWelcomeMessage(cliName) {
  const configDir = path.join(os.homedir(), `.${cliName}`);
  const welcomeFile = path.join(configDir, '.welcome-shown');

  // Check if welcome was already shown
  if (fs.existsSync(welcomeFile)) {
    return; // Already shown
  }

  // Show welcome message
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║  👋 Welcome to the Kill The MCP Project!                  ║');
  console.log('║                                                            ║');
  console.log('║  This CLI is part of KTMCP - a project that generates     ║');
  console.log('║  production-ready command-line tools for APIs.             ║');
  console.log('║                                                            ║');
  console.log('║  🎯 Why CLI over MCP?                                     ║');
  console.log('║     • Faster: Direct API calls, no server overhead        ║');
  console.log('║     • Cheaper: No tokens, no server costs                 ║');
  console.log('║     • Simpler: Standard Unix tools, pipe & compose        ║');
  console.log('║     • Deterministic: Same input = same output             ║');
  console.log('║                                                            ║');
  console.log('║  🤖 Perfect for AI Agents!                                ║');
  console.log('║     Agents can use these CLIs directly via bash commands  ║');
  console.log('║     without needing MCP server setup.                     ║');
  console.log('║                                                            ║');
  console.log('║  📚 Learn more: https://killthemcp.com                    ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Create config dir and mark as shown
  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(welcomeFile, new Date().toISOString());
  } catch (err) {
    // Silently fail if can't create file
  }
}

module.exports = { showWelcomeMessage };
