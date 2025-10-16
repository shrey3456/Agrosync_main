const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

async function main() {
  console.log("Starting certificate testing script...");

  // Read deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", "FarmerCertification.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("Deployment info not found. Please deploy the contract first.");
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("Using deployed contract at:", deploymentInfo.address);

  // Get contract instance
  const FarmerCertification = await hre.ethers.getContractFactory("FarmerCertification");
  const contract = await FarmerCertification.attach(deploymentInfo.address);

  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Network:", hre.network.name);

  // Check if we're admin
  const currentAdmin = await contract.admin();
  const isAdmin = currentAdmin.toLowerCase() === deployer.address.toLowerCase();
  console.log("Current admin:", currentAdmin);
  console.log("Connected account is admin:", isAdmin);

  if (!isAdmin) {
    console.log("Warning: Current account is not the admin. Some operations will fail.");
  }

  try {
    // Generate test data
    const testFarmerId = "farmer-" + crypto.randomBytes(4).toString("hex");
    const farmerName = "Test Farmer";
    const certificateId = "CERT-" + Date.now().toString();
    const aadharHash = "0x" + crypto.randomBytes(32).toString('hex');
    const certificateHash = "0x" + crypto.randomBytes(32).toString('hex');

    console.log("\nTest Data:");
    console.log("- Farmer ID:", testFarmerId);
    console.log("- Farmer Name:", farmerName);
    console.log("- Certificate ID:", certificateId);
    
    // Issue certificate
    if (isAdmin) {
      console.log("\nIssuing certificate...");
      const tx = await contract.issueCertificate(
        certificateId,
        testFarmerId,
        farmerName,
        aadharHash,
        certificateHash
      );
      console.log("Transaction sent:", tx.hash);
      console.log("Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log(`Certificate issued in block ${receipt.blockNumber}`);

      // Verify the certificate
      console.log("\nVerifying certificate...");
      const verification = await contract.verifyCertificateById(certificateId);
      
      console.log("Verification result:");
      console.log("- Is valid:", verification.isValid);
      console.log("- Farmer ID:", verification.farmerId);
      console.log("- Farmer Name:", verification.farmerName);
      console.log("- Expires:", new Date(verification.expiryDate.toNumber() * 1000).toLocaleString());
      
      // Save the details for future use
      const testDataPath = path.join(__dirname, "../test-certificate-data.json");
      fs.writeFileSync(
        testDataPath,
        JSON.stringify({
          certificateId,
          farmerId: testFarmerId,
          farmerName,
          issuedAt: new Date().toISOString(),
          transactionHash: tx.hash
        }, null, 2)
      );
      console.log(`\nTest data saved to ${testDataPath}`);
    } else {
      console.log("\nSkipping certificate issuance because current account is not admin");
      
      // Try to verify some existing certificates
      console.log("\nChecking for any existing certificates...");
      const testIdPrefix = "CERT-";
      const possibleIds = [
        testIdPrefix + Math.floor(Date.now() / 86400000), // Today
        testIdPrefix + Math.floor((Date.now() - 86400000) / 86400000), // Yesterday
        "CERT-001",
        "CERT-123456"
      ];
      
      let foundValid = false;
      for (const id of possibleIds) {
        console.log(`\nTrying to verify certificate ID: ${id}`);
        const verification = await contract.verifyCertificateById(id);
        
        if (verification.farmerId && verification.farmerId !== "") {
          console.log("Found valid certificate!");
          console.log("- Is valid:", verification.isValid);
          console.log("- Farmer ID:", verification.farmerId);
          console.log("- Farmer Name:", verification.farmerName);
          console.log("- Expires:", new Date(verification.expiryDate.toNumber() * 1000).toLocaleString());
          foundValid = true;
          break;
        } else {
          console.log("Certificate not found or invalid");
        }
      }
      
      if (!foundValid) {
        console.log("\nNo valid certificates found. Please issue some certificates first.");
      }
    }

  } catch (error) {
    console.error("\nError executing test:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
