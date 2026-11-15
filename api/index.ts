import type { IncomingMessage, ServerResponse } from 'http';
import dotenv from 'dotenv';
import { createExpressApp } from '../server/app.js';

try {
  dotenv.config();
} catch {
  // Environment variables are injected directly by Vercel/runtime in production
}

let cachedApp: ReturnType<typeof createExpressApp> | null = null;

function getApp() {
  if (!cachedApp) {
    cachedApp = createExpressApp();
  }
  return cachedApp;
}

function normalizeVercelRewriteUrl(req: IncomingMessage & { url?: string; originalUrl?: string }) {
  const rawUrl = req.url || '/';
  try {
    const parsed = new URL(rawUrl, 'http://localhost');
    const pathParam = parsed.searchParams.get('__path');
    if (pathParam !== null) {
      parsed.searchParams.delete('__path');
      const cleanSubpath = pathParam.replace(/^\/+/, '');
      const targetPath = cleanSubpath ? `/api/${cleanSubpath}` : '/api';
      const remainingQuery = parsed.searchParams.toString();
      const normalized = remainingQuery ? `${targetPath}?${remainingQuery}` : targetPath;
      req.url = normalized;
      if (req.originalUrl) {
        req.originalUrl = normalized;
      }
    }
  } catch {
    // Keep original req.url if URL parsing fails
  }
}

export default function handler(req: IncomingMessage & { url?: string }, res: ServerResponse) {
  try {
    normalizeVercelRewriteUrl(req);
    const app = getApp();
    return app(req as any, res as any);
  } catch (error: any) {
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'studymate-vercel-entry',
        timestamp: new Date().toISOString(),
        errorCategory: 'serverless_init_failure',
        errorName: error?.name || 'Error',
        message: error?.message || 'Serverless initialization failed',
      })
    );

    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'The StudyMate backend failed to initialize. Please check server logs.',
          code: 'SERVER_INIT_FAILED',
        })
      );
    }
  }
}
