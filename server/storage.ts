import { 
  users, 
  type User, 
  type InsertUser, 
  tenders, 
  type Tender, 
  type InsertTender,
  savedTenders,
  type SavedTender,
  type InsertSavedTender,
  applications,
  type Application,
  type InsertApplication,
  userProfiles,
  type UserProfile,
  type InsertUserProfile,
  companyDocuments,
  type CompanyDocument,
  type InsertCompanyDocument
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Tender management
  getTender(id: number): Promise<Tender | undefined>;
  getTenders(): Promise<Tender[]>;
  getTendersByCategory(category: string): Promise<Tender[]>;
  createTender(tender: InsertTender): Promise<Tender>;
  
  // Saved tenders
  getSavedTenders(userId: number): Promise<Tender[]>;
  saveTender(data: InsertSavedTender): Promise<SavedTender>;
  unsaveTender(userId: number, tenderId: number): Promise<boolean>;
  isTenderSaved(userId: number, tenderId: number): Promise<boolean>;
  
  // Applications
  getApplications(userId: number): Promise<Application[]>;
  getApplication(id: number): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, application: Partial<Application>): Promise<Application | undefined>;
  
  // User profiles for AI matching
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, profile: Partial<UserProfile>): Promise<UserProfile | undefined>;
  
  // Recommended tenders
  getRecommendedTenders(userId: number, limit?: number): Promise<Tender[]>;
  
  // Company documents
  getCompanyDocument(documentId: string): Promise<CompanyDocument | undefined>;
  getCompanyDocumentsByUser(userId: number): Promise<CompanyDocument[]>;
  createCompanyDocument(document: InsertCompanyDocument): Promise<CompanyDocument>;
  updateCompanyDocument(documentId: string, document: Partial<CompanyDocument>): Promise<CompanyDocument | undefined>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Initialize sample data
    this.initializeData();
  }
  
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...insertUser,
      profileCompleteness: 60,
      services: []
    }).returning();
    
    const user = result[0];
    
    // Create a default user profile for AI matching
    await this.createUserProfile({
      userId: user.id,
      matchAccuracy: 85,
      tendersFound: 24,
      proposalsSubmitted: 8,
      successRate: 31
    });
    
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  // Tender management
  async getTender(id: number): Promise<Tender | undefined> {
    const result = await db.select().from(tenders).where(eq(tenders.id, id));
    return result[0];
  }
  
  async getTenders(): Promise<Tender[]> {
    return await db.select().from(tenders);
  }
  
  async getTendersByCategory(category: string): Promise<Tender[]> {
    return await db.select().from(tenders).where(eq(tenders.category, category));
  }
  
  async createTender(insertTender: InsertTender): Promise<Tender> {
    const result = await db.insert(tenders).values(insertTender).returning();
    return result[0];
  }
  
  // Saved tenders
  async getSavedTenders(userId: number): Promise<Tender[]> {
    return await db.select({
      id: tenders.id,
      title: tenders.title,
      agency: tenders.agency,
      description: tenders.description,
      category: tenders.category,
      location: tenders.location,
      valueMin: tenders.valueMin,
      valueMax: tenders.valueMax,
      deadline: tenders.deadline,
      status: tenders.status,
      requirements: tenders.requirements,
      bidNumber: tenders.bidNumber
    })
    .from(tenders)
    .innerJoin(savedTenders, eq(tenders.id, savedTenders.tenderId))
    .where(eq(savedTenders.userId, userId));
  }
  
  async saveTender(data: InsertSavedTender): Promise<SavedTender> {
    // Check if already saved to avoid duplicates
    const existing = await db.select()
      .from(savedTenders)
      .where(and(
        eq(savedTenders.userId, data.userId),
        eq(savedTenders.tenderId, data.tenderId)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const result = await db.insert(savedTenders)
      .values(data)
      .returning();
    
    return result[0];
  }
  
  async unsaveTender(userId: number, tenderId: number): Promise<boolean> {
    const result = await db.delete(savedTenders)
      .where(and(
        eq(savedTenders.userId, userId),
        eq(savedTenders.tenderId, tenderId)
      ));
    
    // Drizzle doesn't return a count property, so we'll just return true
    // as the operation was successful regardless of whether records were deleted
    return true;
  }
  
  async isTenderSaved(userId: number, tenderId: number): Promise<boolean> {
    const result = await db.select()
      .from(savedTenders)
      .where(and(
        eq(savedTenders.userId, userId),
        eq(savedTenders.tenderId, tenderId)
      ));
    
    return result.length > 0;
  }
  
  // Applications
  async getApplications(userId: number): Promise<Application[]> {
    return await db.select()
      .from(applications)
      .where(eq(applications.userId, userId));
  }
  
  async getApplication(id: number): Promise<Application | undefined> {
    const result = await db.select()
      .from(applications)
      .where(eq(applications.id, id));
    
    return result[0];
  }
  
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const submittedAt = insertApplication.status === 'draft' ? null : new Date();
    
    const result = await db.insert(applications)
      .values({
        ...insertApplication,
        submittedAt
      })
      .returning();
    
    return result[0];
  }
  
  async updateApplication(id: number, applicationData: Partial<Application>): Promise<Application | undefined> {
    const application = await this.getApplication(id);
    if (!application) return undefined;
    
    // Update submission time if status changed to submitted
    let submittedAt = application.submittedAt;
    if (applicationData.status === 'submitted' && application.status !== 'submitted') {
      submittedAt = new Date();
    }
    
    const result = await db.update(applications)
      .set({
        ...applicationData,
        submittedAt
      })
      .where(eq(applications.id, id))
      .returning();
    
    return result[0];
  }
  
  // User profiles for AI matching
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const result = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    
    return result[0];
  }
  
  async createUserProfile(insertProfile: InsertUserProfile): Promise<UserProfile> {
    const result = await db.insert(userProfiles)
      .values(insertProfile)
      .returning();
    
    return result[0];
  }
  
  async updateUserProfile(userId: number, profileData: Partial<UserProfile>): Promise<UserProfile | undefined> {
    const result = await db.update(userProfiles)
      .set(profileData)
      .where(eq(userProfiles.userId, userId))
      .returning();
    
    return result[0];
  }
  
  // Recommended tenders based on matching algorithm
  async getRecommendedTenders(userId: number, limit: number = 3): Promise<Tender[]> {
    try {
      // Get user profile to match against tenders
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        // If no profile exists, return API tenders sorted by deadline
        return await db.select()
          .from(tenders)
          .where(
            sql`${tenders.status} = 'open' AND ${tenders.source} = 'etimad'`
          )
          .orderBy(tenders.deadline)
          .limit(limit);
      }
      
      // Only return tenders from the API (Etimad) with match scores
      const matchedApiTenders = await db.select()
        .from(tenders)
        .where(
          sql`${tenders.status} = 'open' AND ${tenders.source} = 'etimad' AND ${tenders.matchScore} IS NOT NULL`
        )
        .orderBy(desc(tenders.matchScore))
        .limit(limit);
      
      // If we have matched tenders from the API, return them
      if (matchedApiTenders.length > 0) {
        console.log(`[recommendations] Returning ${matchedApiTenders.length} recommended tenders from database`);
        return matchedApiTenders;
      }
      
      // If no matched API tenders with scores, return any API tenders
      console.log(`[recommendations] No API tenders with match scores found, returning API tenders without scores`);
      
      const apiTenders = await db.select()
        .from(tenders)
        .where(
          sql`${tenders.status} = 'open' AND ${tenders.source} = 'etimad'`
        )
        .orderBy(tenders.deadline)
        .limit(limit);
      
      return apiTenders;
    } catch (error) {
      console.error('Error getting recommended tenders:', error);
      return [];
    }
  }
  
  // Company document methods
  async getCompanyDocument(documentId: string): Promise<CompanyDocument | undefined> {
    const result = await db.select()
      .from(companyDocuments)
      .where(eq(companyDocuments.documentId, documentId));
    
    return result[0];
  }
  
  async getCompanyDocumentsByUser(userId: number): Promise<CompanyDocument[]> {
    return await db.select()
      .from(companyDocuments)
      .where(eq(companyDocuments.userId, userId))
      .orderBy(desc(companyDocuments.uploadedAt));
  }
  
  async createCompanyDocument(document: InsertCompanyDocument): Promise<CompanyDocument> {
    const result = await db.insert(companyDocuments)
      .values(document)
      .returning();
    
    return result[0];
  }
  
  async updateCompanyDocument(documentId: string, documentData: Partial<CompanyDocument>): Promise<CompanyDocument | undefined> {
    const result = await db.update(companyDocuments)
      .set(documentData)
      .where(eq(companyDocuments.documentId, documentId))
      .returning();
    
    return result[0];
  }
  
  // Initialize sample data for demonstration purposes
  private async initializeData() {
    try {
      // Check if tenders already exist
      const existingTenders = await db.select().from(tenders).limit(1);
      
      if (existingTenders.length === 0) {
        const now = new Date();
        
        // Sample tenders for demonstration
        const sampleTenders: InsertTender[] = [
          {
            title: "IT Infrastructure Upgrade",
            agency: "Ministry of Technology",
            description: "Comprehensive upgrade of IT infrastructure including servers, networking, and security systems.",
            category: "IT Services",
            location: "National",
            valueMin: "250000",
            valueMax: "300000",
            deadline: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
            status: "open",
            requirements: "ISO 27001 certification, minimum 5 years experience",
            bidNumber: "T-2023-001"
          },
          {
            title: "Cloud Migration Services",
            agency: "Department of Finance",
            description: "Migration of legacy systems to cloud infrastructure with minimal downtime.",
            category: "Cloud Services",
            location: "Regional",
            valueMin: "180000",
            valueMax: "220000",
            deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            status: "open",
            requirements: "AWS/Azure certification, prior government experience",
            bidNumber: "T-2023-002"
          },
          {
            title: "Cybersecurity Assessment",
            agency: "National Security Agency",
            description: "Comprehensive security assessment of government digital infrastructure.",
            category: "Security",
            location: "National",
            valueMin: "120000",
            valueMax: "150000",
            deadline: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
            status: "open",
            requirements: "Security clearance, CISSP certification",
            bidNumber: "T-2023-003"
          },
          {
            title: "Data Center Maintenance",
            agency: "Ministry of Defense",
            description: "Ongoing maintenance and support for mission-critical data centers.",
            category: "IT Services",
            location: "National",
            valueMin: "300000",
            valueMax: "350000",
            deadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
            status: "open",
            requirements: "Security clearance, 24/7 support capability",
            bidNumber: "T-2023-085"
          },
          {
            title: "Network Infrastructure Upgrade",
            agency: "Department of Education",
            description: "Upgrade of network infrastructure across all educational institutions.",
            category: "Networking",
            location: "National",
            valueMin: "400000",
            valueMax: "450000",
            deadline: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
            status: "open",
            requirements: "Education sector experience, Cisco certification",
            bidNumber: "T-2023-079"
          },
          {
            title: "Digital Transformation Consultancy",
            agency: "Ministry of Health",
            description: "Strategic consultancy for digital transformation of healthcare services.",
            category: "Consulting",
            location: "National",
            valueMin: "200000",
            valueMax: "250000",
            deadline: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
            status: "open",
            requirements: "Healthcare experience, digital strategy expertise",
            bidNumber: "T-2023-100"
          }
        ];
        
        // Add tenders to database
        for (const tender of sampleTenders) {
          await this.createTender(tender);
        }
      }
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }
}

export const storage = new DatabaseStorage();
