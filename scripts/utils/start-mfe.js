#!/usr/bin/env node
/**
 * Start Next.js dev server with port from centralized config
 * Usage: node scripts/dev-with-port.js <mfe-name>
 */

const { spawn } = require('child_process');

// Load TypeScript config
const { MFE_PORTS } = (() => {
  try {
    return require('../config/ports');
  } catch {
    require('tsx/cjs');
    return require('../config/ports.ts');
  }
})();

const mfeName = process.argv[2];
if (!mfeName) {
  console.error('Error: MFE name required');
  console.error('Usage: node scripts/dev-with-port.js <mfe-name>');
  process.exit(1);
}

// Map MFE names to port keys
const mfePortMap = {
  'mfe-shell': 'SHELL',
  'mfe-search': 'SEARCH',
  'mfe-wishlist': 'WISHLIST',
  'mfe-reviews': 'REVIEWS',
  'mfe-products': 'PRODUCTS',
  'mfe-cart': 'CART',
};

const portKey = mfePortMap[mfeName];
if (!portKey) {
  console.error(`Error: Unknown MFE "${mfeName}"`);
  console.error(`Valid MFEs: ${Object.keys(mfePortMap).join(', ')}`);
  process.exit(1);
}

const port = MFE_PORTS[portKey];
if (!port) {
  console.error(`Error: No port configured for ${portKey}`);
  process.exit(1);
}

// Determine command type (dev or start)
const command = process.argv[3] || 'dev';

// Start Next.js with the correct port
console.log(`Starting ${mfeName} on port ${port}...`);
const child = spawn('next', [command, '-p', port.toString()], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

child.on('exit', (code) => {
  process.exit(code);
});
