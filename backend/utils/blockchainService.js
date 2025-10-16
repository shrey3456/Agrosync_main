import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import FarmerDocument from '../models/FarmerDocument.js';
import User from '../models/user.js';
import { Client, PrivateKey, AccountId, ContractCallQuery, ContractId } from '@hashgraph/sdk';

dotenv.config();


console.log('=== Blockchain Service Debug Info ===');
console.log('Current working directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CONTRACT_ADDRESS from env:', process.env.CONTRACT_ADDRESS);
console.log('RPC_URL:', process.env.RPC_URL);
console.log('HEDERA_RPC_URL:', process.env.HEDERA_RPC_URL);
console.log('Has PRIVATE_KEY:', !!process.env.PRIVATE_KEY);
console.log('Has ADMIN_PRIVATE_KEY:', !!process.env.ADMIN_PRIVATE_KEY);
console.log('======================================');

// Hedera network configuration
const HEDERA_NETWORK = process.env.HEDERA_NETWORK || 'testnet';
let OPERATOR_ID, OPERATOR_KEY;

try {
  if (process.env.HEDERA_OPERATOR_ID && process.env.HEDERA_OPERATOR_PRIVATE_KEY) {
    OPERATOR_ID = AccountId.fromString(process.env.HEDERA_OPERATOR_ID);
    
    // Handle different private key formats
    let privateKeyString = process.env.HEDERA_OPERATOR_PRIVATE_KEY;
    
    // If it's not a hex string, try to parse it as hex
    if (!privateKeyString.startsWith('0x') && privateKeyString.length === 64) {
      privateKeyString = '0x' + privateKeyString;
    }
    
    OPERATOR_KEY = PrivateKey.fromStringECDSA(privateKeyString);
    console.log('Hedera credentials loaded successfully');
  } else {
    console.warn('Hedera credentials not found in environment variables');
  }
} catch (error) {
  console.warn('Hedera credentials not properly configured:', error.message);
  console.log('Will use EVM mode instead of native Hedera');
}

// Smart contract configuration
let CONTRACT_ID;
try {
  // Try multiple paths for the deployment file
  const possiblePaths = [
    path.resolve(process.cwd(), 'smart-contracts', 'deployments', 'deployment-testnet.json'),
    path.resolve(process.cwd(), '..', 'smart-contracts', 'deployments', 'deployment-testnet.json'),
    path.join(process.cwd(), 'smart-contracts', 'deployments', 'deployment-testnet.json')
  ];
  
  let deploymentFound = false;
  
  for (const deploymentPath of possiblePaths) {
    console.log('Checking deployment path:', deploymentPath);
    if (fs.existsSync(deploymentPath)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      CONTRACT_ID = deployment.address;
      console.log('Loaded contract address from deployment:', deployment.address);
      deploymentFound = true;
      break;
    }
  }
  
  if (!deploymentFound) {
    console.warn('Deployment file not found in any location, using environment variable');
    if (process.env.CONTRACT_ADDRESS) {
      CONTRACT_ID = process.env.CONTRACT_ADDRESS;
      console.log('Using contract address from environment:', CONTRACT_ID);
    }
  }
} catch (error) {
  console.error('Error loading contract configuration:', error);
  // Fallback to environment variable
  if (process.env.CONTRACT_ADDRESS) {
    CONTRACT_ID = process.env.CONTRACT_ADDRESS;
    console.log('Fallback: using contract address from environment:', CONTRACT_ID);
  }
}

// Initialize Hedera client
/*
// Initialize Hedera client
let client;
try {
  if (OPERATOR_ID && OPERATOR_KEY) {
    if (HEDERA_NETWORK === 'testnet') {
      client = Client.forTestnet();
    } else if (HEDERA_NETWORK === 'mainnet') {
      client = Client.forMainnet();
    } else {
      client = Client.forPreviewnet();
    }
    client.setOperator(OPERATOR_ID, OPERATOR_KEY);
    console.log('Hedera client initialized successfully');
  } else {
    console.warn('Hedera client not initialized - missing credentials');
  }
} catch (error) {
  console.warn('Hedera client initialization failed:', error.message);
}
*/

// EVM-only mode
console.log('Using EVM-only mode for blockchain operations');
let client = null; // Disable Hedera client

/**
 * Verify a certificate on the blockchain using Hedera
 */
const verifyBlockchainCertificate = async (certificateId, aadhaarHash, certificateHash) => {
  try {
    console.log('Starting blockchain verification for certificate:', certificateId);
    
    if (!client || !CONTRACT_ID) {
      throw new Error('Blockchain client or contract not properly configured');
    }
    
    // Call the smart contract's getCertificate function
    const contractCall = new ContractCallQuery()
      .setContractId(CONTRACT_ID)
      .setGas(100000)
      .setFunction("getCertificate", [certificateId]);
    
    console.log('Calling smart contract getCertificate function...');
    const contractCallResult = await contractCall.execute(client);
    
    // Parse the result
    const result = contractCallResult.getResult();
    
    // The smart contract returns: (string certificateId, string farmerName, string aadhaarHash, string certificateHash, uint256 timestamp, bool isValid)
    const returnedCertificateId = result.getString(0);
    const farmerName = result.getString(1);
    const returnedAadhaarHash = result.getString(2);
    const returnedCertificateHash = result.getString(3);
    const timestamp = result.getUint256(4);
    const isValid = result.getBool(5);
    
    console.log('Smart contract response:', {
      certificateId: returnedCertificateId,
      farmerName,
      isValid,
      timestamp: timestamp.toString()
    });
    
    // Verify hashes match
    const hashesMatch = returnedAadhaarHash === aadhaarHash && returnedCertificateHash === certificateHash;
    
    return {
      isValid: isValid && hashesMatch,
      certificateId: returnedCertificateId,
      farmerName,
      aadhaarHash: returnedAadhaarHash,
      certificateHash: returnedCertificateHash,
      timestamp: new Date(parseInt(timestamp.toString()) * 1000).toISOString(),
      hashMatch: hashesMatch,
      blockchainValid: isValid
    };
    
  } catch (error) {
    console.error('Blockchain verification failed:', error);
    throw error;
  }
};

/**
 * Check if blockchain service is available
 */
const isBlockchainAvailable = () => {
  return !!(client && CONTRACT_ID);
};

// Load contract ABI and address for Ethereum/Hedera EVM
const getContractInfo = () => {
  try {
    // Get current file directory in ES modules
    const currentFileUrl = new URL(import.meta.url);
    const currentDir = path.dirname(currentFileUrl.pathname);
    
    // Try multiple paths for the contract file
    const possiblePaths = [
      path.resolve(process.cwd(), 'smart-contracts', 'deployments', 'FarmerCertification.json'),
      path.resolve(process.cwd(), '..', 'smart-contracts', 'deployments', 'FarmerCertification.json'),
      path.resolve(currentDir, '..', '..', 'smart-contracts', 'deployments', 'FarmerCertification.json')
    ];
    
    for (const contractPath of possiblePaths) {
      console.log('Checking contract path:', contractPath);
      if (fs.existsSync(contractPath)) {
        const contractInfo = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        console.log('Contract loaded successfully from:', contractPath);
        console.log('Contract address:', contractInfo.address);
        return {
          address: contractInfo.address,
          abi: contractInfo.abi
        };
      }
    }
    
    throw new Error('Contract deployment info not found');
  } catch (error) {
    console.error('Error loading contract information:', error);
    throw new Error('Failed to load contract information');
  }
};

// Create a provider and wallet instance for Ethereum/Hedera EVM
const getProviderAndWallet = () => {
  try {
    const rpcUrl = process.env.RPC_URL || process.env.HEDERA_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY || process.env.ADMIN_PRIVATE_KEY;
    
    if (!rpcUrl || !privateKey) {
      throw new Error('RPC URL or private key not configured');
    }
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    return { provider, wallet };
  } catch (error) {
    console.error('Error creating provider and wallet:', error);
    throw new Error('Failed to create blockchain connection');
  }
};

// Get contract instance for Ethereum/Hedera EVM
const getContract = () => {
  try {
    const contractInfo = getContractInfo();
    const { wallet } = getProviderAndWallet();
    
    return new ethers.Contract(
      contractInfo.address,
      contractInfo.abi,
      wallet
    );
  } catch (error) {
    console.error('Error creating contract instance:', error);
    throw error;
  }
};

// Issue a certificate on the blockchain using Ethereum/Hedera EVM
const verifyAndIssueCertificate = async (farmerId) => {
  try {
    // First fetch the farmer document to get both hashes
    const farmerDoc = await FarmerDocument.findOne({ farmerId });
    
    if (!farmerDoc || !farmerDoc.documents) {
      throw new Error('Farmer document not found');
    }
    
    // Check if both documents exist and are verified
    if (!farmerDoc.documents.aadhaar || 
        !farmerDoc.documents.certificate || 
        farmerDoc.documents.aadhaar.status !== 'verified' || 
        farmerDoc.documents.certificate.status !== 'verified') {
      throw new Error('Both Aadhaar and certificate must be verified before issuing a blockchain certificate');
    }
    
    const contract = getContract();
    
    // Generate a unique certificate ID
    const certificateId = `CERT-${farmerId}-${Date.now()}`;
    
    // Get farmer details from MongoDB
    const farmer = await getFarmerDetails(farmerId);
    
    // Use the actual document hashes from the verified documents
    const aadharHash = '0x' + farmerDoc.documents.aadhaar.fileHash;
    const certificateHash = '0x' + farmerDoc.documents.certificate.fileHash;
    
    console.log(`Issuing certificate with Aadhaar hash: ${aadharHash.substring(0, 18)}...`);
    console.log(`and certificate hash: ${certificateHash.substring(0, 18)}...`);
    
    // Issue the certificate on blockchain
    const transaction = await contract.issueCertificate(
      certificateId,
      farmerId.toString(),
      farmer.name,
      aadharHash,
      certificateHash
    );
    
    console.log(`Certificate issuance transaction submitted: ${transaction.hash}`);
    
    // Wait for transaction to be mined
    const receipt = await transaction.wait();
    console.log(`Certificate issued in block ${receipt.blockNumber}`);
    
    // Return certificate details
    return {
      certificateId,
      farmerId,
      farmerName: farmer.name,
      transactionHash: transaction.hash,
      blockNumber: receipt.blockNumber,
      timestamp: Date.now(),
      aadharHash: aadharHash.substring(0, 18) + '...',
      certificateHash: certificateHash.substring(0, 18) + '...'
    };
  } catch (error) {
    console.error('Error issuing certificate on blockchain:', error);
    throw new Error(`Blockchain error: ${error.message}`);
  }
};

// Verify a certificate on the blockchain using Ethereum/Hedera EVM
const verifyCertificateEVM = async (certificateId) => {
  try {
    const contract = getContract();
    
    if (!contract) {
      throw new Error('Contract not available');
    }
    
    console.log('Calling contract.verifyCertificateById with:', certificateId);
    
    // Call the contract's verification function
    const verification = await contract.verifyCertificateById(certificateId);
    
    console.log('Raw verification result:', verification);
    console.log('Verification structure:', Object.keys(verification));
    console.log('ExpiryDate type:', typeof verification.expiryDate);
    console.log('ExpiryDate value:', verification.expiryDate);
    
    // Handle different ethers.js versions and BigNumber formats
    let expiryDate;
    if (verification.expiryDate !== undefined && verification.expiryDate !== null) {
      if (typeof verification.expiryDate === 'bigint') {
        // ethers.js v6 uses BigInt
        expiryDate = Number(verification.expiryDate);
        console.log('Converted BigInt to number:', expiryDate);
      } else if (verification.expiryDate.toString && typeof verification.expiryDate.toString === 'function') {
        // Has toString method (BigNumber or similar)
        const stringValue = verification.expiryDate.toString();
        expiryDate = Number(stringValue);
        console.log('Converted toString to number:', stringValue, '->', expiryDate);
      } else if (typeof verification.expiryDate === 'number') {
        // Already a number
        expiryDate = verification.expiryDate;
        console.log('Already a number:', expiryDate);
      } else if (typeof verification.expiryDate === 'string') {
        // String number
        expiryDate = Number(verification.expiryDate);
        console.log('Converted string to number:', expiryDate);
      } else {
        // Try to convert to number
        expiryDate = Number(verification.expiryDate);
        console.log('Force converted to number:', expiryDate);
      }
    } else {
      // Default expiry date (1 year from now)
      expiryDate = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
      console.log('Using default expiry date:', expiryDate);
    }
    
    console.log('Final processed expiry date:', expiryDate);
    
    // Return the verification result
    return {
      isValid: Boolean(verification.isValid),
      farmerId: verification.farmerId || 'unknown',
      farmerName: verification.farmerName || 'Unknown Farmer',
      expiryDate: new Date(expiryDate * 1000).toISOString(),
      isExpired: expiryDate * 1000 < Date.now(),
      rawExpiryDate: expiryDate
    };
  } catch (error) {
    console.error('Error verifying certificate:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Blockchain verification error: ${error.message}`);
  }
};

// Main certificate verification function (uses Hedera by default)
const verifyCertificate = async (certificateId, aadhaarHash, certificateHash) => {
  try {
    console.log('Using EVM-only verification for certificate:', certificateId);
    
    // Skip Hedera completely, use EVM directly
    return await verifyCertificateEVM(certificateId);
    
  } catch (evmError) {
    console.error('EVM verification failed:', evmError);
    throw evmError;
  }
};

// Issue a certificate (wrapper function)
const issueCertificate = async (certificateId, farmerName, aadhaarHash, certificateHash) => {
  try {
    console.log('Issuing certificate on blockchain:', certificateId);
    
    // Use the EVM method for production
    return await verifyAndIssueCertificate(certificateId);
    
  } catch (error) {
    console.error('Certificate issuance failed:', error);
    throw error;
  }
};

// Function to get farmer details from MongoDB
const getFarmerDetails = async (farmerId) => {
  try {
    const farmer = await User.findById(farmerId);
    if (!farmer) {
      throw new Error(`Farmer with ID ${farmerId} not found`);
    }
    return {
      id: farmer._id.toString(),
      name: farmer.name || `Farmer ${farmer._id.toString().substring(0, 6)}`,
      email: farmer.email
    };
  } catch (error) {
    console.error('Error fetching farmer details:', error);
    // Return a placeholder if we couldn't get the actual details
    return {
      id: farmerId.toString(),
      name: `Farmer ${farmerId.toString().substring(0, 6)}`,
    };
  }
};

// Test blockchain service initialization
console.log('=== Blockchain Service Initialization Status ===');
console.log('CONTRACT_ID loaded:', !!CONTRACT_ID);
console.log('CONTRACT_ID value:', CONTRACT_ID);
console.log('Hedera client initialized:', !!client);
console.log('OPERATOR_ID:', OPERATOR_ID ? OPERATOR_ID.toString() : 'Not set');
console.log('===============================================');

// Test contract loading
try {
  const contractInfo = getContractInfo();
  console.log('Contract info test - Address:', contractInfo.address);
  console.log('Contract info test - ABI length:', contractInfo.abi.length);
} catch (testError) {
  console.log('Contract info test failed:', testError.message);
}

// Export all functions (FIXED - no duplicates)
export {
  verifyBlockchainCertificate,
  verifyCertificateEVM,
  verifyCertificate,
  issueCertificate,
  verifyAndIssueCertificate,
  isBlockchainAvailable,
  getContract
};
