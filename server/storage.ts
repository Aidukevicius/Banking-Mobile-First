// Referenced from javascript_database blueprint
import {
  users,
  userSettings,
  categories,
  transactions,
  categoryMappings,
  monthlyData,
  type User,
  type InsertUser,
  type UserSettings,
  type InsertUserSettings,
  type Category,
  type InsertCategory,
  type Transaction,
  type InsertTransaction,
  type CategoryMapping,
  type InsertCategoryMapping,
  type MonthlyData,
  type InsertMonthlyData,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // User settings methods
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings & { userId: string }): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;

  // Category methods
  getCategories(userId: string): Promise<Category[]>;
  getCategory(id: string, userId: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory & { userId: string }): Promise<Category>;
  updateCategory(id: string, userId: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string, userId: string): Promise<boolean>;

  // Transaction methods
  getTransactions(userId: string, monthYear?: string): Promise<Transaction[]>;
  getTransaction(id: string, userId: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction>;
  updateTransaction(id: string, userId: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string, userId: string): Promise<boolean>;

  // Category mapping methods
  getCategoryMappings(userId: string): Promise<CategoryMapping[]>;
  getCategoryMappingByProvider(userId: string, provider: string): Promise<CategoryMapping | undefined>;
  createCategoryMapping(mapping: InsertCategoryMapping & { userId: string }): Promise<CategoryMapping>;
  upsertCategoryMapping(userId: string, provider: string, categoryId: string): Promise<CategoryMapping>;

  // Monthly data methods
  getMonthlyData(userId: string, monthYear: string): Promise<MonthlyData | undefined>;
  createOrUpdateMonthlyData(data: InsertMonthlyData & { userId: string }): Promise<MonthlyData>;
  getAllMonthlyData(userId: string): Promise<MonthlyData[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // User settings methods
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async createUserSettings(settings: InsertUserSettings & { userId: string }): Promise<UserSettings> {
    const [created] = await db.insert(userSettings).values(settings).returning();
    return created;
  }

  async updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const [updated] = await db
      .update(userSettings)
      .set(settings)
      .where(eq(userSettings.userId, userId))
      .returning();
    return updated;
  }

  // Category methods
  async getCategories(userId: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.userId, userId)).orderBy(categories.name);
  }

  async getCategory(id: string, userId: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return category || undefined;
  }

  async createCategory(category: InsertCategory & { userId: string }): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: string, userId: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db
      .update(categories)
      .set(category)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteCategory(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Transaction methods
  async getTransactions(userId: string, monthYear?: string): Promise<Transaction[]> {
    if (monthYear) {
      return await db
        .select()
        .from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.monthYear, monthYear)))
        .orderBy(desc(transactions.date));
    }
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));
  }

  async getTransaction(id: string, userId: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    return transaction || undefined;
  }

  async createTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction> {
    const [created] = await db.insert(transactions).values(transaction).returning();
    return created;
  }

  async updateTransaction(id: string, userId: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updated] = await db
      .update(transactions)
      .set(transaction)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteTransaction(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Category mapping methods
  async getCategoryMappings(userId: string): Promise<CategoryMapping[]> {
    return await db.select().from(categoryMappings).where(eq(categoryMappings.userId, userId));
  }

  async getCategoryMappingByProvider(userId: string, provider: string): Promise<CategoryMapping | undefined> {
    const [mapping] = await db
      .select()
      .from(categoryMappings)
      .where(and(eq(categoryMappings.userId, userId), eq(categoryMappings.provider, provider)));
    return mapping || undefined;
  }

  async createCategoryMapping(mapping: InsertCategoryMapping & { userId: string }): Promise<CategoryMapping> {
    const [created] = await db.insert(categoryMappings).values(mapping).returning();
    return created;
  }

  async upsertCategoryMapping(userId: string, provider: string, categoryId: string): Promise<CategoryMapping> {
    const existing = await this.getCategoryMappingByProvider(userId, provider);

    if (existing) {
      const [updated] = await db
        .update(categoryMappings)
        .set({ categoryId })
        .where(and(eq(categoryMappings.userId, userId), eq(categoryMappings.provider, provider)))
        .returning();
      return updated;
    } else {
      return await this.createCategoryMapping({ userId, provider, categoryId });
    }
  }

  // Monthly data methods
  async getMonthlyData(userId: string, monthYear: string): Promise<MonthlyData | undefined> {
    const [data] = await db
      .select()
      .from(monthlyData)
      .where(and(eq(monthlyData.userId, userId), eq(monthlyData.monthYear, monthYear)));
    return data || undefined;
  }

  async createOrUpdateMonthlyData(data: InsertMonthlyData & { userId: string }): Promise<MonthlyData> {
    const existing = await this.getMonthlyData(data.userId, data.monthYear);

    if (existing) {
      // Merge existing data with new data, preserving fields not in the update
      const updateData = {
        income: data.income !== undefined ? data.income : existing.income,
        expenses: data.expenses !== undefined ? data.expenses : existing.expenses,
        savings: data.savings !== undefined ? data.savings : existing.savings,
        investments: data.investments !== undefined ? data.investments : existing.investments,
        updatedAt: new Date(),
      };

      const [updated] = await db
        .update(monthlyData)
        .set(updateData)
        .where(and(eq(monthlyData.userId, data.userId), eq(monthlyData.monthYear, data.monthYear)))
        .returning();
      return updated;
    } else {
      // Set defaults for new records
      const insertData = {
        userId: data.userId!,
        monthYear: data.monthYear!,
        income: data.income || "0",
        expenses: data.expenses || "0",
        savings: data.savings || "0",
        investments: data.investments || "0",
      };
      const [created] = await db.insert(monthlyData).values(insertData).returning();
      return created;
    }
  }

  async getAllMonthlyData(userId: string): Promise<MonthlyData[]> {
    const data = await db
      .select()
      .from(monthlyData)
      .where(eq(monthlyData.userId, userId))
      .orderBy(desc(monthlyData.monthYear));
    return data || [];
  }
}

export const storage = new DatabaseStorage();