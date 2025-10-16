const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Check if deployment info exists
  const deploymentFile = path.join(__dirname, "../deployments", "FarmerCertification.json");
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`No deployment found for network ${hre.network.name}`);
    console.error("Please deploy the contract first using deploy.js");
    process.exit(1);
  }
  
  // Read deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  console.log("Loading contract at address:", deploymentInfo.address);
  
  // Get contract instance
  const FarmerCertification = await hre.ethers.getContractFactory("FarmerCertification");
  const contract = FarmerCertification.attach(deploymentInfo.address);
  
  // Get current admin
  const admin = await contract.admin();
  console.log("Current contract admin:", admin);
  
  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("Current signer:", signer.address);
  
  // Check if signer is admin
  if (admin.toLowerCase() !== signer.address.toLowerCase()) {
    console.log("Warning: Current signer is not the contract admin");
  }
  
  // Get all certificates (example of how to get data)
  console.log("Fetching certificate examples...");
  
  // Get one certificate for a test address (provide actual address if available)
  const testAccounts = await hre.ethers.getSigners();
  const testFarmer = testAccounts[2].address;
  
  const certificate = await contract.checkCertificate(testFarmer);
  console.log(`\nCertificate for ${testFarmer}:`);
  console.log(`  Valid: ${certificate.isValid}`);
  if (certificate.certificateId) {
    console.log(`  Certificate ID: ${certificate.certificateId}`);
    console.log(`  Expires: ${new Date(certificate.expiryDate.toNumber() * 1000).toLocaleString()}`);
    
    // Verify by ID
    const verification = await contract.verifyCertificateById(certificate.certificateId);
    console.log(`\nVerification by ID (${certificate.certificateId}):`);
    console.log(`  Valid: ${verification.isValid}`);
    console.log(`  Farmer: ${verification.farmer}`);
  } else {
    console.log("  No valid certificate found");
  }
  
  // Instructions for adding test data
  console.log("\nTo issue a test certificate, run:");
  console.log(`npx hardhat run scripts/test.js --network ${hre.network.name}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
