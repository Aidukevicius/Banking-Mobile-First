import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User settings table
export const userSettings = pgTable("user_settings", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  theme: varchar("theme", { length: 10 }).notNull().default("light"),
});

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 10 }).notNull().default("expense"), // "income" or "expense"
  name: text("name").notNull(),
  icon: text("icon").notNull().default("tag"),
  color: varchar("color", { length: 7 }).notNull().default("#3B82F6"),
  budgetLimit: decimal("budget_limit", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 10 }).notNull().default("expense"), // "income" or "expense"
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  provider: text("provider").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  categoryId: varchar("category_id").references(() => categories.id, { onDelete: "set null" }),
  monthYear: varchar("month_year", { length: 7 }).notNull(), // Format: YYYY-MM
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Category mappings for learning system
export const categoryMappings = pgTable("category_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  categoryId: varchar("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Savings pots table
export const savingsPots = pgTable("savings_pots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  type: varchar("type", { length: 20 }).notNull().default("savings"), // "savings" or "investments"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Monthly data table
export const monthlyData = pgTable("monthly_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  monthYear: varchar("month_year", { length: 7 }).notNull(), // Format: YYYY-MM
  income: decimal("income", { precision: 12, scale: 2 }).notNull().default("0"),
  expenses: decimal("expenses", { precision: 12, scale: 2 }).notNull().default("0"),
  savings: decimal("savings", { precision: 12, scale: 2 }).notNull().default("0"),
  investments: decimal("investments", { precision: 12, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings),
  categories: many(categories),
  transactions: many(transactions),
  categoryMappings: many(categoryMappings),
  monthlyData: many(monthlyData),
  savingsPots: many(savingsPots),
}));

export const savingsPotsRelations = relations(savingsPots, ({ one }) => ({
  user: one(users, {
    fields: [savingsPots.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  mappings: many(categoryMappings),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  userId: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  date: z.string().or(z.date()),
  amount: z.string().or(z.number()),
});

export const insertCategoryMappingSchema = createInsertSchema(categoryMappings).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertMonthlyDataSchema = createInsertSchema(monthlyData).omit({
  id: true,
  userId: true,
  updatedAt: true,
}).extend({
  income: z.string().or(z.number()).optional(),
  expenses: z.string().or(z.number()).optional(),
  savings: z.string().or(z.number()).optional(),
  investments: z.string().or(z.number()).optional(),
});

export const insertSavingsPotSchema = createInsertSchema(savingsPots).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type CategoryMapping = typeof categoryMappings.$inferSelect;
export type InsertCategoryMapping = z.infer<typeof insertCategoryMappingSchema>;

export type MonthlyData = typeof monthlyData.$inferSelect;
export type InsertMonthlyData = z.infer<typeof insertMonthlyDataSchema>;

export type SavingsPot = typeof savingsPots.$inferSelect;
export type InsertSavingsPot = z.infer<typeof insertSavingsPotSchema>;
