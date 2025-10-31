
import serverless from 'serverless-http';
import express, { type Request, Response, NextFunction } from "express";
import path from 'path';
import { registerRoutes } from "../server/routes";

const app = express();

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Register API routes
registerRoutes(app).catch(err => {
  console.error('Failed to register routes:', err);
});

// Serve static files from dist/public
const staticPath = path.join(process.cwd(), 'dist', 'public');
app.use(express.static(staticPath));

// Handle SPA routing - serve index.html for non-API routes
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

export default serverless(app);
