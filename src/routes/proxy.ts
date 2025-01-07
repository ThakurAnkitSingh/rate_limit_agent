import express from 'express';
import { proxyRequestController } from '../controllers/proxyController';
import verifyAPIKey from '../middleware/auth';

const router = express.Router();

router.post('/proxy/:appId', verifyAPIKey, proxyRequestController);

export default router;
