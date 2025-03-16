/**
 * This script helps you generate password hashes for new users
 * Run it with: npx ts-node src/scripts/generate-user-hash.ts <password> [salt]
 * If salt is not provided, it will use 'demo-salt' for backward compatibility
 */

// Generate a SHA-256 hash with optional custom salt
function generateHash(password: string, salt?: string): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  
  // Use provided salt or demo-salt for backward compatibility
  const useSalt = salt || 'demo-salt';
  
  return `${useSalt}:${hash}`;
}

// Get the password and optional salt from command line arguments
const password = process.argv[2];
const salt = process.argv[3]; // Optional salt parameter

if (!password) {
  console.error('Please provide a password as an argument');
  console.error('Usage: npx ts-node src/scripts/generate-user-hash.ts <password> [salt]');
  console.error('If salt is not provided, "demo-salt" will be used for backward compatibility');
  process.exit(1);
}

// Generate and display the hash
const hash = generateHash(password, salt);
console.log('\nPassword Hash Generator');
console.log('=====================');
console.log(`Password: ${password}`);
console.log(`Salt: ${salt || 'demo-salt'} (${salt ? 'custom' : 'default'})`);
console.log(`Hash: ${hash}`);
console.log('\nSQL to insert a new user:');
console.log(`
INSERT INTO users (username, email, password_hash, role_id)
VALUES (
  'new_username',
  'user@example.com',
  '${hash}',
  (SELECT id FROM roles WHERE name = 'user') -- Change to 'admin' if needed
);
`);
console.log('Remember to change the username and email in the SQL statement above.');
console.log('\nIMPORTANT: The demo users (admin/user123) use hardcoded password checks.');
console.log('If you create new users with demo-salt, they will work with the normal hash comparison.'); 