import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Eye,
  User, 
  AlertTriangle, 
  Shield
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function DocumentVerification() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [farmers, setFarmers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [verificationRemarks, setVerificationRemarks] = useState('');
  const [processingVerification, setProcessingVerification] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const checkAdminAuth = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user || user.role !== 'admin') {
      navigate('/login');
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (checkAdminAuth()) {
      fetchPendingDocuments();
    }
  }, []);

  const fetchPendingDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/documents/pending/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      
      // Group documents by farmer
      const farmersMap = {};
      data.forEach(doc => {
        if (!farmersMap[doc.farmerId]) {
          farmersMap[doc.farmerId] = {
            farmerId: doc.farmerId,
            mongoId: doc._id,
            documents: {},
            farmerName: doc.farmerName || 'Unknown Farmer'
          };
        }
        
        farmersMap[doc.farmerId].documents[doc.documentType] = doc;
      });
      
      setFarmers(farmersMap);
      setDocuments(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load pending documents');
      
      if (err.message.includes('401') || err.message.includes('403')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (docId) => {
    // kept for backward compatibility: try to open by file id if passed
    try {
      const token = localStorage.getItem('token');
      // If docId looks like a document type string (aid), we won't handle here
      window.open(`${API_BASE_URL}/api/documents/${docId}?token=${token}`, '_blank');
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download document');
    }
  };

  // New: view document inline by calling backend file endpoint which streams the file
  const handleViewDocument = async (documentType, farmerId) => {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`${API_BASE_URL}/api/documents/file/${documentType}/${farmerId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error('Failed to fetch file:', resp.status, errText);
        alert('Failed to load document');
        return;
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      // Open in a new tab
      const newWin = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWin) {
        // Fallback: navigate current window
        window.location.href = url;
      }

      // Optionally revoke object URL after some delay
      setTimeout(() => window.URL.revokeObjectURL(url), 60 * 1000);
    } catch (err) {
      console.error('Error viewing document:', err);
      alert('Failed to view document');
    }
  };

  const handleSelectFarmer = (farmerId) => {
    setSelectedFarmer(farmers[farmerId]);
    setVerificationStatus('');
    setVerificationRemarks('');
    setSuccessMessage(null);
  };

  const handleVerifyDocuments = async () => {
    if (!selectedFarmer || !verificationStatus) {
      alert('Please select a status');
      return;
    }

    try {
      setProcessingVerification(true);
      
      // Check if both document types exist for the farmer
      const hasAadhaar = !!selectedFarmer.documents.aadhaar;
      const hasCertificate = !!selectedFarmer.documents.certificate;
      
      if (!hasAadhaar || !hasCertificate) {
        alert('Farmer must upload both Aadhaar and certificate documents for verification');
        setProcessingVerification(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/documents/verify-all/${selectedFarmer.farmerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: verificationStatus,
          remarks: verificationRemarks,
          farmerName: selectedFarmer.farmerName,
          farmerMongoId: selectedFarmer.farmerId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to verify documents');
      }

      const data = await response.json();
      
      if (data) {
        setSuccessMessage(
          verificationStatus === 'verified'
            ? data.certificateIssued
              ? 'Documents verified and certificate issued successfully!'
              : 'Documents verified successfully!'
            : 'Documents rejected successfully'
        );
        
        // Remove verified/rejected farmer from the list
        const updatedFarmers = {...farmers};
        delete updatedFarmers[selectedFarmer.farmerId];
        setFarmers(updatedFarmers);
        
        // Clear form
        setSelectedFarmer(null);
        setVerificationStatus('');
        setVerificationRemarks('');
      }
    } catch (err) {
      console.error('Error verifying documents:', err);
      setError('Failed to verify documents. Please try again.');
      
      if (err.message.includes('401') || err.message.includes('403')) {
        navigate('/login');
      }
    } finally {
      setProcessingVerification(false);
    }
  };

  const getDocumentTypeIcon = (type) => {
    switch (type) {
      case 'aadhaar': return <User className="w-5 h-5 text-blue-400" />;
      case 'certificate': return <Shield className="w-5 h-5 text-green-400" />;
      default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getDocumentTypeName = (type) => {
    switch (type) {
      case 'aadhaar': return 'Aadhaar Card';
      case 'certificate': return 'Farmer Certificate';
      default: return type;
    }
  };

  const user = JSON.parse(localStorage.getItem('user'));

  if (!user || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#1a332e] flex items-center justify-center">
        <div className="bg-[#2d4f47] p-8 rounded-xl border border-red-500/20 max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white text-center mb-2">Access Denied</h1>
          <p className="text-gray-300 text-center mb-6">You don't have permission to access this page.</p>
          <Link
            to="/"
            className="block w-full bg-teal-500 text-white text-center py-2 rounded-lg hover:bg-teal-600 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a332e]">
      <Navbar />
      <div className="pt-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link 
            to="/admin"
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
            <h1 className="text-4xl font-bold text-white mb-2">Document Verification</h1>
            <p className="text-gray-400">Verify farmer identity documents and issue blockchain certificates</p>
          </motion.div>

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300"
            >
              {successMessage}
            </motion.div>
          )}

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Farmers List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-2/5 bg-[#2d4f47] rounded-xl p-6 border border-teal-500/20"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Clock className="mr-2 w-6 h-6" />
                Pending Farmer Verifications
              </h2>

              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading documents...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-400">{error}</div>
              ) : Object.keys(farmers).length === 0 ? (
                <div className="text-center py-8 text-gray-400">No pending documents for verification</div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {Object.keys(farmers).map(farmerId => {
                    const farmer = farmers[farmerId];
                    // Only show farmers with both document types
                    const hasAadhaar = !!farmer.documents.aadhaar;
                    const hasCertificate = !!farmer.documents.certificate;
                    
                    return (
                      <div 
                        key={farmerId}
                        onClick={() => handleSelectFarmer(farmerId)}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedFarmer && selectedFarmer.farmerId === farmerId
                            ? 'bg-teal-500/30 border border-teal-500/50'
                            : 'bg-[#1a332e] hover:bg-[#243e39] border border-teal-500/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{farmer.farmerName}</p>
                            <p className="text-gray-400 text-sm">Farmer ID: {farmer.farmerId}</p>
                            <div className="flex space-x-2 mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${hasAadhaar ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                {hasAadhaar ? 'Aadhaar' : 'No Aadhaar'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${hasCertificate ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                {hasCertificate ? 'Certificate' : 'No Certificate'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Verification Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-3/5 bg-[#2d4f47] rounded-xl p-6 border border-teal-500/20"
            >
              <h2 className="text-xl font-bold text-white mb-6">Verify Documents</h2>

              {!selectedFarmer ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                  <FileText className="w-16 h-16 mb-4 opacity-30" />
                  <p>Select a farmer to verify</p>
                </div>
              ) : (
                <div>
                  {/* Farmer Info */}
                  <div className="bg-[#1a332e] p-6 rounded-lg border border-teal-500/10 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Farmer Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Farmer Name</p>
                        <p className="text-white">{selectedFarmer.farmerName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Farmer ID</p>
                        <p className="text-white">{selectedFarmer.farmerId}</p>
                      </div>
                    </div>
                    
                    {/* Document List */}
                    <h4 className="text-white font-medium mb-2">Documents</h4>
                    <div className="space-y-3">
                      {selectedFarmer.documents.aadhaar && (
                        <div className="bg-[#2d4f47] p-3 rounded flex justify-between items-center">
                          <div className="flex items-center">
                            <User className="w-5 h-5 text-blue-400 mr-2" />
                            <span className="text-white">Aadhaar Card</span>
                          </div>
                          <button 
                            onClick={() => handleViewDocument('aadhaar', selectedFarmer.farmerId)}
                            aria-label={`View Aadhaar for ${selectedFarmer.farmerName}`}
                            title={`View Aadhaar for ${selectedFarmer.farmerName}`}
                            className="p-2 bg-teal-500/20 rounded-lg hover:bg-teal-500/30 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-teal-300" />
                          </button>
                        </div>
                      )}
                      
                      {selectedFarmer.documents.certificate && (
                        <div className="bg-[#2d4f47] p-3 rounded flex justify-between items-center">
                          <div className="flex items-center">
                            <Shield className="w-5 h-5 text-green-400 mr-2" />
                            <span className="text-white">Farmer Certificate</span>
                          </div>
                          <button 
                            onClick={() => handleViewDocument('certificate', selectedFarmer.farmerId)}
                            aria-label={`View Certificate for ${selectedFarmer.farmerName}`}
                            title={`View Certificate for ${selectedFarmer.farmerName}`}
                            className="p-2 bg-teal-500/20 rounded-lg hover:bg-teal-500/30 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-teal-300" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification Form */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white font-medium mb-2">Verification Status</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setVerificationStatus('verified')}
                          className={`flex items-center px-4 py-3 rounded-lg border transition-colors ${
                            verificationStatus === 'verified'
                              ? 'bg-green-500/20 border-green-500/50 text-green-300'
                              : 'bg-[#1a332e] border-teal-500/10 text-white hover:bg-[#243e39]'
                          }`}
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Verify Documents
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setVerificationStatus('rejected')}
                          className={`flex items-center px-4 py-3 rounded-lg border transition-colors ${
                            verificationStatus === 'rejected'
                              ? 'bg-red-500/20 border-red-500/50 text-red-300'
                              : 'bg-[#1a332e] border-teal-500/10 text-white hover:bg-[#243e39]'
                          }`}
                        >
                          <XCircle className="w-5 h-5 mr-2" />
                          Reject Documents
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Remarks (Optional)</label>
                      <textarea
                        value={verificationRemarks}
                        onChange={(e) => setVerificationRemarks(e.target.value)}
                        placeholder="Enter any notes or comments about this verification..."
                        className="w-full bg-[#1a332e] text-white p-3 rounded-lg border border-teal-500/20 focus:outline-none focus:border-teal-500 min-h-[100px]"
                      ></textarea>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={handleVerifyDocuments}
                        disabled={!verificationStatus || processingVerification}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                          !verificationStatus || processingVerification
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            : verificationStatus === 'verified'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {processingVerification
                          ? 'Processing...'
                          : verificationStatus === 'verified'
                            ? 'Confirm Verification'
                            : verificationStatus === 'rejected'
                              ? 'Confirm Rejection'
                              : 'Submit'
                        }
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentVerification;
