
import type { Request, Response } from 'express';
import express from 'express';

let appInstance: any = null;

export default async function handler(req: Request, res: Response) {
  try {
    if (!appInstance) {
      // Import dependencies inline for serverless
      const { registerRoutes } = await import('../server/routes');
      const app = express();
      
      app.use(express.json({
        verify: (req: any, _res, buf) => {
          req.rawBody = buf;
        }
      }));
      app.use(express.urlencoded({ extended: false }));

      await registerRoutes(app);

      app.use((err: any, _req: Request, res: Response, _next: any) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
      });

      appInstance = app;
    }
    
    return appInstance(req, res);
  } catch (error) {
    console.error('Vercel handler error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
