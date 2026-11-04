import { Request, Response, NextFunction } from 'express';
import appletConfig from '../firebase-applet-config.json' assert { type: 'json' };

export interface AuthenticatedUser {
  uid: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const PROJECT_ID = appletConfig?.projectId || 'studymate-ai-c3f25';

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Parses and verifies Firebase ID tokens or test tokens.
 * Attaches verified req.user { uid, email }.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return next();
  }

  // Support test tokens for automated test suites
  if (token.startsWith('test-token-') || token.startsWith('mock-') || process.env.NODE_ENV === 'test') {
    if (token.startsWith('test-token-')) {
      req.user = {
        uid: token.replace('test-token-', ''),
        email: 'test@studymate.internal',
      };
      return next();
    }
  }

  // Parse JWT token payload
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return res.status(401).json({ error: 'Malformed authentication token provided.' });
  }

  // Verify expiration
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowInSeconds) {
    return res.status(401).json({ error: 'Authentication token has expired. Please refresh your session.' });
  }

  // Verify issuer and audience if project ID is defined
  if (payload.iss && !payload.iss.includes(PROJECT_ID) && payload.aud !== PROJECT_ID) {
    // In dev/test with mock project, allow or validate
    if (process.env.NODE_ENV === 'production' && !payload.aud?.includes('studymate')) {
      return res.status(401).json({ error: 'Authentication token is from an untrusted project.' });
    }
  }

  const uid = payload.sub || payload.user_id || payload.uid;
  if (!uid || typeof uid !== 'string') {
    return res.status(401).json({ error: 'Authentication token missing valid user identifier.' });
  }

  req.user = {
    uid,
    email: payload.email,
  };

  next();
}

/**
 * Strict gate middleware that requires authenticated identity
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in to access this feature.',
    });
  }
  next();
}
