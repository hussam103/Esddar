/**
 * Test script for the Etimad Tender Scraper API integration
 * 
 * This script tests the connection to the Etimad Tender Scraper API
 * and verifies that data can be successfully fetched and processed.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { log } from '../server/vite';

// Load environment variables
dotenv.config();

// Base URL for the Etimad API
const ETIMAD_API_URL = process.env.ETIMAD_API_URL || 'http://localhost:3000';

// Test configuration
const TEST_PAGE = 1;
const TEST_PAGE_SIZE = 5;
const TEST_TENDER_ID = '123456'; // Replace with a valid tender ID if available

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Helper to print colored output
function printWithColor(message: string, color: string, isHeader = false): void {
  if (isHeader) {
    console.log('\n' + color + '=====================================' + colors.reset);
    console.log(color + message + colors.reset);
    console.log(color + '=====================================' + colors.reset);
  } else {
    console.log(color + message + colors.reset);
  }
}

// Test the Scrape Tenders API
async function testScrapeTenders(): Promise<void> {
  printWithColor('Testing Scrape Tenders API', colors.fg.green, true);
  
  try {
    printWithColor(`GET ${ETIMAD_API_URL}/api/scrape-tenders?page=${TEST_PAGE}&page_size=${TEST_PAGE_SIZE}`, colors.fg.yellow);
    
    const response = await axios.get(`${ETIMAD_API_URL}/api/scrape-tenders`, {
      params: {
        page: TEST_PAGE,
        page_size: TEST_PAGE_SIZE,
      }
    });
    
    if (response.data && Array.isArray(response.data)) {
      printWithColor(`Successfully fetched ${response.data.length} tenders`, colors.fg.green);
      
      if (response.data.length > 0) {
        printWithColor('Sample tender:', colors.fg.cyan);
        console.log(JSON.stringify(response.data[0], null, 2));
      } else {
        printWithColor('No tenders returned', colors.fg.yellow);
      }
    } else {
      printWithColor(`Invalid response format: ${JSON.stringify(response.data)}`, colors.fg.red);
    }
  } catch (error: any) {
    printWithColor(`Error: ${error.message}`, colors.fg.red);
    if (error.response) {
      printWithColor(`Response data: ${JSON.stringify(error.response.data)}`, colors.fg.red);
      printWithColor(`Response status: ${error.response.status}`, colors.fg.red);
    }
  }
}

// Test the Tender Details API
async function testTenderDetails(): Promise<void> {
  printWithColor('Testing Tender Details API', colors.fg.green, true);
  
  try {
    printWithColor(`GET ${ETIMAD_API_URL}/api/tender-details/${TEST_TENDER_ID}`, colors.fg.yellow);
    
    const response = await axios.get(`${ETIMAD_API_URL}/api/tender-details/${TEST_TENDER_ID}`);
    
    if (response.data) {
      printWithColor('Successfully fetched tender details', colors.fg.green);
      printWithColor('Tender details:', colors.fg.cyan);
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      printWithColor(`Invalid response format: ${JSON.stringify(response.data)}`, colors.fg.red);
    }
  } catch (error: any) {
    printWithColor(`Error: ${error.message}`, colors.fg.red);
    if (error.response) {
      printWithColor(`Response data: ${JSON.stringify(error.response.data)}`, colors.fg.red);
      printWithColor(`Response status: ${error.response.status}`, colors.fg.red);
    }
  }
}

// Test the Paginated Tenders API
async function testPaginatedTenders(): Promise<void> {
  printWithColor('Testing Paginated Tenders API', colors.fg.green, true);
  
  try {
    printWithColor(`GET ${ETIMAD_API_URL}/api/tenders?page=${TEST_PAGE}&page_size=${TEST_PAGE_SIZE}`, colors.fg.yellow);
    
    const response = await axios.get(`${ETIMAD_API_URL}/api/tenders`, {
      params: {
        page: TEST_PAGE,
        page_size: TEST_PAGE_SIZE,
      }
    });
    
    if (response.data) {
      printWithColor('Successfully fetched paginated tenders', colors.fg.green);
      
      if (response.data.tenders && response.data.tenders.length > 0) {
        printWithColor(`Total tenders: ${response.data.totalCount || 'unknown'}`, colors.fg.cyan);
        printWithColor(`Returned tenders: ${response.data.tenders.length}`, colors.fg.cyan);
        printWithColor('Sample tender:', colors.fg.cyan);
        console.log(JSON.stringify(response.data.tenders[0], null, 2));
      } else {
        printWithColor('No tenders returned', colors.fg.yellow);
      }
    } else {
      printWithColor(`Invalid response format: ${JSON.stringify(response.data)}`, colors.fg.red);
    }
  } catch (error: any) {
    printWithColor(`Error: ${error.message}`, colors.fg.red);
    if (error.response) {
      printWithColor(`Response data: ${JSON.stringify(error.response.data)}`, colors.fg.red);
      printWithColor(`Response status: ${error.response.status}`, colors.fg.red);
    }
  }
}

// Test the Etimad API integration
async function main(): Promise<void> {
  printWithColor('ETIMAD TENDER SCRAPER API TEST', colors.fg.magenta, true);
  printWithColor(`Using API URL: ${ETIMAD_API_URL}`, colors.fg.cyan);
  
  // Test each API endpoint
  await testScrapeTenders();
  await testTenderDetails();
  await testPaginatedTenders();
  
  printWithColor('TEST COMPLETE', colors.fg.magenta, true);
}

// Run the test
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});