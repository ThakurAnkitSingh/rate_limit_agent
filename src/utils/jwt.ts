import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

interface JWTDecoded {
  appId: string;
}


// Function to generate JWT
export const generateJWT = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

// Function to verify JWT
export const verifyJWT = (token: string): JWTDecoded => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTDecoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};