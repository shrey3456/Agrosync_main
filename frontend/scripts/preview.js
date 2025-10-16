#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

// Use provided PORT or fallback to 5173
const port = process.env.PORT || '5173';

// Resolve Vite CLI script inside installed node_modules
let viteCli;
try {
  viteCli = require.resolve('vite/dist/node/cli.js', { paths: [process.cwd()] });
} catch (err) {
  // fallback to looking for vite in node_modules/.bin via `npx` (should rarely be needed)
  viteCli = null;
}

const args = [];
if (viteCli) {
  // Invoke Node with the vite CLI script
  args.push(viteCli, 'preview', '--host', '0.0.0.0', '--port', port);
  const proc = spawn(process.execPath, args, { stdio: 'inherit' });
  proc.on('close', (code) => process.exit(code));
} else {
  // Fallback to running `npx vite preview` if resolve failed
  const proc = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', 'preview', '--host', '0.0.0.0', '--port', port], { stdio: 'inherit' });
  proc.on('close', (code) => process.exit(code));
}
