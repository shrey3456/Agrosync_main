import express from 'express';
import { 
  getCommodities, 
  trainModel, 
  getPredictions, 
  getModelStatus 
} from '../controllers/commodityController.js';

const router = express.Router();

// Commodity routes
router.get('/commodities', getCommodities);
router.post('/train/:commodityCode', trainModel);
router.get('/predict/:commodityCode', getPredictions);
router.get('/model-status/:commodityCode', getModelStatus);

export { router as predictsRoutes };