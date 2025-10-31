import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../server/app';

let appInstance: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!appInstance) {
      const { app } = await createApp();
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