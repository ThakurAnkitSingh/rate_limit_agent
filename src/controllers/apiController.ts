import { Request, Response } from 'express';
import { registerAppService } from '../services/apiService';

// Correctly typed controller
export const registerAppController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, baseUrl, rateLimitStrategy, requestCount, timeWindow } = req.body;

    if (!name || !baseUrl || !rateLimitStrategy || !requestCount || !timeWindow) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const appId = await registerAppService({ name, baseUrl, rateLimitStrategy, requestCount, timeWindow })

    res.status(201).json({ appId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
