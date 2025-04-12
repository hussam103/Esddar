import cron from 'node-cron';
import axios from 'axios';
import { log } from '../server/vite.js';

// Function to scrape tenders from Etimad API
async function scrapeTendersFromEtimad() {
  try {
    log('Starting scheduled Etimad tender scraping', 'scheduler');
    
    // Perform the API call to our Etimad scraper endpoint
    // Note: We use direct database access rather than the API to avoid authentication issues
    const response = await axios.post('http://localhost:5000/api/etimad/scrape-tenders', {}, {
      headers: {
        'X-API-Key': process.env.ETIMAD_SCRAPER_API_KEY || 'internal-scheduler',
        'Content-Type': 'application/json'
      }
    });
    
    log(`Etimad scraping completed: ${JSON.stringify(response.data)}`, 'scheduler');
    
    // Store the scraping result in a log file
    const scrapingResult = {
      timestamp: new Date().toISOString(),
      success: response.data.success,
      message: response.data.message,
      tendersCount: response.data.tenders_count || 0
    };
    
    console.log('========== ETIMAD SCRAPING RESULT ==========');
    console.log(`Timestamp: ${scrapingResult.timestamp}`);
    console.log(`Success: ${scrapingResult.success}`);
    console.log(`Message: ${scrapingResult.message}`);
    console.log(`Tenders Count: ${scrapingResult.tendersCount}`);
    console.log('============================================');
    
    return scrapingResult;
  } catch (error) {
    log(`Error in scheduled Etimad scraping: ${error.message}`, 'scheduler');
    
    console.error('========== ETIMAD SCRAPING ERROR ==========');
    console.error(`Timestamp: ${new Date().toISOString()}`);
    console.error(`Error: ${error.message}`);
    console.error('============================================');
    
    return {
      timestamp: new Date().toISOString(),
      success: false,
      message: error.message,
      tendersCount: 0
    };
  }
}

// Schedule the scraping task to run every 3 hours
// Cron format: second(0-59) minute(0-59) hour(0-23) day(1-31) month(1-12) day-of-week(0-6)
// * * */3 * * * runs every 3 hours (at 0:00, 3:00, 6:00, etc.)
cron.schedule('0 0 */3 * * *', async () => {
  log('Running scheduled Etimad tender scraping task', 'scheduler');
  await scrapeTendersFromEtimad();
});

// Optional: Run immediately when the script starts
(async () => {
  log('Initial Etimad tender scraping on startup', 'scheduler');
  await scrapeTendersFromEtimad();
})();

// Keep the script running
log('Etimad scraper scheduler started, will run every 3 hours', 'scheduler');