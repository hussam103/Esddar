import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { sendConfirmationEmail, verifyEmailConfirmationToken, sendWelcomeEmail } from "./services/email-service";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "esddar-tender-matching-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Make sure email is provided
      if (!req.body.email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Create the user with email verification pending
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        emailVerified: false,
        onboardingStep: 'email_verification',
        onboardingCompleted: false
      });

      // Generate base URL for email links
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const baseUrl = `${protocol}://${req.get('host')}`;
      
      // Send confirmation email
      await sendConfirmationEmail(
        user.id, 
        user.username, 
        user.email, 
        baseUrl
      );

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Create sample applications for the newly registered user
        const sampleApplications = [
          {
            userId: user.id,
            tenderId: 4,
            status: "under_review",
            proposalContent: "Detailed proposal for data center maintenance",
            documents: [{ name: "proposal.pdf", size: 1024 * 1024 }]
          },
          {
            userId: user.id,
            tenderId: 5,
            status: "shortlisted",
            proposalContent: "Comprehensive network upgrade proposal",
            documents: [{ name: "network_proposal.pdf", size: 2048 * 1024 }]
          },
          {
            userId: user.id,
            tenderId: 3,
            status: "declined",
            proposalContent: "Digital transformation strategy",
            documents: [{ name: "strategy.pdf", size: 1536 * 1024 }]
          }
        ];

        // Create the applications asynchronously
        Promise.all(sampleApplications.map(app => 
          storage.createApplication(app)
        )).catch(console.error);
        
        // Return the user without the password
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Email confirmation endpoint
  app.get("/api/confirm-email", async (req, res) => {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: "Invalid token" });
    }
    
    const verified = await verifyEmailConfirmationToken(token);
    
    if (!verified) {
      return res.status(400).json({ 
        error: "Invalid or expired token. Please request a new confirmation email." 
      });
    }
    
    // If the user is logged in, update their session
    if (req.isAuthenticated()) {
      req.user.emailVerified = true;
      req.user.onboardingStep = 'upload_document';
    }
    
    // Send welcome email to the user
    const user = await storage.getUser(req.user?.id);
    if (user && user.email) {
      await sendWelcomeEmail(user.username, user.email);
    }
    
    return res.status(200).json({ 
      success: true, 
      message: "Email confirmed successfully" 
    });
  });
  
  // Resend confirmation email endpoint
  app.post("/api/resend-confirmation", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const user = req.user;
    
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
    
    // Generate base URL for email links
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const baseUrl = `${protocol}://${req.get('host')}`;
    
    // Send confirmation email
    const sent = await sendConfirmationEmail(
      user.id, 
      user.username, 
      user.email, 
      baseUrl
    );
    
    if (sent) {
      return res.status(200).json({ 
        success: true, 
        message: "Confirmation email sent successfully" 
      });
    } else {
      return res.status(500).json({ 
        error: "Failed to send confirmation email" 
      });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Return the user without the password
    const userWithoutPassword = { ...req.user };
    delete userWithoutPassword.password;
    res.status(200).json(userWithoutPassword);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Return the user without the password
    const userWithoutPassword = { ...req.user };
    delete userWithoutPassword.password;
    res.json(userWithoutPassword);
  });

  // Add route to update user data
  app.put("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const updatedUser = await storage.updateUser(req.user.id, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Return the user without the password
      const userWithoutPassword = { ...updatedUser };
      delete userWithoutPassword.password;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });
}
