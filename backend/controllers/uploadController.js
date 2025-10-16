import { createUploadStream, createDownloadStream, deleteFile, getGridFSBucket } from '../config/gridfsConfig.js';
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import multer from 'multer';
import { Readable } from 'stream';
import { GridFSBucket } from 'mongodb';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // Reduce to 2MB limit for faster processing
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
}).single('profileImage');

// Middleware to handle file upload
export const uploadProfileImage = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Delete previous GridFS file if exists
      if (user.profileImage) {
        try {
          await deleteFile(user.profileImage, 'profileImage');
        } catch (error) {
          console.log('Previous profile image not found or already deleted');
        }
      }

      // Create filename with user ID
      const filename = `profile_${userId}_${Date.now()}_${req.file.originalname}`;
      
      // Create a readable stream from the buffer
      const readableStream = new Readable();
      readableStream.push(req.file.buffer);
      readableStream.push(null);
      
      // Upload to GridFS as the only storage method
      const uploadStream = createUploadStream(filename, {
        contentType: req.file.mimetype,
        userId: userId.toString(),
        fileType: 'profileImage'
      });
      
      // Return promise to wait for upload to complete
      const uploadPromise = new Promise((resolve, reject) => {
        uploadStream.on('error', reject);
        
        uploadStream.on('finish', async () => {
          try {
            // Update user with file ID only - NO MORE base64 storage
            user.profileImage = uploadStream.id;
            
            // Remove any existing base64 data to free up database space
            if (user.profileImageBase64) {
              user.profileImageBase64 = undefined;
            }
            
            await user.save();
            resolve(uploadStream.id);
          } catch (err) {
            reject(err);
          }
        });
      });
      
      // Pipe the readable stream to the upload stream
      readableStream.pipe(uploadStream);
      
      // Wait for upload to complete
      const fileId = await uploadPromise;
      
      // Return only fileId - no base64 data
      return res.status(200).json({
        success: true,
        message: 'Profile image uploaded successfully',
        fileId: fileId.toString()
      });
      
    } catch (error) {
      console.error('Error in uploadProfileImage:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });
};

export const getProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Profile File ID:", id);

    if (!id) {
      return res.status(404).json({ error: "Profile picture not found" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid file ID" });
    }
    
    const fileIdObject = new mongoose.Types.ObjectId(id);
    const db = mongoose.connection.db;
    
    // Check if the file exists in different possible bucket collections
    const bucketNames = ['profileImages', 'fs']; // Try both with and without 's' and the default 'fs'
    let fileInfo = null;
    let bucketName = null;

    // Log the collections in the database for debugging
    const collections = await db.listCollections().toArray();
    console.log("Available collections:", collections.map(c => c.name).filter(name => name.includes('file') || name.includes('chunk')));

    // Check all possible bucket collections for the file
    for (const name of bucketNames) {
      const collection = `${name}.files`;
      console.log(`Checking for file in ${collection} collection...`);
      
      try {
        const info = await db.collection(collection).findOne({ _id: fileIdObject });
        if (info) {
          console.log(`File found in ${collection}`);
          fileInfo = info;
          bucketName = name;
          break;
        }
      } catch (err) {
        console.log(`Error checking ${collection}:`, err.message);
      }
    }

    if (!fileInfo) {
      console.log("File not found in any bucket collection");
      return res.status(404).json({ error: "Profile image file not found" });
    }

    // Set the appropriate content type
    res.set('Content-Type', fileInfo.contentType || 'image/jpeg');
    
    // Use the bucket where we found the file
    console.log(`Using bucket '${bucketName}' to stream file`);
    const bucket = new GridFSBucket(db, { bucketName: bucketName });
    
    // Stream the file
    const fileStream = bucket.openDownloadStream(fileIdObject);

    fileStream.on("error", (error) => {
      console.error("Error streaming file:", error);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Failed to retrieve profile picture" });
      }
    });

    fileStream.on("end", () => {
      console.log("Profile picture stream completed successfully");
    });

    // Pipe the file to the response
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error in getProfileImage:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

// Delete profile image - optimized
export const deleteProfileImage = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (!user.profileImage) {
      return res.status(400).json({ success: false, message: 'No profile image to delete' });
    }
    
    // Delete file from GridFS
    try {
      await deleteFile(user.profileImage, 'profileImage');
    } catch (error) {
      console.log('Error deleting from GridFS:', error);
    }
    
    // Remove references from user
    user.profileImage = undefined;
    
    // Also remove base64 data if it exists
    if (user.profileImageBase64) {
      user.profileImageBase64 = undefined;
    }
    
    await user.save();
    
    return res.status(200).json({ success: true, message: 'Profile image deleted successfully' });
  } catch (error) {
    console.error('Error in deleteProfileImage:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Remove getProfileImageBase64 endpoint - we don't use base64 anymore