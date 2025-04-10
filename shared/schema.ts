import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User / Company schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  companyName: text("company_name").notNull(),
  industry: text("industry"),
  description: text("description"),
  services: text("services").array(),
  profileCompleteness: integer("profile_completeness").default(0),
  // Subscription fields
  subscriptionPlan: text("subscription_plan"),
  subscriptionPrice: numeric("subscription_price"),
  subscriptionStatus: text("subscription_status"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  companyName: true,
  industry: true,
});

// Tender schema
export const tenders = pgTable("tenders", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  agency: text("agency").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  valueMin: numeric("value_min"),
  valueMax: numeric("value_max"),
  deadline: timestamp("deadline").notNull(),
  status: text("status").notNull().default("open"),
  requirements: text("requirements"),
  bidNumber: text("bid_number").notNull(),
});

export const insertTenderSchema = createInsertSchema(tenders).omit({
  id: true,
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
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  submittedAt: true,
});

// User match profiles (for AI matching)
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  matchAccuracy: integer("match_accuracy").default(0),
  tendersFound: integer("tenders_found").default(0),
  proposalsSubmitted: integer("proposals_submitted").default(0),
  successRate: integer("success_rate").default(0),
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
});

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
