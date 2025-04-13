/**
 * Simple script to start the tender search scheduler
 * Run with: node scripts/start-tender-search-scheduler.js
 */
require('dotenv').config();
require('tsx/cjs').loadTsx(require.resolve('./schedule-tender-search.js'));

console.log('Tender search scheduler script started. Press Ctrl+C to exit.');