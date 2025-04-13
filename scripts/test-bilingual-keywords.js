/**
 * Test script for bilingual (Arabic/English) keyword generation
 * This script demonstrates how the system generates keywords in both languages
 */

import OpenAI from "openai";
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configuration
const SAVE_FILE = './bilingual-keywords-test.json';
const COMPANIES = [
  {
    name: "Tech Solutions Company",
    description: "A company providing IT services, cybersecurity solutions, and software development for government and private sectors.",
    industries: ["Information Technology", "Cybersecurity", "Software Development"],
    specializations: ["Government IT systems", "Secure infrastructure", "Custom applications"]
  },
  {
    name: "Construction Excellence Corp",
    description: "A construction company specializing in infrastructure projects, building development, and engineering services for public and private sectors.",
    industries: ["Construction", "Engineering", "Infrastructure"],
    specializations: ["Road infrastructure", "Government buildings", "Public facilities"]
  }
];

console.log('🔍 Testing Bilingual (Arabic/English) Keyword Generation');
console.log('=====================================================');

async function generateBilingualKeywords(company) {
  try {
    console.log(`\n📝 Generating keywords for: ${company.name}`);
    
    const prompt = `
Generate 10-15 relevant keywords in BOTH Arabic and English that best describe this company's services, 
technologies, expertise, and the types of government tenders they would be qualified for.

For each concept, provide both the English keyword and its Arabic equivalent.
These keywords will be used for matching the company with relevant government tenders in Saudi Arabia.

Company information:
Name: ${company.name}
Description: ${company.description}
Industries: ${company.industries.join(', ')}
Specializations: ${company.specializations.join(', ')}

Please respond with a JSON object in the following format:
{
  "keywords": [
    "English keyword 1 - الكلمة الرئيسية بالعربية 1",
    "English keyword 2 - الكلمة الرئيسية بالعربية 2",
    "..."
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model
      messages: [
        { 
          role: "system", 
          content: "You are an AI that generates bilingual keywords for company profiles. Generate keywords in both Arabic and English to match companies with government tenders in Saudi Arabia." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 1500
    });

    const content = completion.choices[0].message.content || "{}";
    const result = JSON.parse(content);
    
    console.log(`✅ Keywords generated successfully`);
    
    return {
      company: company.name,
      keywords: result.keywords || []
    };
  } catch (error) {
    console.error(`❌ Error generating keywords: ${error.message}`);
    if (error.response) {
      console.error('OpenAI API response:', error.response.data);
    }
    return {
      company: company.name,
      keywords: [],
      error: error.message
    };
  }
}

async function main() {
  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY environment variable is not set');
      console.error('Please set this variable in your .env file');
      process.exit(1);
    }
    
    console.log(`\n🔑 Using OpenAI API key: ${process.env.OPENAI_API_KEY.substring(0, 3)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 3)}`);
    
    // Generate keywords for test companies
    const results = [];
    
    for (const company of COMPANIES) {
      const result = await generateBilingualKeywords(company);
      
      // Display keywords
      if (result.keywords && result.keywords.length > 0) {
        console.log('\n📋 Generated keywords:');
        console.log('----------------------');
        result.keywords.forEach((keyword, index) => {
          console.log(`${index + 1}. ${keyword}`);
        });
      }
      
      results.push(result);
    }
    
    // Save results to file
    fs.writeFileSync(SAVE_FILE, JSON.stringify(results, null, 2));
    console.log(`\n💾 Test results saved to ${SAVE_FILE}`);
    
    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
main();