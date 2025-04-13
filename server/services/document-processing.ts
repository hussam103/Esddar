import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../storage';
import axios from 'axios';
import FormData from 'form-data';
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Map to store processing jobs status
const processingJobs = new Map<string, ProcessingJobStatus>();

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

/**
 * Ensure upload directories exist
 */
export async function ensureUploadDirectories(): Promise<void> {
  const uploadDir = path.join(process.cwd(), 'uploads');
  const tempDir = path.join(uploadDir, 'temp');
  const processedDir = path.join(uploadDir, 'processed');

  try {
    // Create directories if they don't exist
    await fsPromises.mkdir(uploadDir, { recursive: true });
    await fsPromises.mkdir(tempDir, { recursive: true });
    await fsPromises.mkdir(processedDir, { recursive: true });
    
    console.log('Upload directories created successfully');
  } catch (error) {
    console.error('Error creating upload directories:', error);
    throw error;
  }
}

/**
 * Save uploaded file to disk
 */
export async function saveUploadedFile(
  file: Express.Multer.File,
  userId: number
): Promise<string> {
  try {
    // Generate a unique document ID
    const documentId = uuidv4();
    
    // Get file extension
    const fileExt = path.extname(file.originalname);
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Create paths
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    const filePath = path.join(uploadDir, `${documentId}${fileExt}`);
    
    // Write file to disk from memory buffer
    if (!file.buffer) {
      throw new Error('File buffer is missing');
    }
    
    // Ensure directory exists
    await fsPromises.mkdir(uploadDir, { recursive: true });
    
    console.log(`Writing file to: ${filePath} with buffer size: ${file.buffer.length}`);
    await fsPromises.writeFile(filePath, file.buffer);
    
    // Create document record in database
    const document = await storage.createCompanyDocument({
      documentId: documentId,
      userId: userId,
      fileName: sanitizedFileName,
      documentType: 'company_profile',
      filePath: filePath,
      fileSize: file.size,
      status: 'pending',
      uploadedAt: new Date()
    });
    
    console.log(`Created document in database: ${document.documentId}`);
    
    // Store job status
    processingJobs.set(documentId, {
      documentId,
      status: 'pending',
      userId,
      fileName: sanitizedFileName,
      filePath
    });
    
    return documentId;
  } catch (error) {
    console.error('Error saving uploaded file:', error);
    throw new Error('Failed to save uploaded file');
  }
}

/**
 * Process document with WhisperLLM API for OCR
 */
export async function processDocumentWithOCR(documentId: string): Promise<void> {
  try {
    // Get document from database
    const document = await storage.getCompanyDocument(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Update processing status
    await storage.updateCompanyDocument(documentId, {
      status: 'processing'
    });
    
    const jobStatus = processingJobs.get(documentId);
    if (jobStatus) {
      jobStatus.status = 'processing';
    } else {
      processingJobs.set(documentId, {
        documentId,
        status: 'processing',
        userId: document.userId,
        fileName: document.fileName,
        filePath: document.filePath
      });
    }
    
    // Call WhisperLLM API for OCR
    try {
      // Read file as binary data
      const fileData = fs.readFileSync(document.filePath);
      
      // Call WhisperLLM API with binary data (not using FormData)
      const whisperResponse = await axios.post(
        'https://llmwhisperer-api.us-central.unstract.com/api/v2/whisper?mode=form&output_mode=layout_preserving',
        fileData,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'unstract-key': process.env.UNSTRACT_API_KEY
          },
          timeout: 180000 // 3 minutes timeout
        }
      );
      
      // Per the API docs, successful response is 202 with whisper_hash
      if (whisperResponse.status === 202 && whisperResponse.data.whisper_hash) {
        console.log("Whisper job accepted, hash:", whisperResponse.data.whisper_hash);
        
        // Update job status with whisper hash
        const jobStatus = processingJobs.get(documentId);
        if (jobStatus) {
          jobStatus.whisperHash = whisperResponse.data.whisper_hash;
        }
        
        // Poll for OCR results
        await getOCRResults(documentId, whisperResponse.data.whisper_hash);
      } else {
        throw new Error(whisperResponse.data?.message || 'Failed to process document with OCR');
      }
    } catch (error: any) {
      console.error('Error calling WhisperLLM API:', error);
      
      // Check for specific error codes
      let errorMessage = error.message || 'Error calling WhisperLLM API';
      
      // Handle 402 Payment Required (API limit reached)
      if (error.response && error.response.status === 402) {
        const responseMessage = error.response.data?.message || '';
        console.log('WhisperLLM API payment required error:', responseMessage);
        
        if (responseMessage.includes('free processing limit')) {
          errorMessage = 'Daily processing limit reached: ' + responseMessage;
        } else {
          errorMessage = 'API usage limit reached. Please try again tomorrow or contact support.';
        }
        
        // Log the detailed error for debugging
        console.error('WhisperLLM API limit error details:', {
          status: error.response.status,
          data: error.response.data,
          message: responseMessage
        });
      }
      
      // Update processing status to error
      await storage.updateCompanyDocument(documentId, {
        status: 'error',
        errorMessage: errorMessage,
        processedAt: new Date()
      });
      
      const jobStatus = processingJobs.get(documentId);
      if (jobStatus) {
        jobStatus.status = 'error';
        jobStatus.message = errorMessage;
      }
    }
  } catch (error: any) {
    console.error('Error processing document with OCR:', error);
    
    // Update processing status to error
    await storage.updateCompanyDocument(documentId, {
      status: 'error',
      errorMessage: error.message || 'Error processing document',
      processedAt: new Date()
    });
    
    const jobStatus = processingJobs.get(documentId);
    if (jobStatus) {
      jobStatus.status = 'error';
      jobStatus.message = error.message || 'Error processing document';
    }
  }
}

/**
 * Poll WhisperLLM API for OCR results
 */
async function getOCRResults(documentId: string, whisperHash: string): Promise<void> {
  try {
    // Poll WhisperLLM API for results
    const maxRetries = 20;
    let retries = 0;
    let extractedText = null;
    
    while (retries < maxRetries) {
      // Wait between retries
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
      
      try {
        // Check OCR status
        const ocrStatusResponse = await axios.get(
          `https://llmwhisperer-api.us-central.unstract.com/api/v2/whisper-status?whisper_hash=${whisperHash}`,
          {
            headers: {
              'unstract-key': process.env.UNSTRACT_API_KEY
            }
          }
        );
        
        // If OCR is complete (processed status), retrieve the text
        if (ocrStatusResponse.status === 200 && ocrStatusResponse.data.status === 'processed') {
          try {
            console.log(`OCR processing completed for document ${documentId}, retrieving text...`);
            
            // Get the extracted text via the retrieve endpoint
            const retrieveResponse = await axios.get(
              `https://llmwhisperer-api.us-central.unstract.com/api/v2/whisper-retrieve?whisper_hash=${whisperHash}`,
              {
                headers: {
                  'unstract-key': process.env.UNSTRACT_API_KEY
                }
              }
            );
            
            if (retrieveResponse.status === 200) {
              // Check if we have result_text in the response or if text_only=true was used
              extractedText = retrieveResponse.data.result_text || retrieveResponse.data;
              
              console.log(`Retrieved text length: ${extractedText ? extractedText.length : 0} characters`);
              
              // Update job status
              const jobStatus = processingJobs.get(documentId);
              if (jobStatus) {
                jobStatus.extractedText = extractedText;
                console.log(`Updated job status with extracted text for document ${documentId}`);
              }
              
              // Process extracted text with OpenAI to identify company information
              if (extractedText) {
                try {
                  console.log(`Getting document details for processing company information...`);
                  const document = await storage.getCompanyDocument(documentId);
                  
                  if (document) {
                    console.log(`Processing company information for userId ${document.userId}...`);
                    const extractedData = await extractCompanyInformation(extractedText, document.userId);
                    
                    console.log(`Company information extracted:`, extractedData);
                    
                    // Update document with extracted text and data
                    await storage.updateCompanyDocument(documentId, {
                      status: 'completed',
                      extractedText,
                      extractedData,
                      processedAt: new Date()
                    });
                    
                    console.log(`Document updated with extracted data in database`);
                    
                    // Update user profile with extracted company information
                    console.log(`Updating user profile with extracted data for userId ${document.userId}...`);
                    await updateUserProfileWithExtractedData(document.userId, extractedData);
                    
                    // Update job status
                    const jobStatus = processingJobs.get(documentId);
                    if (jobStatus) {
                      jobStatus.status = 'completed';
                      jobStatus.extractedData = extractedData;
                      console.log(`Job status updated to completed for document ${documentId}`);
                    }
                  }
                } catch (err) {
                  console.error('Error processing extracted text:', err);
                  throw err;
                }
              }
              
              // Processing complete, exit loop
              break;
            }
          } catch (retrievalError) {
            console.error('Error retrieving OCR results:', retrievalError);
            throw retrievalError;
          }
        } else if (ocrStatusResponse.data.status === 'error') {
          throw new Error(ocrStatusResponse.data.message || 'Error processing document with OCR');
        }
      } catch (error: any) {
        console.error('Error checking OCR status:', error);
        if (retries >= maxRetries - 1) {
          throw error;
        }
      }
      
      retries++;
    }
    
    // If no text was extracted after max retries, throw error
    if (!extractedText) {
      throw new Error('OCR processing timed out');
    }
  } catch (error: any) {
    console.error('Error getting OCR results:', error);
    
    // Update processing status to error
    await storage.updateCompanyDocument(documentId, {
      status: 'error',
      errorMessage: error.message || 'Error getting OCR results',
      processedAt: new Date()
    });
    
    const jobStatus = processingJobs.get(documentId);
    if (jobStatus) {
      jobStatus.status = 'error';
      jobStatus.message = error.message || 'Error getting OCR results';
    }
  }
}

/**
 * Extract structured company information using GPT-4o
 */
async function extractCompanyInformation(text: string, userId: number): Promise<any> {
  try {
    console.log(`Starting company information extraction for userId: ${userId}`);
    console.log(`Text length: ${text.length} characters`);
    
    // Limit text to a reasonable size to avoid token limits
    const truncatedText = text.length > 10000 ? text.substring(0, 10000) + "..." : text;
    
    const prompt = `
You are an expert AI assistant for extracting structured company information from documents.
Analyze the following text extracted from a company document and identify key information about the business.

Extract the following information in JSON format:
1. companyDescription: A concise description of the company (max 200 words)
2. businessType: The type of business (e.g., LLC, Corporation, etc.)
3. companyActivities: An array of primary business activities or services (provide at least 3-5 if possible)
4. mainIndustries: An array of the main industries the company operates in (provide at least 2-3 if possible)
5. specializations: An array of specialized areas or expertise (provide at least 2-3 if possible)

If you cannot find specific information for a field, use null for singular values or an empty array [] for array values.
IMPORTANT: Always return a valid JSON object with all the requested fields, even if some values are null or empty arrays.

Here's the text from the document:
${truncatedText}
`;

    console.log('Sending extraction request to OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an AI that extracts structured company information from documents." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const content = completion.choices[0].message.content || "{}";
    console.log('Received response from OpenAI:', content);
    
    try {
      // Parse the extracted information
      const extractedInfo = JSON.parse(content);
      
      // Validate the extracted information has the expected structure
      const validatedInfo = {
        companyDescription: typeof extractedInfo.companyDescription === 'string' ? extractedInfo.companyDescription : null,
        businessType: typeof extractedInfo.businessType === 'string' ? extractedInfo.businessType : null,
        companyActivities: Array.isArray(extractedInfo.companyActivities) ? extractedInfo.companyActivities : [],
        mainIndustries: Array.isArray(extractedInfo.mainIndustries) ? extractedInfo.mainIndustries : [],
        specializations: Array.isArray(extractedInfo.specializations) ? extractedInfo.specializations : []
      };
      
      console.log('Validated extraction result:', validatedInfo);
      return validatedInfo;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse extracted information from OpenAI');
    }
  } catch (error) {
    console.error('Error extracting company information:', error);
    
    // Return default values
    const defaultValues = {
      companyDescription: null,
      businessType: null,
      companyActivities: [],
      mainIndustries: [],
      specializations: []
    };
    
    console.log('Returning default values due to extraction error:', defaultValues);
    return defaultValues;
  }
}

/**
 * Update user profile with extracted company information
 */
async function updateUserProfileWithExtractedData(userId: number, extractedData: any): Promise<void> {
  try {
    console.log(`Updating user profile for userId: ${userId} with extracted data:`, extractedData);
    
    // Get existing user profile
    const existingProfile = await storage.getUserProfile(userId);

    // Make sure the data has the expected format
    const normalizedData = {
      companyDescription: extractedData.companyDescription || null,
      companyActivities: Array.isArray(extractedData.companyActivities) ? extractedData.companyActivities : [],
      businessType: extractedData.businessType || null,
      mainIndustries: Array.isArray(extractedData.mainIndustries) ? extractedData.mainIndustries : [],
      specializations: Array.isArray(extractedData.specializations) ? extractedData.specializations : []
    };
    
    // Prepare a combined query string for tender matching
    // This combines all extracted data into a single comprehensive string
    // that will be used for semantic search in the tender API
    const combinedQueryData = [
      normalizedData.companyDescription || '',
      ...(normalizedData.companyActivities || []),
      ...(normalizedData.mainIndustries || []),
      ...(normalizedData.specializations || [])
    ].filter(Boolean).join(' ');
    
    console.log(`Generated combined query data for tender matching: ${combinedQueryData.substring(0, 100)}...`);
    
    // For debugging, log the profile before update
    console.log('Existing profile:', existingProfile);
    
    if (existingProfile) {
      // Update existing profile with extracted data and combined query data
      const updatedProfile = await storage.updateUserProfile(userId, {
        companyDescription: normalizedData.companyDescription || existingProfile.companyDescription,
        companyActivities: normalizedData.companyActivities.length > 0 ? normalizedData.companyActivities : existingProfile.companyActivities,
        businessType: normalizedData.businessType || existingProfile.businessType,
        mainIndustries: normalizedData.mainIndustries.length > 0 ? normalizedData.mainIndustries : existingProfile.mainIndustries,
        specializations: normalizedData.specializations.length > 0 ? normalizedData.specializations : existingProfile.specializations,
        queryData: combinedQueryData, // Store the combined data for tender API queries
      });
      
      console.log('Profile updated successfully:', updatedProfile);
      
      // Update the user's profileCompleteness score
      const user = await storage.getUser(userId);
      if (user) {
        let completeness = 30; // Base score for having uploaded a document
        
        // Add scores for each filled field
        if (normalizedData.companyDescription) completeness += 15;
        if (normalizedData.businessType) completeness += 15;
        if (normalizedData.companyActivities.length > 0) completeness += 15;
        if (normalizedData.mainIndustries.length > 0) completeness += 15;
        if (normalizedData.specializations.length > 0) completeness += 10;
        
        // Cap at 100%
        completeness = Math.min(completeness, 100);
        
        // Update user profile completeness
        await storage.updateUser(userId, {
          profileCompleteness: completeness
        });
        
        console.log(`Updated user profile completeness to ${completeness}%`);
      }
    } else {
      // Create new profile with extracted data and combined query data
      const newProfile = await storage.createUserProfile({
        userId,
        companyDescription: normalizedData.companyDescription,
        companyActivities: normalizedData.companyActivities,
        businessType: normalizedData.businessType,
        mainIndustries: normalizedData.mainIndustries,
        specializations: normalizedData.specializations,
        queryData: combinedQueryData // Store the combined data for tender API queries
      });
      
      console.log('New profile created successfully:', newProfile);
      
      // Update the user's profileCompleteness score for a new profile
      const user = await storage.getUser(userId);
      if (user) {
        let completeness = 30; // Base score for having uploaded a document
        
        // Add scores for each filled field
        if (normalizedData.companyDescription) completeness += 15;
        if (normalizedData.businessType) completeness += 15;
        if (normalizedData.companyActivities.length > 0) completeness += 15;
        if (normalizedData.mainIndustries.length > 0) completeness += 15;
        if (normalizedData.specializations.length > 0) completeness += 10;
        
        // Cap at 100%
        completeness = Math.min(completeness, 100);
        
        // Update user profile completeness
        await storage.updateUser(userId, {
          profileCompleteness: completeness
        });
        
        console.log(`Set initial user profile completeness to ${completeness}%`);
      }
    }
  } catch (error) {
    console.error('Error updating user profile with extracted data:', error);
    throw error; // Re-throw so we can track this error
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
  try {
    const jobStatus = processingJobs.get(documentId);
    
    if (jobStatus && jobStatus.filePath) {
      if (fs.existsSync(jobStatus.filePath)) {
        await fsPromises.unlink(jobStatus.filePath);
      }
    }
  } catch (error) {
    console.error('Error cleaning up document files:', error);
  }
}