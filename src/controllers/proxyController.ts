import { Request, Response } from 'express';
import { proxyRequestService } from '../services/proxyService';

export const proxyRequestController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appId } = req.params;
    const response = await proxyRequestService(req, appId);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};