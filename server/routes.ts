import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTenderSchema, insertApplicationSchema, insertSavedTenderSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";
import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from "./db";
import { tenders } from "../shared/schema";
import { eq } from "drizzle-orm";

// Schema for subscription
const subscriptionSchema = z.object({
  plan: z.enum(["basic", "professional", "enterprise"]),
  price: z.number().positive()
});

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
  app.post("/api/scrape-tenders", async (req, res) => {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        success: false, 
        message: "لم يتم التعرف على المستخدم" 
      });
    }
    
    // Check if the user is an admin (ID 1)
    if (req.user.id !== 1) {
      return res.status(403).json({
        success: false, 
        message: "ليس لديك الصلاحيات الكافية للقيام بهذا الإجراء"
      });
    }
    
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
  app.post("/api/test-etimad-tender", async (req, res) => {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        success: false, 
        message: "لم يتم التعرف على المستخدم" 
      });
    }
    
    // Check if the user is an admin (ID 1)
    if (req.user.id !== 1) {
      return res.status(403).json({
        success: false, 
        message: "ليس لديك الصلاحيات الكافية للقيام بهذا الإجراء"
      });
    }
    
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
