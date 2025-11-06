import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authMiddleware, AuthRequest, hashPassword, comparePassword, generateToken, generateResetToken, hashResetToken, getResetTokenExpiry } from "./auth";
import { sendPasswordResetEmail } from "./resend-client";
import { rateLimitPasswordReset } from "./rate-limiter";
import { insertUserSchema, loginSchema, insertCategorySchema, insertTransactionSchema, insertMonthlyDataSchema, insertCategoryMappingSchema, insertUserSettingsSchema } from "@shared/schema";
import { parsePdfStatement } from "./pdf-parser";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

async function updateMonthlyData(userId: string, monthYear: string) {
  try {
    const transactions = await storage.getTransactions(userId, monthYear);

    // Calculate income from income transactions
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    // Calculate expenses from expense transactions
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    // Get existing monthly data to preserve savings and investments
    const existingData = await storage.getMonthlyData(userId, monthYear);

    await storage.createOrUpdateMonthlyData({
      userId,
      monthYear,
      income: income.toString(),
      expenses: expenses.toString(),
      savings: existingData?.savings || "0",
      investments: existingData?.investments || "0",
    });
  } catch (error) {
    console.error("Error updating monthly data:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    const startTime = Date.now();
    try {
      console.log('[REGISTER] Start');
      const { username, email, password } = insertUserSchema.parse(req.body);
      console.log('[REGISTER] Parsed input:', Date.now() - startTime, 'ms');

      console.log('[REGISTER] Checking username...');
      const existingUsername = await storage.getUserByUsername(username);
      console.log('[REGISTER] Username check done:', Date.now() - startTime, 'ms');
      if (existingUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }

      console.log('[REGISTER] Checking email...');
      const existingEmail = await storage.getUserByEmail(email);
      console.log('[REGISTER] Email check done:', Date.now() - startTime, 'ms');
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      console.log('[REGISTER] Hashing password...');
      const hashedPassword = hashPassword(password);
      console.log('[REGISTER] Creating user...');
      const user = await storage.createUser({ username, email, password: hashedPassword });
      console.log('[REGISTER] User created:', Date.now() - startTime, 'ms');

      console.log('[REGISTER] Creating settings...');
      await storage.createUserSettings({
        userId: user.id,
        currency: "USD",
        theme: "light",
      });
      console.log('[REGISTER] Settings created:', Date.now() - startTime, 'ms');

      const token = generateToken(user.id);
      console.log('[REGISTER] Complete:', Date.now() - startTime, 'ms');
      res.json({ user: { id: user.id, username: user.username }, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const startTime = Date.now();
    try {
      console.log('[LOGIN] Start');
      const { username, password } = loginSchema.parse(req.body);

      console.log('[LOGIN] Looking up user...');
      const user = await storage.getUserByUsername(username);
      console.log('[LOGIN] User lookup done:', Date.now() - startTime, 'ms');
      if (!user || !comparePassword(password, user.password)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user.id);
      console.log('[LOGIN] Complete:', Date.now() - startTime, 'ms');
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

  app.post("/api/auth/forgot-password", rateLimitPasswordReset, async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);

      // Always return success message for security (don't reveal if user exists)
      const successMessage = "If that email exists, a reset link has been sent";

      if (!user) {
        return res.json({ message: successMessage });
      }

      const resetToken = generateResetToken();
      const hashedToken = hashResetToken(resetToken);
      const expiry = getResetTokenExpiry();

      await storage.setResetToken(user.id, hashedToken, expiry);

      try {
        await sendPasswordResetEmail(user.email, resetToken, user.username);
        console.log(`Password reset email sent to ${email}`);
      } catch (emailError: any) {
        console.error("Failed to send password reset email:", emailError);
        return res.status(500).json({ error: "Failed to send reset email. Please try again later." });
      }

      res.json({ message: successMessage });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return res.status(400).json({ error: "Password must contain uppercase, lowercase, and numbers" });
      }

      const hashedToken = hashResetToken(token);
      const user = await storage.getUserByResetToken(hashedToken);

      if (!user || !user.resetTokenExpiry) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (new Date() > user.resetTokenExpiry) {
        await storage.updateUserPassword(user.id, user.password);
        return res.status(400).json({ error: "Reset token has expired. Please request a new one." });
      }

      const hashedPassword = hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);

      console.log(`Password successfully reset for user ${user.username}`);
      res.json({ message: "Password has been reset successfully" });
    } catch (error: any) {
      console.error("Reset password error:", error);
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
      console.log(`[GET /api/transactions] userId: ${req.userId}, month: ${monthYear || 'all'}`);
      const transactions = await storage.getTransactions(req.userId!, monthYear);
      console.log(`[GET /api/transactions] Found ${transactions.length} transactions`);
      res.json(transactions);
    } catch (error: any) {
      console.error('[GET /api/transactions] Error:', error);
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

      // Update monthly expenses automatically
      await updateMonthlyData(req.userId!, transaction.monthYear);

      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update transaction (amount, category, or type)
  app.put("/api/transactions/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      // Get original transaction to track monthYear changes
      const allTransactions = await storage.getTransactions(req.userId!);
      const originalTransaction = allTransactions.find(t => t.id === id);
      
      if (!originalTransaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      const originalMonthYear = originalTransaction.monthYear;

      // Build update data - only include fields that are being changed
      const updateData: any = {};
      
      if (req.body.amount !== undefined) {
        updateData.amount = String(req.body.amount);
      }
      
      if (req.body.categoryId !== undefined) {
        updateData.categoryId = req.body.categoryId || null;
      }
      
      if (req.body.type !== undefined) {
        updateData.type = req.body.type;
      }
      
      if (req.body.date !== undefined) {
        updateData.date = typeof req.body.date === 'string' ? new Date(req.body.date) : req.body.date;
      }

      const transaction = await storage.updateTransaction(id, req.userId!, updateData);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // If category was updated, upsert category mapping (create or update)
      if (updateData.categoryId && transaction.provider) {
        await storage.upsertCategoryMapping(req.userId!, transaction.provider, updateData.categoryId);
      }

      // Update monthly expenses for both old and new months if monthYear changed
      if (originalMonthYear && originalMonthYear !== transaction.monthYear) {
        await updateMonthlyData(req.userId!, originalMonthYear);
      }
      await updateMonthlyData(req.userId!, transaction.monthYear);

      res.json(transaction);
    } catch (error: any) {
      console.error("Update transaction error:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/transactions/clear-all", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const deleted = await storage.clearAllTransactions(req.userId!);

      // Reset all monthly data
      const monthlyDataList = await storage.getAllMonthlyData(req.userId!);
      for (const data of monthlyDataList) {
        await storage.createOrUpdateMonthlyData({
          userId: req.userId!,
          monthYear: data.monthYear,
          income: "0",
          expenses: "0",
          savings: data.savings || "0",
          investments: data.investments || "0",
        });
      }

      res.json({ success: true, deleted });
    } catch (error: any) {
      console.error("Clear all transactions error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/transactions/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      // Get transaction before deleting to update monthly expenses
      const transactions = await storage.getTransactions(req.userId!);
      const transaction = transactions.find(t => t.id === id);

      const deleted = await storage.deleteTransaction(id, req.userId!);
      if (!deleted) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      // Update monthly expenses if transaction was found
      if (transaction) {
        await updateMonthlyData(req.userId!, transaction.monthYear);
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

      // Create transactions with auto-categorization and duplicate detection
      const createdTransactions = [];
      const skippedDuplicates = [];
      const monthsToUpdate = new Set<string>();

      for (const parsed of parsedTransactions) {
        const monthYear = parsed.date.substring(0, 7); // YYYY-MM
        const categoryId = mappingMap.get(parsed.provider.toLowerCase()) || null;

        // Determine transaction type based on amount
        // Positive amounts = income, Negative amounts = expense
        const type = parsed.amount > 0 ? 'income' : 'expense';

        // Check for duplicate transaction
        const transactionDate = new Date(parsed.date);
        const amountStr = parsed.amount.toString();
        const duplicate = await storage.findDuplicateTransaction(
          req.userId!,
          transactionDate,
          parsed.description,
          parsed.provider,
          amountStr
        );

        if (duplicate) {
          skippedDuplicates.push({
            date: parsed.date,
            description: parsed.description,
            provider: parsed.provider,
            amount: parsed.amount,
          });
          continue;
        }

        const transaction = await storage.createTransaction({
          userId: req.userId!,
          type,
          date: transactionDate,
          description: parsed.description,
          provider: parsed.provider,
          amount: amountStr,
          categoryId,
          monthYear,
        });

        createdTransactions.push(transaction);
        monthsToUpdate.add(monthYear);
      }

      // Update monthly expenses for all affected months
      for (const monthYear of Array.from(monthsToUpdate)) {
        await updateMonthlyData(req.userId!, monthYear);
      }

      res.json({
        total: createdTransactions.length,
        categorized: createdTransactions.filter(t => t.categoryId !== null).length,
        uncategorized: createdTransactions.filter(t => t.categoryId === null).length,
        transactions: createdTransactions,
        skipped: skippedDuplicates.length,
        duplicates: skippedDuplicates,
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

  // Portfolio endpoints
  app.get("/api/portfolio", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const currentMonth = new Date().toISOString().substring(0, 7);
      const monthlyData = await storage.getMonthlyData(req.userId!, currentMonth);
      res.json({
        savings: monthlyData?.savings || "0",
        investments: monthlyData?.investments || "0",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/portfolio/savings", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { value } = req.body;
      const currentMonth = new Date().toISOString().substring(0, 7);
      const monthlyData = await storage.createOrUpdateMonthlyData({
        userId: req.userId!,
        monthYear: currentMonth,
        savings: value,
      });
      res.json(monthlyData);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/portfolio/investments", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { value } = req.body;
      const currentMonth = new Date().toISOString().substring(0, 7);
      const monthlyData = await storage.createOrUpdateMonthlyData({
        userId: req.userId!,
        monthYear: currentMonth,
        investments: value,
      });
      res.json(monthlyData);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Savings pots routes
  app.get("/api/savings-pots", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const type = req.query.type as string | undefined;
      const pots = await storage.getSavingsPots(req.userId!, type);
      res.json(pots);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/savings-pots", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const data = req.body;
      const pot = await storage.createSavingsPot({ ...data, userId: req.userId! });
      res.json(pot);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/savings-pots/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const pot = await storage.updateSavingsPot(id, req.userId!, data);
      if (!pot) {
        return res.status(404).json({ error: "Savings pot not found" });
      }
      res.json(pot);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/savings-pots/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSavingsPot(id, req.userId!);
      if (!deleted) {
        return res.status(404).json({ error: "Savings pot not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}