/**
 * This script tests the semantic search API endpoint.
 * It simulates a company profile and sends it to the API for tender matching.
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

async function testSemanticSearch() {
  printWithColor('TESTING SEMANTIC SEARCH API', colors.magenta, true);
  
  // Create a sample company profile
  const sampleProfile = {
    companyName: "Tech Solutions Arabia",
    companyDescription: "We specialize in providing IT infrastructure solutions, software development, and cybersecurity services to government entities and large corporations.",
    sectors: ["Information Technology", "Cybersecurity", "Software Development"],
    activities: ["IT Consulting", "System Integration", "Custom Software Development", "Cybersecurity Solutions"],
    specialization: "Government IT systems and secure infrastructure",
    companySize: "Medium",
    foundedYear: 2015,
    location: "Riyadh"
  };
  
  try {
    printWithColor('Sending request to semantic search API...', colors.blue);
    
    // Set up API key for authentication
    const apiKey = process.env.ETIMAD_SCRAPER_API_KEY || 'internal-scheduler';
    
    // Make the API call
    const response = await axios.post('http://localhost:5000/api/search/run-tender-search', 
      { profile: sampleProfile },
      { 
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      printWithColor('✓ API call successful!', colors.green);
      
      // Print the results
      printWithColor('Search Results:', colors.cyan);
      console.log('Profiles processed:', response.data.profiles_processed);
      console.log('Tenders found:', response.data.tenders_found);
      
      if (response.data.errors && response.data.errors.length > 0) {
        printWithColor('Errors:', colors.yellow);
        response.data.errors.forEach(error => console.log(`  - ${error}`));
      }
    } else {
      printWithColor('✗ API call failed!', colors.red);
      console.log('Error message:', response.data.message);
      
      if (response.data.errors) {
        printWithColor('Errors:', colors.yellow);
        response.data.errors.forEach(error => console.log(`  - ${error}`));
      }
    }
  } catch (error) {
    printWithColor('✗ Exception occurred!', colors.red);
    console.error('Error details:', error.response ? error.response.data : error.message);
  }
}

// Run the test
(async () => {
  try {
    await testSemanticSearch();
  } catch (error) {
    console.error('Unhandled error:', error);
  }
})();