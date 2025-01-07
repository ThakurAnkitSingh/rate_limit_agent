import Redis from 'ioredis';
import supabase from '../config/supabase';
import { generateJWT } from '../utils/jwt';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
});

export const generateAPIKeyService = async (appId: string): Promise<string | null> => {
  // Checking if app info exists
  const { data: app, error } = await supabase
    .from('apps')
    .select('*')
    .eq('id', appId)
    .single();

  if (error || !app) {
    throw new Error('App info not found');
  }

  // Generating API Key
  const apiKey = generateJWT({ appId });

  // Save the API Key to the database
  const { error: insertError } = await supabase
    .from('api_keys')
    .insert([{ app_id: appId, api_key: apiKey }]);

  if (insertError) {
    throw new Error(insertError.message);
  }
  return apiKey;
};
