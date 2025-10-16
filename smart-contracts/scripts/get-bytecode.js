// Script to extract bytecode from compiled contract
const fs = require('fs');
const path = require('path');

// Path to the compiled contract artifact
const artifactPath = path.join(
  __dirname,
  '../artifacts/contracts/FarmerCertification.sol/FarmerCertification.json'
);

// Read the artifact file
const artifactContent = fs.readFileSync(artifactPath, 'utf8');
const artifact = JSON.parse(artifactContent);

// Extract the bytecode
const bytecode = artifact.bytecode;

// Print the bytecode and its length
console.log(`\nContract Bytecode Length: ${bytecode.length} characters`);
console.log(`\nBytecode for FarmerCertification contract:\n${bytecode}\n`);

// Save bytecode to a file for easy access
const outputPath = path.join(__dirname, '../contract-bytecode.txt');
fs.writeFileSync(outputPath, bytecode);
console.log(`Bytecode saved to: ${outputPath}\n`);

// Print instructions for verification
console.log("To verify your contract on Ethereum or compatible networks:");
console.log("1. Copy this bytecode");
console.log("2. Go to the blockchain explorer (Etherscan, etc.)");
console.log("3. Find your contract by address");
console.log("4. Use the 'Verify Contract' option");
console.log("5. Paste the bytecode when prompted\n");