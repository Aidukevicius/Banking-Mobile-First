
import type { VercelRequest, VercelResponse } from '@vercel/node';

let handler: any = null;

export default async function vercelHandler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!handler) {
      // Dynamically import without serverless-http wrapper
      const appModule = await import('../dist/server/app.js');
      const { createApp } = appModule;
      const { app } = await createApp();
      
      // Store the app directly
      handler = app;
      
      console.log('Handler initialized successfully');
    }

    // Handle the request directly with Express
    handler(req, res);
  } catch (error) {
    console.error('Vercel handler error:', error);

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Server initialization failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      });
    }
  }
}
