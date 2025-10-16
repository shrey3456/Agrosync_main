const hre = require("hardhat");

async function main() {
    console.log("Starting deployment...");
    
    // Deploy the contract
    const FarmerCertification = await hre.ethers.getContractFactory("FarmerCertification");
    const farmerCertification = await FarmerCertification.deploy();
    await farmerCertification.deployed();
    
    console.log("FarmerCertification deployed to:", farmerCertification.address);
    
    // Wait for a few block confirmations
    await farmerCertification.deployTransaction.wait(5);
    
    // Save deployment info
    const fs = require("fs");
    const path = require("path");
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }
    
    // Get contract artifact
    const artifact = await hre.artifacts.readArtifact("FarmerCertification");
    
    // Save contract address and ABI
    const deploymentInfo = {
        address: farmerCertification.address,
        abi: artifact.abi,
        network: hre.network.name,
        timestamp: new Date().toISOString(),
    };
    
    fs.writeFileSync(
        path.join(deploymentsDir, "FarmerCertification.json"),
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("Deployment info saved to deployments/FarmerCertification.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
