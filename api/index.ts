
import serverless from 'serverless-http';
import express, { type Request, Response, NextFunction } from "express";
import path from 'path';

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const app = express();

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Register API routes with error handling
let routesRegistered = false;
(async () => {
  try {
    const { registerRoutes } = await import("../dist/server/routes.js");
    await registerRoutes(app);
    routesRegistered = true;
    console.log('Routes registered successfully');
  } catch (err) {
    console.error('Failed to register routes:', err);
    throw err;
  }
})();

// Health check to ensure routes are loaded
app.use((req, res, next) => {
  if (!routesRegistered && req.path.startsWith('/api')) {
    return res.status(503).json({ error: 'Service initializing, please retry' });
  }
  next();
});

// Serve static files from dist/public
// Use __dirname for Vercel compatibility
const staticPath = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'dist', 'public');
app.use(express.static(staticPath));

// Handle SPA routing - serve index.html for non-API routes
app.get('*', (_req: Request, res: Response) => {
  const indexPath = path.join(staticPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading application');
    }
  });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

export default serverless(app);
