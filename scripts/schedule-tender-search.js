import cron from 'node-cron';
import axios from 'axios';

// Simple logger function 
function log(message, source = "search-scheduler") {
  console.log(`${new Date().toLocaleTimeString()} [${source}] ${message}`);
}

// Function to run the tender search API
async function runTenderSearch() {
  try {
    log('Starting scheduled semantic tender search', 'search-scheduler');
    
    // Call our semantic search API endpoint
    const response = await axios.post('http://localhost:5000/api/search/run-tender-search', {}, {
      headers: {
        'X-API-Key': process.env.ETIMAD_SCRAPER_API_KEY || 'internal-scheduler',
        'Content-Type': 'application/json'
      }
    });
    
    log(`Semantic search completed: ${JSON.stringify(response.data)}`, 'search-scheduler');
    
    // Store the search result in a log
    const searchResult = {
      timestamp: new Date().toISOString(),
      success: response.data.success,
      message: response.data.message,
      profilesProcessed: response.data.profiles_processed || 0,
      tendersFound: response.data.tenders_found || 0
    };
    
    console.log('========== SEMANTIC SEARCH RESULT ==========');
    console.log(`Timestamp: ${searchResult.timestamp}`);
    console.log(`Success: ${searchResult.success}`);
    console.log(`Message: ${searchResult.message}`);
    console.log(`Profiles Processed: ${searchResult.profilesProcessed}`);
    console.log(`Tenders Found: ${searchResult.tendersFound}`);
    console.log('============================================');
    
    return searchResult;
  } catch (error) {
    log(`Error in scheduled tender search: ${error.message}`, 'search-scheduler');
    
    console.error('========== SEMANTIC SEARCH ERROR ==========');
    console.error(`Timestamp: ${new Date().toISOString()}`);
    console.error(`Error: ${error.message}`);
    console.error('============================================');
    
    return {
      timestamp: new Date().toISOString(),
      success: false,
      message: error.message,
      profilesProcessed: 0,
      tendersFound: 0
    };
  }
}

// Schedule the search task to run every 2 hours
// Cron format: second(0-59) minute(0-59) hour(0-23) day(1-31) month(1-12) day-of-week(0-6)
// 0 0 */2 * * * runs every 2 hours (at 0:00, 2:00, 4:00, etc.)
cron.schedule('0 0 */2 * * *', async () => {
  log('Running scheduled semantic tender search task', 'search-scheduler');
  await runTenderSearch();
});

// Optional: Run immediately when the script starts
(async () => {
  log('Initial semantic tender search on startup', 'search-scheduler');
  await runTenderSearch();
})();

// Keep the script running
log('Semantic search scheduler started, will run every 2 hours', 'search-scheduler');