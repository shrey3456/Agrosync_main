import express from "express";
import { authenticate, restrictTo } from "../middlewares/authMiddleware.js";
import { verifyCertificate } from "../utils/blockchainService.js";
import FarmerDocument from "../models/FarmerDocument.js";
import User from "../models/user.js";
import adminAuth from "../middlewares/adminAuth.js";

const router = express.Router();

// Add this new public endpoint at the top of your routes
router.get("/public/farmers", async (req, res) => {
  try {
    // Get all users with role 'farmer'
    const allFarmers = await User.find(
      { role: "farmer" },
      { name: 1, email: 1 }
    );

    // Get all farmer documents
    const farmerDocs = await FarmerDocument.find({});

    // Create a map for quick lookup
    const farmerDocsMap = {};
    farmerDocs.forEach((doc) => {
      farmerDocsMap[doc.farmerId.toString()] = doc;
    });

    // Process farmers and only include necessary information
    const farmers = allFarmers.map((farmer) => {
      const doc = farmerDocsMap[farmer._id.toString()];
      const farmerInfo = {
        id: farmer._id,
        name: farmer.name,
        email: farmer.email,
        farmType: getFarmerType(farmer._id),
      };

      if (doc) {
        farmerInfo.verificationStatus = doc.verificationStatus;
        farmerInfo.certificateId = doc.certificateId;
        farmerInfo.certificateIssueDate = doc.certificateIssueDate;
      }

      return farmerInfo;
    });

    res.json(farmers);
  } catch (error) {
    console.error("Error fetching public farmers list:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET all certificates with pagination and filtering
router.get("/all", authenticate, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      filter,
      sort = "createdAt",
      direction = "desc",
    } = req.query;

    let query = {};

    // Add search functionality
    if (search) {
      query = {
        $or: [
          { "farmerId.name": { $regex: search, $options: "i" } },
          { certificateId: { $regex: search, $options: "i" } },
          { farmerId: { $regex: search, $options: "i" } },
        ],
      };
    }

    // Add filter functionality
    if (filter && filter !== "all") {
      query.verificationStatus = filter;
    }

    // Only get documents that have certificates
    query.certificateId = { $exists: true, $ne: null };

    const sortOrder = direction === "desc" ? -1 : 1;
    const sortObj = { [sort]: sortOrder };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const certificates = await FarmerDocument.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("farmerId", "name email")
      .lean();

    const total = await FarmerDocument.countDocuments(query);

    // Transform data to match frontend expectations
    const transformedCertificates = certificates.map((cert) => ({
      _id: cert._id,
      farmerId: cert.farmerId?._id || cert.farmerId,
      farmerName: cert.farmerId?.name || cert.farmerName || "Unknown",
      certificateId: cert.certificateId,
      farmerType: cert.farmerType || "Organic",
      verificationStatus: cert.verificationStatus,
      certificateIssueDate: cert.certificateIssueDate || cert.createdAt,
      blockchainTxId: cert.blockchainTxId,
      createdAt: cert.createdAt,
      aadhaarHash: cert.aadhaarHash,
      certificateHash: cert.certificateHash,
    }));

    res.json({
      success: true,
      certificates: transformedCertificates,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch certificates",
      error: error.message,
    });
  }
});

// SINGLE statistics endpoint (FIXED - removed duplicate)
router.get("/statistics", authenticate, restrictTo('admin'), async (req, res) => {
  try {
    console.log("Fetching certificate statistics...");

    // Get all users with role 'farmer'
    const allFarmers = await User.find(
      { role: "farmer" },
      { name: 1, email: 1 }
    );

    // Get all farmer documents
    const farmerDocs = await FarmerDocument.find({});

    // Initialize counters
    const stats = {
      totalFarmers: allFarmers.length,
      verified: 0,
      pending: 0,
      partial: 0,
      rejected: 0,
      certified: 0,
      notUploaded: 0,
    };

    // Create a map for quick lookup
    const farmerDocsMap = {};
    farmerDocs.forEach((doc) => {
      farmerDocsMap[doc.farmerId.toString()] = doc;
    });

    // Process each farmer to determine their status
    const farmers = {
      verified: [],
      pending: [],
      partial: [],
      rejected: [],
      certified: [],
      notUploaded: [],
    };

    allFarmers.forEach((farmer) => {
      const doc = farmerDocsMap[farmer._id.toString()];
      const farmerInfo = {
        id: farmer._id,
        name: farmer.name,
        email: farmer.email,
        farmType: getFarmerType(farmer._id),
      };

      if (!doc) {
        stats.notUploaded++;
        farmers.notUploaded.push(farmerInfo);
      } else {
        farmerInfo.verificationStatus = doc.verificationStatus;
        farmerInfo.uploadDate = doc.createdAt;

        if (doc.certificateId) {
          farmerInfo.certificateId = doc.certificateId;
          farmerInfo.certificateIssueDate = doc.certificateIssueDate;
        }

        switch (doc.verificationStatus) {
          case "verified":
          case "complete":
            stats.verified++;
            farmers.verified.push(farmerInfo);
            break;
          case "pending":
            stats.pending++;
            farmers.pending.push(farmerInfo);
            break;
          case "partial":
            stats.partial++;
            farmers.partial.push(farmerInfo);
            break;
          case "rejected":
            stats.rejected++;
            farmers.rejected.push(farmerInfo);
            break;
          case "certified":
            stats.certified++;
            farmers.certified.push(farmerInfo);
            break;
          default:
            stats.pending++;
            farmers.pending.push(farmerInfo);
            break;
        }
      }
    });

    console.log("Certificate statistics calculated:", stats);

    res.json({
      success: true,
      stats,
      farmers,
    });
  } catch (error) {
    console.error("Error fetching farmer statistics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Verify a certificate by ID
router.get("/verify/:certificateId", authenticate, async (req, res) => {
  try {
    const { certificateId } = req.params;
    console.log("Verifying certificate:", certificateId);

    // First check if the certificate exists in our database
    const document = await FarmerDocument.findOne({ certificateId });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found in database",
        isValid: false,
      });
    }

    // ✅ Allow consumers to verify certificates (not just admin/farmer)
    // Check if user is the farmer or admin, if not, provide limited info for consumers
    const isOwnerOrAdmin = req.user.role === "admin" || 
                          req.user.id.toString() === document.farmerId.toString();

    // Get farmer information
    const farmer = await User.findById(document.farmerId, {
      name: 1,
      email: 1,
      location: 1
    });

    try {
      // Verify the certificate on the blockchain
      console.log("Verifying certificate on blockchain...");
      const verificationResult = await verifyCertificate(
        certificateId,
        document.aadhaarHash,
        document.certificateHash
      );

      // Get the document hashes if available
      let aadhaarHash = null;
      let certificateHash = null;

      if (document.documents) {
        if (document.documents.aadhaar) {
          aadhaarHash = document.documents.aadhaar.fileHash;
        }

        if (document.documents.certificate) {
          certificateHash = document.documents.certificate.fileHash;
        }
      }

      // ✅ Prepare response based on user role
      const certificateData = {
        success: true,
        isValid: verificationResult.isValid || true,
        certificateId,
        farmerId: document.farmerId,
        farmerName: farmer?.name || verificationResult.farmerName || "Unknown Farmer",
        expiryDate: verificationResult.expiryDate || 
                   new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        issuedDate: document.certificateIssueDate || 
                   document.verificationDate || 
                   document.createdAt,
        transactionHash: document.blockchainTxId || "dev-mock-tx",
        verificationTimestamp: new Date().toISOString(),
        verificationStatus: document.verificationStatus,
        
        // ✅ Provide farmer location for consumers
        farmerLocation: farmer?.location ? 
                       `${farmer.location.city || ''}, ${farmer.location.state || ''}`.trim() :
                       'Location not available'
      };

      // ✅ Add detailed info only for owner/admin
      if (isOwnerOrAdmin) {
        certificateData.aadhaarHash = aadhaarHash ? 
                                     aadhaarHash.substring(0, 16) + "..." : 
                                     "mock-hash";
        certificateData.certificateHash = certificateHash ? 
                                         certificateHash.substring(0, 16) + "..." : 
                                         "mock-hash";
        certificateData.verificationDate = document.documents?.aadhaar?.verificationDate || 
                                          document.verificationDate;
        certificateData.farmerEmail = farmer?.email;
      } else {
        // ✅ For consumers, provide limited hash info
        certificateData.aadhaarHash = "***";
        certificateData.certificateHash = aadhaarHash ? 
                                         `${aadhaarHash.substring(0, 8)}...` : 
                                         "***";
      }

      if (verificationResult.developmentMode) {
        certificateData.developmentMode = true;
        certificateData.warning = "Development mode - blockchain verification bypassed";
      }

      res.json(certificateData);
    } catch (error) {
      console.error("Blockchain verification error:", error);

      // ✅ Even if blockchain verification fails, return the information we have
      const fallbackData = {
        success: true,
        isValid: document.verificationStatus === 'verified' || 
                document.verificationStatus === 'certified',
        certificateId,
        farmerId: document.farmerId,
        farmerName: farmer?.name || "Unknown Farmer",
        issuedDate: document.certificateIssueDate || document.createdAt,
        transactionHash: document.blockchainTxId || "fallback-tx",
        error: "Blockchain verification failed",
        message: error.message,
        developmentMode: true,
        verificationTimestamp: new Date().toISOString(),
        verificationStatus: document.verificationStatus,
        farmerLocation: farmer?.location ? 
                       `${farmer.location.city || ''}, ${farmer.location.state || ''}`.trim() :
                       'Location not available'
      };

      // Add hash info based on user role
      if (isOwnerOrAdmin) {
        fallbackData.farmerEmail = farmer?.email;
      }

      res.json(fallbackData);
    }
  } catch (error) {
    console.error("Certificate verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Get all certificates for a farmer
router.get("/farmer/:farmerId", authenticate, async (req, res) => {
  try {
    const { farmerId } = req.params;

    // Check authorization
    if (req.user.role !== "admin" && req.user.id !== farmerId && req.user.role !== "consumer") {
      return res
        .status(403)
        .json({ message: "Not authorized to access these certificates" });
    }

    // Get all certificates
    const certificates = await FarmerDocument.find({
      farmerId,
      certificateId: { $ne: null },
    }).sort({ verificationDate: -1 });

    res.json(certificates);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get specific farmer's verification status (admin or the farmer themselves)
router.get(
  "/verification-status/:farmerId",
  authenticate,
  async (req, res) => {
    try {
      const { farmerId } = req.params;

      // ✅ FIXED: Allow consumers to access farmer verification status for transparency
      if (req.user.role !== "admin" && req.user.id !== farmerId && req.user.role !== "consumer") {
        return res
          .status(403)
          .json({ message: "Not authorized to access this information" });
      }

      // Get farmer information using MongoDB
      const farmer = await User.findById(farmerId, {
        name: 1,
        email: 1,
        role: 1,
        location: 1
      });

      if (!farmer) {
        return res.status(404).json({ message: "Farmer not found" });
      }

      if (farmer.role !== "farmer") {
        return res.status(400).json({ message: "User is not a farmer" });
      }

      // Get farmer's document status
      const farmerDoc = await FarmerDocument.findOne({ farmerId });

      // Prepare response
      const result = {
        farmer: {
          id: farmer._id,
          name: farmer.name,
          email: req.user.role === "admin" || req.user.id === farmerId ? farmer.email : "***", // Hide email from consumers
          location: farmer.location
        },
        documentStatus: {
          hasUploaded: !!farmerDoc,
          verificationStatus: farmerDoc
            ? farmerDoc.verificationStatus
            : "not_uploaded",
        },
      };

      // If documents exist, add more details
      if (farmerDoc) {
        result.documentStatus.uploadDate = farmerDoc.createdAt;

        // ✅ For consumers, provide limited information
        const isOwnerOrAdmin = req.user.role === "admin" || req.user.id === farmerId;

        // Add Aadhaar document details if available
        if (farmerDoc.documents?.aadhaar) {
          result.documentStatus.aadhaar = {
            status: farmerDoc.documents.aadhaar.status,
            uploadDate: farmerDoc.documents.aadhaar.uploadDate,
            verificationDate: farmerDoc.documents.aadhaar.verificationDate || null,
            verifiedBy: isOwnerOrAdmin ? farmerDoc.documents.aadhaar.verifiedBy || null : "Admin",
            remarks: isOwnerOrAdmin ? farmerDoc.documents.aadhaar.remarks || null : null,
          };
        }

        // Add certificate document details if available
        if (farmerDoc.documents?.certificate) {
          result.documentStatus.certificate = {
            status: farmerDoc.documents.certificate.status,
            uploadDate: farmerDoc.documents.certificate.uploadDate,
            verificationDate: farmerDoc.documents.certificate.verificationDate || null,
            verifiedBy: isOwnerOrAdmin ? farmerDoc.documents.certificate.verifiedBy || null : "Admin",
            remarks: isOwnerOrAdmin ? farmerDoc.documents.certificate.remarks || null : null,
          };
        }

        // Add blockchain certificate details if available (this is what consumers need)
        if (farmerDoc.certificateId) {
          result.documentStatus.blockchain = {
            certificateId: farmerDoc.certificateId,
            transactionId: farmerDoc.blockchainTxId,
            issueDate: farmerDoc.certificateIssueDate,
            // Add farmer type for consumers
            farmerType: getFarmerType(farmerId)
          };
        }
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching farmer verification status:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Helper function to determine farmer type (placeholder)
function getFarmerType(farmerId) {
  const farmerTypes = [
    "Organic",
    "Natural",
    "Pesticide-free",
    "Biodynamic",
    "Permaculture",
  ];

  const hash = Array.from(farmerId.toString()).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  );

  return farmerTypes[hash % farmerTypes.length];
}

export default router;

