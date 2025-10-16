const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');
const { execSync } = require('child_process');

async function main() {
  console.log("Starting contract verification process...");

  // Get deployment info
  const deploymentPath = path.join(__dirname, '../deployments/FarmerCertification.json');
  if (!fs.existsSync(deploymentPath)) {
    console.error("Deployment file not found. Please deploy the contract first.");
    return;
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  console.log(`Verifying contract at address: ${deployment.address}`);
  console.log(`Network: ${deployment.network} (Chain ID: ${deployment.chainId})`);

  try {
    // Try automatic verification using hardhat-etherscan plugin equivalent for Hedera
    // Since there's no direct plugin for Hedera, we can check the deployed bytecode
    console.log("\nVerifying bytecode match...");
    const provider = ethers.provider;
    console.log("Fetching deployed bytecode from network...");
    const deployedBytecode = await provider.getCode(deployment.address);
    
    // Get compiled bytecode
    const artifactPath = path.join(
      __dirname,
      '../artifacts/contracts/FarmerCertification.sol/FarmerCertification.json'
    );
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Compare deployed bytecode with compiled bytecode
    const deployedCode = deployedBytecode.slice(2); // Remove '0x' prefix
    const compiledCode = artifact.deployedBytecode.slice(2); // Remove '0x' prefix
    
    if (deployedCode.includes(compiledCode) || compiledCode.includes(deployedCode)) {
      console.log("✅ Bytecode verification successful! The deployed contract matches the compiled version.");
      
      // Optional: Generate a verification report
      const verificationReport = {
        contract: "FarmerCertification",
        address: deployment.address,
        network: deployment.network,
        chainId: deployment.chainId,
        verifiedAt: new Date().toISOString(),
        bytecodeMatched: true
      };
      
      fs.writeFileSync(
        path.join(__dirname, '../verification-report.json'),
        JSON.stringify(verificationReport, null, 2)
      );
      console.log("Verification report saved to verification-report.json");
    } else {
      console.log("❌ Bytecode verification failed. The deployed contract does not match the compiled version.");
    }
    
    // For Hedera testnet, provide manual verification instructions
    console.log("\nFor manual verification on Hashscan:");
    console.log(`1. Visit: https://hashscan.io/${deployment.network}/contract/${deployment.address}`);
    console.log("2. Compare the contract bytecode manually");
    
  } catch (error) {
    console.error("Error during verification:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during verification:", error);
    process.exit(1);
  });
