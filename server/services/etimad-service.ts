/**
 * Etimad Tender Service - provides functionality for fetching tender data from Etimad.sa
 * 
 * This service provides methods to:
 * 1. Scrape tenders from Etimad and save them to the database
 * 2. Get detailed information for specific tenders
 * 3. Retrieve tenders with pagination and filtering
 */

import axios from 'axios';
import { db } from '../db';
import { tenders, insertTenderSchema } from '@shared/schema';
import { storage } from '../storage';
import { log } from '../vite';
import { eq, sql } from 'drizzle-orm';

// Base URL for the Etimad Tender Scraper API
// The API runs on port 5000 according to documentation
const ETIMAD_API_BASE_URL = process.env.ETIMAD_API_URL || 'http://localhost:5000';

interface EtimadTender {
  id?: number;
  entityName: string;
  tenderTitle: string;
  tenderIdString: string;
  tenderType: string;
  tenderValue?: number;
  lastEnrollDate?: string;
  lastOfferDate?: string;
  submissionDetails?: string;
  details?: any;
}

/**
 * Scrapes tenders from Etimad platform and saves to the database
 * @param page Page number (default: 1)
 * @param pageSize Number of tenders per page (default: 10, max: 100)
 * @returns Response with success status, message, and tenders data
 */
export async function scrapeTenders(page: number = 1, pageSize: number = 10): Promise<{
  success: boolean,
  message: string,
  tenders_count: number,
  tenders?: any[],
  errors?: string[]
}> {
  try {
    log(`Fetching tenders from Etimad API - page ${page}, pageSize ${pageSize}`, 'etimad-service');
    
    // Check if pageSize exceeds maximum
    if (pageSize > 100) {
      return {
        success: false,
        message: "Page size cannot exceed 100",
        tenders_count: 0,
        errors: ["Page size limit exceeded. Maximum allowed is 100."]
      };
    }
    
    // Check if we're in test mode
    if (process.env.ETIMAD_API_MODE === 'test') {
      log(`Using test mode for Etimad API`, 'etimad-service');
      const mockData = getMockPaginatedTenders(page, pageSize);
      await saveTendersToDatabase(mockData.tenders);
      return {
        success: true,
        message: `Successfully scraped ${mockData.tenders.length} tenders (test mode)`,
        tenders_count: mockData.tenders.length,
        tenders: mockData.tenders
      };
    }
    
    const response = await axios.get(`${ETIMAD_API_BASE_URL}/api/scrape-tenders`, {
      params: {
        page,
        page_size: pageSize,
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': process.env.ETIMAD_API_KEY || ''
      }
    });
    
    if (response.data && response.data.success) {
      const tenders = response.data.tenders || [];
      log(`Successfully fetched ${tenders.length} tenders from Etimad`, 'etimad-service');
      
      // Save tenders to the database
      await saveTendersToDatabase(tenders);
      
      return {
        success: true,
        message: `Successfully scraped ${tenders.length} tenders`,
        tenders_count: tenders.length,
        tenders: tenders
      };
    } else {
      log(`Invalid response from Etimad API: ${JSON.stringify(response.data)}`, 'etimad-service');
      return {
        success: false,
        message: "Failed to scrape tenders: Invalid response format",
        tenders_count: 0,
        errors: ["Invalid API response format"]
      };
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    log(`Error scraping tenders from Etimad: ${errorMessage}`, 'etimad-service');
    
    // If in development or test mode, provide mock data
    if (process.env.NODE_ENV === 'development' || process.env.ETIMAD_API_MODE === 'test') {
      log(`Providing mock data for scraping tenders`, 'etimad-service');
      const mockData = getMockPaginatedTenders(page, pageSize);
      await saveTendersToDatabase(mockData.tenders);
      return {
        success: true,
        message: `Successfully scraped ${mockData.tenders.length} tenders (mock data)`,
        tenders_count: mockData.tenders.length,
        tenders: mockData.tenders
      };
    }
    
    return {
      success: false,
      message: `Failed to scrape tenders from Etimad: ${errorMessage}`,
      tenders_count: 0,
      errors: [errorMessage]
    };
  }
}

/**
 * Gets detailed information for a specific tender
 * @param tenderIdString Encrypted tender ID string
 * @returns Detailed tender information
 */
export async function getTenderDetails(tenderIdString: string): Promise<{
  success: boolean,
  message: string,
  tender_details?: any,
  errors?: string[]
}> {
  try {
    log(`Fetching tender details for ID ${tenderIdString}`, 'etimad-service');
    
    // Check if we're in test mode
    if (process.env.ETIMAD_API_MODE === 'test') {
      log(`Using test mode for Etimad API`, 'etimad-service');
      // Return mock data for testing
      const mockData = getMockTenderDetails(tenderIdString);
      return {
        success: true,
        message: `Successfully retrieved tender details (test mode)`,
        tender_details: mockData
      };
    }
    
    const response = await axios.get(`${ETIMAD_API_BASE_URL}/api/tender-details/${tenderIdString}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': process.env.ETIMAD_API_KEY || ''
      }
    });
    
    if (response.data && response.data.success) {
      log(`Successfully fetched details for tender ${tenderIdString}`, 'etimad-service');
      
      // Update the tender in the database with the new details
      if (response.data.tender_details) {
        await updateTenderDetails(tenderIdString, response.data.tender_details);
      }
      
      return {
        success: true,
        message: `Successfully retrieved tender details`,
        tender_details: response.data.tender_details
      };
    } else {
      log(`Invalid response for tender details: ${JSON.stringify(response.data)}`, 'etimad-service');
      return {
        success: false,
        message: "Failed to get tender details: Invalid response format",
        errors: ["Invalid API response format"]
      };
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    log(`Error fetching tender details: ${errorMessage}`, 'etimad-service');
    
    // If in development or test mode, provide mock data
    if (process.env.NODE_ENV === 'development' || process.env.ETIMAD_API_MODE === 'test') {
      log(`Providing mock data for tender details`, 'etimad-service');
      const mockData = getMockTenderDetails(tenderIdString);
      return {
        success: true,
        message: `Successfully retrieved tender details (mock data)`,
        tender_details: mockData
      };
    }
    
    return {
      success: false,
      message: `Failed to get tender details: ${errorMessage}`,
      errors: [errorMessage]
    };
  }
}

/**
 * Gets a paginated list of tenders with optional filtering
 * @param page Page number (default: 1)
 * @param pageSize Number of items per page (default: 10, max: 100)
 * @param tenderType Optional filter by tender type
 * @param agencyName Optional filter by agency name
 * @returns Paginated list of tenders
 */
export async function getPaginatedTenders(
  page: number = 1, 
  pageSize: number = 10,
  tenderType?: string,
  agencyName?: string
): Promise<{
  success: boolean,
  message: string,
  tenders?: any[],
  total_count?: number,
  current_page?: number,
  total_pages?: number,
  page_size?: number,
  errors?: string[]
}> {
  try {
    log(`Fetching paginated tenders - page ${page}, pageSize ${pageSize}`, 'etimad-service');
    
    // Check if pageSize exceeds maximum
    if (pageSize > 100) {
      return {
        success: false,
        message: "Page size cannot exceed 100",
        errors: ["Page size limit exceeded. Maximum allowed is 100."]
      };
    }
    
    // Check if we're in test mode
    if (process.env.ETIMAD_API_MODE === 'test') {
      log(`Using test mode for Etimad API`, 'etimad-service');
      // Return mock data for testing
      const mockData = getMockPaginatedTenders(page, pageSize, tenderType, agencyName);
      return {
        success: true,
        message: `Successfully retrieved tenders (test mode)`,
        tenders: mockData.tenders,
        total_count: mockData.totalCount,
        current_page: mockData.currentPage,
        total_pages: mockData.totalPages,
        page_size: mockData.pageSize
      };
    }
    
    const params: any = {
      page,
      page_size: pageSize,
    };
    
    if (tenderType) params.tender_type = tenderType;
    if (agencyName) params.agency_name = agencyName;
    
    const response = await axios.get(`${ETIMAD_API_BASE_URL}/api/tenders`, { 
      params,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': process.env.ETIMAD_API_KEY || ''
      }
    });
    
    if (response.data && response.data.success) {
      log(`Successfully fetched paginated tenders`, 'etimad-service');
      return {
        success: true,
        message: `Successfully retrieved tenders`,
        tenders: response.data.tenders || [],
        total_count: response.data.total_count || 0,
        current_page: response.data.current_page || page,
        total_pages: response.data.total_pages || 0,
        page_size: response.data.page_size || pageSize
      };
    } else {
      log(`Invalid response for paginated tenders: ${JSON.stringify(response.data)}`, 'etimad-service');
      return {
        success: false,
        message: "Failed to retrieve tenders: Invalid response format",
        errors: ["Invalid API response format"]
      };
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    log(`Error fetching paginated tenders: ${errorMessage}`, 'etimad-service');
    
    // If in development or test mode, provide mock data
    if (process.env.NODE_ENV === 'development' || process.env.ETIMAD_API_MODE === 'test') {
      log(`Providing mock data for paginated tenders`, 'etimad-service');
      const mockData = getMockPaginatedTenders(page, pageSize, tenderType, agencyName);
      return {
        success: true,
        message: `Successfully retrieved tenders (mock data)`,
        tenders: mockData.tenders,
        total_count: mockData.totalCount,
        current_page: mockData.currentPage,
        total_pages: mockData.totalPages,
        page_size: mockData.pageSize
      };
    }
    
    return {
      success: false,
      message: `Failed to get paginated tenders: ${errorMessage}`,
      errors: [errorMessage]
    };
  }
}

/**
 * Gets tenders using the Simple Semantic Search API
 * @param companyProfile User profile containing company information for matching
 * @param limit Maximum number of results to return (default: 10, max: 50)
 * @param activeOnly Filter to only active tenders (default: true)
 * @returns Response with success status, tenders data, and matching information
 */
export async function searchTenders(
  companyProfile: any,
  limit: number = 10,
  activeOnly: boolean = true
): Promise<{
  success: boolean,
  message: string,
  results?: any[],
  count?: number,
  errors?: string[]
}> {
  try {
    log(`Searching tenders using company profile data`, 'etimad-service');
    
    // Check if limit exceeds maximum
    if (limit > 50) {
      limit = 50;
      log(`Limiting tender search results to 50 items (maximum)`, 'etimad-service');
    }

    // Build a search query from company profile data
    const searchQuery = buildSearchQueryFromProfile(companyProfile);
    
    // Check if we're in test mode
    if (process.env.ETIMAD_API_MODE === 'test') {
      log(`Using test mode for Etimad API search`, 'etimad-service');
      // Return mock data for testing
      const mockData = getMockSearchResults(searchQuery, limit, activeOnly);
      
      // Save the mock tenders to the database
      if (mockData.results) {
        await saveTendersFromSearchResults(mockData.results);
      }
      
      return {
        success: true,
        message: `Successfully searched for tenders (test mode)`,
        results: mockData.results,
        count: mockData.results?.length || 0
      };
    }
    
    const params = {
      q: searchQuery,
      limit: limit,
      active_only: activeOnly
    };
    
    log(`Performing semantic search with query: "${searchQuery}"`, 'etimad-service');
    const response = await axios.get(`${ETIMAD_API_BASE_URL}/api/v1/search`, { 
      params,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': process.env.ETIMAD_API_KEY || ''
      }
    });
    
    if (response.data && response.data.success) {
      log(`Successfully retrieved ${response.data.count} tenders via semantic search`, 'etimad-service');
      
      // Save the matched tenders to the database
      if (response.data.results) {
        await saveTendersFromSearchResults(response.data.results);
      }
      
      return {
        success: true,
        message: `Successfully searched for tenders`,
        results: response.data.results || [],
        count: response.data.count || 0
      };
    } else {
      log(`Invalid response from semantic search: ${JSON.stringify(response.data)}`, 'etimad-service');
      return {
        success: false,
        message: "Failed to search tenders: Invalid response format",
        errors: ["Invalid API response format"]
      };
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    log(`Error searching tenders: ${errorMessage}`, 'etimad-service');
    
    // If in development or test mode, provide mock data
    if (process.env.NODE_ENV === 'development' || process.env.ETIMAD_API_MODE === 'test') {
      log(`Providing mock data for tender search`, 'etimad-service');
      const searchQuery = buildSearchQueryFromProfile(companyProfile);
      const mockData = getMockSearchResults(searchQuery, limit, activeOnly);
      
      // Save the mock tenders to the database
      if (mockData.results) {
        await saveTendersFromSearchResults(mockData.results);
      }
      
      return {
        success: true,
        message: `Successfully searched for tenders (mock data)`,
        results: mockData.results,
        count: mockData.results?.length || 0
      };
    }
    
    return {
      success: false,
      message: `Failed to search tenders: ${errorMessage}`,
      errors: [errorMessage]
    };
  }
}

/**
 * Gets a specific tender by ID
 * @param tenderId Tender ID
 * @returns Tender data
 */
export async function getTenderById(tenderId: number): Promise<{
  success: boolean,
  message: string,
  tender?: any,
  errors?: string[]
}> {
  try {
    log(`Fetching tender by ID ${tenderId}`, 'etimad-service');
    
    const response = await axios.get(`${ETIMAD_API_BASE_URL}/api/tenders/${tenderId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': process.env.ETIMAD_API_KEY || ''
      }
    });
    
    if (response.data && response.data.success) {
      log(`Successfully fetched tender ${tenderId}`, 'etimad-service');
      return {
        success: true,
        message: `Successfully retrieved tender`,
        tender: response.data.tender
      };
    } else {
      log(`Invalid response for tender ${tenderId}: ${JSON.stringify(response.data)}`, 'etimad-service');
      return {
        success: false,
        message: "Failed to retrieve tender: Invalid response format",
        errors: ["Invalid API response format"]
      };
    }
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    log(`Error fetching tender by ID: ${errorMessage}`, 'etimad-service');
    
    // Provide a more useful error response
    return {
      success: false,
      message: `Failed to get tender by ID: ${errorMessage}`,
      errors: [errorMessage]
    };
  }
}

/**
 * Saves tenders to the database
 * @param tendersData Array of tender data from Etimad
 */
async function saveTendersToDatabase(tendersData: EtimadTender[]): Promise<void> {
  try {
    log(`Saving ${tendersData.length} tenders to database`, 'etimad-service');
    
    for (const tenderData of tendersData) {
      // Check if the tender already exists in the database by tenderIdString
      const existingTender = await db.select()
        .from(tenders)
        .where(eq(tenders.externalId, tenderData.tenderIdString))
        .limit(1);
      
      if (existingTender.length === 0) {
        // Map the Etimad tender data to our database schema
        const insertData = {
          title: tenderData.tenderTitle,
          agency: tenderData.entityName,
          bidNumber: tenderData.tenderIdString,
          description: tenderData.details?.description || '',
          category: tenderData.tenderType || 'General',
          status: 'Active',
          releaseDate: new Date(),
          closingDate: tenderData.lastOfferDate ? new Date(tenderData.lastOfferDate) : null,
          enrollmentDeadline: tenderData.lastEnrollDate ? new Date(tenderData.lastEnrollDate) : null,
          value: tenderData.tenderValue || null,
          industry: tenderData.details?.industry || 'General',
          requirements: tenderData.details?.requirements || '',
          keywords: tenderData.details?.keywords || [],
          location: tenderData.details?.location || '',
          externalId: tenderData.tenderIdString,
          externalSource: 'Etimad',
          source: 'etimad',
          externalUrl: `https://tenders.etimad.sa/Tender/Details/${tenderData.tenderIdString}`,
          rawData: JSON.stringify(tenderData),
        };
        
        // Validate the data with Zod schema
        const validatedData = insertTenderSchema.parse(insertData);
        
        // Insert the tender into the database
        await storage.createTender(validatedData);
        log(`Created new tender: ${tenderData.tenderTitle}`, 'etimad-service');
      } else {
        log(`Tender ${tenderData.tenderIdString} already exists in database`, 'etimad-service');
      }
    }
    
    log(`Completed saving tenders to database`, 'etimad-service');
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    log(`Error saving tenders to database: ${errorMessage}`, 'etimad-service');
    throw new Error(`Failed to save tenders to database: ${errorMessage}`);
  }
}

/**
 * Updates a tender in the database with new details
 * @param tenderIdString Tender ID string
 * @param details Detail data from Etimad
 */
async function updateTenderDetails(tenderIdString: string, details: any): Promise<void> {
  try {
    log(`Updating tender details for ${tenderIdString}`, 'etimad-service');
    
    // Find the tender by externalId
    const existingTenders = await db.select()
      .from(tenders)
      .where(eq(tenders.externalId, tenderIdString))
      .limit(1);
    
    if (existingTenders.length === 0) {
      log(`Tender ${tenderIdString} not found in database`, 'etimad-service');
      return;
    }
    
    const existingTender = existingTenders[0];
    
    // Update with new details
    const updateData = {
      description: details.description || existingTender.description,
      requirements: details.requirements || existingTender.requirements,
      keywords: details.keywords || existingTender.keywords,
      industry: details.industry || existingTender.industry,
      location: details.location || existingTender.location,
      rawData: JSON.stringify({ ...JSON.parse(existingTender.rawData || '{}'), details }),
    };
    
    // Update in the database
    await db.update(tenders)
      .set(updateData)
      .where(eq(tenders.id, existingTender.id));
    
    log(`Successfully updated tender details for ${tenderIdString}`, 'etimad-service');
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    log(`Error updating tender details: ${errorMessage}`, 'etimad-service');
    throw new Error(`Failed to update tender details: ${errorMessage}`);
  }
}

/**
 * Gets mock tender details for testing
 * @param tenderIdString Tender ID
 * @returns Mock tender details
 */
function getMockTenderDetails(tenderIdString: string): any {
  return {
    tenderIdString,
    title: `Test Tender ${tenderIdString}`,
    agency: "Ministry of Testing",
    description: "This is a test tender from the mock API",
    category: "Information Technology",
    value: 1000000,
    lastEnrollDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastOfferDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    submissionDetails: "Submit your proposal through the platform",
    requirements: "Must have experience in government projects",
    location: "Riyadh",
    industry: "Technology",
    keywords: ["software", "IT", "development"]
  };
}

/**
 * Gets mock paginated tenders for testing
 * @param page Page number
 * @param pageSize Number of items per page
 * @param tenderType Optional tender type filter
 * @param agencyName Optional agency name filter
 * @returns Mock paginated tenders
 */

/**
 * Builds a search query string from company profile data
 * @param companyProfile User profile containing company information
 * @returns Search query string for the API
 */
function buildSearchQueryFromProfile(companyProfile: any): string {
  // If we have a pre-processed query data field from OCR extraction, use it first
  if (companyProfile.queryData && typeof companyProfile.queryData === 'string' && companyProfile.queryData.length > 0) {
    log(`Using pre-processed queryData from document OCR extraction: ${companyProfile.queryData.substring(0, 100)}...`, 'etimad-service');
    return companyProfile.queryData;
  }
  
  // Otherwise, build the query from profile components
  const queryParts = [];
  
  // Add company description
  if (companyProfile.companyDescription) {
    queryParts.push(companyProfile.companyDescription);
  }
  
  // Add company activities from document extraction
  if (companyProfile.companyActivities && Array.isArray(companyProfile.companyActivities) && companyProfile.companyActivities.length > 0) {
    queryParts.push(companyProfile.companyActivities.join(' '));
  } else if (companyProfile.activities && Array.isArray(companyProfile.activities) && companyProfile.activities.length > 0) {
    queryParts.push(companyProfile.activities.join(' '));
  }
  
  // Add main industries or sectors from document extraction
  if (companyProfile.mainIndustries && Array.isArray(companyProfile.mainIndustries) && companyProfile.mainIndustries.length > 0) {
    queryParts.push(companyProfile.mainIndustries.join(' '));
  } else if (companyProfile.sectors && Array.isArray(companyProfile.sectors) && companyProfile.sectors.length > 0) {
    queryParts.push(companyProfile.sectors.join(' '));
  }
  
  // Add specializations from document extraction
  if (companyProfile.specializations && Array.isArray(companyProfile.specializations) && companyProfile.specializations.length > 0) {
    queryParts.push(companyProfile.specializations.join(' '));
  } else if (companyProfile.specialization) {
    queryParts.push(companyProfile.specialization);
  }
  
  // Add business type for better matching
  if (companyProfile.businessType) {
    queryParts.push(companyProfile.businessType);
  }
  
  // Add keywords if available
  if (companyProfile.keywords && Array.isArray(companyProfile.keywords) && companyProfile.keywords.length > 0) {
    queryParts.push(companyProfile.keywords.join(' '));
  }
  
  // Join all parts and return
  const query = queryParts.join(' ').trim();
  log(`Generated search query from profile components: ${query.substring(0, 100)}...`, 'etimad-service');
  return query;
}

/**
 * Saves tenders from search results to the database
 * @param searchResults Search results array
 */
async function saveTendersFromSearchResults(searchResults: any[]): Promise<void> {
  try {
    log(`Saving ${searchResults.length} tenders from search results to database`, 'etimad-service');
    
    for (const result of searchResults) {
      // Check if the tender already exists in the database by tender_id or reference_number
      const existingTender = await db.select()
        .from(tenders)
        .where(sql`(${tenders.externalId} = ${result.tender_id} OR ${tenders.bidNumber} = ${result.reference_number})`)
        .limit(1);
      
      if (existingTender.length === 0) {
        // Convert the search result to match our database schema
        const insertData = {
          title: result.tender_name,
          agency: result.agency_name,
          bidNumber: result.reference_number,
          description: result.tender_purpose || '',
          category: result.tender_type || 'General',
          status: 'Active',
          releaseDate: new Date(),
          deadline: result.submission_date ? new Date(result.submission_date) : null,
          closingDate: result.submission_date ? new Date(result.submission_date) : null,
          value: result.tender_value || null,
          requirements: result.requirements || '',
          externalId: String(result.tender_id),
          externalSource: 'Etimad',
          source: 'etimad',
          externalUrl: `https://tenders.etimad.sa/Tender/Details/${result.tender_id}`,
          rawData: JSON.stringify({
            ...result,
            similarity_percentage: result.similarity_percentage,
            match_rank: result.match_rank
          }),
          matchScore: result.similarity_percentage || null,
        };
        
        // Validate the data with Zod schema
        const validatedData = insertTenderSchema.parse(insertData);
        
        // Insert the tender into the database
        await storage.createTender(validatedData);
        log(`Created new tender from search: ${result.tender_name}`, 'etimad-service');
      } else {
        // Update the existing tender with match information
        const existingTenderData = existingTender[0];
        const rawData = JSON.parse(existingTenderData.rawData || '{}');
        
        // Update the raw data with match information
        const updatedRawData = {
          ...rawData,
          similarity_percentage: result.similarity_percentage,
          match_rank: result.match_rank
        };
        
        // Update in the database
        await db.update(tenders)
          .set({
            matchScore: result.similarity_percentage || null,
            rawData: JSON.stringify(updatedRawData),
            source: 'etimad' // Ensure source field is set to etimad
          })
          .where(eq(tenders.id, existingTenderData.id));
        
        log(`Updated existing tender ${result.tender_id} with match information`, 'etimad-service');
      }
    }
    
    log(`Completed saving search results to database`, 'etimad-service');
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    log(`Error saving search results to database: ${errorMessage}`, 'etimad-service');
    throw new Error(`Failed to save search results to database: ${errorMessage}`);
  }
}

/**
 * Gets mock search results for testing
 * @param query Search query string
 * @param limit Maximum number of results to return
 * @param activeOnly Filter to only active tenders
 * @returns Mock search results
 */
function getMockSearchResults(query: string, limit: number, activeOnly: boolean): any {
  const mockResults = [];
  
  for (let i = 0; i < limit; i++) {
    const similarity = Math.round((100 - (i * 5)) * 10) / 10; // Decreasing similarity
    
    mockResults.push({
      id: i + 1,
      tender_id: `tender_${i + 1}`,
      tender_name: `Mock Tender ${i + 1} for "${query}"`,
      agency_name: ['Ministry of Technology', 'Ministry of Health', 'Ministry of Education'][i % 3],
      reference_number: `REF-${i + 1}-2025`,
      tender_purpose: `This tender is related to ${query} and requires expertise in the field`,
      submission_date: new Date(Date.now() + (14 + i) * 24 * 60 * 60 * 1000).toISOString(),
      tender_value: Math.floor(Math.random() * 1000000) + 500000,
      tender_type: ['Services', 'Supplies', 'Construction'][i % 3],
      requirements: "Qualified vendor with experience in similar projects",
      location: ["Riyadh", "Jeddah", "Dammam"][i % 3],
      is_active: activeOnly ? true : (i % 5 !== 0), // Some inactive if not filtered
      
      // Search relevance information
      similarity_percentage: similarity,
      match_rank: i + 1
    });
  }
  
  return {
    success: true,
    query: query,
    results: mockResults,
    count: mockResults.length,
    active_only: activeOnly
  };
}

/**
 * Gets mock paginated tenders for testing
 * @param page Page number
 * @param pageSize Number of items per page
 * @param tenderType Optional tender type filter
 * @param agencyName Optional agency name filter
 * @returns Mock paginated tenders
 */
function getMockPaginatedTenders(
  page: number = 1,
  pageSize: number = 10,
  tenderType?: string,
  agencyName?: string
): any {
  // Generate mock tenders
  const mockTenders = [];
  const startIndex = (page - 1) * pageSize;
  const totalCount = 150; // Mock total count
  
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  
  for (let i = startIndex; i < endIndex; i++) {
    const tenderId = `tender_${i + 1}`;
    mockTenders.push({
      tenderIdString: tenderId,
      tenderTitle: `Test Tender ${i + 1}`,
      entityName: agencyName || ['Ministry of Testing', 'Ministry of Technology', 'Ministry of Infrastructure'][i % 3],
      tenderType: tenderType || ['IT Services', 'Construction', 'Consulting'][i % 3],
      tenderValue: Math.floor(Math.random() * 1000000) + 500000,
      lastEnrollDate: new Date(Date.now() + (7 + i) * 24 * 60 * 60 * 1000).toISOString(),
      lastOfferDate: new Date(Date.now() + (14 + i) * 24 * 60 * 60 * 1000).toISOString(),
      submissionDetails: "Submit through platform",
      details: {
        description: `Detailed description for tender ${i + 1}`,
        requirements: "Vendor requirements go here",
        location: ["Riyadh", "Jeddah", "Dammam"][i % 3],
        industry: "Technology",
        keywords: ["software", "IT", "development"]
      }
    });
  }
  
  return {
    tenders: mockTenders,
    totalCount,
    currentPage: page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize)
  };
}