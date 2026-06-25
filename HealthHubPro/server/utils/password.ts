import * as crypto from 'crypto';
import { promisify } from 'util';

// Use Node.js built-in crypto module as bcrypt is not available
// This is a simplified implementation using PBKDF2
// In a production app, you would use bcrypt

// Constants for the hashing algorithm
const ITERATIONS = 10000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';
const SEPARATOR = '$';

// Promisify crypto functions
const randomBytes = promisify(crypto.randomBytes);
const pbkdf2 = promisify(crypto.pbkdf2);

/**
 * Hash a password using PBKDF2
 * 
 * @param password The password to hash
 * @returns A hashed password string (salt$hash format)
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // Generate a random salt
    const salt = (await randomBytes(16)).toString('hex');
    
    // Hash the password
    const hash = await pbkdf2(
      password, 
      salt, 
      ITERATIONS, 
      KEY_LENGTH, 
      DIGEST
    );
    
    // Return the salt and hash together
    return `${salt}${SEPARATOR}${hash.toString('hex')}`;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against a hash
 * 
 * @param password The password to verify
 * @param storedHash The stored hash to verify against
 * @returns A boolean indicating if the password matches
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Extract the salt from the stored hash
    const [salt, hash] = storedHash.split(SEPARATOR);
    
    if (!salt || !hash) {
      return false;
    }
    
    // Hash the provided password with the same salt
    const newHash = await pbkdf2(
      password, 
      salt, 
      ITERATIONS, 
      KEY_LENGTH, 
      DIGEST
    );
    
    // Compare the hashes
    return newHash.toString('hex') === hash;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}
