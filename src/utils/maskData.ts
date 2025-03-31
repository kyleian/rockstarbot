/**
 * Utility functions for masking sensitive data in logs and output
 */

export function maskId(id: string): string {
  if (!id) return 'undefined';
  return `${id.substring(0, 4)}...${id.slice(-4)}`;
}

export function maskUsername(username: string): string {
  if (!username || username.length <= 2) return username;
  return `${username.charAt(0)}${'*'.repeat(username.length - 2)}${username.charAt(username.length - 1)}`;
}

export function maskSensitiveInfo(obj: any): any {
  if (!obj) return obj;
  
  const masked = { ...obj };
  if (masked.id) masked.id = maskId(masked.id);
  if (masked.username) masked.username = maskUsername(masked.username);
  return masked;
}
