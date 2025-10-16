import mongoose from 'mongoose';

// Define the schema for individual documents
const DocumentSchema = new mongoose.Schema({
  documentType: {
    type: String,
    required: true,
    enum: ['aadhaar', 'certificate']
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  fileHash: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    ref: 'User'
  },
  verificationDate: {
    type: Date,
    default: null
  },
  remarks: {
    type: String,
    default: null
  }
});

// Define the main farmer document schema
const FarmerDocumentSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  // Store both document types in a single record for a farmer
  documents: {
    aadhaar: DocumentSchema,
    certificate: DocumentSchema
  },
  // Blockchain certificate details (once both docs are verified)
  certificateId: {
    type: String,
    unique: true,
    sparse: true // allows null values but enforces uniqueness when present
  },
  certificateIssueDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  blockchainTxId: {
    type: String
  },
  aadhaarHash: {
    type: String
  },
  certificateHash: {
    type: String
  },
  farmerType: {
    type: String,
    default: 'Organic'
  },
  // Overall verification status
  verificationStatus: {
    type: String,
    enum: ['pending', 'partial', 'complete', 'certified', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// Add methods to check if all required documents are uploaded and verified
FarmerDocumentSchema.methods.areAllDocumentsUploaded = function() {
  return this.documents.aadhaar && this.documents.certificate;
};

FarmerDocumentSchema.methods.areAllDocumentsVerified = function() {
  return this.documents.aadhaar && 
         this.documents.certificate &&
         this.documents.aadhaar.status === 'verified' &&
         this.documents.certificate.status === 'verified';
};

FarmerDocumentSchema.methods.updateVerificationStatus = function() {
  if (!this.documents.aadhaar && !this.documents.certificate) {
    this.verificationStatus = 'pending';
  } else if (!this.documents.aadhaar || !this.documents.certificate) {
    this.verificationStatus = 'partial';
  } else if (this.documents.aadhaar.status === 'rejected' || this.documents.certificate.status === 'rejected') {
    this.verificationStatus = 'rejected';
  } else if (this.documents.aadhaar.status === 'verified' && this.documents.certificate.status === 'verified') {
    this.verificationStatus = this.certificateId ? 'certified' : 'complete';
  } else {
    this.verificationStatus = 'pending';
  }
  
  return this.verificationStatus;
};

const FarmerDocument = mongoose.model('FarmerDocument', FarmerDocumentSchema);

export default FarmerDocument;
