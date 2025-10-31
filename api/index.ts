import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import type { Express } from 'express';

let handler: ReturnType<typeof serverless> | null = null;

export default async function vercelHandler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!handler) {
      // Dynamically import the app creation function
      const { createApp } = await import('../dist/server/app.js');
      const { app } = await createApp();

      // Wrap Express app with serverless-http
      handler = serverless(app as Express, {
        request: (request: any) => {
          // Ensure proper path handling
          request.url = req.url || '/';
        }
      });

      console.log('Serverless handler initialized successfully');
    }

    // Call the serverless handler
    return await handler(req, res);
  } catch (error) {
    console.error('Vercel handler error:', error);

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Server initialization failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
}