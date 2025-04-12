/**
 * Start the Etimad Tender Scraper Scheduler
 * 
 * This script runs the scheduler for scraping tender data from Etimad platform.
 * It's designed to be run as a separate process alongside the main application.
 */

// Register required environment variables
require('dotenv').config();

// Import the scheduler
require('./schedule-etimad-scraper');

console.log('Etimad Tender Scraper Scheduler started');
console.log('Press Ctrl+C to stop the scheduler');