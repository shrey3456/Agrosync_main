import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Calendar, User, FileText, ExternalLink } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { Link, useParams, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function FarmerCertificate() {
  const { certificateId } = useParams();
  console.log(certificateId)
  const navigate = useNavigate();
  
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user) {
          navigate('/login');
          return;
        }

        setLoading(true);
        setError(null);

        // Call the API to verify the certificate on the blockchain
        const response = await fetch(`${API_BASE_URL}/api/certificates/verify/${certificateId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch certificate');
        }

        const data = await response.json();
        console.log("Certificate data:", data);
        setCertificate(data);
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError('Failed to load certificate information. Please try again later.');
        
        if (err.message.includes('401') || err.message.includes('403')) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId, navigate]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if certificate is expired
  const isExpired = () => {
    if (!certificate || !certificate.expiryDate) return false;
    return new Date(certificate.expiryDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-[#1a332e]">
      <Navbar />
      <div className="pt-24 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link 
            to="/farmer/documents"
            className="inline-flex items-center text-teal-400 hover:text-teal-300 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Documents
          </Link>

          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">Blockchain Certificate</h1>
            <p className="text-gray-400">Your verified farmer identity certificate on the blockchain</p>
          </motion.div>

          {/* Certificate */}
          {loading ? (
            <div className="flex justify-center items-center h-[400px]">
              <div className="animate-pulse text-teal-400">Loading certificate...</div>
            </div>
          ) : error ? (
            <div className="bg-red-500/20 text-red-300 p-6 rounded-xl border border-red-500/30">
              <p className="font-medium">{error}</p>
            </div>
          ) : !certificate ? (
            <div className="bg-yellow-500/20 text-yellow-300 p-6 rounded-xl border border-yellow-500/30">
              <p className="font-medium">Certificate not found</p>
            </div>
          ) : !certificate.isValid ? (
            <div className="bg-red-500/20 text-red-300 p-6 rounded-xl border border-red-500/30">
              <p className="font-medium">This certificate is invalid or has been revoked</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-br ${isExpired() ? 'from-yellow-900/30 to-red-900/30 border-red-500/30' : 'from-teal-900/30 to-green-900/30 border-teal-500/30'} p-8 rounded-xl border`}
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Verified Farmer Certificate</h2>
                  <p className="text-gray-300">Certificate ID: {certificateId}</p>
                </div>
                <div className={`flex items-center ${isExpired() ? 'text-yellow-400' : 'text-green-400'} py-1 px-3 rounded-full ${isExpired() ? 'bg-yellow-500/20' : 'bg-green-500/20'}`}>
                  {isExpired() ? (
                    <span className="font-medium">Expired</span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span className="font-medium">Valid</span>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-[#1a332e] p-6 rounded-lg border border-teal-500/20 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center mb-2">
                      <User className="w-5 h-5 text-teal-400 mr-2" />
                      <p className="text-gray-300 font-medium">Farmer ID</p>
                    </div>
                    <p className="text-white">{certificate.farmerId}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <User className="w-5 h-5 text-teal-400 mr-2" />
                      <p className="text-gray-300 font-medium">Farmer Name</p>
                    </div>
                    <p className="text-white">{certificate.farmerName}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <Calendar className="w-5 h-5 text-teal-400 mr-2" />
                      <p className="text-gray-300 font-medium">Issue Date</p>
                    </div>
                    <p className="text-white">{formatDate(certificate.issuedDate)}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <Calendar className="w-5 h-5 text-teal-400 mr-2" />
                      <p className="text-gray-300 font-medium">Expiry Date</p>
                    </div>
                    <p className={`${isExpired() ? 'text-red-400' : 'text-white'}`}>
                      {formatDate(certificate.expiryDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a332e] p-6 rounded-lg border border-teal-500/20 mb-8">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-teal-400" />
                  Blockchain Verification
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-300 mb-1">Aadhaar Hash</p>
                    <p className="text-white font-mono text-sm bg-[#2d4f47] p-2 rounded overflow-x-auto">
                      {certificate.aadhaarHash || 'Not available'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-300 mb-1">Certificate Hash</p>
                    <p className="text-white font-mono text-sm bg-[#2d4f47] p-2 rounded overflow-x-auto">
                      {certificate.certificateHash || 'Not available'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-300 mb-1">Transaction Hash</p>
                    <div className="flex items-center">
                      <p className="text-white font-mono text-sm bg-[#2d4f47] p-2 rounded overflow-x-auto flex-grow">
                        {certificate.transactionHash || 'Not available'}
                      </p>
                      {certificate.transactionHash && (
                        <a 
                          href={`https://hashscan.io/testnet/transaction/${certificate.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 p-2 bg-teal-500/20 rounded hover:bg-teal-500/30 transition-colors"
                        >
                          <ExternalLink className="w-5 h-5 text-teal-300" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => window.print()}
                  className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Print Certificate
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FarmerCertificate;
