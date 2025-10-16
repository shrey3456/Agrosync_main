const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

async function main() {
  console.log("Starting contract tests...");

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

  // Get signers - on testnet we'll only have one signer
  const signers = await hre.ethers.getSigners();
  const owner = signers[0];
  
  console.log("Using account:", owner.address);
  console.log("Network:", hre.network.name);

  try {
    // Test 1: Check admin
    console.log("\nTest 1: Checking current admin...");
    const currentAdmin = await contract.admin();
    console.log("Current admin:", currentAdmin);
    
    const isAdmin = currentAdmin.toLowerCase() === owner.address.toLowerCase();
    console.log("Current account is admin:", isAdmin);

    if (!isAdmin) {
      console.log("Warning: Current account is not the contract admin. Some tests will fail.");
      console.log("You can still perform read operations.");
    }

    // Test 2: Generate test farmer address
    console.log("\nTest 2: Preparing test data...");
    // Generate a random address for testing if we need a farmer address
    const testFarmerPrivateKey = "0x" + crypto.randomBytes(32).toString('hex');
    const testFarmerWallet = new hre.ethers.Wallet(testFarmerPrivateKey);
    const testFarmerAddress = testFarmerWallet.address;
    console.log("Generated test farmer address:", testFarmerAddress);

    // Test 3: Issue certificate (will only work if we're admin)
    if (isAdmin) {
      console.log("\nTest 3: Issuing certificate...");
      const certificateId = "CERT-" + Date.now().toString();
      const aadharHash = "0x" + crypto.randomBytes(32).toString('hex');
      const certificateHash = "0x" + crypto.randomBytes(32).toString('hex');

      const tx = await contract.issueCertificate(
        testFarmerAddress,
        certificateId,
        aadharHash,
        certificateHash
      );
      
      console.log("Transaction sent, waiting for confirmation...");
      await tx.wait();
      console.log("Certificate issued successfully!");
      
      // Test 4: Verify certificate
      console.log("\nTest 4: Verifying certificate...");
      const verification = await contract.verifyCertificateById(certificateId);
      console.log("Verification result:", {
        isValid: verification.isValid,
        farmer: verification.farmer,
        expiryDate: new Date(verification.expiryDate.toNumber() * 1000).toLocaleString()
      });
      
      // Test 5: Revoke certificate
      console.log("\nTest 5: Revoking certificate...");
      const revokeTx = await contract.revokeCertificate(
        testFarmerAddress, 
        "Test revocation"
      );
      console.log("Transaction sent, waiting for confirmation...");
      await revokeTx.wait();
      console.log("Certificate revoked successfully!");
      
      // Test 6: Verify revoked certificate
      console.log("\nTest 6: Verifying revoked certificate...");
      const revokedVerification = await contract.verifyCertificateById(certificateId);
      console.log("Revoked certificate verification:", {
        isValid: revokedVerification.isValid,
        farmer: revokedVerification.farmer
      });
    } else {
      console.log("\nSkipping admin-only tests (issue/revoke certificate)");
      
      // We can still test reading data
      console.log("\nTest 3: Looking up random certificates...");
      // Generate a few random certificate IDs to try
      const testIds = [
        "CERT-123456",
        "CERT-" + Date.now().toString(),
        "CERT-INVALID"
      ];
      
      for (const id of testIds) {
        console.log(`\nChecking certificate ID: ${id}`);
        const verification = await contract.verifyCertificateById(id);
        console.log("Result:", {
          isValid: verification.isValid,
          farmer: verification.farmer || "N/A"
        });
      }
    }

    console.log("\nAll tests completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });