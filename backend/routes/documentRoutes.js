import express from 'express';
import multer from 'multer';
import { createUploadStream, createDownloadStream, generateFileHash } from '../config/gridfsConfig.js';
import FarmerDocument from '../models/FarmerDocument.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import mongoose from 'mongoose';
import { verifyAndIssueCertificate, getContract } from '../utils/blockchainService.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload a document
router.post('/upload', authenticate, upload.single('document'), async (req, res) => {
  try {
    console.log('Starting document upload process');
    const { documentType, farmerId } = req.body;
    console.log('Document details:', { documentType, farmerId });
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!['aadhaar', 'certificate'].includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    // Validate farmerId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(farmerId)) {
      return res.status(400).json({ message: 'Invalid farmer ID format' });
    }

    // Create file name with unique identifier
    const filename = `${documentType}_${farmerId}_${Date.now()}_${req.file.originalname}`;
    console.log(`Creating file: ${filename}`);
    
    try {
      // Generate hash of file for later verification
      const fileHash = generateFileHash(req.file.buffer);
      console.log('File hash generated successfully');

      // Use direct MongoDB API to store the file
      const db = mongoose.connection.db;
      const bucket = new mongoose.mongo.GridFSBucket(db, {
        bucketName: 'farmerDocuments'
      });
      
      console.log('Created GridFS bucket directly');
      
      // Generate a file ID beforehand so we can use it later
      const fileId = new mongoose.Types.ObjectId();
      console.log('Generated file ID:', fileId);
      
      // Create upload stream with the specific ID
      const uploadStream = bucket.openUploadStreamWithId(fileId, filename, {
        metadata: {
          contentType: req.file.mimetype,
          farmerId,
          documentType,
          uploadDate: new Date()
        }
      });
      
      console.log('Upload stream created with ID');
      
      // Write to the stream
      uploadStream.write(req.file.buffer);
      
      // Create a promise to handle the upload completion
      const uploadComplete = new Promise((resolve, reject) => {
        uploadStream.on('error', (error) => {
          console.error('Upload stream error:', error);
          reject(error);
        });
        
        uploadStream.on('finish', () => {
          console.log('Upload finished, using predefined file ID:', fileId);
          resolve();
        });
      });
      
      // End the stream - this will trigger the 'finish' event
      uploadStream.end();
      
      // Wait for upload to complete
      await uploadComplete;
      
      // Find or create farmer document record
      let farmerDoc = await FarmerDocument.findOne({ farmerId });
      
      if (!farmerDoc) {
        farmerDoc = new FarmerDocument({ farmerId });
      }
      
      // Create document data object
      const documentData = {
        documentType,
        fileId,
        filename,
        fileHash,
        contentType: req.file.mimetype,
        uploadDate: new Date(),
        status: 'pending'
      };
      
      // Set the specific document type
      if (!farmerDoc.documents) {
        farmerDoc.documents = {};
      }
      
      farmerDoc.documents[documentType] = documentData;
      
      // Update verification status
      farmerDoc.updateVerificationStatus();
      
      await farmerDoc.save();
      console.log('Document metadata saved to MongoDB');
      
      res.status(201).json({ 
        message: 'Document uploaded successfully',
        document: {
          id: farmerDoc._id,
          farmerId: farmerDoc.farmerId,
          documentType,
          filename,
          status: documentData.status,
          uploadDate: documentData.uploadDate,
          verificationStatus: farmerDoc.verificationStatus
        }
      });
    } catch (streamError) {
      console.error('Stream processing error:', streamError);
      return res.status(500).json({ 
        message: 'Error processing file upload stream', 
        error: streamError.message 
      });
    }
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// New endpoint to upload both documents at once
router.post('/upload-both', upload.fields([
  { name: 'aadhaarDocument', maxCount: 1 },
  { name: 'certificateDocument', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Starting multi-document upload process');
    const { farmerId } = req.body;
    console.log('Farmer ID:', farmerId);
    
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const { aadhaarDocument, certificateDocument } = req.files;
    
    if (!aadhaarDocument && !certificateDocument) {
      return res.status(400).json({ message: 'At least one document is required' });
    }
    
    try {
      // Use direct MongoDB API to store files
      const db = mongoose.connection.db;
      const bucket = new mongoose.mongo.GridFSBucket(db, {
        bucketName: 'farmerDocuments'
      });
      
      console.log('Created GridFS bucket for multiple files');
      
      // Find or create farmer document record
      let farmerDoc = await FarmerDocument.findOne({ farmerId });
      
      if (!farmerDoc) {
        farmerDoc = new FarmerDocument({ farmerId });
      }
      
      if (!farmerDoc.documents) {
        farmerDoc.documents = {};
      }
      
      // Process Aadhaar document if provided
      if (aadhaarDocument && aadhaarDocument[0]) {
        const file = aadhaarDocument[0];
        const fileId = new mongoose.Types.ObjectId();
        const filename = `aadhaar_${farmerId}_${Date.now()}_${file.originalname}`;
        const fileHash = generateFileHash(file.buffer);
        
        // Create upload stream for Aadhaar
        const uploadStream = bucket.openUploadStreamWithId(fileId, filename, {
          metadata: {
            contentType: file.mimetype,
            farmerId,
            documentType: 'aadhaar',
            uploadDate: new Date()
          }
        });
        
        await new Promise((resolve, reject) => {
          uploadStream.on('error', reject);
          uploadStream.on('finish', resolve);
          uploadStream.write(file.buffer, (err) => {
            if (err) reject(err);
            uploadStream.end();
          });
        });
        
        // Update farmer document with Aadhaar info
        farmerDoc.documents.aadhaar = {
          documentType: 'aadhaar',
          fileId,
          filename,
          fileHash,
          contentType: file.mimetype,
          uploadDate: new Date(),
          status: 'pending'
        };
        
        console.log('Aadhaar document uploaded successfully');
      }
      
      // Process certificate document if provided
      if (certificateDocument && certificateDocument[0]) {
        const file = certificateDocument[0];
        const fileId = new mongoose.Types.ObjectId();
        const filename = `certificate_${farmerId}_${Date.now()}_${file.originalname}`;
        const fileHash = generateFileHash(file.buffer);
        
        // Create upload stream for certificate
        const uploadStream = bucket.openUploadStreamWithId(fileId, filename, {
          metadata: {
            contentType: file.mimetype,
            farmerId,
            documentType: 'certificate',
            uploadDate: new Date()
          }
        });
        
        await new Promise((resolve, reject) => {
          uploadStream.on('error', reject);
          uploadStream.on('finish', resolve);
          uploadStream.write(file.buffer, (err) => {
            if (err) reject(err);
            uploadStream.end();
          });
        });
        
        // Update farmer document with certificate info
        farmerDoc.documents.certificate = {
          documentType: 'certificate',
          fileId,
          filename,
          fileHash,
          contentType: file.mimetype,
          uploadDate: new Date(),
          status: 'pending'
        };
        
        console.log('Certificate document uploaded successfully');
      }
      
      // Update verification status
      farmerDoc.updateVerificationStatus();
      
      // Save the updated document
      await farmerDoc.save();
      console.log('Farmer document updated with all uploaded files');
      
      res.status(201).json({
        message: 'Documents uploaded successfully',
        farmerDoc: {
          id: farmerDoc._id,
          farmerId: farmerDoc.farmerId,
          verificationStatus: farmerDoc.verificationStatus,
          documents: {
            aadhaar: farmerDoc.documents.aadhaar ? {
              status: farmerDoc.documents.aadhaar.status,
              uploadDate: farmerDoc.documents.aadhaar.uploadDate
            } : null,
            certificate: farmerDoc.documents.certificate ? {
              status: farmerDoc.documents.certificate.status,
              uploadDate: farmerDoc.documents.certificate.uploadDate
            } : null
          }
        }
      });
    } catch (error) {
      console.error('Error processing upload:', error);
      res.status(500).json({ message: 'Error uploading documents', error: error.message });
    }
  } catch (error) {
    console.error('Server error in multi-document upload:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get documents for a farmer
router.get('/farmer/:farmerId', authenticate, async (req, res) => {
  try {
    const { farmerId } = req.params;
    
    // Make sure the requesting user is either the farmer or an admin
    if (req.user.role !== 'admin' && req.user.id.toString() !== farmerId) {
      return res.status(403).json({ message: 'Not authorized to access these documents' });
    }
    
    const farmerDoc = await FarmerDocument.findOne({ farmerId });
    
    if (!farmerDoc) {
      return res.json({
        farmerId,
        documents: {},
        verificationStatus: 'pending',
        certificateId: null
      });
    }
    
    res.json({
      farmerId: farmerDoc.farmerId,
      documents: farmerDoc.documents,
      verificationStatus: farmerDoc.verificationStatus,
      certificateId: farmerDoc.certificateId,
      blockchainTxId: farmerDoc.blockchainTxId,
      certificateIssueDate: farmerDoc.certificateIssueDate
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get document file by ID
router.get('/file/:documentType/:farmerId', authenticate, async (req, res) => {
  try {
    const { documentType, farmerId } = req.params;
    
    const farmerDoc = await FarmerDocument.findOne({ farmerId });
    if (!farmerDoc || !farmerDoc.documents || !farmerDoc.documents[documentType]) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Security check: Make sure user has access to this document
    if (req.user.role !== 'admin' && req.user.id.toString() !== farmerId) {
      return res.status(403).json({ message: 'Not authorized to access this document' });
    }
    
    const fileId = farmerDoc.documents[documentType].fileId;
    const downloadStream = createDownloadStream(fileId);
    
    // Set headers for file download
    res.set('Content-Type', farmerDoc.documents[documentType].contentType || 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename="${farmerDoc.documents[documentType].filename}"`);
    
    // Pipe the file to the response
    downloadStream.pipe(res);
    
    downloadStream.on('error', (error) => {
      res.status(500).json({ message: 'Error downloading file', error: error.message });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin route to verify a document
router.put('/verify/:farmerId/:documentType', authenticate, async (req, res) => {
  try {
    // Only admins can verify documents
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to verify documents' });
    }
    
    const { farmerId, documentType } = req.params;
    const { status, remarks } = req.body;
    console.log("hello")
    
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const farmerDoc = await FarmerDocument.findOne({ farmerId });
    if (!farmerDoc || !farmerDoc.documents || !farmerDoc.documents[documentType]) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Update document status
    farmerDoc.documents[documentType].status = status;
    farmerDoc.documents[documentType].verifiedBy = req.user.id.toString();
    farmerDoc.documents[documentType].verificationDate = new Date();
    farmerDoc.documents[documentType].remarks = remarks;
    
    // Update overall verification status
    farmerDoc.updateVerificationStatus();
    
    await farmerDoc.save();
    
    // Check if both documents are now verified and issue certificate if needed
    if (farmerDoc.areAllDocumentsVerified() && !farmerDoc.certificateId) {
      try {
        // Issue blockchain certificate
        const certificateResult = await verifyAndIssueCertificate(farmerId);
        
        // Update farmer document with certificate info
        farmerDoc.certificateId = certificateResult.certificateId;
        farmerDoc.blockchainTxId = certificateResult.transactionHash;
        farmerDoc.certificateIssueDate = new Date();
        farmerDoc.verificationStatus = 'certified';
        
        await farmerDoc.save();
        
        return res.json({
          message: 'Document verified and certificate issued',
          document: farmerDoc.documents[documentType],
          verificationStatus: farmerDoc.verificationStatus,
          certificateIssued: true,
          certificateDetails: certificateResult
        });
      } catch (certError) {
        console.error('Error issuing certificate:', certError);
        return res.json({
          message: 'Document verified but certificate issuance failed',
          document: farmerDoc.documents[documentType],
          verificationStatus: farmerDoc.verificationStatus,
          certificateIssued: false,
          error: certError.message
        });
      }
    }
    
    res.json({
      message: 'Document verification status updated',
      document: farmerDoc.documents[documentType],
      verificationStatus: farmerDoc.verificationStatus
    });
  } catch (error) {
    console.error('Document verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin route to verify all documents for a farmer and issue blockchain certificate
router.put('/verify-all/:farmerId', authenticate, async (req, res) => {
  try {
    // Only admins can verify documents
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to verify documents' });
    }
    
    const { farmerId } = req.params;
    const { status, remarks, farmerName, farmerMongoId } = req.body;
    
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const farmerDoc = await FarmerDocument.findOne({ farmerId });
    if (!farmerDoc || !farmerDoc.documents) {
      return res.status(404).json({ message: 'Farmer documents not found' });
    }
    
    // Check if both document types exist
    if (!farmerDoc.documents.aadhaar || !farmerDoc.documents.certificate) {
      return res.status(400).json({ message: 'Both Aadhaar and certificate documents must be uploaded' });
    }
    
    // Update status for both documents
    ['aadhaar', 'certificate'].forEach(docType => {
      if (farmerDoc.documents[docType]) {
        farmerDoc.documents[docType].status = status;
        farmerDoc.documents[docType].verifiedBy = req.user.id.toString();
        farmerDoc.documents[docType].verificationDate = new Date();
        farmerDoc.documents[docType].remarks = remarks;
      }
    });
    
    // Update overall verification status
    farmerDoc.updateVerificationStatus();
    
    await farmerDoc.save();
    
    // If rejected, just return the updated status
    if (status === 'rejected') {
      return res.json({
        message: 'Documents rejected',
        verificationStatus: farmerDoc.verificationStatus,
        certificateIssued: false
      });
    }
    
    // If verified and no certificate yet, issue blockchain certificate
    if (status === 'verified' && !farmerDoc.certificateId) {
      try {
        // Create a unique certificate ID
        const certificateId = `CERT-${farmerId}-${Date.now()}`;
        
        // Get document hashes for blockchain
        const aadhaarHash = '0x' + farmerDoc.documents.aadhaar.fileHash;
        const certificateHash = '0x' + farmerDoc.documents.certificate.fileHash;
        
        // Get contract instance
        const contract = getContract();
        
        // Issue certificate on blockchain with proper farmer name and document hashes
        const transaction = await contract.issueCertificate(
          certificateId,
          farmerId,
          farmerName || `Farmer ${farmerId}`,  // Use the provided name or a default
          aadhaarHash,
          certificateHash
        );
        
        console.log(`Certificate issuance transaction submitted: ${transaction.hash}`);
        
        // Wait for transaction to be mined
        const receipt = await transaction.wait();
        
        // Update farmer document with certificate info
        farmerDoc.certificateId = certificateId;
        farmerDoc.blockchainTxId = transaction.hash;
        farmerDoc.certificateIssueDate = new Date();
        farmerDoc.verificationStatus = 'certified';
        farmerDoc.farmerName = farmerName || `Farmer ${farmerId}`;
        
        await farmerDoc.save();
        
        return res.json({
          message: 'Documents verified and certificate issued',
          verificationStatus: farmerDoc.verificationStatus,
          certificateIssued: true,
          certificateDetails: {
            certificateId,
            farmerId,
            farmerName: farmerName || `Farmer ${farmerId}`,
            transactionHash: transaction.hash,
            blockNumber: receipt.blockNumber,
            timestamp: Date.now(),
            aadhaarHash: aadhaarHash.substring(0, 18) + '...',
            certificateHash: certificateHash.substring(0, 18) + '...'
          }
        });
      } catch (certError) {
        console.error('Error issuing certificate:', certError);
        return res.json({
          message: 'Documents verified but certificate issuance failed',
          verificationStatus: farmerDoc.verificationStatus,
          certificateIssued: false,
          error: certError.message
        });
      }
    }
    
    res.json({
      message: 'Documents verification status updated',
      verificationStatus: farmerDoc.verificationStatus,
      certificateIssued: false
    });
  } catch (error) {
    console.error('Document verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all pending documents (admin only)
router.get('/pending/all', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Find all farmers with at least one pending document
    const farmerDocs = await FarmerDocument.find({
      $or: [
        { 'documents.aadhaar.status': 'pending' },
        { 'documents.certificate.status': 'pending' }
      ]
    }).sort({ 'createdAt': -1 });
    
    // Flatten the documents for easier frontend handling
    const pendingDocuments = [];
    
    farmerDocs.forEach(farmerDoc => {
      const { farmerId, farmerName, _id } = farmerDoc;
      
      if (farmerDoc.documents.aadhaar && farmerDoc.documents.aadhaar.status === 'pending') {
        pendingDocuments.push({
          _id: farmerDoc.documents.aadhaar.fileId,
          farmerId,
          farmerName: farmerName || `Farmer ${farmerId}`,
          documentType: 'aadhaar',
          ...farmerDoc.documents.aadhaar,
          farmerMongoId: _id
        });
      }
      
      if (farmerDoc.documents.certificate && farmerDoc.documents.certificate.status === 'pending') {
        pendingDocuments.push({
          _id: farmerDoc.documents.certificate.fileId,
          farmerId,
          farmerName: farmerName || `Farmer ${farmerId}`,
          documentType: 'certificate',
          ...farmerDoc.documents.certificate,
          farmerMongoId: _id
        });
      }
    });
    
    res.json(pendingDocuments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export const documentRoutes = router;
