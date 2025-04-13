/**
 * Test script for the recommended tenders API and refresh functionality
 * This script tests whether the API is properly fetching, processing, and storing tender data
 * 
 * Run with: node scripts/test-recommended-tenders.js
 */

const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const API_BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  username: 'hussam145',
  password: 'Testhusam@123'
};

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function printHeader(message) {
  const line = '-'.repeat(message.length + 4);
  console.log('\n' + line);
  log(`| ${message} |`, colors.green + colors.bright);
  console.log(line + '\n');
}

// Create a new axios instance with cookies enabled
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Login and get user session
async function login() {
  printHeader('Logging in to test account');
  
  try {
    const response = await api.post('/api/login', TEST_USER);
    log(`Successfully logged in as ${TEST_USER.username}`, colors.green);
    return response.data;
  } catch (error) {
    log(`Login failed: ${error.message}`, colors.red);
    if (error.response) {
      log(`Response status: ${error.response.status}`, colors.red);
      log(`Response data: ${JSON.stringify(error.response.data)}`, colors.red);
    }
    throw new Error('Login failed');
  }
}

// Test getting recommended tenders without refresh
async function testGetRecommendedTenders() {
  printHeader('Testing recommended tenders endpoint (no refresh)');
  
  try {
    const response = await api.get('/api/recommended-tenders');
    const tenders = response.data;
    
    log(`Successfully retrieved ${tenders.length} recommended tenders`, colors.green);
    
    if (tenders.length > 0) {
      log(`First tender: "${tenders[0].title}"`, colors.cyan);
      
      // Check if any tenders have match scores
      const tendersWithMatchScores = tenders.filter(tender => tender.matchScore !== null && tender.matchScore !== undefined);
      log(`Tenders with match scores: ${tendersWithMatchScores.length}`, colors.yellow);
      
      if (tendersWithMatchScores.length > 0) {
        log(`Match scores: ${tendersWithMatchScores.map(t => t.matchScore).join(', ')}`, colors.yellow);
      }
    }
    
    return tenders;
  } catch (error) {
    log(`Failed to get recommended tenders: ${error.message}`, colors.red);
    if (error.response) {
      log(`Response status: ${error.response.status}`, colors.red);
      log(`Response data: ${JSON.stringify(error.response.data)}`, colors.red);
    }
    return [];
  }
}

// Test forcing a refresh of recommended tenders
async function testForceRefreshRecommendedTenders() {
  printHeader('Testing force refresh of recommended tenders');
  
  try {
    console.time('API request time');
    const response = await api.get('/api/recommended-tenders?refresh=true');
    console.timeEnd('API request time');
    
    const tenders = response.data;
    
    log(`Successfully retrieved ${tenders.length} recommended tenders after force refresh`, colors.green);
    
    if (tenders.length > 0) {
      log(`First tender: "${tenders[0].title}"`, colors.cyan);
      
      // Check if any tenders have match scores
      const tendersWithMatchScores = tenders.filter(tender => tender.matchScore !== null && tender.matchScore !== undefined);
      log(`Tenders with match scores: ${tendersWithMatchScores.length}`, colors.yellow);
      
      if (tendersWithMatchScores.length > 0) {
        log(`Match scores: ${tendersWithMatchScores.map(t => t.matchScore).join(', ')}`, colors.yellow);
      }
      
      // Check if any tenders have rawData with similarity percentages
      const tendersWithRawData = tenders.filter(tender => tender.rawData && tender.rawData.includes('similarity_percentage'));
      log(`Tenders with similarity data in rawData: ${tendersWithRawData.length}`, colors.yellow);
      
      if (tendersWithRawData.length > 0) {
        for (const tender of tendersWithRawData.slice(0, 3)) {
          try {
            const rawData = JSON.parse(tender.rawData);
            if (rawData.similarity_percentage) {
              log(`Tender "${tender.title}" has similarity percentage: ${rawData.similarity_percentage}%`, colors.cyan);
            }
          } catch (e) {
            log(`Error parsing rawData for tender: ${e.message}`, colors.red);
          }
        }
      }
    }
    
    return tenders;
  } catch (error) {
    log(`Failed to refresh recommended tenders: ${error.message}`, colors.red);
    if (error.response) {
      log(`Response status: ${error.response.status}`, colors.red);
      log(`Response data: ${JSON.stringify(error.response.data)}`, colors.red);
    }
    return [];
  }
}

// Test the user profile to verify we have a good search query
async function testUserProfile() {
  printHeader('Testing user profile for search query construction');
  
  try {
    const response = await api.get('/api/user-profile');
    const profile = response.data;
    
    log(`User profile retrieved successfully`, colors.green);
    
    if (profile) {
      log(`User ID: ${profile.userId}`, colors.cyan);
      log(`Company Description: ${profile.companyDescription ? profile.companyDescription.substring(0, 100) + '...' : 'N/A'}`, colors.cyan);
      log(`Preferred Sectors: ${Array.isArray(profile.preferredSectors) ? profile.preferredSectors.join(', ') : 'N/A'}`, colors.cyan);
      log(`Skills: ${profile.skills || 'N/A'}`, colors.cyan);
      log(`Company Activities: ${profile.companyActivities ? (Array.isArray(profile.companyActivities) ? profile.companyActivities.join(', ') : profile.companyActivities) : 'N/A'}`, colors.cyan);
    }
    
    return profile;
  } catch (error) {
    log(`Failed to get user profile: ${error.message}`, colors.red);
    if (error.response) {
      log(`Response status: ${error.response.status}`, colors.red);
      log(`Response data: ${JSON.stringify(error.response.data)}`, colors.red);
    }
    return null;
  }
}

// Main test function
async function runTests() {
  try {
    // Login first
    await login();
    
    // Test user profile
    const profile = await testUserProfile();
    
    // Test getting recommended tenders without refresh
    const initialTenders = await testGetRecommendedTenders();
    
    // Test forcing a refresh
    const refreshedTenders = await testForceRefreshRecommendedTenders();
    
    // Compare results
    printHeader('Comparing before and after refresh');
    
    log(`Initial tenders count: ${initialTenders.length}`, colors.cyan);
    log(`Refreshed tenders count: ${refreshedTenders.length}`, colors.cyan);
    
    const initialIds = initialTenders.map(t => t.id);
    const newTenders = refreshedTenders.filter(t => !initialIds.includes(t.id));
    
    log(`New tenders after refresh: ${newTenders.length}`, colors.yellow);
    
    if (newTenders.length > 0) {
      log(`New tenders: ${newTenders.map(t => t.title).join(', ')}`, colors.green);
    }
    
    // Summary
    printHeader('Test Summary');
    if (refreshedTenders.length > initialTenders.length || newTenders.length > 0) {
      log(`✅ Test PASSED: New tenders were found after refresh`, colors.green + colors.bright);
    } else {
      const refreshMatchScores = refreshedTenders.filter(t => t.matchScore !== null && t.matchScore !== undefined).length;
      const initialMatchScores = initialTenders.filter(t => t.matchScore !== null && t.matchScore !== undefined).length;
      
      if (refreshMatchScores > initialMatchScores) {
        log(`✅ Test PASSED: More tenders have match scores after refresh`, colors.green + colors.bright);
      } else {
        log(`❌ Test FAILED: No new tenders or match scores after refresh`, colors.red + colors.bright);
        log(`Check logs on the server side for more information`, colors.yellow);
      }
    }
    
  } catch (error) {
    log(`Test error: ${error.message}`, colors.red + colors.bright);
  }
}

// Run the tests
runTests();