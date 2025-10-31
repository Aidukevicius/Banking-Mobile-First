
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../dist/server/app.js';

let appInstance: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!appInstance) {
      const { app } = await createApp();
      appInstance = app;
    }

    // Handle the request with Express and wait for it to complete
    await new Promise<void>((resolve, reject) => {
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 29000); // Vercel has 30s limit

      // Handle Express response finishing
      res.on('finish', () => {
        clearTimeout(timeout);
        resolve();
      });

      res.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });

      // Call Express app
      appInstance(req, res, (err: any) => {
        clearTimeout(timeout);
        if (err) {
          console.error('Express middleware error:', err);
          
          // Only send response if not already sent
          if (!res.headersSent) {
            res.status(500).json({
              error: 'Internal server error',
              message: err.message || 'An error occurred processing your request'
            });
          }
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Vercel handler error:', error);
    
    // Only send response if not already sent
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
