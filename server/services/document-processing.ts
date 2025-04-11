import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import { storage } from '../storage';
import { CompanyDocument, User } from '@shared/schema';

// Promisify fs functions
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

// Ensure the upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const TEMP_DIR = path.join(UPLOAD_DIR, 'temp');

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface ProcessingJobStatus {
  documentId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
  userId: number;
  fileName: string;
  filePath: string;
  whisperHash?: string;
  extractedText?: string;
  extractedData?: any;
}

// In-memory storage for processing jobs
const processingJobs = new Map<string, ProcessingJobStatus>();

/**
 * Ensure upload directories exist
 */
export async function ensureUploadDirectories(): Promise<void> {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      await mkdirAsync(UPLOAD_DIR, { recursive: true });
    }
    if (!fs.existsSync(TEMP_DIR)) {
      await mkdirAsync(TEMP_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating upload directories:', error);
    throw new Error('Failed to create upload directories');
  }
}

/**
 * Save uploaded file to disk
 */
export async function saveUploadedFile(
  file: Express.Multer.File,
  userId: number
): Promise<string> {
  await ensureUploadDirectories();
  
  // Generate unique document ID
  const documentId = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  // Generate file path
  const fileExt = path.extname(file.originalname);
  const fileName = `${documentId}${fileExt}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  
  // Save file to disk
  await writeFileAsync(filePath, file.buffer);
  
  // Create processing job entry
  processingJobs.set(documentId, {
    documentId,
    status: 'pending',
    userId,
    fileName: file.originalname,
    filePath
  });
  
  // Save document in database
  await storage.createCompanyDocument({
    userId,
    fileName: file.originalname,
    filePath,
    fileSize: file.size,
    uploadedAt: new Date(),
    status: 'pending',
    documentId
  });
  
  return documentId;
}

/**
 * Process document with WhisperLLM API for OCR
 */
export async function processDocumentWithOCR(documentId: string): Promise<void> {
  // Get job status
  const job = processingJobs.get(documentId);
  if (!job) {
    throw new Error('Document job not found');
  }
  
  try {
    // Update job status
    job.status = 'processing';
    processingJobs.set(documentId, job);
    
    // Update document status in database
    await storage.updateCompanyDocument(documentId, {
      status: 'processing'
    });
    
    // Read file
    const fileBuffer = await readFileAsync(job.filePath);
    
    // Call WhisperLLM API for OCR
    const whisperResponse = await fetch('https://llmwhisperer-api.us-central.unstract.com/api/v2/whisper?mode=form&output_mode=layout_preserving', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'unstract-key': process.env.UNSTRACT_API_KEY || '',
      },
      body: fileBuffer
    });
    
    if (!whisperResponse.ok) {
      throw new Error(`WhisperLLM API error: ${whisperResponse.statusText}`);
    }
    
    const whisperResult = await whisperResponse.json();
    
    if (whisperResult.status !== 'processing' || !whisperResult.whisper_hash) {
      throw new Error('Invalid response from WhisperLLM API');
    }
    
    // Store whisper hash
    job.whisperHash = whisperResult.whisper_hash;
    processingJobs.set(documentId, job);
    
    // Wait for processing to complete
    let isProcessed = false;
    let attempts = 0;
    const maxAttempts = 20; // Timeout after 20 attempts (about 2 minutes)
    
    while (!isProcessed && attempts < maxAttempts) {
      attempts++;
      
      // Wait for 6 seconds between status checks
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      // Check processing status
      const statusResponse = await fetch(`https://llmwhisperer-api.us-central.unstract.com/api/v2/whisper-status?whisper_hash=${job.whisperHash}`, {
        method: 'GET',
        headers: {
          'unstract-key': process.env.UNSTRACT_API_KEY || '',
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`WhisperLLM status API error: ${statusResponse.statusText}`);
      }
      
      const statusResult = await statusResponse.json();
      
      if (statusResult.status === 'processed') {
        isProcessed = true;
      } else if (statusResult.status === 'error' || statusResult.status === 'failed') {
        throw new Error(`Document processing failed: ${statusResult.message || 'Unknown error'}`);
      }
    }
    
    if (!isProcessed) {
      throw new Error('Document processing timed out');
    }
    
    // Retrieve the processed text
    const retrieveResponse = await fetch(`https://llmwhisperer-api.us-central.unstract.com/api/v2/whisper-retrieve?whisper_hash=${job.whisperHash}`, {
      method: 'GET',
      headers: {
        'unstract-key': process.env.UNSTRACT_API_KEY || '',
      }
    });
    
    if (!retrieveResponse.ok) {
      throw new Error(`WhisperLLM retrieve API error: ${retrieveResponse.statusText}`);
    }
    
    const retrieveResult = await retrieveResponse.json();
    
    if (!retrieveResult.result_text) {
      throw new Error('No text content returned from WhisperLLM API');
    }
    
    // Store extracted text
    job.extractedText = retrieveResult.result_text;
    processingJobs.set(documentId, job);
    
    // Process with OpenAI to extract structured information
    const extractedInfo = await extractCompanyInformation(job.extractedText, job.userId);
    
    // Store extracted data
    job.extractedData = extractedInfo;
    job.status = 'completed';
    processingJobs.set(documentId, job);
    
    // Update document and user profile in database
    await storage.updateCompanyDocument(documentId, {
      status: 'completed',
      processedAt: new Date(),
      extractedText: job.extractedText,
      extractedData: job.extractedData
    });
    
    // Update user profile with extracted information
    const userProfile = await storage.getUserProfile(job.userId);
    if (userProfile) {
      await storage.updateUserProfile(job.userId, {
        companyDescription: extractedInfo.description,
        businessType: extractedInfo.businessType,
        companyActivities: extractedInfo.activities,
        mainIndustries: extractedInfo.industries,
        specializations: extractedInfo.specializations
      });
    } else {
      await storage.createUserProfile({
        userId: job.userId,
        companyDescription: extractedInfo.description,
        businessType: extractedInfo.businessType,
        companyActivities: extractedInfo.activities,
        mainIndustries: extractedInfo.industries,
        specializations: extractedInfo.specializations
      });
    }
    
  } catch (error) {
    console.error('Error processing document:', error);
    
    // Update job status to error
    job.status = 'error';
    job.message = error.message;
    processingJobs.set(documentId, job);
    
    // Update document status in database
    await storage.updateCompanyDocument(documentId, {
      status: 'error',
      errorMessage: error.message
    });
    
    throw error;
  }
}

/**
 * Extract structured company information using GPT-4o
 */
async function extractCompanyInformation(text: string, userId: number): Promise<any> {
  try {
    // Get user data to help with the context
    const user = await storage.getUser(userId);
    
    // Prepare the prompt for OpenAI
    const prompt = `You are an expert business analyst tasked with extracting structured information from a company profile document.
    
The document has been processed using OCR and contains information about the company named "${user?.companyName || 'Unknown'}".

Please analyze the text below and extract the following information in JSON format:
1. description: A concise description of the company (max 300 words)
2. businessType: The type of business (e.g., "Corporation", "LLC", "Sole Proprietorship", etc.)
3. activities: An array of the company's main business activities and services (max 10 items)
4. industries: An array of industries the company operates in (max 5 items)
5. specializations: An array of the company's special expertise areas (max 8 items)
6. targetMarkets: An array of the company's target markets or customer segments (max 5 items)
7. certifications: An array of certifications or qualifications the company holds (max 10 items)
8. keywords: An array of relevant keywords for the company's business (max 15 items)

If any information is not available in the text, use "unknown" for string fields or [] for array fields.

Here is the company document text:
${text.substring(0, 15000)}${text.length > 15000 ? '...' : ''}`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are a business analyst expert who extracts structured information from company documents." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    // Parse the response
    const jsonResponse = JSON.parse(completion.choices[0].message.content);
    return jsonResponse;
    
  } catch (error) {
    console.error('Error extracting company information:', error);
    // Return a basic structure if extraction fails
    return {
      description: "Unable to extract company description due to processing error.",
      businessType: "unknown",
      activities: [],
      industries: [],
      specializations: [],
      targetMarkets: [],
      certifications: [],
      keywords: []
    };
  }
}

/**
 * Get document processing status
 */
export function getDocumentStatus(documentId: string): ProcessingJobStatus | null {
  return processingJobs.get(documentId) || null;
}

/**
 * Clean up temporary files
 */
export async function cleanupDocumentFiles(documentId: string): Promise<void> {
  const job = processingJobs.get(documentId);
  if (job && job.filePath && fs.existsSync(job.filePath)) {
    try {
      await unlinkAsync(job.filePath);
    } catch (error) {
      console.error('Error cleaning up document file:', error);
    }
  }
}