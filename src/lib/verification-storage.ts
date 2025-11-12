// Shared verification code storage
// In production, use Redis or database instead of in-memory Map

export const verificationCodes = new Map<string, { code: string; expires: number }>();
