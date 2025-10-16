import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, FileCheck, FileX, AlertCircle, CheckCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function DocumentUpload() {
  const navigate = useNavigate();
  const [farmerDocs, setFarmerDocs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Fetch existing documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        console.log("DocumentUpload - Token:", !!token);
        console.log("DocumentUpload - User:", !!user);
        
        if (!token || !user) {
          console.log("No token or user found, redirecting to login");
          navigate('/login');
          return;
        }
        
        const userData = JSON.parse(user);
        console.log("DocumentUpload - User data:", userData);
        
        // Fix: Check for both _id and id
        const userId = userData._id || userData.id;
        if (!userId) {
          console.log("No user ID found, redirecting to login");
          navigate('/login');
          return;
        }
        
        setLoading(true);
        setError(null);
        
        // Use the userId variable instead of userData._id
        const response = await fetch(`${API_BASE_URL}/api/documents/farmer/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log("API Response status:", response.status);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.log("Authentication failed, redirecting to login");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch documents');
        }

        const data = await response.json();
        console.log("Document data:", data);
        setFarmerDocs(data);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load your documents. Please try again later.');
        
        // Only redirect to login if it's an auth error
        if (err.message.includes('401') || err.message.includes('403')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [navigate]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'aadhaar') {
        setAadhaarFile(file);
      } else {
        setCertificateFile(file);
      }
    }
  };

  // New function to upload both files at once
  const uploadBothDocuments = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      
      // Fix: Use id or _id
      const userId = user._id || user.id;
      if (!user || !userId) {
        throw new Error('User ID is missing');
      }
      
      const formData = new FormData();
      
      if (aadhaarFile) {
        formData.append('aadhaarDocument', aadhaarFile);
      }
      
      if (certificateFile) {
        formData.append('certificateDocument', certificateFile);
      }
      
      // Use userId instead of user._id
      formData.append('farmerId', userId);
      
      const response = await fetch(`${API_BASE_URL}/api/documents/upload-both`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload documents');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  };

  const uploadDocument = async (file, documentType) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      
      // Fix: Use id or _id
      const userId = user._id || user.id;
      if (!user || !userId) {
        throw new Error('User ID is missing');
      }
      
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      formData.append('farmerId', userId);
      
      const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${documentType} document`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error uploading ${documentType} document:`, error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadSuccess(null);
    setUploadError(null);
    
    try {
      if (!aadhaarFile && !certificateFile) {
        setUploadError('Please select at least one document to upload.');
        setUploading(false);
        return;
      }
      
      let result;
      
      // If both files are selected, use the combined upload endpoint
      if (aadhaarFile && certificateFile) {
        result = await uploadBothDocuments();
        setUploadSuccess('Both documents uploaded successfully!');
      } else {
        // Otherwise use the individual upload endpoints
        const uploads = [];
        
        if (aadhaarFile) {
          uploads.push(uploadDocument(aadhaarFile, 'aadhaar'));
        }
        
        if (certificateFile) {
          uploads.push(uploadDocument(certificateFile, 'certificate'));
        }
        
        await Promise.all(uploads);
        setUploadSuccess('Document uploaded successfully!');
      }
      
      // Clear file inputs
      setAadhaarFile(null);
      setCertificateFile(null);
      
      // Refresh the document list
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      
      // Fix: Use id or _id
      const userId = user._id || user.id;
      
      const response = await fetch(`${API_BASE_URL}/api/documents/farmer/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFarmerDocs(data);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getDocumentStatus = (type) => {
    if (!farmerDocs || !farmerDocs.documents) return 'not_uploaded';
    
    const doc = farmerDocs.documents[type];
    return doc ? doc.status : 'not_uploaded';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'text-green-500';
      case 'rejected': return 'text-red-500';
      case 'pending': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return <FileCheck className="w-6 h-6 text-green-500" />;
      case 'rejected': return <FileX className="w-6 h-6 text-red-500" />;
      case 'pending': return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      default: return <Upload className="w-6 h-6 text-gray-400" />;
    }
  };

  const hasBlockchainCertificate = () => {
    return farmerDocs && farmerDocs.certificateId && farmerDocs.blockchainTxId;
  };

  const viewCertificate = () => {
    if (farmerDocs && farmerDocs.certificateId) {
      navigate(`/farmer/certificate/${farmerDocs.certificateId}`);
    }
  };

  const canUpdateDocument = (type) => {
    const status = getDocumentStatus(type);
    // Allow update if document is not uploaded, pending, or rejected
    return ['not_uploaded', 'pending', 'rejected'].includes(status);
  };

  const areAllDocumentsVerified = () => {
    const aadhaarStatus = getDocumentStatus('aadhaar');
    const certificateStatus = getDocumentStatus('certificate');
    // Check if both documents are verified
    return aadhaarStatus === 'verified' && certificateStatus === 'verified';
  };

  return (
    <div className=" bg-[#1a332e]">
    
      <Navbar />
      <div className='pt-20'></div>
      <div className="min-h-screen" >
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link 
            to="/farmer/"
            className="inline-flex items-center text-teal-400 hover:text-teal-300 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>

          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">Identity Verification</h1>
            <p className="text-gray-400">Upload your identity documents to get verified as a farmer</p>
          </motion.div>

          {/* Document Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-xl bg-[#2d4f47] border border-teal-500/20"
          >
            <h2 className="text-xl font-bold text-white mb-4">Document Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Aadhaar Card Status */}
              <div className="bg-[#1a332e] p-4 rounded-lg border border-teal-500/10">
                <div className="flex items-center">
                  {getStatusIcon(getDocumentStatus('aadhaar'))}
                  <div className="ml-3">
                    <h3 className="text-white font-semibold">Aadhaar Card</h3>
                    <p className={`${getStatusColor(getDocumentStatus('aadhaar'))} capitalize`}>
                      {getDocumentStatus('aadhaar') === 'not_uploaded' ? 'Not Uploaded' : getDocumentStatus('aadhaar')}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Certificate Status */}
              <div className="bg-[#1a332e] p-4 rounded-lg border border-teal-500/10">
                <div className="flex items-center">
                  {getStatusIcon(getDocumentStatus('certificate'))}
                  <div className="ml-3">
                    <h3 className="text-white font-semibold">Farmer Certificate</h3>
                    <p className={`${getStatusColor(getDocumentStatus('certificate'))} capitalize`}>
                      {getDocumentStatus('certificate') === 'not_uploaded' ? 'Not Uploaded' : getDocumentStatus('certificate')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {farmerDocs && farmerDocs.verificationStatus && (
              <div className="mt-4 pt-4 border-t border-teal-500/10">
                <p className="text-gray-300">
                  <span className="font-medium">Overall Status:</span> 
                  <span className={`ml-2 capitalize ${
                    farmerDocs.verificationStatus === 'certified' ? 'text-green-400' : 
                    farmerDocs.verificationStatus === 'complete' ? 'text-blue-400' : 
                    farmerDocs.verificationStatus === 'rejected' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {farmerDocs.verificationStatus}
                  </span>
                </p>
              </div>
            )}
          </motion.div>

          {/* Upload Form - Only show if at least one document is not verified */}
          {(!areAllDocumentsVerified() && !hasBlockchainCertificate()) ? (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              <div className="bg-[#2d4f47] rounded-xl p-6 border border-teal-500/20">
                <h2 className="text-xl font-bold text-white mb-6">Upload Documents</h2>
                <p className="text-gray-300 mb-6">For verification, you need to upload <strong>both</strong> your Aadhaar card and government-issued farmer certificate.</p>
                
                {/* Upload Messages */}
                {uploadSuccess && (
                  <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300">
                    {uploadSuccess}
                  </div>
                )}
                
                {uploadError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300">
                    {uploadError}
                  </div>
                )}
                
                <div className="space-y-6">
                  {/* Aadhaar Upload - Only show if can update */}
                  {canUpdateDocument('aadhaar') ? (
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Aadhaar Card <span className="text-red-400">*</span>
                        {getDocumentStatus('aadhaar') === 'rejected' && (
                          <span className="ml-2 text-red-400 text-sm">(Rejected - Please reupload)</span>
                        )}
                      </label>
                      <div className="border-2 border-dashed border-teal-500/20 rounded-xl p-6">
                        <div className="text-center">
                          {aadhaarFile ? (
                            <div className="mb-2 text-teal-300">{aadhaarFile.name}</div>
                          ) : (
                            <Upload className="w-10 h-10 text-teal-400 mx-auto mb-2" />
                          )}
                          <p className="text-gray-300 mb-2">Upload your Aadhaar card</p>
                          <p className="text-gray-400 text-sm mb-4">PDF or image file (max 5MB)</p>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleFileChange(e, 'aadhaar')}
                            className="hidden"
                            id="aadhaar-upload"
                          />
                          <label
                            htmlFor="aadhaar-upload"
                            className=" mb-3 inline-block bg-teal-500/20 text-teal-300 px-4 py-2 rounded-lg cursor-pointer hover:bg-teal-500/30 transition-colors"
                          >
                            {aadhaarFile ? 'Change File' : 'Select File'}
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-white font-medium mb-2">Aadhaar Card</label>
                      <div className="bg-[#1a332e] p-4 rounded-lg border border-teal-500/10">
                        <div className="flex items-center">
                          {getStatusIcon(getDocumentStatus('aadhaar'))}
                          <div className="ml-3">
                            <p className="text-white">Your Aadhaar card has been {getDocumentStatus('aadhaar')}</p>
                            <p className="text-gray-400 text-sm">Document is locked and cannot be changed</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Certificate Upload - Only show if can update */}
                  {canUpdateDocument('certificate') ? (
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Government Farmer Certificate <span className="text-red-400">*</span>
                        {getDocumentStatus('certificate') === 'rejected' && (
                          <span className="ml-2 text-red-400 text-sm">(Rejected - Please reupload)</span>
                        )}
                      </label>
                      <div className="border-2 border-dashed border-teal-500/20 rounded-xl p-6">
                        <div className="text-center">
                          {certificateFile ? (
                            <div className="mb-2 text-teal-300">{certificateFile.name}</div>
                          ) : (
                            <Upload className="w-10 h-10 text-teal-400 mx-auto mb-2" />
                          )}
                          <p className="text-gray-300 mb-2">Upload your government-issued farmer certificate</p>
                          <p className="text-gray-400 text-sm mb-4">PDF or image file (max 5MB)</p>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleFileChange(e, 'certificate')}
                            className="hidden"
                            id="certificate-upload"
                          />
                          <label
                            htmlFor="certificate-upload"
                            className="inline-block bg-teal-500/20 text-teal-300 px-4 py-2 rounded-lg cursor-pointer hover:bg-teal-500/30 transition-colors"
                          >
                            {certificateFile ? 'Change File' : 'Select File'}
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-white font-medium mb-2">Government Farmer Certificate</label>
                      <div className="bg-[#1a332e] p-4 rounded-lg border border-teal-500/10">
                        <div className="flex items-center">
                          {getStatusIcon(getDocumentStatus('certificate'))}
                          <div className="ml-3">
                            <p className="text-white">Your Farmer Certificate has been {getDocumentStatus('certificate')}</p>
                            <p className="text-gray-400 text-sm">Document is locked and cannot be changed</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button - Only show if there are files to upload */}
              {(canUpdateDocument('aadhaar') || canUpdateDocument('certificate')) && (
                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={uploading || (!aadhaarFile && !certificateFile)}
                    className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                      uploading || (!aadhaarFile && !certificateFile) 
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                        : 'bg-teal-500 text-white hover:bg-teal-600'
                    }`}
                  >
                    {uploading ? 'Uploading...' : aadhaarFile && certificateFile ? 'Upload Both Documents' : 'Upload Document'}
                  </motion.button>
                </div>
              )}
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 p-6 rounded-xl bg-green-500/20 border border-green-500/30 text-center"
            >
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Documents Verified</h3>
              <p className="text-gray-300">
                Your documents have been verified. {hasBlockchainCertificate() ? 
                  'View your blockchain certificate for more details.' : 
                  'Your certificate will be issued shortly.'}
              </p>
              {hasBlockchainCertificate() && (
                <button
                  onClick={viewCertificate}
                  className="mt-4 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors"
                >
                  View Certificate
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentUpload;
