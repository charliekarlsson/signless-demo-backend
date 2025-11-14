import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const TOKEN_COOKIE = 'x4zero_session';

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
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearSessionCookie = (res) => {
  res.clearCookie(TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
          }
        : null,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
