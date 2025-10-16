const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

async function main() {
  console.log("Starting two-farmer test script...");

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
    throw new Error("Current account is not the admin. Cannot issue certificates.");
  }

  try {
    // Test data for two farmers
    const farmers = [
      {
        name: "John Doe",
        id: "FARMER-001",
        certificateId: "CERT-001-" + Date.now(),
        aadharHash: "0x" + crypto.randomBytes(32).toString('hex'),
        certificateHash: "0x" + crypto.randomBytes(32).toString('hex')
      },
      {
        name: "Jane Smith",
        id: "FARMER-002",
        certificateId: "CERT-002-" + Date.now(),
        aadharHash: "0x" + crypto.randomBytes(32).toString('hex'),
        certificateHash: "0x" + crypto.randomBytes(32).toString('hex')
      }
    ];

    // Issue certificates for both farmers
    for (const farmer of farmers) {
      console.log(`\nIssuing certificate for ${farmer.name}...`);
      console.log("Farmer ID:", farmer.id);
      console.log("Certificate ID:", farmer.certificateId);

      const tx = await contract.issueCertificate(
        farmer.certificateId,
        farmer.id,
        farmer.name,
        farmer.aadharHash,
        farmer.certificateHash
      );

      console.log("Transaction sent:", tx.hash);
      console.log("Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log(`Certificate issued in block ${receipt.blockNumber}`);

      // Verify the certificate
      console.log("\nVerifying certificate...");
      const verification = await contract.verifyCertificateById(farmer.certificateId);
      
      console.log("Verification result:");
      console.log("- Is valid:", verification.isValid);
      console.log("- Farmer ID:", verification.farmerId);
      console.log("- Farmer Name:", verification.farmerName);
      console.log("- Expires:", new Date(verification.expiryDate.toNumber() * 1000).toLocaleString());
      
      // Save the details
      const testDataPath = path.join(__dirname, `../test-data-${farmer.id}.json`);
      fs.writeFileSync(
        testDataPath,
        JSON.stringify({
          certificateId: farmer.certificateId,
          farmerId: farmer.id,
          farmerName: farmer.name,
          issuedAt: new Date().toISOString(),
          transactionHash: tx.hash,
          verification: {
            isValid: verification.isValid,
            farmerId: verification.farmerId,
            farmerName: verification.farmerName,
            expiryDate: verification.expiryDate.toNumber()
          }
        }, null, 2)
      );
      console.log(`\nTest data saved to ${testDataPath}`);
    }

    console.log("\nAll certificates issued and verified successfully!");

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