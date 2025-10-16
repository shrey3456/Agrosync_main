#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

// Use provided PORT or fallback to 5173
const port = process.env.PORT || '5173';

// Use npm run preview which will invoke vite preview; this is more robust
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const args = ['run', 'preview', '--', '--host', '0.0.0.0', '--port', port];
const proc = spawn(npmCmd, args, { stdio: 'inherit' });
proc.on('close', (code) => process.exit(code));
