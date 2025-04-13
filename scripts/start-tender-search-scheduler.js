/**
 * Simple script to start the tender search scheduler
 * Run with: node scripts/start-tender-search-scheduler.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the scheduler script
const schedulerPath = path.join(__dirname, 'schedule-tender-search.js');

// Start the scheduler as a detached process
const scheduler = spawn('node', [schedulerPath], {
  detached: true,
  stdio: 'inherit'
});

console.log(`Starting tender search scheduler with PID ${scheduler.pid}`);

// Unref the child process so it can run independently
scheduler.unref();