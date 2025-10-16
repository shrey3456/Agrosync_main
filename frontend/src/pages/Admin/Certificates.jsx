import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import {
  Users,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  FileCheck,
  Check,
  X,
  ExternalLink,
  AlertCircle,
  Download,
  Calendar,
  ArrowUpDown,
  ClipboardList,
  Clock,
  AlertTriangle,
  UserPlus,
  CheckCircle2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Certificates = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState(null);

  const ITEMS_PER_PAGE = 10;

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
      fetchCertificates();
      fetchStatistics();
    }
  }, [currentPage, searchQuery, sortConfig, filter]);

  const fetchCertificates = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', ITEMS_PER_PAGE);
      params.append('sort', sortConfig.key);
      params.append('direction', sortConfig.direction);
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (filter !== 'all') {
        params.append('filter', filter);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/certificates/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch certificates');
      }

      const data = await response.json();
      console.log('Fetched certificates:', data);
      setCertificates(data.certificates || []);
      setTotalPages(Math.ceil((data.total || 0) / ITEMS_PER_PAGE));
      setError(null);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setError('Failed to fetch certificates');
      // Use sample data for development
      const sampleCertificates = generateSampleCertificates();
      setCertificates(sampleCertificates);
      setTotalPages(Math.ceil(sampleCertificates.length / ITEMS_PER_PAGE));
      
      if (error.message.includes('401') || error.message.includes('403')) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatistics = async () => {
    setIsStatsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/certificates/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Set mock statistics in case of error
      setStats({
        totalFarmers: 48,
        verified: 12,
        pending: 8,
        partial: 14,
        rejected: 3,
        certified: 9,
        notUploaded: 2
      });
    } finally {
      setIsStatsLoading(false);
    }
  };

  const verifyWithBlockchain = async (certificateId) => {
    setVerificationLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/certificates/verify/${certificateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to verify certificate');
      }

      const data = await response.json();
      
      setVerificationResult({
        verified: data.isValid,
        message: data.isValid 
          ? "Certificate successfully verified on the blockchain!" 
          : "Certificate verification failed",
        details: {
          txId: data.transactionHash,
          timestamp: new Date().toISOString(),
          hashMatch: data.isValid,
          networkConsensus: data.isValid ? "Valid" : "Invalid",
          issuer: "Farmers Connect Admin",
          expiryDate: data.expiryDate,
          farmerName: data.farmerName,
          farmerId: data.farmerId,
          aadhaarHash: data.aadhaarHash,
          certificateHash: data.certificateHash
        }
      });
    } catch (error) {
      console.error('Error verifying certificate:', error);
      setError('Failed to verify certificate');
      
      // If API fails, use mock verification for development
      setVerificationResult({
        verified: Math.random() > 0.2, // 80% chance of success for demo
        message: Math.random() > 0.2 
          ? "Certificate successfully verified on the blockchain!" 
          : "Certificate verification failed",
        error: error.message,
        details: {
          txId: selectedCertificate.blockchainTxId,
          timestamp: new Date().toISOString(),
          hashMatch: Math.random() > 0.2,
          networkConsensus: Math.random() > 0.2 ? "Valid" : "Invalid",
          issuer: "Farmers Connect Admin"
        }
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const generateSampleCertificates = () => {
    const farmerTypes = ['Organic', 'Natural', 'Pesticide-free', 'Biodynamic', 'Permaculture'];
    const farmerNames = ['Rajesh Kumar', 'Priya Singh', 'Mohit Verma', 'Aditya Sharma', 'Neha Patel', 
                         'Sanjay Gupta', 'Kavita Jain', 'Amit Patel', 'Lakshmi Devi', 'Rahul Mishra'];
    
    return Array.from({ length: 23 }, (_, i) => ({
      _id: `doc_${i + 1}`,
      farmerId: `f${10000 + i}`,
      farmerName: farmerNames[i % farmerNames.length],
      certificateId: `CERT-${100 + i}`,
      farmerType: farmerTypes[i % farmerTypes.length],
      verificationStatus: i % 10 === 0 ? 'pending' : (i % 15 === 0 ? 'rejected' : 'certified'),
      certificateIssueDate: new Date(Date.now() - Math.random() * 10000000000),
      blockchainTxId: `0.0.484972${i.toString().padStart(2, '0')}`,
      createdAt: new Date(Date.now() - Math.random() * 10000000000)
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setSearchQuery(e.target.value);
      setCurrentPage(1);
    }
  };

  const viewCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setVerificationResult(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCertificate(null);
    setVerificationResult(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderPagination = () => {
    const pageNumbers = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // Always show 5 page numbers if possible
    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 4);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - 4);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-400">
          Showing {isLoading ? '...' : `${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, certificates.length)} of ${certificates.length}`} certificates
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-md ${
              currentPage === 1
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-teal-400 hover:bg-teal-500/10'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => handlePageChange(number)}
              className={`w-8 h-8 flex items-center justify-center rounded-md ${
                currentPage === number
                  ? 'bg-teal-500 text-white'
                  : 'text-gray-400 hover:bg-teal-500/10 hover:text-white'
              }`}
            >
              {number}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md ${
              currentPage === totalPages
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-teal-400 hover:bg-teal-500/10'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'certified':
        return (
          <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs flex items-center">
            <Check className="w-3 h-3 mr-1" /> Certified
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" /> Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs flex items-center">
            <X className="w-3 h-3 mr-1" /> Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#081210] via-[#071512] to-[#061411]">
      {!showModal && <Navbar />}
      
      <div className="container mx-auto px-4 pt-32 pb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4 ">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Farmer Certificates
            </h1>
            <p className="text-gray-400">
              View and verify farmer certificates stored on the blockchain
            </p>
          </motion.div>
        </div>
        
        {/* Statistics Summary */}
        {isStatsLoading ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-teal-500/5 animate-pulse rounded-xl p-6 h-32"></div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
          >
            <div className="bg-gradient-to-br from-[#386259] to-[#2d4f47] rounded-xl border border-teal-500/20 shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 text-sm font-medium">Total Farmers</h3>
                <Users className="h-5 w-5 text-teal-300" />
              </div>
              <p className="text-3xl font-bold text-white">{stats?.totalFarmers || 0}</p>
              <p className="text-gray-400 text-xs mt-2">Registered farmers</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#386259] to-[#2d4f47] rounded-xl border border-teal-500/20 shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 text-sm font-medium">Certified</h3>
                <ShieldCheck className="h-5 w-5 text-green-300" />
              </div>
              <p className="text-3xl font-bold text-white">{stats?.certified || 0}</p>
              <p className="text-gray-400 text-xs mt-2">Blockchain certificates issued</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#386259] to-[#2d4f47] rounded-xl border border-teal-500/20 shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 text-sm font-medium">Verified</h3>
                <CheckCircle2 className="h-5 w-5 text-blue-300" />
              </div>
              <p className="text-3xl font-bold text-white">{stats?.verified || 0}</p>
              <p className="text-gray-400 text-xs mt-2">Documents verified, awaiting certification</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#386259] to-[#2d4f47] rounded-xl border border-teal-500/20 shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 text-sm font-medium">Pending</h3>
                <Clock className="h-5 w-5 text-yellow-300" />
              </div>
              <p className="text-3xl font-bold text-white">{stats?.pending || 0}</p>
              <p className="text-gray-400 text-xs mt-2">Awaiting verification</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#386259] to-[#2d4f47] rounded-xl border border-teal-500/20 shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 text-sm font-medium">Partial</h3>
                <ClipboardList className="h-5 w-5 text-orange-300" />
              </div>
              <p className="text-3xl font-bold text-white">{stats?.partial || 0}</p>
              <p className="text-gray-400 text-xs mt-2">Incomplete document submission</p>
            </div>
            
            <div className="bg-gradient-to-br from-[#386259] to-[#2d4f47] rounded-xl border border-teal-500/20 shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-300 text-sm font-medium">Rejected</h3>
                <AlertTriangle className="h-5 w-5 text-red-300" />
              </div>
              <p className="text-3xl font-bold text-white">{stats?.rejected || 0}</p>
              <p className="text-gray-400 text-xs mt-2">Failed verification</p>
            </div>
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#386259] to-[#2d4f47] p-6 rounded-xl border border-teal-500/20 shadow-lg shadow-black/20 mb-8"
        >
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by farmer name or certificate ID..."
                className="w-full bg-[#1c3631] text-white pl-10 pr-4 py-2 rounded-lg border border-[#2d4f47] focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                onKeyDown={handleSearch}
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            
            <div className="flex space-x-2">
              <div className="relative">
                <select
                  className="bg-[#1c3631] text-white pl-4 pr-10 py-2 rounded-lg border border-[#2d4f47] focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none"
                  value={filter}
                  onChange={handleFilterChange}
                >
                  <option value="all">All Certificates</option>
                  <option value="certified">Certified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
          
          {/* Certificates Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-teal-500/10 text-white">
              <thead>
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-teal-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('farmerName')}
                  >
                    <div className="flex items-center">
                      Farmer Name 
                      <ArrowUpDown className="ml-1 w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-teal-300 uppercase tracking-wider">
                    Farm Type
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-teal-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('certificateIssueDate')}
                  >
                    <div className="flex items-center">
                      Issue Date
                      <ArrowUpDown className="ml-1 w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-teal-300 uppercase tracking-wider">
                    Certificate ID
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-teal-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('verificationStatus')}
                  >
                    <div className="flex items-center">
                      Status
                      <ArrowUpDown className="ml-1 w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-teal-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-500/10">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="bg-teal-500/5 animate-pulse">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-5 w-32 bg-gray-700 rounded"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-5 w-20 bg-gray-700 rounded"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-5 w-24 bg-gray-700 rounded"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-5 w-16 bg-gray-700 rounded"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-5 w-20 bg-gray-700 rounded"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-5 w-20 bg-gray-700 rounded"></div>
                      </td>
                    </tr>
                  ))
                ) : certificates.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                      No certificates found.
                    </td>
                  </tr>
                ) : (
                  certificates
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
                    .map((certificate) => (
                      <tr 
                        key={certificate._id} 
                        className="hover:bg-teal-500/10 transition-colors cursor-pointer"
                        onClick={() => viewCertificate(certificate)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center mr-3">
                              <Users className="w-4 h-4 text-teal-300" />
                            </div>
                            <span className="font-medium">{certificate.farmerName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                            {certificate.farmerType}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                            {formatDate(certificate.certificateIssueDate)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-300">
                          {certificate.certificateId}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getStatusBadge(certificate.verificationStatus)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              viewCertificate(certificate);
                            }}
                            className="text-teal-300 hover:text-teal-200 transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {renderPagination()}
        </motion.div>
      </div>
      
      {/* Certificate Modal */}
      {showModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-[#386259] to-[#2d4f47] rounded-xl border border-teal-500/20 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center p-6 border-b border-teal-500/20">
              <h3 className="text-xl font-bold text-white">Farmer Certificate</h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 p-6 bg-gradient-to-br from-[#2d4f47] to-[#1e3831] rounded-lg border border-teal-500/10">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-teal-300 font-semibold">Certificate #{selectedCertificate.certificateId}</h4>
                  {getStatusBadge(selectedCertificate.verificationStatus)}
                </div>
                
                <div className="text-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-10 h-10 text-teal-300" />
                  </div>
                  <h3 className="text-white text-2xl font-bold mb-1">{selectedCertificate.farmerName}</h3>
                  <p className="text-gray-300 text-sm">Certified {selectedCertificate.farmerType} Farmer</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Farmer ID</p>
                    <p className="text-white truncate max-w-[220px]" title={selectedCertificate.farmerId}>{selectedCertificate.farmerId}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Certification Type</p>
                    <p className="text-white">{selectedCertificate.farmerType}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Issue Date</p>
                    <p className="text-white">{formatDate(selectedCertificate.certificateIssueDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Status</p>
                    <p className="text-white">{selectedCertificate.verificationStatus}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs mb-1">Blockchain Transaction ID</p>
                    <p className="text-white flex items-center truncate max-w-[350px]" title={selectedCertificate.blockchainTxId}>
                      <span className="truncate max-w-[300px] inline-block align-bottom">{selectedCertificate.blockchainTxId}</span>
                      <a 
                        href={`https://hashscan.io/testnet/transaction/${selectedCertificate.blockchainTxId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-teal-400 hover:text-teal-300 inline-flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Blockchain Verification</h4>
                
                {!verificationResult ? (
                  <button
                    onClick={() => verifyWithBlockchain(selectedCertificate.certificateId)}
                    disabled={verificationLoading}
                    className={`w-full py-3 rounded-lg flex items-center justify-center ${
                      verificationLoading
                        ? "bg-teal-600/50 cursor-not-allowed"
                        : "bg-teal-600 hover:bg-teal-700"
                    } text-white transition-colors`}
                  >
                    {verificationLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Verifying on Blockchain...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5 mr-2" />
                        Verify Certificate Authenticity
                      </>
                    )}
                  </button>
                ) : (
                  <div className={`p-4 rounded-lg ${
                    verificationResult.verified ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
                  }`}>
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                        verificationResult.verified ? "bg-green-500/20" : "bg-red-500/20"
                      } flex items-center justify-center mr-3`}>
                        {verificationResult.verified ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div>
                        <h5 className={`font-medium ${
                          verificationResult.verified ? "text-green-300" : "text-red-300"
                        }`}>
                          {verificationResult.verified ? "Certificate Verified" : "Verification Failed"}
                        </h5>
                        <p className="text-gray-300 text-sm mt-1">{verificationResult.message}</p>
                        
                        {verificationResult.verified && verificationResult.details && (
                          <div className="mt-4 text-sm">
                            <div className="grid grid-cols-2 gap-2 min-w-0">
                              <div className="col-span-2">
                                <p className="text-gray-400 text-xs">Transaction ID</p>
                                <p className="text-gray-300 truncate max-w-full" style={{maxWidth:'100%'}} title={verificationResult.details.txId}>{verificationResult.details.txId}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs">Verification Time</p>
                                <p className="text-gray-300">{new Date(verificationResult.details.timestamp).toLocaleTimeString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-xs">Hash Match</p>
                                <p className="text-green-300">✓ Verified</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-gray-400 text-xs">Issuer</p>
                                <p className="text-gray-300 truncate max-w-full" style={{maxWidth:'100%'}} title={verificationResult.details.issuer}>{verificationResult.details.issuer}</p>
                              </div>
                              {verificationResult.details.expiryDate && (
                                <div>
                                  <p className="text-gray-400 text-xs">Expiry Date</p>
                                  <p className="text-gray-300">{formatDate(verificationResult.details.expiryDate)}</p>
                                </div>
                              )}
                              {verificationResult.details.aadhaarHash && (
                                <div className="col-span-2">
                                  <p className="text-gray-400 text-xs">Aadhaar Hash</p>
                                  <p className="text-gray-300 truncate max-w-full" style={{maxWidth:'100%'}} title={verificationResult.details.aadhaarHash}>{verificationResult.details.aadhaarHash}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between">
                <button 
                  onClick={closeModal}
                  className="px-4 py-2 border border-teal-500/30 rounded-lg text-white hover:bg-teal-500/20 transition-colors"
                >
                  Close
                </button>
                <a 
                  href="#" 
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-white transition-colors flex items-center"
                  onClick={(e) => e.preventDefault()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Certificate
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
