import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authMiddleware, AuthRequest, hashPassword, comparePassword, generateToken } from "./auth";
import { insertUserSchema, insertCategorySchema, insertTransactionSchema, insertMonthlyDataSchema, insertCategoryMappingSchema, insertUserSettingsSchema } from "@shared/schema";
import { parsePdfStatement } from "./pdf-parser";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const hashedPassword = hashPassword(password);
      const user = await storage.createUser({ username, password: hashedPassword });
      
      // Create default user settings
      await storage.createUserSettings({
        userId: user.id,
        currency: "USD",
        theme: "light",
      });
      
      const token = generateToken(user.id);
      res.json({ user: { id: user.id, username: user.username }, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || !comparePassword(password, user.password)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const token = generateToken(user.id);
      res.json({ user: { id: user.id, username: user.username }, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ id: user.id, username: user.username });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User settings routes
  app.get("/api/settings", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const settings = await storage.getUserSettings(req.userId!);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/settings", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertUserSettingsSchema.parse(req.body);
      const settings = await storage.updateUserSettings(req.userId!, data);
      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Category routes
  app.get("/api/categories", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const categories = await storage.getCategories(req.userId!);
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/categories", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory({ ...data, userId: req.userId! });
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/categories/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const data = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, req.userId!, data);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/categories/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCategory(id, req.userId!);
      if (!deleted) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transaction routes
  app.get("/api/transactions", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const monthYear = req.query.month as string | undefined;
      const transactions = await storage.getTransactions(req.userId!, monthYear);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transactions", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction({ 
        ...data, 
        userId: req.userId!,
        date: typeof data.date === 'string' ? new Date(data.date) : data.date,
      });
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/transactions/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const data = insertTransactionSchema.partial().parse(req.body);
      const updateData = {
        ...data,
        date: data.date && typeof data.date === 'string' ? new Date(data.date) : data.date,
      };
      const transaction = await storage.updateTransaction(id, req.userId!, updateData);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      // If category was updated, upsert category mapping (create or update)
      if (data.categoryId && transaction.provider) {
        await storage.upsertCategoryMapping(req.userId!, transaction.provider, data.categoryId);
      }
      
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/transactions/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTransaction(id, req.userId!);
      if (!deleted) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // PDF upload and parsing
  app.post("/api/transactions/upload-pdf", authMiddleware, upload.single("pdf"), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }
      
      // Parse PDF to extract transactions
      const parsedTransactions = await parsePdfStatement(req.file.buffer);
      
      // Get user's category mappings for auto-categorization
      const mappings = await storage.getCategoryMappings(req.userId!);
      const mappingMap = new Map(mappings.map(m => [m.provider.toLowerCase(), m.categoryId]));
      
      // Create transactions with auto-categorization
      const createdTransactions = [];
      for (const parsed of parsedTransactions) {
        const monthYear = parsed.date.substring(0, 7); // YYYY-MM
        const categoryId = mappingMap.get(parsed.provider.toLowerCase()) || null;
        
        const transaction = await storage.createTransaction({
          userId: req.userId!,
          date: new Date(parsed.date),
          description: parsed.description,
          provider: parsed.provider,
          amount: parsed.amount.toString(),
          categoryId,
          monthYear,
        });
        
        createdTransactions.push(transaction);
      }
      
      res.json({
        total: createdTransactions.length,
        categorized: createdTransactions.filter(t => t.categoryId !== null).length,
        uncategorized: createdTransactions.filter(t => t.categoryId === null).length,
        transactions: createdTransactions,
      });
    } catch (error: any) {
      console.error("PDF upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Monthly data routes
  app.get("/api/monthly-data/:monthYear", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { monthYear } = req.params;
      const data = await storage.getMonthlyData(req.userId!, monthYear);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/monthly-data", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = await storage.getAllMonthlyData(req.userId!);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/monthly-data/:monthYear", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { monthYear } = req.params;
      const data = insertMonthlyDataSchema.parse({ ...req.body, monthYear });
      const monthlyData = await storage.createOrUpdateMonthlyData({ ...data, userId: req.userId! });
      res.json(monthlyData);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Category mappings
  app.get("/api/category-mappings", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const mappings = await storage.getCategoryMappings(req.userId!);
      res.json(mappings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
