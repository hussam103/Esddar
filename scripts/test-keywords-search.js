/**
 * Test script for the AI-generated keywords feature and enhanced search
 * 
 * This script tests the implementation of AI-generated keywords and their
 * use in the tender search algorithm with enhanced weighting.
 * 
 * Run with: node scripts/test-keywords-search.js
 */

import axios from 'axios';
import colors from 'colors/safe';
import { pool } from '../server/db.js';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../shared/schema.js';

const db = drizzle({ client: pool, schema });
const { userProfiles } = schema;

// Config
const BASE_URL = 'http://localhost:5000';
let authToken = null;

// Test user credentials
const TEST_USER = {
  username: 'hussam1030',
  password: 'Hm@103037',
};

function log(message, color = colors.white) {
  console.log(color(message));
}

function printHeader(message) {
  console.log('\n' + colors.cyan.bold('='.repeat(80)));
  console.log(colors.cyan.bold('  ' + message));
  console.log(colors.cyan.bold('='.repeat(80)) + '\n');
}

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/login`, TEST_USER);
    authToken = response.headers['set-cookie'][0];
    log(`✅ Successfully logged in as ${TEST_USER.username}`, colors.green);
    return response.data;
  } catch (error) {
    log(`❌ Login failed: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * Get a user profile and check if it has AI-generated keywords
 */
async function checkUserProfile(userId) {
  printHeader('Testing User Profile for AI-Generated Keywords');
  
  try {
    // Check directly in the database
    const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    
    if (profile && profile.length > 0) {
      log(`Found user profile for userId: ${userId}`, colors.green);
      
      // Check if profile has keywords field populated
      const keywords = profile[0].keywords;
      
      if (keywords && Array.isArray(keywords) && keywords.length > 0) {
        log(`✅ Profile has ${keywords.length} AI-generated keywords:`, colors.green);
        log(JSON.stringify(keywords, null, 2), colors.yellow);
      } else {
        log(`⚠️ Profile doesn't have any AI-generated keywords`, colors.yellow);
      }
      
      // Check if queryData field exists and contains content
      if (profile[0].queryData) {
        log(`✅ Profile has queryData field populated (${profile[0].queryData.length} characters)`, colors.green);
        log(`First 200 characters of queryData: "${profile[0].queryData.substring(0, 200)}..."`, colors.gray);
      } else {
        log(`⚠️ Profile doesn't have queryData field populated`, colors.yellow);
      }
      
      return profile[0];
    } else {
      log(`❌ Could not find user profile for userId: ${userId}`, colors.red);
      return null;
    }
  } catch (error) {
    log(`❌ Error checking user profile: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * Test the tender search with keyword enhancement
 */
async function testKeywordEnhancedSearch(profile) {
  printHeader('Testing Enhanced Tender Search with AI-Generated Keywords');
  
  if (!profile) {
    log(`❌ No profile available for testing search`, colors.red);
    return;
  }
  
  try {
    log(`Performing search with user profile...`, colors.cyan);
    
    // Test the search API
    const response = await axios.post(
      `${BASE_URL}/api/refresh-recommended-tenders`,
      {},
      { headers: { Cookie: authToken } }
    );
    
    if (response.status === 200 && response.data.success) {
      log(`✅ Search successful - found ${response.data.count || 0} tenders`, colors.green);
      
      // Log the first few results
      if (response.data.results && response.data.results.length > 0) {
        log(`First 3 search results:`, colors.cyan);
        
        for (let i = 0; i < Math.min(3, response.data.results.length); i++) {
          const tender = response.data.results[i];
          log(`\n${i+1}. ${tender.title || 'Untitled'}`, colors.yellow.bold);
          log(`   Agency: ${tender.agency || 'Unknown'}`, colors.yellow);
          log(`   Match score: ${tender.matchScore || 'N/A'}`, colors.yellow);
          log(`   Category: ${tender.category || 'Unknown'}`, colors.gray);
        }
      } else {
        log(`No tender results returned`, colors.yellow);
      }
    } else {
      log(`❌ Search failed: ${response.data.message || 'Unknown error'}`, colors.red);
    }
  } catch (error) {
    log(`❌ Error testing search: ${error.message}`, colors.red);
    console.error(error.response?.data || error);
  }
}

/**
 * Check profile completeness with keywords impact
 */
async function checkProfileCompleteness(userId) {
  printHeader('Testing Profile Completeness with Keywords');
  
  try {
    // Get the user to check profile completeness
    const response = await axios.get(
      `${BASE_URL}/api/user`,
      { headers: { Cookie: authToken } }
    );
    
    if (response.status === 200) {
      const user = response.data;
      log(`User profile completeness: ${user.profileCompleteness}%`, colors.green);
      
      // Check which factors contribute to the completeness
      const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
      
      if (profile && profile.length > 0) {
        const p = profile[0];
        log(`Profile completeness factors:`, colors.cyan);
        
        const factors = [
          { name: 'Company Description', value: p.companyDescription ? '✅ Present' : '❌ Missing', score: p.companyDescription ? 15 : 0 },
          { name: 'Business Type', value: p.businessType ? '✅ Present' : '❌ Missing', score: p.businessType ? 10 : 0 },
          { name: 'Company Activities', value: p.companyActivities.length > 0 ? `✅ ${p.companyActivities.length} items` : '❌ Empty', score: p.companyActivities.length > 0 ? 10 : 0 },
          { name: 'Main Industries', value: p.mainIndustries.length > 0 ? `✅ ${p.mainIndustries.length} items` : '❌ Empty', score: p.mainIndustries.length > 0 ? 10 : 0 },
          { name: 'Specializations', value: p.specializations.length > 0 ? `✅ ${p.specializations.length} items` : '❌ Empty', score: p.specializations.length > 0 ? 10 : 0 },
          { name: 'AI-Generated Keywords', value: p.keywords.length > 0 ? `✅ ${p.keywords.length} keywords` : '❌ Empty', score: p.keywords.length > 0 ? 10 : 0 },
          { name: 'Base Score (document uploaded)', value: '✅ Base Score', score: 30 },
        ];
        
        let totalScore = 0;
        factors.forEach(factor => {
          log(`  - ${factor.name}: ${factor.value} (+${factor.score}%)`, factor.score > 0 ? colors.green : colors.gray);
          totalScore += factor.score;
        });
        
        log(`\nCalculated completeness: ${Math.min(totalScore, 100)}%`, colors.yellow.bold);
        log(`Actual user completeness: ${user.profileCompleteness}%`, colors.yellow.bold);
        
        if (Math.min(totalScore, 100) === user.profileCompleteness) {
          log(`✅ Profile completeness calculation matches the expected value`, colors.green.bold);
        } else {
          log(`❌ Profile completeness calculation doesn't match! Expected ${Math.min(totalScore, 100)}%, got ${user.profileCompleteness}%`, colors.red.bold);
        }
      }
    } else {
      log(`❌ Could not get user data: Status ${response.status}`, colors.red);
    }
  } catch (error) {
    log(`❌ Error checking profile completeness: ${error.message}`, colors.red);
    console.error(error.response?.data || error);
  }
}

/**
 * Test the query builder function
 */
async function testQueryBuilder(profile) {
  printHeader('Testing Search Query Builder with Keywords');
  
  if (!profile) {
    log(`❌ No profile available for testing query builder`, colors.red);
    return;
  }
  
  try {
    // Get the search query that would be built using our new test endpoint
    const response = await axios.post(
      `${BASE_URL}/api/test/build-search-query`,
      {},
      { headers: { Cookie: authToken } }
    );
    
    if (response.status === 200 && response.data.query) {
      log(`Search query built for profile:`, colors.green);
      log(response.data.query, colors.yellow);
      
      // Check if keywords appear twice in the query (double-weighted)
      if (profile.keywords && profile.keywords.length > 0) {
        const keywordCount = {};
        profile.keywords.forEach(keyword => {
          const regex = new RegExp(keyword, 'gi');
          const matches = (response.data.query.match(regex) || []).length;
          keywordCount[keyword] = matches;
        });
        
        log(`\nKeyword frequency in search query:`, colors.cyan);
        Object.entries(keywordCount).forEach(([keyword, count]) => {
          log(`  - "${keyword}": appears ${count} time(s)`, count >= 2 ? colors.green : colors.yellow);
          
          if (count >= 2) {
            log(`    ✅ Keyword is properly weighted in the search query`, colors.green);
          } else if (count === 1) {
            log(`    ⚠️ Keyword is present but not double-weighted`, colors.yellow);
          } else {
            log(`    ❌ Keyword is missing from the search query`, colors.red);
          }
        });
      } else {
        log(`No keywords available to check in the search query`, colors.yellow);
      }
    } else {
      log(`❌ Could not get search query: ${response.data.message || 'Unknown error'}`, colors.red);
    }
  } catch (error) {
    // If the test endpoint doesn't exist, we'll inform the user
    if (error.response && error.response.status === 404) {
      log(`❌ The /api/test/build-search-query endpoint doesn't exist.`, colors.red);
      log(`This endpoint should already be added to server/routes.ts`, colors.yellow);
      log(`Make sure the endpoint exists and is accessible.`, colors.yellow);
    } else {
      log(`❌ Error testing query builder: ${error.message}`, colors.red);
      console.error(error.response?.data || error);
    }
  }
}

async function runTests() {
  try {
    // Login first
    const user = await login();
    
    // Check if the user profile has AI-generated keywords
    const profile = await checkUserProfile(user.id);
    
    // Test the search functionality with keywords
    await testKeywordEnhancedSearch(profile);
    
    // Check profile completeness with keywords
    await checkProfileCompleteness(user.id);
    
    // Test the query builder
    await testQueryBuilder(profile);
    
    // Close the database connection
    await pool.end();
    
    log('\n✅ All tests completed', colors.green.bold);
  } catch (error) {
    log(`\n❌ Tests failed: ${error.message}`, colors.red.bold);
    
    // Make sure to close the database connection
    try {
      await pool.end();
    } catch (e) {
      // Ignore errors when closing the pool
    }
    
    process.exit(1);
  }
}

// Run all tests
runTests();