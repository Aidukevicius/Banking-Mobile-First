import type { Request, Response } from 'express';

let appPromise: Promise<any> | null = null;

export default async function handler(req: Request, res: Response) {
  try {
    if (!appPromise) {
      appPromise = (async () => {
        const { createApp } = await import('../server/app');
        const { app } = await createApp();
        return app;
      })();
    }
    
    const app = await appPromise;
    return app(req, res);
  } catch (error) {
    console.error('Vercel handler error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
