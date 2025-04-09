import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTenderSchema, insertApplicationSchema, insertSavedTenderSchema } from "@shared/schema";
import { z } from "zod";

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

  const httpServer = createServer(app);
  return httpServer;
}
