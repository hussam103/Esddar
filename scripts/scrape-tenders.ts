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
    console.log(`Scraping page ${pageNumber}...`);
    const csrfToken = await getCSRFToken();
    
    if (!csrfToken) {
      throw new Error('Could not get CSRF token');
    }
    
    // Build the URL with parameters
    const url = `https://tenders.etimad.sa/Tender/AllSupplierTendersForVisitorAsync`;
    
    // Make the request
    const response = await axios.get(url, {
      params: {
        '__RequestVerificationToken': csrfToken,
        'PublishDateId': 5,
        'PageSize': pageSize,
        'PageNumber': pageNumber,
        'IsSearch': true,
        'SortDirection': 'DESC',
        'Sort': 'SubmitionDate',
        '_': new Date().getTime()
      },
      headers: {
        'Accept-Language': 'ar',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Referer': 'https://tenders.etimad.sa/Tender/AllTendersForVisitor',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    console.log('Response status:', response.status);
    
    // Check if response is valid JSON
    if (typeof response.data === 'string') {
      try {
        const parsedData = JSON.parse(response.data);
        return parsedData.Data?.Items || [];
      } catch (e) {
        console.error('Error parsing JSON:', e);
        console.log('Response data:', response.data.substring(0, 200) + '...');
        return [];
      }
    }
    
    return response.data.Data?.Items || [];
  } catch (error) {
    console.error('Error scraping tenders:', error);
    return [];
  }
}

// Function to get tender details
async function getTenderDetails(tenderIdString: string): Promise<any> {
  try {
    console.log(`Getting details for tender ID: ${tenderIdString}`);
    
    const url = `https://tenders.etimad.sa/Tender/OpenTenderDetailsReportForVisitor?tenderIdString=${tenderIdString}`;
    
    const response = await axios.get(url, {
      headers: {
        'Accept-Language': 'ar',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Referer': 'https://tenders.etimad.sa/Tender/AllTendersForVisitor',
      }
    });
    
    // Parse the HTML response to extract detailed information
    const $ = cheerio.load(response.data);
    
    // Extract tender details
    const tenderDetails = {
      title: $('.info_header .head').text().trim(),
      agency: $('.block_header-entity').text().trim(),
      description: $('.info_header .body').text().trim(),
      requirements: $('.requirements').text().trim(),
      // Add more fields as needed
    };
    
    return tenderDetails;
  } catch (error) {
    console.error(`Error getting details for tender ID ${tenderIdString}:`, error);
    return null;
  }
}

// Function to save tenders to the database
async function saveTendersToDatabase(tendersData: any[]): Promise<void> {
  try {
    console.log(`Saving ${tendersData.length} tenders to database...`);
    
    for (const tender of tendersData) {
      // Check if the tender already exists in the database
      const existingTender = await db.select().from(tenders).where(eq(tenders.bidNumber, tender.ReferenceNumber)).limit(1);
      
      if (existingTender.length > 0) {
        console.log(`Tender with bid number ${tender.ReferenceNumber} already exists, skipping.`);
        continue;
      }
      
      // Get additional details if needed
      // const details = await getTenderDetails(tender.IdString);
      
      // Map the tender data to our schema
      const tenderToInsert = {
        title: tender.TenderName,
        agency: tender.AgencyName,
        description: tender.TenderDescription || '',
        category: tender.TenderTypeName || 'غير محدد',
        location: tender.TenderAreaName || 'غير محدد',
        valueMin: tender.ConditionBookletPrice?.toString() || '0',
        valueMax: tender.EstimatedValue?.toString() || '0',
        deadline: new Date(tender.LastOfferPresentationDate),
        status: 'open',
        requirements: tender.TenderDescription || '',
        bidNumber: tender.ReferenceNumber,
        // Add the Etimad IdString as etimadId for direct linking
        etimadId: tender.IdString || null,
        // Set source to 'etimad' for tenders from Etimad platform
        source: 'etimad'
      };
      
      // Insert the tender into the database
      await db.insert(tenders).values(tenderToInsert);
      console.log(`Inserted tender: ${tenderToInsert.title}`);
    }
    
    console.log('All tenders saved successfully!');
  } catch (error) {
    console.error('Error saving tenders to database:', error);
  }
}

// Main function to run the scraper
async function main(): Promise<void> {
  try {
    // Scrape first page
    console.log('Starting tender scraping...');
    const tendersData = await scrapeTenders(1, 50);
    
    if (!tendersData || tendersData.length === 0) {
      console.log('No tenders found or could not parse the response.');
      return;
    }
    
    console.log(`Found ${tendersData.length} tenders.`);
    
    // Save the tenders to the database
    await saveTendersToDatabase(tendersData);
    
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