import { hashPassword, comparePassword } from './password-utils';
import jwt from 'jsonwebtoken';
import { pool, query } from './db';
import { cookies, headers } from 'next/headers';

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  role_id: number;
  role?: string;
  permissions?: string[];
}

export interface UserWithPassword extends User {
  password_hash: string;
}

// JWT configuration
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';

// Re-export the password utilities
export { hashPassword, comparePassword };

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: User): string {
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    roleId: user.role_id
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Authenticate a user with username/email and password
 */
export async function authenticateUser(usernameOrEmail: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    // Query to find user by username or email
    const userResult = await query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.role_id, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username = $1 OR u.email = $1`,
      [usernameOrEmail]
    );

    if (userResult.rowCount === 0) {
      return null; // User not found
    }

    const user = userResult.rows[0] as UserWithPassword;
    
    // Check password
    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return null; // Password doesn't match
    }

    // Get user permissions
    const permissionsResult = await query(
      `SELECT p.name
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [user.role_id]
    );

    const permissions = permissionsResult.rows.map(row => row.name);
    
    // Update last login time
    await query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
      [user.id]
    );

    // Create user object without password
    const userWithoutPassword: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role: user.role,
      permissions
    };

    // Generate token
    const token = generateToken(userWithoutPassword);

    return { user: userWithoutPassword, token };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Get user by ID with role and permissions
 */
export async function getUserById(userId: number): Promise<User | null> {
  try {
    const userResult = await query(
      `SELECT u.id, u.username, u.email, u.role_id, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rowCount === 0) {
      return null;
    }

    const user = userResult.rows[0] as User;

    // Get user permissions
    const permissionsResult = await query(
      `SELECT p.name
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [user.role_id]
    );

    user.permissions = permissionsResult.rows.map(row => row.name);

    return user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(userId: number, permission: string): Promise<boolean> {
  try {
    const result = await query(
      `SELECT EXISTS (
        SELECT 1
        FROM users u
        JOIN role_permissions rp ON u.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = $1 AND p.name = $2
      ) as has_permission`,
      [userId, permission]
    );
    
    return result.rows[0].has_permission;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(userId: number, role: string): Promise<boolean> {
  try {
    const result = await query(
      `SELECT EXISTS (
        SELECT 1
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1 AND r.name = $2
      ) as has_role`,
      [userId, role]
    );
    
    return result.rows[0].has_role;
  } catch (error) {
    console.error('Error checking role:', error);
    return false;
  }
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  try {
    const result = await query(
      `SELECT DISTINCT p.name
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN users u ON rp.role_id = u.role_id
       WHERE u.id = $1`,
      [userId]
    );
    
    return result.rows.map(row => row.name);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

interface JwtPayload {
  userId: number;
}

export async function verifyAdmin(): Promise<{ isAdmin: boolean; userId: number }> {
  try {
    const headersList = headers();
    const cookie = (await headersList).get('cookie');
    const token = cookie?.match(/auth-token=([^;]+)/)?.[1];

    if (!token) {
      return { isAdmin: false, userId: 0 };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    const result = await pool.query(
      `SELECT u.id, r.name as role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return { isAdmin: false, userId: 0 };
    }

    const user = result.rows[0];
    return {
      isAdmin: user.role === 'admin',
      userId: user.id
    };
  } catch (error) {
    console.error('Error verifying admin status:', error);
    return { isAdmin: false, userId: 0 };
  }
} 