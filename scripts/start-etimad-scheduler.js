// Start Etimad Scheduler
// This script initializes the Etimad scheduler
// It is meant to be run as a standalone process

// Import the scheduler script to start the cron job
import './schedule-etimad-scraper.js';

console.log('Etimad scheduler started!');
console.log('Scraping will run automatically every 3 hours.');
console.log('Press Ctrl+C to stop the scheduler.');

// Keep the process running
setInterval(() => {
  const date = new Date();
  console.log(`Scheduler alive: ${date.toISOString()}`);
}, 3600000); // Log status every hour