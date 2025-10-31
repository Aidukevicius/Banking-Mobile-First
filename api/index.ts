
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../server/app';

let appInstance: any = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!appInstance) {
      const { app } = await createApp();
      appInstance = app;
    }

    // Let Express handle the request
    return new Promise((resolve, reject) => {
      appInstance(req, res, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  } catch (error) {
    console.error('Vercel handler error:', error);
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
