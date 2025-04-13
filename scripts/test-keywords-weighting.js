/**
 * Test script for the keyword weighting in the search query builder
 * This script tests how AI-generated keywords are double-weighted in search queries
 */

import axios from 'axios';
import fs from 'fs';

// Configuration
const BASE_URL = 'http://localhost:5000';

// Test profile with keywords
const TEST_PROFILE = {
  companyName: "Test Cybersecurity Company",
  companyDescription: "A test company providing advanced cybersecurity solutions",
  businessType: "Technology",
  activities: ["Security consulting", "Penetration testing", "Security audits"],
  mainIndustries: ["Cybersecurity", "Information Technology"],
  specializations: ["Network security", "Cloud security", "Data protection"],
  keywords: ["cybersecurity", "network protection", "data encryption", "cloud security", "penetration testing"]
};

// Login credentials
const TEST_USER = {
  username: 'hussam1030',
  password: 'Hm@103037',
};

console.log('🔍 Testing Keyword Weighting in Search Queries');
console.log('===============================================');

async function login() {
  try {
    console.log(`\n📝 Logging in as ${TEST_USER.username}...`);
    const response = await axios.post(`${BASE_URL}/api/login`, TEST_USER);
    console.log(`✅ Login successful`);
    return {
      user: response.data,
      authToken: response.headers['set-cookie'][0]
    };
  } catch (error) {
    console.error(`❌ Login failed: ${error.message}`);
    process.exit(1);
  }
}

async function testKeywordWeighting(authToken) {
  try {
    console.log('\n📝 Testing search query generation with custom profile...');
    
    // Send the test profile to the API
    const response = await axios.post(
      `${BASE_URL}/api/test/build-search-query`,
      { profile: TEST_PROFILE },
      { 
        headers: { 
          Cookie: authToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    if (response.status !== 200 || !response.data.query) {
      console.error('❌ Failed to generate search query');
      console.error('Response:', response.data);
      return;
    }
    
    const result = response.data;
    console.log(`\n✅ Search query generated successfully (${result.query.length} characters)`);
    
    // Print the query
    console.log('\n📝 Generated search query:');
    console.log('------------------------');
    console.log(result.query);
    console.log('------------------------');
    
    // Check keyword weighting
    console.log('\n🔍 Analyzing keyword frequency in the query:');
    const keywordOccurrences = {};
    let totalKeywords = TEST_PROFILE.keywords.length;
    let doubleWeightedCount = 0;
    
    TEST_PROFILE.keywords.forEach(keyword => {
      // Create a regex to find all occurrences of the keyword
      const regex = new RegExp(keyword, 'gi');
      const matches = (result.query.match(regex) || []).length;
      keywordOccurrences[keyword] = matches;
      
      const status = matches >= 2 
        ? '✅ DOUBLE-WEIGHTED' 
        : (matches === 1 ? '⚠️ SINGLE OCCURRENCE' : '❌ MISSING');
      
      if (matches >= 2) doubleWeightedCount++;
      
      console.log(`- "${keyword}": ${matches} occurrences - ${status}`);
    });
    
    // Calculate effectiveness
    const weightingEffectiveness = Math.round((doubleWeightedCount / totalKeywords) * 100);
    console.log(`\n📊 Weighting effectiveness: ${doubleWeightedCount}/${totalKeywords} keywords are double-weighted (${weightingEffectiveness}%)`);
    
    if (weightingEffectiveness >= 80) {
      console.log('✅ PASS: Keyword double-weighting is working correctly');
    } else if (weightingEffectiveness >= 50) {
      console.log('⚠️ PARTIAL: Some keywords are double-weighted, but not all');
    } else {
      console.log('❌ FAIL: Keyword double-weighting is not working as expected');
    }
    
    // Save the result to a file
    fs.writeFileSync('./keyword-weighting-test.json', JSON.stringify({
      query: result.query,
      keywords: TEST_PROFILE.keywords,
      keywordOccurrences,
      weightingEffectiveness
    }, null, 2));
    
    console.log('\n💾 Test results saved to keyword-weighting-test.json');
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    }
  }
}

async function main() {
  const { authToken } = await login();
  await testKeywordWeighting(authToken);
  console.log('\n✅ Test completed');
}

main();