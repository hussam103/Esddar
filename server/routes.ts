import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertTenderSchema, 
  insertApplicationSchema, 
  insertSavedTenderSchema, 
  tenders, 
  users, 
  applications,
  externalSources,
  scrapeLogs,
  vectorRecords
} from "@shared/schema";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";
import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from "./db";
import { eq, count, desc } from "drizzle-orm";
import multer from "multer";
import { 
  ensureUploadDirectories, 
  saveUploadedFile, 
  processDocumentWithOCR,
  getDocumentStatus,
  cleanupDocumentFiles
} from "./services/document-processing";
import { sendWelcomeEmail, sendSubscriptionConfirmationEmail, verifyEmailConfirmationToken, sendConfirmationEmail } from "./services/email-service";

// Schema for subscription
const subscriptionSchema = z.object({
  plan: z.enum(["basic", "professional", "enterprise"]),
  price: z.number().positive()
});

import { 
  scrapeTenders, 
  getTenderDetails, 
  getPaginatedTenders, 
  getTenderById 
} from './services/etimad-service';

// Middleware to check if user is authenticated and has admin role
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized: Please log in" });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up authentication routes
  setupAuth(app);

  // API routes
  // Tenders
  app.get("/api/tenders", async (req, res) => {
    try {
      const tenders = await storage.getTenders();
      res.json(tenders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tenders" });
    }
  });

  app.get("/api/tenders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tender = await storage.getTender(id);
      
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }
      
      res.json(tender);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tender" });
    }
  });
  
  app.get("/api/tenders/category/:category", async (req, res) => {
    try {
      const tenders = await storage.getTendersByCategory(req.params.category);
      res.json(tenders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tenders by category" });
    }
  });
  
  // Get recommended tenders based on user profile
  app.get("/api/recommended-tenders", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const recommendedTenders = await storage.getRecommendedTenders(req.user.id, limit);
      res.json(recommendedTenders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recommended tenders" });
    }
  });

  // Saved tenders
  app.get("/api/saved-tenders", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const savedTenders = await storage.getSavedTenders(req.user.id);
      res.json(savedTenders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch saved tenders" });
    }
  });

  app.post("/api/save-tender", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const data = insertSavedTenderSchema.parse({
        userId: req.user.id,
        tenderId: req.body.tenderId
      });
      
      const isSaved = await storage.isTenderSaved(data.userId, data.tenderId);
      if (isSaved) {
        return res.status(400).json({ error: "Tender already saved" });
      }
      
      const savedTender = await storage.saveTender(data);
      res.status(201).json(savedTender);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to save tender" });
    }
  });

  app.delete("/api/save-tender/:tenderId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const tenderId = parseInt(req.params.tenderId);
      const result = await storage.unsaveTender(req.user.id, tenderId);
      
      if (!result) {
        return res.status(404).json({ error: "Saved tender not found" });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unsave tender" });
    }
  });
  
  app.get("/api/is-tender-saved/:tenderId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const tenderId = parseInt(req.params.tenderId);
      const isSaved = await storage.isTenderSaved(req.user.id, tenderId);
      res.json({ isSaved });
    } catch (error) {
      res.status(500).json({ error: "Failed to check if tender is saved" });
    }
  });

  // Applications
  app.get("/api/applications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const applications = await storage.getApplications(req.user.id);
      
      // Fetch the tender details for each application
      const applicationsWithTenders = await Promise.all(
        applications.map(async (app) => {
          const tender = await storage.getTender(app.tenderId);
          return { ...app, tender };
        })
      );
      
      res.json(applicationsWithTenders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.get("/api/applications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getApplication(id);
      
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      
      if (application.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const tender = await storage.getTender(application.tenderId);
      res.json({ ...application, tender });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch application" });
    }
  });

  app.post("/api/applications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const data = insertApplicationSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const application = await storage.createApplication(data);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create application" });
    }
  });

  app.put("/api/applications/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getApplication(id);
      
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      
      if (application.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const updatedApplication = await storage.updateApplication(id, req.body);
      res.json(updatedApplication);
    } catch (error) {
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  // User profile
  app.get("/api/user-profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const profile = await storage.getUserProfile(req.user.id);
      
      if (!profile) {
        return res.status(404).json({ error: "User profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.put("/api/user-profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const profile = await storage.updateUserProfile(req.user.id, req.body);
      
      if (!profile) {
        return res.status(404).json({ error: "User profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });

  // Subscription
  app.post("/api/subscribe", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const data = subscriptionSchema.parse(req.body);
      
      // Update user with subscription details
      const user = await storage.updateUser(req.user.id, {
        // Use as any to bypass type checking for the new fields we added
        subscriptionPlan: data.plan,
        subscriptionPrice: data.price.toString(),
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      } as any);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.status(201).json({
        success: true,
        subscription: {
          plan: user.subscriptionPlan,
          status: user.subscriptionStatus,
          startDate: user.subscriptionStartDate,
          endDate: user.subscriptionEndDate
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // Get current subscription details
  app.get("/api/subscription", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (!user.subscriptionPlan) {
        return res.json({ hasSubscription: false });
      }
      
      res.json({
        hasSubscription: true,
        subscription: {
          plan: user.subscriptionPlan,
          price: user.subscriptionPrice,
          status: user.subscriptionStatus,
          startDate: user.subscriptionStartDate,
          endDate: user.subscriptionEndDate
        } as any
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscription details" });
    }
  });

  // Cancel subscription
  app.post("/api/subscription/cancel", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user || !user.subscriptionPlan) {
        return res.status(404).json({ error: "No active subscription found" });
      }
      
      const updatedUser = await storage.updateUser(req.user.id, {
        subscriptionStatus: 'cancelled'
      } as any);
      
      res.json({
        success: true,
        message: "Subscription cancelled successfully"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });
  
  // Company document upload and OCR processing
  
  // Initialize multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(), // Use memory storage for handling file data
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: (req, file, cb) => {
      // Only accept PDF files
      if (file.mimetype !== 'application/pdf') {
        return cb(new Error('Only PDF files are allowed'));
      }
      cb(null, true);
    }
  });
  
  // Initialize upload directories
  ensureUploadDirectories().catch(error => {
    console.error('Failed to initialize upload directories:', error);
  });
  
  // Upload company document
  app.post(
    "/api/upload-company-document", 
    (req, res, next) => {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      console.log("Authentication check passed");
      next();
    },
    upload.single('file'),
    async (req, res) => {
      try {
        console.log("Upload endpoint called", { 
          hasFile: !!req.file, 
          contentType: req.headers['content-type'],
          bodyKeys: Object.keys(req.body || {})
        });
        
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }
        
        console.log("File uploaded:", {
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        });
        
        // Ensure user exists
        if (!req.user || !req.user.id) {
          return res.status(401).json({ error: "User not authenticated" });
        }
        
        // Check for existing documents and delete them if found
        const existingDocuments = await storage.getCompanyDocumentsByUser(req.user.id);
        
        if (existingDocuments && existingDocuments.length > 0) {
          // Delete existing documents from storage and database
          for (const doc of existingDocuments) {
            await cleanupDocumentFiles(doc.documentId);
            // The database record will be replaced with the new upload
          }
          console.log(`Removed ${existingDocuments.length} existing documents for user ${req.user.id}`);
        }
        
        const documentId = await saveUploadedFile(req.file, req.user.id);
        
        res.status(201).json({ 
          success: true, 
          documentId,
          message: "Document uploaded successfully"
        });
        
        // Send notification
        (global as any).sendNotification(
          req.user.id,
          'Document Upload',
          'Your document has been uploaded and is pending processing',
          'info',
          { documentId }
        );
      } catch (error: any) {
        console.error('Error uploading document:', error);
        res.status(500).json({ 
          error: "Failed to upload document",
          message: error.message || 'Unknown error occurred'
        });
      }
    }
  );
  
  // Process uploaded document with OCR
  app.post(
    "/api/process-company-document/:documentId",
    async (req, res) => {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      
      try {
        const { documentId } = req.params;
        
        // Get document from database
        const document = await storage.getCompanyDocument(documentId);
        
        if (!document) {
          return res.status(404).json({ error: "Document not found" });
        }
        
        if (document.userId !== req.user.id) {
          return res.status(403).json({ error: "Forbidden" });
        }
        
        // Start processing in the background
        processDocumentWithOCR(documentId).catch(error => {
          console.error('Error processing document with OCR:', error);
        });
        
        res.status(202).json({ 
          success: true, 
          status: 'processing',
          message: "Document processing started"
        });
      } catch (error: any) {
        console.error('Error starting document processing:', error);
        res.status(500).json({ 
          error: "Failed to process document",
          message: error.message || 'Unknown error occurred'
        });
      }
    }
  );
  
  // Check document processing status
  app.get(
    "/api/check-document-status/:documentId",
    async (req, res) => {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      
      try {
        const { documentId } = req.params;
        
        // Get document from database
        const document = await storage.getCompanyDocument(documentId);
        
        if (!document) {
          return res.status(404).json({ error: "Document not found" });
        }
        
        if (document.userId !== req.user.id) {
          return res.status(403).json({ error: "Forbidden" });
        }
        
        // Get processing status
        const status = getDocumentStatus(documentId);
        
        // If processing is complete, send notification
        if (status && status.status === 'completed' && !document.processedAt) {
          // Send notification
          (global as any).sendNotification(
            req.user.id,
            'Document Processing Complete',
            'Your document has been processed successfully',
            'success',
            { documentId }
          );
        }
        
        res.json({ 
          documentId,
          status: document.status,
          message: document.errorMessage || 'Document is being processed'
        });
      } catch (error: any) {
        console.error('Error checking document status:', error);
        res.status(500).json({ 
          error: "Failed to check document status",
          message: error.message || 'Unknown error occurred'
        });
      }
    }
  );
  
  // Get user company documents
  app.get(
    "/api/company-documents",
    async (req, res) => {
      if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
      
      try {
        const documents = await storage.getCompanyDocumentsByUser(req.user.id);
        res.json(documents);
      } catch (error: any) {
        console.error('Error fetching user documents:', error);
        res.status(500).json({ 
          error: "Failed to fetch user documents",
          message: error.message || 'Unknown error occurred'
        });
      }
    }
  );

  // Email Verification Endpoints
  
  // Email confirmation route
  app.get("/api/confirm-email", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: "Invalid or missing token. Please request a new confirmation email." });
      }
      
      const verified = await verifyEmailConfirmationToken(token);
      
      if (verified) {
        // The verification was successful, look for any authenticated user
        if (req.isAuthenticated() && req.user) {
          const user = await storage.getUser(req.user.id);
          if (user && user.email) {
            await sendWelcomeEmail(user.username, user.email);
          }
        }
        
        return res.json({ 
          success: true, 
          message: "Email confirmed successfully. You can now continue with the onboarding process." 
        });
      } else {
        return res.status(400).json({ 
          error: "Invalid or expired token. Please request a new confirmation email." 
        });
      }
    } catch (error: any) {
      console.error("Error confirming email:", error);
      return res.status(500).json({ 
        error: "An error occurred while confirming your email. Please try again later." 
      });
    }
  });
  
  // Resend confirmation email
  app.post("/api/resend-confirmation", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (user.emailVerified) {
        return res.status(400).json({ 
          error: "Email is already verified" 
        });
      }
      
      if (!user.email) {
        return res.status(400).json({ 
          error: "No email address associated with this account" 
        });
      }
      
      // Get the protocol and host from headers
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      
      // Send confirmation email
      const emailSent = await sendConfirmationEmail(
        user.id, 
        user.username, 
        user.email, 
        baseUrl
      );
      
      if (emailSent) {
        return res.json({ 
          success: true, 
          message: "Confirmation email sent successfully" 
        });
      } else {
        return res.status(500).json({ 
          error: "Failed to send confirmation email. Please try again later." 
        });
      }
    } catch (error: any) {
      console.error("Error resending confirmation email:", error);
      return res.status(500).json({ 
        error: "An error occurred. Please try again later." 
      });
    }
  });
  
  // Onboarding Flow Endpoints
  
  // Get user's current onboarding status
  app.get("/api/onboarding-status", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get document status for all steps (needed for step completion indicators)
      let documentStatus = null;
      const documents = await storage.getCompanyDocumentsByUser(user.id);
      if (documents && documents.length > 0) {
        documentStatus = {
          documentId: documents[0].documentId,
          status: documents[0].status,
          fileName: documents[0].fileName,
          uploadedAt: documents[0].uploadedAt
        };
      }
      
      res.json({
        completed: user.onboardingCompleted,
        currentStep: user.onboardingStep,
        emailVerified: user.emailVerified,
        documentStatus,
        hasSubscription: !!user.subscriptionPlan,
        hasTutorial: user.hasSeenTutorial
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch onboarding status" });
    }
  });
  
  // Update onboarding step
  app.post("/api/onboarding/next-step", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const { currentStep, nextStep } = req.body;
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Validate the current step
      if (user.onboardingStep !== currentStep) {
        return res.status(400).json({ 
          error: "Invalid current step", 
          expected: user.onboardingStep, 
          received: currentStep 
        });
      }
      
      // Validate the next step based on the current step
      const validNextSteps: Record<string, string[]> = {
        'email_verification': ['upload_document'],
        'upload_document': ['choose_plan'],
        'choose_plan': ['payment'],
        'payment': ['completed']
      };
      
      if (!validNextSteps[currentStep]?.includes(nextStep)) {
        return res.status(400).json({ 
          error: "Invalid next step", 
          validSteps: validNextSteps[currentStep] || [] 
        });
      }
      
      // Special validation for specific steps
      if (currentStep === 'email_verification' && !user.emailVerified) {
        return res.status(400).json({ 
          error: "Email must be verified to proceed" 
        });
      }
      
      if (currentStep === 'upload_document') {
        const documents = await storage.getCompanyDocumentsByUser(user.id);
        if (!documents || documents.length === 0) {
          return res.status(400).json({ 
            error: "Company document must be uploaded to proceed" 
          });
        }
        
        // Make sure the document is fully processed
        if (documents[0].status !== 'completed') {
          return res.status(400).json({ 
            error: "Document is still being processed. Please wait until processing is complete." 
          });
        }
      }
      
      // Update the user's onboarding step
      const updatedUser = await storage.updateUser(user.id, { 
        onboardingStep: nextStep,
        onboardingCompleted: nextStep === 'completed'
      });
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update onboarding step" });
      }
      
      res.json({
        success: true,
        currentStep: nextStep,
        completed: nextStep === 'completed'
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update onboarding step" });
    }
  });
  
  // Complete tutorial
  app.post("/api/onboarding/complete-tutorial", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const { tutorialKey, pointsEarned, achievementsEarned } = req.body;
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get current user profile or create if doesn't exist
      let userProfile = await storage.getUserProfile(user.id);
      if (!userProfile) {
        userProfile = await storage.createUserProfile({
          userId: user.id,
          companyDescription: '',
          achievements: [],
          points: 0,
          level: 1,
          completedTutorials: []
        });
      }

      // Update user points and completed tutorials
      const currentPoints = userProfile.points || 0;
      const newPoints = currentPoints + (pointsEarned || 0);
      
      // Calculate level based on points
      const calculateLevel = (points: number) => {
        return Math.floor(Math.sqrt(points / 25)) + 1;
      };
      
      const newLevel = calculateLevel(newPoints);
      
      // Get existing achievements and add new ones
      const currentAchievements = userProfile.achievements || [];
      const completedTutorials = userProfile.completedTutorials || [];
      
      // Add new achievements if they don't already exist
      const newAchievements = (achievementsEarned || [])
        .filter(id => !currentAchievements.some(a => a.id === id))
        .map(achievementId => ({
          id: achievementId,
          dateUnlocked: new Date().toISOString()
        }));
      
      const updatedAchievements = [...currentAchievements, ...newAchievements];
      
      // Add completed tutorial if not already completed
      let updatedTutorials = completedTutorials;
      if (tutorialKey && !completedTutorials.includes(tutorialKey)) {
        updatedTutorials = [...completedTutorials, tutorialKey];
      }
      
      // Update user profile
      await storage.updateUserProfile(user.id, {
        points: newPoints,
        level: newLevel,
        achievements: updatedAchievements,
        completedTutorials: updatedTutorials
      });
      
      // Update user hasSeenTutorial flag
      const updatedUser = await storage.updateUser(user.id, {
        hasSeenTutorial: true
      });
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update tutorial status" });
      }
      
      res.json({
        success: true,
        hasSeenTutorial: true,
        points: newPoints,
        level: newLevel,
        achievements: updatedAchievements
      });
    } catch (error) {
      console.error("Error completing tutorial:", error);
      res.status(500).json({ error: "Failed to update tutorial status" });
    }
  });
  
  // Achievement endpoints defined below
  
  // Skip tutorial endpoint
  app.post("/api/onboarding/skip-tutorial", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(user.id, {
        hasSeenTutorial: true
      });
      
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update tutorial status" });
      }
      
      res.json({
        success: true,
        hasSeenTutorial: true
      });
    } catch (error) {
      console.error("Error skipping tutorial:", error);
      res.status(500).json({ error: "Failed to update tutorial status" });
    }
  });
  
  // Get user achievements
  app.get("/api/user/achievements", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const userId = parseInt(req.query.userId as string) || req.user.id;
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get user profile
      const userProfile = await storage.getUserProfile(userId);
      if (!userProfile) {
        // If no profile yet, return empty achievements
        return res.status(200).json({
          achievements: [],
          points: 0,
          level: 1
        });
      }
      
      // Define all possible achievements
      const allAchievements = [
        {
          id: 'first_login',
          name: {
            en: 'First Login',
            ar: 'الدخول الأول'
          },
          description: {
            en: 'You logged in for the first time',
            ar: 'لقد قمت بتسجيل الدخول لأول مرة'
          },
          points: 10
        },
        {
          id: 'email_verified',
          name: {
            en: 'Email Verified',
            ar: 'تم التحقق من البريد الإلكتروني'
          },
          description: {
            en: 'You verified your email address',
            ar: 'لقد تحققت من عنوان بريدك الإلكتروني'
          },
          points: 15
        },
        {
          id: 'profile_completed',
          name: {
            en: 'Profile Expert',
            ar: 'خبير الملف الشخصي'
          },
          description: {
            en: 'Complete your profile information',
            ar: 'أكمل معلومات ملفك الشخصي'
          },
          points: 25
        },
        {
          id: 'document_uploaded',
          name: {
            en: 'Document Master',
            ar: 'سيد المستندات'
          },
          description: {
            en: 'Upload your first company document',
            ar: 'قم بتحميل وثيقة الشركة الأولى الخاصة بك'
          },
          points: 20
        },
        {
          id: 'first_saved_tender',
          name: {
            en: 'Tender Collector',
            ar: 'جامع المناقصات'
          },
          description: {
            en: 'Save your first tender',
            ar: 'احفظ أول مناقصة'
          },
          points: 15
        },
        {
          id: 'first_application',
          name: {
            en: 'First Application',
            ar: 'الطلب الأول'
          },
          description: {
            en: 'Apply for your first tender',
            ar: 'تقدم بطلب للمناقصة الأولى'
          },
          points: 50
        },
        {
          id: 'subscription_started',
          name: {
            en: 'Premium Member',
            ar: 'عضو مميز'
          },
          description: {
            en: 'Subscribe to a premium plan',
            ar: 'اشترك في خطة مميزة'
          },
          points: 100
        },
        {
          id: 'tutorial_completed',
          name: {
            en: 'Tutorial Graduate',
            ar: 'خريج البرنامج التعليمي'
          },
          description: {
            en: 'Complete the platform tutorial',
            ar: 'أكمل البرنامج التعليمي للمنصة'
          },
          points: 30
        },
        {
          id: 'tender_explorer',
          name: {
            en: 'Tender Explorer',
            ar: 'مستكشف المناقصات'
          },
          description: {
            en: 'Discover the recommended tenders section',
            ar: 'اكتشف قسم المناقصات الموصى بها'
          },
          points: 20
        },
        {
          id: 'profile_master',
          name: {
            en: 'Profile Master',
            ar: 'سيد الملف الشخصي'
          },
          description: {
            en: 'Learn how to optimize your profile',
            ar: 'تعلم كيفية تحسين ملفك الشخصي'
          },
          points: 30
        }
      ];
      
      // Map earned achievements with dates
      const unlockedAchievementMap = new Map(
        (userProfile.achievements || []).map(achievement => [achievement.id, achievement.dateUnlocked])
      );
      
      // Calculate progress for specific achievements
      const calculateProfileCompleteness = () => {
        // Basic profile fields that count toward completeness
        const totalFields = 6; // username, email, companyName, description, industry, services
        let completedFields = 0;
        
        if (user.username) completedFields++;
        if (user.email) completedFields++;
        if (user.companyName) completedFields++;
        if (user.description) completedFields++;
        if (user.industry) completedFields++;
        if (user.services && user.services.length > 0) completedFields++;
        
        return Math.round((completedFields / totalFields) * 100);
      };
      
      // Check for automatic achievements based on user state
      const checkForAutomaticAchievements = async () => {
        const newAchievements = [];
        const profileCompleteness = calculateProfileCompleteness();
        
        // First login achievement - should always be unlocked if user exists
        if (!unlockedAchievementMap.has('first_login')) {
          newAchievements.push({
            id: 'first_login',
            dateUnlocked: new Date().toISOString()
          });
        }
        
        // Email verified achievement
        if (!unlockedAchievementMap.has('email_verified') && user.emailVerified) {
          newAchievements.push({
            id: 'email_verified',
            dateUnlocked: new Date().toISOString()
          });
        }
        
        // Profile completed achievement (if 100% complete)
        if (!unlockedAchievementMap.has('profile_completed') && profileCompleteness === 100) {
          newAchievements.push({
            id: 'profile_completed',
            dateUnlocked: new Date().toISOString()
          });
        }
        
        // Check if user has uploaded documents
        if (!unlockedAchievementMap.has('document_uploaded')) {
          const documents = await storage.getCompanyDocumentsByUser(userId);
          if (documents && documents.length > 0) {
            newAchievements.push({
              id: 'document_uploaded',
              dateUnlocked: new Date().toISOString()
            });
          }
        }
        
        // Check if user has saved tenders
        if (!unlockedAchievementMap.has('first_saved_tender')) {
          const savedTenders = await storage.getSavedTenders(userId);
          if (savedTenders && savedTenders.length > 0) {
            newAchievements.push({
              id: 'first_saved_tender',
              dateUnlocked: new Date().toISOString()
            });
          }
        }
        
        // Check if user has applied to any tenders
        if (!unlockedAchievementMap.has('first_application')) {
          const applications = await storage.getApplications(userId);
          if (applications && applications.length > 0) {
            newAchievements.push({
              id: 'first_application',
              dateUnlocked: new Date().toISOString()
            });
          }
        }
        
        // Check if user has an active subscription
        if (!unlockedAchievementMap.has('subscription_started') && 
            user.subscriptionStatus === 'active') {
          newAchievements.push({
            id: 'subscription_started',
            dateUnlocked: new Date().toISOString()
          });
        }
        
        // Check if we need to update the profile with new achievements
        if (newAchievements.length > 0) {
          // Calculate points from new achievements
          const newPoints = newAchievements.reduce((total, achievement) => {
            const achievementInfo = allAchievements.find(a => a.id === achievement.id);
            return total + (achievementInfo?.points || 0);
          }, 0);
          
          // Update user profile with new achievements and points
          const updatedAchievements = [
            ...(userProfile.achievements || []),
            ...newAchievements
          ];
          
          const updatedPoints = (userProfile.points || 0) + newPoints;
          const newLevel = Math.floor(Math.sqrt(updatedPoints / 25)) + 1;
          
          await storage.updateUserProfile(userId, {
            achievements: updatedAchievements,
            points: updatedPoints,
            level: newLevel
          });
          
          // Update local map for response
          newAchievements.forEach(achievement => {
            unlockedAchievementMap.set(achievement.id, achievement.dateUnlocked);
          });
        }
      };
      
      // Check for automatic achievements
      await checkForAutomaticAchievements();
      
      // Map achievements to the format needed by the frontend
      const formattedAchievements = allAchievements.map(achievement => {
        const isUnlocked = unlockedAchievementMap.has(achievement.id);
        const dateUnlocked = unlockedAchievementMap.get(achievement.id);
        
        // Calculate progress for profile completion if relevant
        let progress;
        if (achievement.id === 'profile_completed' && !isUnlocked) {
          progress = calculateProfileCompleteness();
        }
        
        return {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          points: achievement.points,
          isUnlocked,
          dateUnlocked,
          progress
        };
      });
      
      res.status(200).json({
        achievements: formattedAchievements,
        points: userProfile.points || 0,
        level: userProfile.level || 1,
        completedTutorials: userProfile.completedTutorials || []
      });
      
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  // Etimad API Integration
  app.get("/api/scrape-etimad-tenders", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(401).json({ error: "Unauthorized - Admin access required" });
    }

    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.page_size ? parseInt(req.query.page_size as string) : 10;
      
      if (pageSize > 100) {
        return res.status(400).json({ error: "Page size cannot exceed 100" });
      }
      
      const tenders = await scrapeTenders(page, pageSize);
      res.json({ success: true, count: tenders.length, tenders });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to scrape tenders from Etimad",
        message: error.message
      });
    }
  });

  app.get("/api/tender-details/:tenderIdString", async (req, res) => {
    try {
      const { tenderIdString } = req.params;
      const details = await getTenderDetails(tenderIdString);
      
      if (!details) {
        return res.status(404).json({ error: "Tender details not found" });
      }
      
      res.json(details);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to get tender details",
        message: error.message
      });
    }
  });

  app.get("/api/etimad-tenders", async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.page_size ? parseInt(req.query.page_size as string) : 10;
      const tenderType = req.query.tender_type as string | undefined;
      const agencyName = req.query.agency_name as string | undefined;
      
      if (pageSize > 100) {
        return res.status(400).json({ error: "Page size cannot exceed 100" });
      }
      
      const results = await getPaginatedTenders(page, pageSize, tenderType, agencyName);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to get paginated tenders",
        message: error.message
      });
    }
  });

  app.get("/api/etimad-tenders/:tenderId", async (req, res) => {
    try {
      const tenderId = parseInt(req.params.tenderId);
      
      if (isNaN(tenderId)) {
        return res.status(400).json({ error: "Invalid tender ID" });
      }
      
      const tender = await getTenderById(tenderId);
      
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }
      
      res.json(tender);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to get tender by ID",
        message: error.message
      });
    }
  });

  // Etimad Tender API Endpoints
  // Get tenders with pagination and filters
  app.get("/api/etimad/tenders", async (req, res) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.page_size ? parseInt(req.query.page_size as string) : 10;
      const tenderType = req.query.tender_type as string || undefined;
      const agencyName = req.query.agency_name as string || undefined;
      
      const paginatedTenders = await getPaginatedTenders(page, pageSize, tenderType, agencyName);
      res.json(paginatedTenders);
    } catch (error: any) {
      console.error('Error fetching paginated tenders:', error);
      res.status(500).json({ 
        error: "Failed to fetch tenders", 
        message: error.message || 'Unknown error occurred'
      });
    }
  });
  
  // Get tender details by ID
  app.get("/api/etimad/tender/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tender = await getTenderById(id);
      
      if (!tender) {
        return res.status(404).json({ error: "Tender not found" });
      }
      
      res.json(tender);
    } catch (error: any) {
      console.error('Error fetching tender details:', error);
      res.status(500).json({ 
        error: "Failed to fetch tender details", 
        message: error.message || 'Unknown error occurred'
      });
    }
  });
  
  // Get tender details by external ID (tenderIdString)
  app.get("/api/etimad/tender-details/:tenderIdString", async (req, res) => {
    try {
      const { tenderIdString } = req.params;
      const tenderDetails = await getTenderDetails(tenderIdString);
      
      if (!tenderDetails) {
        return res.status(404).json({ error: "Tender details not found" });
      }
      
      res.json(tenderDetails);
    } catch (error: any) {
      console.error('Error fetching tender details:', error);
      res.status(500).json({ 
        error: "Failed to fetch tender details", 
        message: error.message || 'Unknown error occurred'
      });
    }
  });
  
  // Scrape tenders from Etimad and save them to the database
  app.get("/api/etimad/scrape-tenders", isAdmin, async (req, res) => {
    try {
      
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.page_size ? parseInt(req.query.page_size as string) : 10;
      
      const tenders = await scrapeTenders(page, pageSize);
      res.json(tenders);
    } catch (error: any) {
      console.error('Error scraping tenders:', error);
      res.status(500).json({ 
        error: "Failed to scrape tenders", 
        message: error.message || 'Unknown error occurred'
      });
    }
  });

  const httpServer = createServer(app);
  
  // إنشاء خادم WebSocket مع تحديد المسار لتجنب التعارض مع HMR الخاص بـ Vite
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });
  
  // متغير لتخزين اتصالات العملاء (connections) مع معرفات المستخدمين
  const clients = new Map<number, Set<WebSocket>>();
  
  // التعامل مع اتصالات الـ websocket
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // استقبال رسائل من العميل
    ws.on('message', async (message) => {
      try {
        // تفسير الرسالة المستلمة
        const data = JSON.parse(message.toString());
        
        // معالجة رسالة تسجيل الدخول
        if (data.type === 'auth' && data.userId) {
          const userId = parseInt(data.userId);
          
          // تخزين اتصال العميل مع معرف المستخدم
          if (!clients.has(userId)) {
            clients.set(userId, new Set());
          }
          clients.get(userId)?.add(ws);
          
          // إرسال إشعار تأكيد التسجيل
          ws.send(JSON.stringify({
            type: 'auth_success',
            message: 'تم تسجيل الدخول إلى نظام الإشعارات بنجاح'
          }));
          
          console.log(`User ${userId} connected to notifications`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // التعامل مع إغلاق الاتصال
    ws.on('close', () => {
      // إزالة الاتصال من جميع قوائم المستخدمين
      clients.forEach((userConnections, userId) => {
        if (userConnections.has(ws)) {
          userConnections.delete(ws);
          if (userConnections.size === 0) {
            clients.delete(userId);
          }
          console.log(`Connection closed for user ${userId}`);
        }
      });
    });
  });
  
  // إضافة دالة مساعدة لإرسال الإشعارات عبر websocket
  // يمكن استخدامها في أي مكان في التطبيق
  (global as any).sendNotification = (
    userId: number,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    data?: any
  ) => {
    const userConnections = clients.get(userId);
    if (!userConnections || userConnections.size === 0) {
      console.log(`No active connections for user ${userId}`);
      return false;
    }
    
    const notification = {
      type: 'notification',
      title,
      message,
      notificationType: type,
      timestamp: new Date(),
      data
    };
    
    // إرسال الإشعار لجميع اتصالات المستخدم
    let sent = false;
    userConnections.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification));
        sent = true;
      }
    });
    
    return sent;
  };
  
  // إرسال إشعار عندما يتم حفظ مناقصة
  const originalSaveTender = app.post.bind(app, "/api/save-tender");
  app._router.stack = app._router.stack.filter((layer: any) => 
    !(layer.route && layer.route.path === "/api/save-tender" && layer.route.methods.post)
  );
  
  app.post("/api/save-tender", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const data = insertSavedTenderSchema.parse({
        userId: req.user.id,
        tenderId: req.body.tenderId
      });
      
      const isSaved = await storage.isTenderSaved(data.userId, data.tenderId);
      if (isSaved) {
        return res.status(400).json({ error: "Tender already saved" });
      }
      
      const savedTender = await storage.saveTender(data);
      
      // إرسال إشعار للمستخدم عند حفظ مناقصة جديدة
      const tender = await storage.getTender(data.tenderId);
      if (tender) {
        (global as any).sendNotification(
          req.user.id,
          'تم حفظ المناقصة',
          `تم حفظ المناقصة "${tender.title}" بنجاح`,
          'success',
          { tenderId: tender.id }
        );
      }
      
      res.status(201).json(savedTender);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to save tender" });
    }
  });
  
  // إرسال إشعار عند تقديم طلب لمناقصة
  const originalCreateApplication = app.post.bind(app, "/api/applications");
  app._router.stack = app._router.stack.filter((layer: any) => 
    !(layer.route && layer.route.path === "/api/applications" && layer.route.methods.post)
  );
  
  app.post("/api/applications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const data = insertApplicationSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const application = await storage.createApplication(data);
      
      // إرسال إشعار للمستخدم عند تقديم طلب جديد
      const tender = await storage.getTender(data.tenderId);
      if (tender) {
        (global as any).sendNotification(
          req.user.id,
          'تم تقديم الطلب',
          `تم تقديم طلبك لمناقصة "${tender.title}" بنجاح`,
          'success',
          { applicationId: application.id, tenderId: tender.id }
        );
      }
      
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create application" });
    }
  });
  
  // Admin API routes
  
  // Get all external sources
  app.get("/api/admin/sources", isAdmin, async (req, res) => {
    try {
      const sources = await db.query.externalSources.findMany({
        orderBy: (sources, { desc }) => [desc(sources.lastScrapedAt)]
      });
      res.json(sources);
    } catch (error) {
      console.error("Failed to fetch external sources:", error);
      res.status(500).json({ error: "Failed to fetch external sources" });
    }
  });
  
  // Add a new external source
  app.post("/api/admin/sources", isAdmin, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const source = await db.insert(externalSources).values({
        ...req.body,
        createdBy: req.user.id,
        createdAt: new Date()
      }).returning();
      
      res.status(201).json(source[0]);
    } catch (error) {
      console.error("Failed to add external source:", error);
      res.status(500).json({ error: "Failed to add external source" });
    }
  });
  
  // Update an external source
  app.put("/api/admin/sources/:id", isAdmin, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const source = await db.update(externalSources)
        .set(req.body)
        .where(eq(externalSources.id, id))
        .returning();
      
      if (source.length === 0) {
        return res.status(404).json({ error: "External source not found" });
      }
      
      res.json(source[0]);
    } catch (error) {
      console.error("Failed to update external source:", error);
      res.status(500).json({ error: "Failed to update external source" });
    }
  });
  
  // Delete an external source
  app.delete("/api/admin/sources/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await db.delete(externalSources)
        .where(eq(externalSources.id, id))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ error: "External source not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete external source:", error);
      res.status(500).json({ error: "Failed to delete external source" });
    }
  });
  
  // Get all scrape logs
  app.get("/api/admin/scrape-logs", isAdmin, async (req, res) => {
    try {
      const logs = await db.query.scrapeLogs.findMany({
        with: {
          source: true
        },
        orderBy: (logs, { desc }) => [desc(logs.startTime)]
      });
      res.json(logs);
    } catch (error) {
      console.error("Failed to fetch scrape logs:", error);
      res.status(500).json({ error: "Failed to fetch scrape logs" });
    }
  });
  
  // Start a scraping job for a source
  app.post("/api/admin/scrape/:sourceId", isAdmin, async (req, res) => {
    try {
      const sourceId = parseInt(req.params.sourceId);
      
      // Get the source
      const source = await db.query.externalSources.findFirst({
        where: eq(externalSources.id, sourceId)
      });
      
      if (!source) {
        return res.status(404).json({ error: "External source not found" });
      }
      
      // Create a new scrape log
      const scrapeLog = await db.insert(scrapeLogs).values({
        sourceId: sourceId,
        startTime: new Date(),
        status: 'running',
        details: {}
      }).returning();
      
      // For the demo, we'll just update the log after a short delay
      // In a real implementation, this would be handled by a background job
      setTimeout(async () => {
        try {
          // Update the scrape log with completion data
          await db.update(scrapeLogs)
            .set({
              endTime: new Date(),
              status: 'completed',
              totalTenders: Math.floor(Math.random() * 50) + 5,
              newTenders: Math.floor(Math.random() * 20),
              updatedTenders: Math.floor(Math.random() * 10),
              failedTenders: Math.floor(Math.random() * 3),
              details: { message: "Scraping completed successfully" }
            })
            .where(eq(scrapeLogs.id, scrapeLog[0].id));
            
          // Update the source's lastScrapedAt
          await db.update(externalSources)
            .set({ lastScrapedAt: new Date() })
            .where(eq(externalSources.id, sourceId));
            
          console.log(`Scraping job ${scrapeLog[0].id} completed for source ${sourceId}`);
        } catch (error) {
          console.error(`Error updating scrape log ${scrapeLog[0].id}:`, error);
        }
      }, 10000); // 10 seconds delay
      
      res.status(201).json(scrapeLog[0]);
    } catch (error) {
      console.error("Failed to start scraping job:", error);
      res.status(500).json({ error: "Failed to start scraping job" });
    }
  });
  
  // Get system statistics
  app.get("/api/admin/statistics", isAdmin, async (req, res) => {
    try {
      // Get total tenders count
      const tendersCount = await db.select({ count: count() }).from(tenders);
      
      // Get tenders by source
      const tendersBySource = await db.select({
        name: tenders.source,
        value: count(tenders.id)
      })
      .from(tenders)
      .groupBy(tenders.source);
      
      // Get tenders by status
      const tendersByStatus = await db.select({
        name: tenders.status,
        value: count(tenders.id)
      })
      .from(tenders)
      .groupBy(tenders.status);
      
      // Get users count
      const usersCount = await db.select({ count: count() }).from(users);
      
      // Get applications count
      const applicationsCount = await db.select({ count: count() }).from(applications);
      
      res.json({
        total: tendersCount[0]?.count || 0,
        users: usersCount[0]?.count || 0,
        applications: applicationsCount[0]?.count || 0,
        bySource: tendersBySource,
        byStatus: tendersByStatus
      });
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });
  
  // Get RAG system statistics
  app.get("/api/admin/rag-statistics", isAdmin, async (req, res) => {
    try {
      // Get vector records statistics
      const vectorCount = await db.select({ count: count() }).from(vectorRecords);
      
      // Get tender processing status
      const tenderVectorStatus = await db.select({
        status: tenders.vectorStatus,
        count: count()
      })
      .from(tenders)
      .groupBy(tenders.vectorStatus);
      
      // Calculate processing statistics
      const total = await db.select({ count: count() }).from(tenders);
      const processed = tenderVectorStatus.find(s => s.status === 'processed')?.count || 0;
      const failed = tenderVectorStatus.find(s => s.status === 'failed')?.count || 0;
      const pending = tenderVectorStatus.find(s => s.status === 'pending')?.count || 0;
      
      // Get matching statistics (simulated for now)
      // In a real implementation, this would query the tender_matches table
      
      res.json({
        vectorization: {
          total: total[0]?.count || 0,
          processed,
          failed,
          pending
        },
        matching: [
          { name: "90-100%", value: Math.floor(Math.random() * 20) + 10 },
          { name: "70-89%", value: Math.floor(Math.random() * 30) + 20 },
          { name: "50-69%", value: Math.floor(Math.random() * 40) + 30 },
          { name: "0-49%", value: Math.floor(Math.random() * 30) + 10 }
        ],
        vectorRecords: vectorCount[0]?.count || 0
      });
    } catch (error) {
      console.error("Failed to fetch RAG statistics:", error);
      res.status(500).json({ error: "Failed to fetch RAG statistics" });
    }
  });
  
  // API لإرسال إشعار اختباري
  app.post("/api/send-test-notification", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    const { title, message, type } = req.body;
    
    const sent = (global as any).sendNotification(
      req.user.id,
      title || 'إشعار اختباري',
      message || 'هذا إشعار اختباري من النظام',
      type || 'info'
    );
    
    if (sent) {
      res.json({ success: true, message: 'تم إرسال الإشعار بنجاح' });
    } else {
      res.status(400).json({ success: false, message: 'فشل إرسال الإشعار. لا توجد اتصالات نشطة للمستخدم.' });
    }
  });
  
  // API endpoint for scraping tenders from Etimad platform
  app.post("/api/scrape-tenders", isAdmin, async (req, res) => {
    
    try {
      // Using arrow functions to avoid strict mode issues
      const getCSRFToken = async (): Promise<string | null> => {
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
      };

      // Using the direct API endpoint as provided by the client
      const scrapeTenders = async (pageNumber: number = 1, pageSize: number = 50): Promise<any[]> => {
        try {
          console.log(`Scraping page ${pageNumber} with pageSize ${pageSize}...`);
          
          // Using the first API endpoint from the instructions:
          // https://tenders.etimad.sa/Tender/AllSupplierTendersForVisitorAsync
          const timestamp = new Date().getTime();
          const url = `https://tenders.etimad.sa/Tender/AllSupplierTendersForVisitorAsync?PageSize=${pageSize}&PageNumber=${pageNumber}&_=${timestamp}`;
          
          console.log(`Fetching tender list from URL: ${url}`);
          
          // Make the request with the correct headers
          const config = {
            headers: {
              'Accept': 'application/json, text/javascript, */*; q=0.01',
              'Accept-Language': 'ar,en;q=0.9',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
              'Referer': 'https://tenders.etimad.sa/Tender/AllTendersForVisitor',
              'X-Requested-With': 'XMLHttpRequest',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          };
          
          // Make the request
          const response = await axios.get(url, config);
          
          console.log('Response status:', response.status);
          
          // Check if we have data in the format provided by the user
          if (response.data && Array.isArray(response.data.data)) {
            console.log(`Found ${response.data.data.length} tenders in the response`);
            
            // Log sample data to help with debugging
            if (response.data.data.length > 0) {
              console.log('Sample tender data:', JSON.stringify(response.data.data[0]).substring(0, 300) + '...');
            }
            
            return response.data.data;
          }
          
          // If the API didn't return data in the expected format, check alternative formats
          if (typeof response.data === 'string') {
            try {
              const parsedData = JSON.parse(response.data);
              console.log('Parsed data structure:', Object.keys(parsedData));
              
              if (Array.isArray(parsedData.data)) {
                return parsedData.data;
              }
              
              return [];
            } catch (e) {
              console.error('Error parsing JSON:', e);
              console.log('Response data:', response.data.substring(0, 200) + '...');
              return [];
            }
          }
          
          // Log what we received to help with debugging
          console.log('Response data structure:', Object.keys(response.data));
          console.log('Sample response data:', JSON.stringify(response.data).substring(0, 300) + '...');
          
          return [];
        } catch (error) {
          console.error('Error scraping tenders:', error);
          return [];
        }
      };

      // Using arrow functions to avoid strict mode issues
      const saveTendersToDatabase = async (tendersData: any[]): Promise<{saved: number, skipped: number}> => {
        let saved = 0;
        let skipped = 0;
        
        try {
          console.log(`Saving ${tendersData.length} tenders to database...`);
          
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
                skipped++;
                continue;
              }
              
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
              saved++;
            } catch (error) {
              console.error('Error processing individual tender:', error);
              skipped++;
            }
          }
          
          console.log(`All tenders processed! Saved: ${saved}, Skipped: ${skipped}`);
          return { saved, skipped };
        } catch (error) {
          console.error('Error saving tenders to database:', error);
          throw error;
        }
      };

      // Main function to scrape
      const pageNumber = parseInt(req.body.pageNumber || '1');
      const pageSize = parseInt(req.body.pageSize || '50');
      
      try {
        // Show a message that we're attempting to connect to Etimad
        console.log(`Attempting to scrape page ${pageNumber} with ${pageSize} tenders per page from Etimad...`);
        
        // Scrape tenders
        const tendersData = await scrapeTenders(pageNumber, pageSize);
        
        // Log the response for debugging
        console.log(`Scraping response received: ${tendersData.length} tenders found`);
        
        if (!tendersData || tendersData.length === 0) {
          // If no actual tenders found from the external API, return an error message with more details
          return res.status(404).json({
            success: false,
            message: "لم يتم العثور على مناقصات من منصة اعتماد. يرجى المحاولة مرة أخرى لاحقًا أو تجربة تغيير رقم الصفحة وعدد المناقصات لكل صفحة.",
            details: "منصة اعتماد قد تفرض قيودًا على استدعاء واجهة البرمجة (API). جرب استخدام رقم صفحة أقل أو قم بتقليل عدد المناقصات في كل صفحة.",
            tips: [
              "تقليل عدد المناقصات في كل صفحة (مثل 5 أو 10)",
              "تجربة أرقام صفحات مختلفة (1-5)",
              "المحاولة لاحقًا عندما يكون الضغط أقل على منصة اعتماد"
            ]
          });
        }
        
        // If we got here, we have actual tender data from the API
        // Save tenders to database
        const result = await saveTendersToDatabase(tendersData);
        
        // Send success response
        res.json({
          success: true,
          message: `تم جلب المناقصات ومعالجتها بنجاح.`,
          stats: {
            total: tendersData.length,
            saved: result.saved,
            skipped: result.skipped
          }
        });
      } catch (error) {
        console.error('Error in scraping and processing tenders:', error);
        res.status(500).json({
          success: false,
          message: 'حدث خطأ أثناء جلب ومعالجة المناقصات',
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
    } catch (error) {
      console.error('Error in scrape-tenders endpoint:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to scrape tenders',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // API endpoint for testing a specific Etimad tender ID
  app.post("/api/test-etimad-tender", isAdmin, async (req, res) => {
    
    const { tenderId } = req.body;
    
    if (!tenderId) {
      return res.status(400).json({
        success: false, 
        message: "يرجى تقديم معرف المناقصة للاختبار"
      });
    }
    
    try {
      // Function to fetch tender details
      const getTenderDetails = async (tenderIdString: string): Promise<any> => {
        try {
          console.log(`Getting details for tender ID: ${tenderIdString}`);
          
          // Using the second API endpoint from the instructions:
          // https://tenders.etimad.sa/Tender/OpenTenderDetailsReportForVisitor?tenderIdString=<TenderIdString>
          const url = `https://tenders.etimad.sa/Tender/OpenTenderDetailsReportForVisitor?tenderIdString=${encodeURIComponent(tenderIdString)}`;
          
          console.log(`Fetching detailed tender data from URL: ${url}`);
          
          const response = await axios.get(url, {
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'ar,en;q=0.9',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          // Parse the HTML response to extract detailed information using cheerio
          const $ = cheerio.load(response.data);
          
          // Extract tender details from the HTML
          const tenderDetails = {
            title: $('.tender-title').text().trim() || $('.info_header .head').text().trim(),
            agency: $('.agency-name').text().trim() || $('.block_header-entity').text().trim(),
            description: $('.tender-description').text().trim() || $('.info_header .body').text().trim(),
            requirements: $('.requirements').text().trim() || '',
            bidNumber: $('.tender-id').text().trim() || '',
            url: url,
            htmlContent: response.data.substring(0, 1000) + '...' // Sending a preview of the HTML for debugging
          };
          
          return {
            success: true,
            details: tenderDetails
          };
        } catch (error: any) {
          console.error(`Error getting details for tender ID ${tenderIdString}:`, error.message);
          if (error.response) {
            console.error('Response status:', error.response.status);
          }
          return {
            success: false,
            error: error.message,
            status: error.response?.status
          };
        }
      };
      
      const result = await getTenderDetails(tenderId);
      
      res.json(result);
    } catch (error) {
      console.error('Error in test-etimad-tender endpoint:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to test tender ID',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  return httpServer;
}
