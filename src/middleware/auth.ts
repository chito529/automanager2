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
  let uid = 'uid_public_default';
  let email = 'public@automanager.com';
  let displayName = 'Usuario Público';

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      // Decode the custom base64 token (which represents custom user details)
      const decodedStr = Buffer.from(token, 'base64').toString('utf8');
      if (decodedStr) {
        const decodedUser = JSON.parse(decodedStr) as DecodedCustomUser;
        if (decodedUser && decodedUser.uid && decodedUser.email) {
          uid = decodedUser.uid;
          email = decodedUser.email;
          displayName = decodedUser.displayName || decodedUser.email.split('@')[0];
        }
      }
    } catch (error) {
      console.warn('Could not decode token, falling back to public default:', error);
    }
  }

  try {
    req.user = { uid, email, displayName };

    // Get or create database user record for this session
    const dbUser = await getOrCreateUser(uid, email);
    req.dbUser = dbUser;

    next();
  } catch (error) {
    console.error('Error synchronizing database user profile:', error);
    return res.status(500).json({ error: 'Database session synchronization failed' });
  }
};
