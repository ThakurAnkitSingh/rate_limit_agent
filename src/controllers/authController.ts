import { Request, Response } from 'express';
import { generateAPIKeyService } from '../services/authService';


const generateAPIKeyController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { appId } = req.body;

    const apiKey = await generateAPIKeyService(appId);
    if (!apiKey) {
      res.status(400).json({ message: 'Unable to generate API Key' });
    }else{
      res.status(201).json({ apiKey });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export default generateAPIKeyController;
