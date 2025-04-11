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
  type InsertUserProfile
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
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
        // If no profile exists, return general tenders sorted by deadline
        return await db.select()
          .from(tenders)
          .where(eq(tenders.status, 'open'))
          .orderBy(tenders.deadline)
          .limit(limit);
      }
      
      // Get all available tenders
      const allTenders = await this.getTenders();
      
      // Simplified matching algorithm
      // In a real implementation, this would use the vector database and RAG
      const scoredTenders = allTenders
        .filter(tender => tender.status === 'open')
        .map(tender => {
          // Initialize with a base score
          let matchScore = 50;
          
          // Consider user profile attributes
          if (userProfile.preferredSectors && 
              userProfile.preferredSectors.includes(tender.category)) {
            matchScore += 20;
          }
          
          // Consider company description match with tender description
          if (userProfile.companyDescription && tender.description) {
            // Simplified keyword matching
            const companyKeywords = userProfile.companyDescription.toLowerCase().split(/\s+/);
            const tenderKeywords = tender.description.toLowerCase().split(/\s+/);
            
            // Count matching keywords
            const matchingKeywords = companyKeywords.filter(word => 
              tenderKeywords.includes(word) && word.length > 3
            ).length;
            
            matchScore += matchingKeywords * 2;
          }
          
          // Consider skills match
          if (userProfile.skills && tender.requirements) {
            const skills = userProfile.skills.toLowerCase().split(/\s+/);
            const requirements = tender.requirements.toLowerCase().split(/\s+/);
            
            const matchingSkills = skills.filter(skill => 
              requirements.includes(skill) && skill.length > 3
            ).length;
            
            matchScore += matchingSkills * 3;
          }
          
          // Add a random factor to simulate AI-driven matching
          matchScore += Math.floor(Math.random() * 10);
          
          // Cap at 100
          matchScore = Math.min(matchScore, 100);
          
          return { tender, matchScore };
        });
      
      // Sort by match score (highest first) and return top matches
      return scoredTenders
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit)
        .map(item => item.tender);
    } catch (error) {
      console.error('Error getting recommended tenders:', error);
      return [];
    }
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
