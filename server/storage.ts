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
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tenders: Map<number, Tender>;
  private savedTenders: Map<number, SavedTender>;
  private applications: Map<number, Application>;
  private userProfiles: Map<number, UserProfile>;
  sessionStore: session.SessionStore;
  
  private userCurrentId: number;
  private tenderCurrentId: number;
  private savedTenderCurrentId: number;
  private applicationCurrentId: number;
  private userProfileCurrentId: number;

  constructor() {
    this.users = new Map();
    this.tenders = new Map();
    this.savedTenders = new Map();
    this.applications = new Map();
    this.userProfiles = new Map();
    
    this.userCurrentId = 1;
    this.tenderCurrentId = 1;
    this.savedTenderCurrentId = 1;
    this.applicationCurrentId = 1;
    this.userProfileCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize some sample tenders
    this.initializeTenders();
  }
  
  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id, profileCompleteness: 60, services: [] };
    this.users.set(id, user);
    
    // Create a default user profile for AI matching
    await this.createUserProfile({
      userId: id,
      matchAccuracy: 85,
      tendersFound: 24,
      proposalsSubmitted: 8,
      successRate: 31
    });
    
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Tender management
  async getTender(id: number): Promise<Tender | undefined> {
    return this.tenders.get(id);
  }
  
  async getTenders(): Promise<Tender[]> {
    return Array.from(this.tenders.values());
  }
  
  async getTendersByCategory(category: string): Promise<Tender[]> {
    return Array.from(this.tenders.values()).filter(
      (tender) => tender.category === category
    );
  }
  
  async createTender(insertTender: InsertTender): Promise<Tender> {
    const id = this.tenderCurrentId++;
    const tender: Tender = { ...insertTender, id };
    this.tenders.set(id, tender);
    return tender;
  }
  
  // Saved tenders
  async getSavedTenders(userId: number): Promise<Tender[]> {
    const saved = Array.from(this.savedTenders.values()).filter(
      (saved) => saved.userId === userId
    );
    
    return Promise.all(
      saved.map(async (item) => {
        const tender = await this.getTender(item.tenderId);
        if (!tender) throw new Error(`Tender with id ${item.tenderId} not found`);
        return tender;
      })
    );
  }
  
  async saveTender(data: InsertSavedTender): Promise<SavedTender> {
    const id = this.savedTenderCurrentId++;
    const savedTender: SavedTender = { 
      ...data, 
      id, 
      savedAt: new Date() 
    };
    this.savedTenders.set(id, savedTender);
    return savedTender;
  }
  
  async unsaveTender(userId: number, tenderId: number): Promise<boolean> {
    const saved = Array.from(this.savedTenders.values()).find(
      (saved) => saved.userId === userId && saved.tenderId === tenderId
    );
    
    if (saved) {
      this.savedTenders.delete(saved.id);
      return true;
    }
    
    return false;
  }
  
  async isTenderSaved(userId: number, tenderId: number): Promise<boolean> {
    return Array.from(this.savedTenders.values()).some(
      (saved) => saved.userId === userId && saved.tenderId === tenderId
    );
  }
  
  // Applications
  async getApplications(userId: number): Promise<Application[]> {
    return Array.from(this.applications.values()).filter(
      (app) => app.userId === userId
    );
  }
  
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }
  
  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const id = this.applicationCurrentId++;
    const application: Application = { 
      ...insertApplication, 
      id,
      submittedAt: insertApplication.status === 'draft' ? undefined : new Date()
    };
    this.applications.set(id, application);
    return application;
  }
  
  async updateApplication(id: number, applicationData: Partial<Application>): Promise<Application | undefined> {
    const application = await this.getApplication(id);
    if (!application) return undefined;
    
    const updatedApplication = { 
      ...application, 
      ...applicationData,
      // Update submission time if status changed to submitted
      submittedAt: applicationData.status === 'submitted' && application.status !== 'submitted' 
        ? new Date() 
        : application.submittedAt
    };
    
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  // User profiles for AI matching
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    return Array.from(this.userProfiles.values()).find(
      (profile) => profile.userId === userId
    );
  }
  
  async createUserProfile(insertProfile: InsertUserProfile): Promise<UserProfile> {
    const id = this.userProfileCurrentId++;
    const profile: UserProfile = { ...insertProfile, id };
    this.userProfiles.set(id, profile);
    return profile;
  }
  
  async updateUserProfile(userId: number, profileData: Partial<UserProfile>): Promise<UserProfile | undefined> {
    const profile = await this.getUserProfile(userId);
    if (!profile) return undefined;
    
    const updatedProfile = { ...profile, ...profileData };
    this.userProfiles.set(profile.id, updatedProfile);
    return updatedProfile;
  }
  
  // Initialize sample tenders for testing
  private async initializeTenders() {
    const now = new Date();
    
    // Sample tenders
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
    
    // Create each tender
    for (const tender of sampleTenders) {
      await this.createTender(tender);
    }
    
    // Create sample applications
    const sampleApplications: InsertApplication[] = [
      {
        userId: 1, // Will be assigned to the first registered user
        tenderId: 4,
        status: "under_review",
        proposalContent: "Detailed proposal for data center maintenance",
        documents: [{ name: "proposal.pdf", size: 1024 * 1024 }]
      },
      {
        userId: 1,
        tenderId: 5,
        status: "shortlisted",
        proposalContent: "Comprehensive network upgrade proposal",
        documents: [{ name: "network_proposal.pdf", size: 2048 * 1024 }]
      },
      {
        userId: 1,
        tenderId: 6,
        status: "declined",
        proposalContent: "Digital transformation strategy",
        documents: [{ name: "strategy.pdf", size: 1536 * 1024 }]
      }
    ];
    
    // We'll add these applications once a user registers
  }
}

export const storage = new MemStorage();
