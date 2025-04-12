import cron from 'node-cron';
import axios from 'axios';
import { log } from '../server/vite.js';
import { db } from '../server/db.js';
import { scrapeLogs } from '../shared/schema.js';

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
    
    // Log to database
    try {
      await db.insert(scrapeLogs).values({
        sourceId: 1, // Assuming Etimad is source ID 1
        status: scrapingResult.success ? 'completed' : 'failed',
        totalTenders: scrapingResult.tendersCount,
        newTenders: scrapingResult.tendersCount, // Assume all are new for now
        errorMessage: !scrapingResult.success ? scrapingResult.message : null,
        details: { 
          automated: true,
          scheduler: true,
          message: scrapingResult.message,
          timestamp: scrapingResult.timestamp
        },
        startTime: new Date(Date.now() - 60000), // 1 minute ago
        endTime: new Date()
      });
      console.log('Scraping result logged to database');
    } catch (dbError) {
      console.error('Failed to log scraping result to database:', dbError.message);
    }
    
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