import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';

export interface DecodedCustomUser {
  uid: string;
  email: string;
  displayName: string | null;
}

export interface AuthRequest extends Request {
  user?: DecodedCustomUser;
  dbUser?: typeof users.$inferSelect;
}

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Failed to register or sync user profile:", error);
    throw new Error("Database profile synchronization failed", { cause: error });
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    // Decode the custom base64 token (which represents custom user details)
    const decodedStr = Buffer.from(token, 'base64').toString('utf8');
    const decodedUser = JSON.parse(decodedStr) as DecodedCustomUser;

    if (!decodedUser || !decodedUser.uid || !decodedUser.email) {
      throw new Error('Invalid token format');
    }

    req.user = decodedUser;

    // Get or create database user record
    const dbUser = await getOrCreateUser(decodedUser.uid, decodedUser.email);
    req.dbUser = dbUser;

    next();
  } catch (error) {
    console.error('Error decoding custom token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
