const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

async function main() {
  // Check if deployment info exists
  const deploymentFile = path.join(__dirname, "../deployments", "FarmerCertification.json");
  
  if (!fs.existsSync(deploymentFile)) {
    console.error("No deployment found. Please deploy the contract first.");
    process.exit(1);
  }
  
  // Read deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  console.log("Loading contract at address:", deploymentInfo.address);
  
  // Get contract instance
  const FarmerCertification = await hre.ethers.getContractFactory("FarmerCertification");
  const contract = FarmerCertification.attach(deploymentInfo.address);
  
  // Get accounts
  const [admin, farmer] = await hre.ethers.getSigners();
  
  // Generate a unique certificate ID
  const certificateId = "CERT-" + Date.now().toString();
  
  // Generate random hashes for testing
  const aadharHash = "0x" + crypto.randomBytes(32).toString('hex');
  const certificateHash = "0x" + crypto.randomBytes(32).toString('hex');
  
  console.log("\nIssuing certificate to:", farmer.address);
  console.log("Certificate ID:", certificateId);
  
  // Issue certificate
  const tx = await contract.issueCertificate(
    farmer.address,
    certificateId,
    aadharHash,
    certificateHash
  );
  
  console.log("Transaction sent, waiting for confirmation...");
  await tx.wait();
  
  console.log("\n✅ Certificate issued successfully!");
  
  // Verify the certificate
  const certificate = await contract.checkCertificate(farmer.address);
  console.log("\nCertificate details:");
  console.log("  Valid:", certificate.isValid);
  console.log("  Certificate ID:", certificate.certificateId);
  console.log("  Expires:", new Date(certificate.expiryDate.toNumber() * 1000).toLocaleString());
  
  console.log("\nYou can now verify this certificate by ID using:");
  console.log(`npx hardhat run scripts/verify-certificate.js --network ${hre.network.name} -- ${certificateId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
