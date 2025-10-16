const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment to Hedera Hashgraph...");
  
  // Get the network name
  const networkName = hre.network.name;
  console.log(`Network: ${networkName} (Chain ID: ${hre.network.config.chainId})`);
  
  // Get account details
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying from account: ${deployer.address}`);
  
  // Check account balance
  const balance = await deployer.getBalance();
  console.log(`Account balance: ${hre.ethers.utils.formatEther(balance)} HBAR`);
  
  // Deploy the contract
  console.log("Deploying FarmerCertification...");
  const FarmerCertification = await hre.ethers.getContractFactory("FarmerCertification");
  const farmerCertification = await FarmerCertification.deploy();
  
  console.log("Waiting for deployment transaction confirmation...");
  await farmerCertification.deployed();
  
  console.log(`FarmerCertification deployed to: ${farmerCertification.address}`);
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Get contract artifact
  const artifact = await hre.artifacts.readArtifact("FarmerCertification");
  
  // Save deployment info
  const deploymentInfo = {
    address: farmerCertification.address,
    abi: artifact.abi,
    network: networkName,
    chainId: hre.network.config.chainId,
    deploymentTime: new Date().toISOString(),
    deployerAddress: deployer.address
  };
  
  // Save to standard file location
  fs.writeFileSync(
    path.join(deploymentsDir, "FarmerCertification.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  // Also save with network name for compatibility
  fs.writeFileSync(
    path.join(deploymentsDir, `deployment-${networkName}.json`),
    JSON.stringify({
      address: farmerCertification.address,
      network: networkName,
      chainId: hre.network.config.chainId,
      deploymentTime: new Date().toISOString()
    }, null, 2)
  );
  
  console.log("Deployment info saved to deployments directory");
  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
