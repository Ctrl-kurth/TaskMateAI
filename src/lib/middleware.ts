import { NextRequest } from 'next/server';
import { verifyToken, JWTPayload } from './jwt';

export interface AuthRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Middleware to verify JWT token from Authorization header
 */
export function getAuthUser(request: NextRequest): JWTPayload | null {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);
    
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return Response.json(
    { success: false, error: message },
    { status: 401 }
  );
}
