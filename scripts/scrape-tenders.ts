import axios from 'axios';
import * as cheerio from 'cheerio';
import { pool, db } from '../server/db';
import { tenders } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Function to get the CSRF token
async function getCSRFToken(): Promise<string | null> {
  try {
    console.log('Getting CSRF token...');
    const response = await axios.get('https://tenders.etimad.sa/Tender/AllTendersForVisitor', {
      headers: {
        'Accept-Language': 'ar',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      }
    });
    
    const $ = cheerio.load(response.data);
    const csrfToken = $('input[name="__RequestVerificationToken"]').val() as string;
    console.log('CSRF Token:', csrfToken);
    return csrfToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    return null;
  }
}

// Function to scrape the tenders
async function scrapeTenders(pageNumber: number = 1, pageSize: number = 50): Promise<any[]> {
  try {
    console.log(`Scraping page ${pageNumber} with pageSize ${pageSize}...`);
    
    // Using the direct API endpoint as provided
    const timestamp = new Date().getTime();
    const url = `https://tenders.etimad.sa/Tender/AllSupplierTendersForVisitorAsync?PageSize=${pageSize}&PageNumber=${pageNumber}&_=${timestamp}`;
    
    console.log(`Fetching from URL: ${url}`);
    
    // Make the request
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'ar,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Referer': 'https://tenders.etimad.sa/Tender/AllTendersForVisitor',
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('Response status:', response.status);
    
    // Check if we have data
    if (response.data && Array.isArray(response.data.data)) {
      console.log(`Found ${response.data.data.length} tenders in the response`);
      return response.data.data;
    } else {
      console.log('Response data structure:', JSON.stringify(response.data).substring(0, 200) + '...');
      return [];
    }
  } catch (error: any) {
    console.error('Error scraping tenders:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return [];
  }
}

// Function to get tender details
async function getTenderDetails(tenderIdString: string): Promise<any> {
  try {
    console.log(`Getting details for tender ID: ${tenderIdString}`);
    
    // Using the updated URL format for tender details
    const url = `https://tenders.etimad.sa/Tender/DetailsForVisitor?STenderId=${encodeURIComponent(tenderIdString)}`;
    
    console.log(`Fetching details from URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Referer': 'https://tenders.etimad.sa/Tender/AllTendersForVisitor',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    // Parse the HTML response to extract detailed information
    const $ = cheerio.load(response.data);
    
    // Extract tender details using the updated selectors from Etimad website
    const tenderDetails = {
      title: $('.tender-title').text().trim() || $('.info_header .head').text().trim(),
      agency: $('.agency-name').text().trim() || $('.block_header-entity').text().trim(),
      description: $('.tender-description').text().trim() || $('.info_header .body').text().trim(),
      requirements: $('.requirements').text().trim() || '',
      location: $('.tender-location').text().trim() || '',
      // Add more fields as needed
    };
    
    console.log('Extracted tender details:', tenderDetails);
    return tenderDetails;
  } catch (error: any) {
    console.error(`Error getting details for tender ID ${tenderIdString}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data?.substring?.(0, 200) || error.response.data);
    }
    return null;
  }
}

// Function to save tenders to the database
async function saveTendersToDatabase(tendersData: any[]): Promise<void> {
  try {
    console.log(`Saving ${tendersData.length} tenders to database...`);
    
    let savedCount = 0;
    let skippedCount = 0;
    
    for (const tender of tendersData) {
      try {
        // Log the tender data structure to understand the format
        console.log('Processing tender:', JSON.stringify(tender).substring(0, 300) + '...');
        
        // Based on the sample JSON you provided, adjust the field names
        const bidNumber = tender.referenceNumber || tender.tenderNumber || `ET-${Date.now()}`;
        
        // Check if the tender already exists in the database
        const existingTender = await db.select().from(tenders).where(eq(tenders.bidNumber, bidNumber)).limit(1);
        
        if (existingTender.length > 0) {
          console.log(`Tender with bid number ${bidNumber} already exists, skipping.`);
          skippedCount++;
          continue;
        }
        
        // For details we could get more info, but for now we'll use what we have
        // const details = await getTenderDetails(tender.tenderIdString);
        
        // Parse dates properly
        let deadline;
        try {
          deadline = new Date(tender.lastOfferPresentationDate);
          if (isNaN(deadline.getTime())) {
            console.log(`Invalid date format for deadline: ${tender.lastOfferPresentationDate}, using current date + 30 days`);
            deadline = new Date();
            deadline.setDate(deadline.getDate() + 30);
          }
        } catch (e) {
          console.log(`Error parsing date: ${e}, using current date + 30 days`);
          deadline = new Date();
          deadline.setDate(deadline.getDate() + 30);
        }
        
        // Map the tender data to our schema using the updated field names
        const tenderToInsert = {
          title: tender.tenderName || 'مناقصة بدون عنوان',
          agency: tender.agencyName || 'جهة غير معروفة',
          description: tender.tenderDescription || tender.tenderName || '',
          category: tender.tenderTypeName || tender.tenderActivityName || 'غير محدد',
          location: tender.branchName || 'غير محدد',
          valueMin: (tender.condetionalBookletPrice?.toString() || tender.invitationCost?.toString() || '0'),
          valueMax: (tender.financialFees?.toString() || tender.buyingCost?.toString() || '2000'),
          deadline: deadline,
          status: 'open',
          requirements: tender.tenderDescription || '',
          bidNumber: bidNumber,
          // Use tenderIdString for direct linking to Etimad
          etimadId: tender.tenderIdString || null,
          // Set source to 'etimad' for tenders from Etimad platform
          source: 'etimad'
        };
        
        // Insert the tender into the database
        await db.insert(tenders).values(tenderToInsert);
        console.log(`Inserted tender: ${tenderToInsert.title}`);
        savedCount++;
      } catch (error) {
        console.error('Error processing individual tender:', error);
        skippedCount++;
      }
    }
    
    console.log(`All tenders processed! Saved: ${savedCount}, Skipped: ${skippedCount}`);
  } catch (error) {
    console.error('Error saving tenders to database:', error);
  }
}

// Main function to run the scraper
async function main(): Promise<void> {
  try {
    console.log('Starting tender scraping...');
    let allTenders: any[] = [];
    const pagesToScrape = 3; // Scrape multiple pages for more tenders
    
    // Scrape multiple pages
    for (let page = 1; page <= pagesToScrape; page++) {
      console.log(`Scraping page ${page}...`);
      const tendersData = await scrapeTenders(page, 50);
      
      if (!tendersData || tendersData.length === 0) {
        console.log(`No tenders found on page ${page} or could not parse the response.`);
        break; // No more tenders to scrape
      }
      
      console.log(`Found ${tendersData.length} tenders on page ${page}.`);
      allTenders = [...allTenders, ...tendersData];
      
      // Add a small delay between requests to avoid rate limiting
      if (page < pagesToScrape) {
        console.log('Waiting before next request...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`Total tenders found: ${allTenders.length}`);
    
    if (allTenders.length === 0) {
      console.log('No tenders found across all pages.');
      return;
    }
    
    // Save all the tenders to the database
    await saveTendersToDatabase(allTenders);
    
    console.log('Scraping completed successfully!');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the main function
main();