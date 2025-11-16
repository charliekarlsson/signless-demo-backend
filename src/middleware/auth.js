import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const TOKEN_COOKIE = 'x4zero_session';

const parseBoolean = (value) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false;
  }

  return undefined;
};

const resolveSameSite = (value) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (['lax', 'strict', 'none'].includes(normalized)) {
    return normalized;
  }

  return undefined;
};

const inferProductionLike = () => {
  const explicit = parseBoolean(process.env.SESSION_COOKIE_SECURE);
  if (explicit !== undefined) {
    return explicit;
  }

  const env = (process.env.NODE_ENV || '').toLowerCase();
  if (env === 'production') {
    return true;
  }

  const railwayEnv = (process.env.RAILWAY_ENVIRONMENT || '').toLowerCase();
  if (railwayEnv === 'production') {
    return true;
  }

  const railwayEnvName = (process.env.RAILWAY_ENVIRONMENT_NAME || '').toLowerCase();
  if (railwayEnvName === 'production') {
    return true;
  }

  return false;
};

const resolveCookieSettings = () => {
  const productionLike = inferProductionLike();
  const sameSiteOverride = resolveSameSite(process.env.SESSION_COOKIE_SAMESITE);

  const sameSite = sameSiteOverride || (productionLike ? 'none' : 'lax');
  const secure = sameSite === 'none' ? true : productionLike;

  return { sameSite, secure };
};

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  if (req.cookies?.[TOKEN_COOKIE]) {
    return req.cookies[TOKEN_COOKIE];
  }

  return null;
};

export const issueSession = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

export const setSessionCookie = (res, token) => {
  const { sameSite, secure } = resolveCookieSettings();
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearSessionCookie = (res) => {
  const { sameSite, secure } = resolveCookieSettings();
  res.clearCookie(TOKEN_COOKIE, {
    httpOnly: true,
    secure,
    sameSite,
  });
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { merchant: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      merchant: user.merchant
        ? {
            id: user.merchant.id,
            slug: user.merchant.slug,
            onboardingStatus: user.merchant.onboardingStatus,
            onboardingChecklist: user.merchant.onboardingChecklist,
          }
        : null,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
