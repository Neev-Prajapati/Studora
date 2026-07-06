// Simple in-memory cache for downloaded and parsed files.
// In a serverless environment (like Vercel), this keeps data warm across requests 
// that hit the same lambda instance, drastically reducing file download and parsing time.

export const fileCache = new Map<string, any>();
