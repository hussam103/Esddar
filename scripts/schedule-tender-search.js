/**
 * Scheduler for semantic search tender matching
 * 
 * This script will run a scheduled job to regularly search for new tenders
 * that match user company profiles using the Simple Semantic Search API.
 * 
 * It runs every 2 hours by default but can be configured via environment variables.
 */
import axios from 'axios';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

// Configure schedule using environment variables or defaults
const SEARCH_SCHEDULE = process.env.TENDER_SEARCH_SCHEDULE || '0 */2 * * *'; // Every 2 hours by default
const API_URL = process.env.API_URL || 'http://localhost:5000';
const API_KEY = process.env.ETIMAD_SCRAPER_API_KEY || 'internal-scheduler';

function log(message, source = "search-scheduler") {
  console.log(`${new Date().toLocaleTimeString()} [${source}] ${message}`);
}

/**
 * Run the semantic tender search via the API endpoint
 */
async function runTenderSearch() {
  try {
    log("Starting scheduled semantic tender search...");
    
    const response = await axios.post(`${API_URL}/api/search/run-tender-search`, 
      {}, // Empty request body - the endpoint will find all active user profiles
      {
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      log(`Search completed successfully. Processed ${response.data.profiles_processed} profiles and found ${response.data.tenders_found} tenders.`);
      
      if (response.data.errors && response.data.errors.length > 0) {
        log(`Completed with warnings:`);
        response.data.errors.forEach(error => log(`- ${error}`));
      }
    } else {
      log(`Search failed: ${response.data.message}`);
      
      if (response.data.errors) {
        response.data.errors.forEach(error => log(`- ${error}`));
      }
    }
  } catch (error) {
    log(`Error running tender search: ${error.message}`);
    if (error.response) {
      log(`Response status: ${error.response.status}`);
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
  }
}

// Run the scheduler
log(`Starting tender search scheduler with schedule: ${SEARCH_SCHEDULE}`);

// Run once immediately on startup
runTenderSearch();

// Then schedule for regular runs
cron.schedule(SEARCH_SCHEDULE, () => {
  runTenderSearch();
});

log('Tender search scheduler is running...');