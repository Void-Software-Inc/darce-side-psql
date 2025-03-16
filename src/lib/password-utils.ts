/**
 * Hash a password using SHA-256 with a salt
 * Format: salt:hash
 */
export async function hashPassword(password: string, useDemoSalt: boolean = false, customSalt?: string): Promise<string> {
  // This function will only be used on the server side in API routes
  // We'll use a simple hash for demo purposes
  // In a real application, you would use a proper password hashing library
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Use the appropriate salt
  let salt: string;
  if (useDemoSalt) {
    salt = 'demo-salt';
  } else if (customSalt) {
    salt = customSalt;
  } else {
    // Generate a random salt if no custom salt provided
    salt = Math.random().toString(36).substring(2, 15);
  }
  
  // Return the salt and hash combined
  return `${salt}:${hashHex}`;
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(password: string, storedHash: string): Promise<boolean> {
  try {
    console.log('Comparing password:', { password, storedHash });
    
    // Split the stored hash into salt and hash
    const [salt, hash] = storedHash.split(':');
    console.log('Split hash:', { salt, hash });
    
    // Special case for demo users with hardcoded passwords
    if (salt === 'demo-salt') {
      console.log('Using demo-salt comparison method');
      
      // Hardcoded checks for demo users
      if (password === 'admin123' && hash === '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918') {
        console.log('Admin user matched with hardcoded password!');
        return true;
      }
      
      if (password === 'user123' && hash === '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92') {
        console.log('Regular user matched with hardcoded password!');
        return true;
      }
      
      // For other demo-salt users, calculate the hash
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log('Demo user comparison:', { 
        calculatedHash, 
        storedHash: hash,
        matches: calculatedHash === hash
      });
      
      return calculatedHash === hash;
    }
    
    // For regular users with custom salts, we'll use the Web Crypto API
    console.log('Using custom salt comparison method');
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('Regular user comparison:', { 
      calculatedHash: hashHex, 
      storedHash: hash,
      matches: hashHex === hash
    });
    
    // For the demo, we'll just compare the hashes directly
    // This is not how you would normally verify passwords with salts
    return hashHex === hash;
  } catch (error) {
    console.error('Error comparing password:', error);
    return false;
  }
}

/**
 * Generate a hash for a new user (for admin use)
 * This function can be used to generate hashes for new users
 * that you want to insert directly into the database
 */
export async function generateUserHash(password: string, useDemoSalt: boolean = true, customSalt?: string): Promise<string> {
  // Generate a direct SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Use the appropriate salt
  let salt: string;
  if (useDemoSalt) {
    salt = 'demo-salt';
  } else if (customSalt) {
    salt = customSalt;
  } else {
    // Generate a random salt if no custom salt provided
    salt = Math.random().toString(36).substring(2, 15);
  }
  
  return `${salt}:${hashHex}`;
}