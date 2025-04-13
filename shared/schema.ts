import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User / Company schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  emailVerified: boolean("email_verified").default(false),
  companyName: text("company_name").notNull(),
  industry: text("industry"),
  description: text("description"),
  services: text("services").array(),
  profileCompleteness: integer("profile_completeness").default(0),
  role: text("role").default("user"), // 'user' or 'admin'
  // Onboarding flow tracking
  onboardingStep: text("onboarding_step").default("email_verification"), // email_verification, upload_document, choose_plan, payment, completed
  onboardingCompleted: boolean("onboarding_completed").default(false),
  // Subscription fields
  subscriptionPlan: text("subscription_plan"),
  subscriptionPrice: numeric("subscription_price"),
  subscriptionStatus: text("subscription_status"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  // Tutorial and welcome flow
  hasSeenTutorial: boolean("has_seen_tutorial").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  companyName: true,
  industry: true,
  role: true,
});

// Tender schema
export const tenders = pgTable("tenders", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  agency: text("agency").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  value: numeric("value"), // Single value field
  valueMin: numeric("value_min"),
  valueMax: numeric("value_max"),
  releaseDate: timestamp("release_date"),
  enrollmentDeadline: timestamp("enrollment_deadline"),
  closingDate: timestamp("closing_date"),
  deadline: timestamp("deadline").notNull(),
  status: text("status").notNull().default("open"),
  requirements: text("requirements"),
  bidNumber: text("bid_number").notNull(),
  // Industry and keywords for better matching
  industry: text("industry").default("General"),
  keywords: text("keywords").array(),
  // External source identification
  externalId: text("external_id"),
  externalSource: text("external_source").default("local"),
  externalUrl: text("external_url"),
  source: text("source").default("local"), // 'local', 'etimad', or other API sources
  // Raw data storage for additional API response information
  rawData: text("raw_data"),
  // Match score from semantic search
  matchScore: numeric("match_score"),
  // Vector embedding information for RAG
  vectorId: text("vector_id"),
  vectorStatus: text("vector_status").default("pending"), // 'pending', 'processed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  url: text("url"),
});

export const insertTenderSchema = createInsertSchema(tenders).omit({
  id: true,
  vectorId: true,
  vectorStatus: true,
  createdAt: true,
});

// User's saved tenders
export const savedTenders = pgTable("saved_tenders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tenderId: integer("tender_id").notNull(),
  savedAt: timestamp("saved_at").defaultNow(),
});

export const insertSavedTenderSchema = createInsertSchema(savedTenders).omit({
  id: true,
  savedAt: true,
});

// Applications
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tenderId: integer("tender_id").notNull(),
  status: text("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at"),
  proposalContent: text("proposal_content"),
  documents: jsonb("documents"),
  matchScore: integer("match_score"), // AI-generated match score
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  submittedAt: true,
  matchScore: true,
});

// User match profiles (for AI matching)
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  companyDescription: text("company_description"),
  // New fields from document extraction
  businessType: text("business_type"),
  companyActivities: jsonb("company_activities").default([]),
  mainIndustries: jsonb("main_industries").default([]),
  specializations: jsonb("specializations").default([]),
  targetMarkets: jsonb("target_markets").default([]),
  certifications: jsonb("certifications").default([]),
  keywords: jsonb("keywords").default([]),
  // Original fields
  skills: text("skills"),
  pastExperience: text("past_experience"),
  preferredSectors: text("preferred_sectors").array(),
  companySize: text("company_size"),
  yearsInBusiness: integer("years_in_business"),
  matchAccuracy: integer("match_accuracy").default(0),
  tendersFound: integer("tenders_found").default(0),
  proposalsSubmitted: integer("proposals_submitted").default(0),
  successRate: integer("success_rate").default(0),
  // Gamification fields
  points: integer("points").default(0),
  level: integer("level").default(1),
  achievements: jsonb("achievements").default([]),
  completedTutorials: jsonb("completed_tutorials").default([]),
  // Vector embedding information for RAG
  vectorId: text("vector_id"),
  vectorStatus: text("vector_status").default("pending"), // 'pending', 'processed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  vectorId: true,
  vectorStatus: true,
  createdAt: true,
  updatedAt: true,
});

// Company documents for OCR processing
export const companyDocuments = pgTable("company_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  documentId: text("document_id").notNull().unique(), // Unique identifier for processing
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  documentType: text("document_type").default("company_profile"), // 'company_profile', 'license', 'certificate', etc.
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'error'
  extractedText: text("extracted_text"),
  extractedData: jsonb("extracted_data"),
  errorMessage: text("error_message"),
  whisperHash: text("whisper_hash"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const insertCompanyDocumentSchema = createInsertSchema(companyDocuments).omit({
  id: true,
  extractedText: true,
  extractedData: true,
  errorMessage: true,
  whisperHash: true,
  processedAt: true,
});

// External sources for tender scraping
export const externalSources = pgTable("external_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  url: text("url").notNull(),
  type: text("type").notNull(), // 'api', 'website_scrape'
  apiEndpoint: text("api_endpoint"),
  credentials: jsonb("credentials"),
  active: boolean("active").default(true),
  lastScrapedAt: timestamp("last_scraped_at"),
  scrapingFrequency: integer("scraping_frequency").default(24), // Hours between scrapes
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").notNull(), // Admin ID
});

export const insertExternalSourceSchema = createInsertSchema(externalSources).omit({
  id: true,
  lastScrapedAt: true,
  createdAt: true,
});

// Logs for scraping operations
export const scrapeLogs = pgTable("scrape_logs", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  status: text("status").default("running"), // 'running', 'completed', 'failed'
  totalTenders: integer("total_tenders").default(0),
  newTenders: integer("new_tenders").default(0),
  updatedTenders: integer("updated_tenders").default(0),
  failedTenders: integer("failed_tenders").default(0),
  errorMessage: text("error_message"),
  details: jsonb("details"),
});

export const insertScrapeLogSchema = createInsertSchema(scrapeLogs).omit({
  id: true,
  startTime: true,
  endTime: true,
});

// RAG matches between tenders and company profiles
export const tenderMatches = pgTable("tender_matches", {
  id: serial("id").primaryKey(),
  tenderId: integer("tender_id").notNull(),
  userProfileId: integer("user_profile_id").notNull(),
  matchScore: integer("match_score").notNull(), // 0-100
  matchDetails: jsonb("match_details"),
  createdAt: timestamp("created_at").defaultNow(),
  notificationSent: boolean("notification_sent").default(false),
});

export const insertTenderMatchSchema = createInsertSchema(tenderMatches).omit({
  id: true,
  createdAt: true,
  notificationSent: true,
});

// Vector database records to track embeddings
export const vectorRecords = pgTable("vector_records", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull(), // ID in vector database (Pinecone)
  sourceType: text("source_type").notNull(), // 'tender', 'company_profile', 'document'
  sourceId: integer("source_id").notNull(), // ID of the source record
  embeddingModel: text("embedding_model").notNull(), // Which model was used for embedding
  dimensions: integer("dimensions").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVectorRecordSchema = createInsertSchema(vectorRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  savedTenders: many(savedTenders),
  applications: many(applications),
  profile: one(userProfiles, { fields: [users.id], references: [userProfiles.userId] }),
  documents: many(companyDocuments),
  createdSources: many(externalSources, { fields: [users.id], references: [externalSources.createdBy] }),
}));

export const tendersRelations = relations(tenders, ({ many }) => ({
  savedBy: many(savedTenders),
  applications: many(applications),
  matches: many(tenderMatches),
}));

export const savedTendersRelations = relations(savedTenders, ({ one }) => ({
  user: one(users, { fields: [savedTenders.userId], references: [users.id] }),
  tender: one(tenders, { fields: [savedTenders.tenderId], references: [tenders.id] }),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  tender: one(tenders, { fields: [applications.tenderId], references: [tenders.id] }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one, many }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
  matches: many(tenderMatches),
}));

export const companyDocumentsRelations = relations(companyDocuments, ({ one }) => ({
  user: one(users, { fields: [companyDocuments.userId], references: [users.id] }),
}));

export const externalSourcesRelations = relations(externalSources, ({ one, many }) => ({
  createdByUser: one(users, { fields: [externalSources.createdBy], references: [users.id] }),
  logs: many(scrapeLogs),
}));

export const scrapeLogsRelations = relations(scrapeLogs, ({ one }) => ({
  source: one(externalSources, { fields: [scrapeLogs.sourceId], references: [externalSources.id] }),
}));

export const tenderMatchesRelations = relations(tenderMatches, ({ one }) => ({
  tender: one(tenders, { fields: [tenderMatches.tenderId], references: [tenders.id] }),
  userProfile: one(userProfiles, { fields: [tenderMatches.userProfileId], references: [userProfiles.id] }),
}));

// Define types from schemas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Tender = typeof tenders.$inferSelect;
export type InsertTender = z.infer<typeof insertTenderSchema>;

export type SavedTender = typeof savedTenders.$inferSelect;
export type InsertSavedTender = z.infer<typeof insertSavedTenderSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type CompanyDocument = typeof companyDocuments.$inferSelect;
export type InsertCompanyDocument = z.infer<typeof insertCompanyDocumentSchema>;

export type ExternalSource = typeof externalSources.$inferSelect;
export type InsertExternalSource = z.infer<typeof insertExternalSourceSchema>;

export type ScrapeLog = typeof scrapeLogs.$inferSelect;
export type InsertScrapeLog = z.infer<typeof insertScrapeLogSchema>;

export type TenderMatch = typeof tenderMatches.$inferSelect;
export type InsertTenderMatch = z.infer<typeof insertTenderMatchSchema>;

export type VectorRecord = typeof vectorRecords.$inferSelect;
export type InsertVectorRecord = z.infer<typeof insertVectorRecordSchema>;
