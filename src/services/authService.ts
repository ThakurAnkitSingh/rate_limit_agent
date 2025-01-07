import Redis from 'ioredis';
import supabase from '../config/supabase';
import { generateJWT } from '../utils/jwt';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379"),
});

export const generateAPIKeyService = async (userId: string): Promise<string | null> => {
  // Check if user exists
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !user) {
    throw new Error('User not found');
  }

  // Generate API Key
  const apiKey = generateJWT({ userId });

  // Save the API Key to the database
  const { error: insertError } = await supabase
    .from('api_keys')
    .insert([{ user_id: userId, api_key: apiKey }]);

  if (insertError) {
    throw new Error(insertError.message);
  }

  const bucketKey = `rate_limit:${userId}:${apiKey}`;
  await redis.set(bucketKey, user.request_count);
  return apiKey;
};
