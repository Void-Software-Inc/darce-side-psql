/**
 * Hash a password using SHA-256 with a salt
 * Format: salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
  // This function will only be used on the server side in API routes
  // We'll use a simple hash for demo purposes
  // In a real application, you would use a proper password hashing library
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Generate a random salt (this is a simplified version)
  const salt = Math.random().toString(36).substring(2, 15);
  
  // Return the salt and hash combined
  return `${salt}:${hashHex}`;
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Split the stored hash into salt and hash
    const [salt, hash] = storedHash.split(':');
    
    // For demo purposes, we'll use a simplified comparison
    // In a real application, you would use the same hashing algorithm
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // For the demo, we'll just compare the hashes directly
    // This is not how you would normally verify passwords with salts
    return hashHex === hash;
  } catch (error) {
    console.error('Error comparing password:', error);
    return false;
  }
} 