import type { Request, Response } from 'express';

let appPromise: Promise<any> | null = null;

export default async function handler(req: Request, res: Response) {
  if (!appPromise) {
    appPromise = (async () => {
      const { createApp } = await import('../server/app');
      const { app } = await createApp();
      return app;
    })();
  }
  
  const app = await appPromise;
  return app(req, res);
}
