const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get certificate ID from command line
  const certificateId = process.argv[process.argv.length - 1];
  console.log("Certificate ID:", certificateId);  
  if (!certificateId || certificateId.startsWith("--")) {
    console.error("Please provide a certificate ID");
    console.error("Usage: npx hardhat run scripts/verify-certificate.js --network testnet -- CERT-ID");
    process.exit(1);
  }
  
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
  
  console.log(`\nVerifying certificate with ID: ${certificateId}`);
  
  // Verify certificate
  const result = await contract.verifyCertificateById(certificateId);
  
  console.log("\nVerification result:");
  console.log("  Valid:", result.isValid);
  
  if (result.isValid) {
    console.log("  Farmer address:", result.farmer);
    console.log("  Expires:", new Date(result.expiryDate.toNumber() * 1000).toLocaleString());
  } else {
    console.log("  ❌ Certificate is not valid or does not exist");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
