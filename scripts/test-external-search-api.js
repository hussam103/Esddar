/**
 * This script tests the external Simple Tender Search API.
 * It makes a direct request to the API to verify it's working properly.
 */
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function printWithColor(message, color, isHeader = false) {
  const prefix = isHeader ? '\n' : '';
  console.log(`${prefix}${color}${message}${colors.reset}`);
}

async function testExternalSearchAPI() {
  printWithColor('TESTING EXTERNAL SIMPLE TENDER SEARCH API', colors.magenta, true);
  
  // Get the API base URL from environment variable or use the default
  const apiBaseUrl = process.env.SIMPLE_TENDER_SEARCH_API_URL || 'https://esddar-api.replit.app';
  const searchQuery = 'medical equipment';
  const limit = 2;
  
  try {
    printWithColor(`Sending request to ${apiBaseUrl}/api/v1/search?q=${searchQuery}&limit=${limit}...`, colors.blue);
    
    // Make the API call
    const response = await axios.get(`${apiBaseUrl}/api/v1/search`, {
      params: {
        q: searchQuery,
        limit: limit,
        active_only: true
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (response.data && response.data.success) {
      printWithColor('✓ API call successful!', colors.green);
      
      // Print the results
      printWithColor('Search Results:', colors.cyan);
      console.log('Query:', response.data.query);
      console.log('Count:', response.data.count);
      console.log('Active only:', response.data.active_only);
      
      // Print brief summary of each result
      if (response.data.results && response.data.results.length > 0) {
        printWithColor('Tenders found:', colors.yellow);
        response.data.results.forEach((tender, index) => {
          console.log(`${index + 1}. ${tender.tender_name} (${tender.similarity_percentage}% match)`);
          console.log(`   Agency: ${tender.agency_name}`);
          console.log(`   ID: ${tender.tender_id}`);
          console.log(`   Submission Date: ${tender.submission_date}`);
          console.log('');
        });
      } else {
        printWithColor('No tenders found matching the query.', colors.yellow);
      }
    } else {
      printWithColor('✗ API call failed!', colors.red);
      console.log('Error message:', response.data.message);
    }
  } catch (error) {
    printWithColor('✗ Exception occurred!', colors.red);
    console.error('Error details:', error.response ? error.response.data : error.message);
    
    if (error.response) {
      console.log('Status code:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
}

// Run the test
(async () => {
  try {
    await testExternalSearchAPI();
  } catch (error) {
    console.error('Unhandled error:', error);
  }
})();