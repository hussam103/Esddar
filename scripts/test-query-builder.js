/**
 * Test script for the AI-enhanced search query builder
 * This script tests the double-weighting of AI-generated keywords in search queries
 * 
 * Run with: node scripts/test-query-builder.js
 */

import axios from 'axios';
import fs from 'fs';
import util from 'util';

// Configuration
const BASE_URL = 'http://localhost:5000';
let authToken = null;

// Test credentials
const TEST_USER = {
  username: 'hussam1030',
  password: 'Hm@103037',
};

console.log('🔍 Testing AI-Enhanced Search Query Builder');
console.log('===========================================');
console.log('This test will check how AI-generated keywords are weighted in search queries');

async function login() {
  try {
    console.log(`\n📝 Logging in as ${TEST_USER.username}...`);
    const response = await axios.post(`${BASE_URL}/api/login`, TEST_USER);
    authToken = response.headers['set-cookie'][0];
    console.log(`✅ Login successful`);
    return response.data;
  } catch (error) {
    console.error(`❌ Login failed: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    }
    throw error;
  }
}

async function testQueryBuilder(userId) {
  console.log('\n📝 Testing search query builder...');
  
  try {
    // Get the user profile to access keywords
    console.log(`Getting user profile for ID ${userId}...`);
    const profileResponse = await axios.get(
      `${BASE_URL}/api/user-profile`,
      { headers: { Cookie: authToken } }
    );
    
    if (!profileResponse.data) {
      console.error('❌ Could not retrieve user profile');
      return;
    }
    
    const profile = profileResponse.data;
    console.log(`✅ Retrieved user profile for ${profile.companyName || 'Unknown Company'}`);
    
    // Now test the query builder
    console.log('\n📝 Testing search query generation with our new endpoint...');
    const response = await axios.post(
      `${BASE_URL}/api/test/build-search-query`,
      {},
      { headers: { Cookie: authToken } }
    );
    
    if (response.data && response.data.query) {
      console.log(`\n✅ Search query generated successfully`);
      console.log('\n📋 Query details:');
      console.log(`- Query length: ${response.data.query.length} characters`);
      console.log(`- Has keywords: ${response.data.hasKeywords ? 'Yes' : 'No'}`);
      console.log(`- Has queryData: ${response.data.hasQueryData ? 'Yes' : 'No'}`);
      
      // Print a sample of the query
      console.log('\n📝 Sample of generated query:');
      console.log('----------------------------');
      console.log(response.data.query.substring(0, 200) + '...');
      console.log('----------------------------');
      
      // Check keyword weighting if available
      if (response.data.hasKeywords && response.data.keywords && response.data.keywords.length > 0) {
        console.log('\n🔍 Analyzing keyword weighting in query:');
        
        const keywordCounts = {};
        response.data.keywords.forEach(keyword => {
          // Create regex to match the keyword (case insensitive)
          const regex = new RegExp(keyword, 'gi');
          const matches = (response.data.query.match(regex) || []).length;
          keywordCounts[keyword] = matches;
        });
        
        console.log('\nKeyword frequencies:');
        console.log('-------------------');
        let correctlyWeighted = 0;
        let totalKeywords = response.data.keywords.length;
        
        Object.entries(keywordCounts).forEach(([keyword, count]) => {
          const weightStatus = count >= 2 
            ? '✅ DOUBLE-WEIGHTED' 
            : (count === 1 ? '⚠️ SINGLE OCCURRENCE' : '❌ MISSING');
          
          if (count >= 2) correctlyWeighted++;
          
          console.log(`- "${keyword}": ${count} occurrences - ${weightStatus}`);
        });
        
        const weightPercentage = (correctlyWeighted / totalKeywords) * 100;
        console.log(`\n📊 Summary: ${correctlyWeighted} of ${totalKeywords} keywords are properly double-weighted (${weightPercentage.toFixed(1)}%)`);
        
        if (weightPercentage >= 80) {
          console.log('✅ PASS: Most keywords are correctly double-weighted');
        } else if (weightPercentage >= 50) {
          console.log('⚠️ PARTIAL: Some keywords are double-weighted, but not all');
        } else {
          console.log('❌ FAIL: Most keywords are not double-weighted properly');
        }
      } else {
        console.log('\n⚠️ No keywords available to test weighting');
      }
      
      // Save the full results to a file for detailed analysis
      const resultFile = './search-query-test-result.json';
      fs.writeFileSync(resultFile, JSON.stringify(response.data, null, 2));
      console.log(`\n💾 Full test results saved to ${resultFile}`);
      
      return response.data;
    } else {
      console.error('❌ Could not generate search query');
      if (response.data) {
        console.error('Response:', response.data);
      }
    }
  } catch (error) {
    console.error(`❌ Error testing query builder: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    }
  }
  
  return null;
}

async function main() {
  try {
    // Login first
    const user = await login();
    
    // Test the query builder
    const result = await testQueryBuilder(user.id);
    
    if (result) {
      console.log('\n✅ Test completed successfully');
    } else {
      console.log('\n❌ Test completed with errors');
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
main();