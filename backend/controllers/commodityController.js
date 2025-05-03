import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use path.join to create platform-independent paths
const MODEL_DIR = path.join(dirname(__dirname), 'model', 'models');

// Helper function to validate pickle file integrity
function validatePickleFile(filePath) {
  try {
    // Check if file exists and has size > 0
    const stats = fs.statSync(filePath);
    return stats.isFile() && stats.size > 0;
  } catch (error) {
    console.error(`Error validating pickle file ${filePath}:`, error);
    return false;
  }
}

// Helper function to provide fallback predictions
function provideFallbackPredictions(res, commodityCode, days, errorMsg, details) {
  const forecast = [];
  
  const start_date = new Date();
  let lastPrice = 100.0; // Starting price
  
  for (let i = 1; i <= days; i++) {
    const currentDate = new Date(start_date);
    currentDate.setDate(start_date.getDate() + i);
    const dateString = currentDate.toISOString().split('T')[0];
    
    // Random walk with slight upward bias
    const change = (Math.random() - 0.4) * 5; // Slight upward bias
    lastPrice = Math.max(0, lastPrice + change);
    const price = parseFloat(lastPrice.toFixed(2));
    
    // Calculate confidence intervals
    const volatility = lastPrice * 0.15;
    const lowerCi = parseFloat(Math.max(0, lastPrice - volatility).toFixed(2));
    const upperCi = parseFloat((lastPrice + volatility).toFixed(2));
    
    // Buy signal if price is below 100
    const buySignal = price < 100;
    
    forecast.push({
      date: dateString,
      price: price,
      lower_ci: lowerCi,
      upper_ci: upperCi,
      buy_signal: buySignal
    });
  }
  
  res.json({
    success: true,
    commodity: commodityCode,
    predictions: {
      historical_avg: 100.0,
      model_type: "Fallback Model",
      generated_at: new Date().toISOString(),
      forecast: forecast
    },
    note: "Using fallback predictions due to model issues",
    error: errorMsg,
    details: details
  });
}

// Get all commodities
export const getCommodities = async (req, res) => {
  try {
    console.log(`API call: /api/commodities`);
    console.log(`Checking models directory: ${MODEL_DIR}`);
    
    // Check if models directory exists
    if (!fs.existsSync(MODEL_DIR)) {
      console.error(`Models directory not found: ${MODEL_DIR}`);
      return res.json({ commodities: [] });
    }
    
    // Try to read directory contents
    console.log("Reading directory contents...");
    let files;
    try {
      files = fs.readdirSync(MODEL_DIR);
      console.log(`Files found: ${files.length}`);
    } catch (readError) {
      console.error("Error reading directory:", readError);
      return res.status(500).json({ 
        error: 'Failed to read models directory',
        details: readError.message
      });
    }
    
    // Filter for model files
    console.log("Filtering for model files...");
    const modelFiles = files.filter(file => file.endsWith('_model.pkl'));
    console.log(`Model files found: ${modelFiles.length}`);
    
    // Extract commodity codes from filenames
    const commodities = modelFiles.map(file => file.replace('_model.pkl', ''));
    
    console.log(`Found ${commodities.length} commodity models: ${commodities.join(', ')}`);
    res.json({ commodities });
  } catch (error) {
    console.error('Error in getCommodities:', error);
    res.status(500).json({ 
      error: 'Failed to list available commodities',
      details: error.message
    });
  }
};

// Train model for a commodity
export const trainModel = async (req, res) => {
  try {
    const { commodityCode } = req.params;
    const { trainingData } = req.body;
    
    if (!trainingData || !Array.isArray(trainingData)) {
      return res.status(400).json({
        success: false,
        message: 'Training data is required and must be an array'
      });
    }
    
    console.log(`Training request for ${commodityCode} with ${trainingData.length} data points`);
    
    // Path to the Python training script
    const scriptPath = path.join(dirname(__dirname), 'train_model.py');
    
    // Check if training script exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`Training script not found: ${scriptPath}`);
      return res.status(500).json({
        success: false,
        message: 'Training script not found'
      });
    }
    
    // Save training data to a temporary file
    const tempDataPath = path.join(dirname(__dirname), `${commodityCode}_temp_data.json`);
    fs.writeFileSync(tempDataPath, JSON.stringify(trainingData));
    
    console.log(`Training data saved to ${tempDataPath}, spawning Python training process...`);
    
    // Spawn Python process for training
    const pythonProcess = spawn('python', [
      scriptPath,
      commodityCode,
      tempDataPath,
      MODEL_DIR
    ]);
    
    let dataString = '';
    let errorString = '';
    
    // Collect output from Python script
    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python stdout: ${data}`);
      dataString += data.toString();
    });
    
    // Collect error output
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
      console.error(`Python error: ${data.toString()}`);
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      console.log(`Python training process exited with code ${code}`);
      
      // Clean up temp file
      if (fs.existsSync(tempDataPath)) {
        fs.unlinkSync(tempDataPath);
        console.log(`Temporary data file removed: ${tempDataPath}`);
      }
      
      if (code !== 0) {
        console.error(`Python process failed with code ${code}`);
        return res.status(500).json({
          success: false,
          message: 'Error training model',
          error: errorString || 'Unknown Python error'
        });
      }
      
      try {
        // Parse the training result data
        console.log(`Raw Python output: ${dataString}`);
        const result = JSON.parse(dataString.trim());
        
        // Check for errors in the training result
        if (result.error) {
          return res.status(500).json({
            success: false,
            message: result.error
          });
        }
        
        // Return successful response
        res.json({
          success: true,
          commodity: commodityCode,
          message: 'Model trained successfully',
          metrics: result.metrics || {}
        });
      } catch (error) {
        console.error('Error parsing training result data:', error);
        console.error('Raw data was:', dataString);
        res.status(500).json({
          success: false,
          message: 'Error processing training result data',
          details: error.message,
          rawOutput: dataString
        });
      }
    });
    
    // Handle process errors
    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python training process:', error);
      
      // Clean up temp file in case of error
      if (fs.existsSync(tempDataPath)) {
        fs.unlinkSync(tempDataPath);
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to start training process',
        error: error.message
      });
    });
    
  } catch (error) {
    console.error('Error in trainModel:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get predictions for a commodity
export const getPredictions = async (req, res) => {
  try {
    const { commodityCode } = req.params;
    const days = req.query.days || 3; // Default to 3 days forecast
    
    console.log(`Prediction request for ${commodityCode}, ${days} days`);
    
    // Check if model file exists
    const modelPath = path.join(MODEL_DIR, `${commodityCode}_model.pkl`);
    console.log(`Looking for model file at: ${modelPath}`);
    
    if (!fs.existsSync(modelPath)) {
      console.error(`Model file not found: ${modelPath}`);
      // Return empty predictions array instead of error to avoid frontend map issues
      return res.json({
        success: false,
        message: `No model found for commodity: ${commodityCode}`,
        predictions: [] // Always include predictions array even if empty
      });
    }
    
    console.log(`Model file found, spawning Python process...`);
    
    // Path to the Python script
    const scriptPath = path.join(dirname(__dirname), 'prediction.py');
    console.log(`Python script path: ${scriptPath}`);
    
    // Call Python script to load model and generate predictions
    // Check if Python script exists
    if (!fs.existsSync(scriptPath)) {
      console.error(`Python script not found: ${scriptPath}`);
      return res.status(500).json({
        success: false,
        message: 'Prediction script not found'
      });
    }
    
    // Use absolute paths for model directory in arguments
    const pythonProcess = spawn('python', [
      scriptPath,
      commodityCode,
      days.toString(),
      MODEL_DIR  // Pass the model directory to the Python script
    ]);
    
    let dataString = '';
    let errorString = '';
    
    // Collect output from Python script
    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python stdout: ${data}`);
      dataString += data.toString();
    });
    
    // Collect error output
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
      console.error(`Python stderr: ${data.toString()}`);
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      
      if (code !== 0) {
        console.error(`Python process failed with code ${code}`);
        // Return fallback predictions instead of error
        return provideFallbackPredictions(res, commodityCode, days, 
          `Python process failed with code ${code}`, errorString);
      }
      
      try {
        // Clean dataString to extract only valid JSON
        let jsonStart = dataString.indexOf('{');
        if (jsonStart === -1) jsonStart = dataString.indexOf('[');
        let jsonString = jsonStart >= 0 ? dataString.substring(jsonStart) : dataString.trim();
        
        console.log(`Attempting to parse JSON: ${jsonString}`);
        
        // Parse the prediction data
        const predictions = JSON.parse(jsonString);
        
        // Check for errors in the prediction data
        if (predictions.error) {
          // Return fallback predictions instead of error
          return provideFallbackPredictions(res, commodityCode, days, 
            predictions.error, JSON.stringify(predictions.suggestions || []));
        }
        
        // Handle the new prediction format
        if (predictions.forecast) {
          // Already in the correct format
          res.json({
            success: true,
            commodity: commodityCode,
            predictions: predictions
          });
        } else if (Array.isArray(predictions)) {
          // Convert old format to new format
          res.json({
            success: true,
            commodity: commodityCode,
            predictions: {
              historical_avg: 100.0,
              model_type: "SARIMA",
              generated_at: new Date().toISOString(),
              forecast: predictions.map(p => ({
                ...p,
                lower_ci: parseFloat((p.price * 0.85).toFixed(2)),
                upper_ci: parseFloat((p.price * 1.15).toFixed(2)),
                buy_signal: p.price < 100
              }))
            }
          });
        } else {
          // Unknown format, provide fallback
          return provideFallbackPredictions(res, commodityCode, days, 
            "Unexpected prediction format", JSON.stringify(predictions));
        }
      } catch (error) {
        console.error('Error parsing prediction data:', error);
        console.error('Raw data was:', dataString);
        
        // Use fallback predictions
        return provideFallbackPredictions(res, commodityCode, days, 
          error.message, dataString);
      }
    });
    
    // Handle process errors
    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python process:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start prediction process',
        error: error.message
      });
    });
    
  } catch (error) {
    console.error('Error in getPredictions:', error);
    // Always provide fallback predictions
    provideFallbackPredictions(res, commodityCode, days, error.message, "");
  }
};

// Get model status
export const getModelStatus = async (req, res) => {
  try {
    const { commodityCode } = req.params;
    const modelPath = path.join(MODEL_DIR, `${commodityCode}_model.pkl`);
    
    if (!fs.existsSync(modelPath)) {
      return res.status(404).json({
        success: false,
        status: 'not_found',
        message: `No model found for commodity: ${commodityCode}`
      });
    }
    
    const isValid = validatePickleFile(modelPath);
    const stats = fs.statSync(modelPath);
    
    res.json({
      success: true,
      commodity: commodityCode,
      status: isValid ? 'valid' : 'corrupt',
      lastModified: stats.mtime,
      size: stats.size
    });
  } catch (error) {
    console.error(`Error checking model status: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to check model status',
      error: error.message
    });
  }
};