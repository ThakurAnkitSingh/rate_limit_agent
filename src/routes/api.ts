import express from 'express';
import { registerAppController } from '../controllers/apiController';

const router = express.Router();

// Register API route
router.post('/register', registerAppController);

export default router;