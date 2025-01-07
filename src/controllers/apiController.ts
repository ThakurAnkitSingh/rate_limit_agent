import { Request, Response } from 'express';
import { registerAppService } from '../services/apiService';

// Correctly typed controller
export const registerAppController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, baseUrl, rateLimitStrategy, requestCount, timeWindow } = req.body;

    if (!name || !baseUrl || !requestCount || !timeWindow) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // by default, we use the rolling window strategy
    const strategy = rateLimitStrategy || 'token_bucket';

    const appId = await registerAppService({ name, baseUrl, strategy, requestCount, timeWindow })

    res.status(201).json({ appId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
