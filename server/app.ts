import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import type { Server } from "http";

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

export async function createApp() {
  const app = express();

  app.use(express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: false }));

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        log(logLine);
      }
    });

    next();
  });

  // Register API routes
  const server = await registerRoutes(app);

  // Global error handler - ensures all errors return JSON
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Global error handler:', err);
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        message: err.message || 'An unexpected error occurred'
      });
    }
  });

  // Setup static file serving
  const isProduction = app.get("env") === "production" || process.env.NODE_ENV === "production";
  
  if (isProduction) {
    serveStatic(app);
  } else if (server) {
    // Only setup Vite in development when we have a server instance
    await setupVite(app, server);
  } else {
    // Fallback to static serving if no server
    serveStatic(app);
  }

  return { app, server };
}