import express from 'express';
import  generateAPIKeyController  from '../controllers/authController'
const router = express.Router();

router.post('/generate-api-key', generateAPIKeyController);

export default router;
