# Smart Contract Testing and Verification Guide

This document provides a step-by-step guide to test and verify the FarmerCertification smart contract.

## Prerequisites

1. Node.js and npm installed
2. Access to a Hedera account with HBAR (for testnet deployment)
3. `.env` file configured with your credentials

## Local Testing

### 1. Compile the contract

```bash
npm run compile
```

This will compile the smart contract and generate the artifacts.

### 2. Run unit tests

```bash
npm test
```

This runs the automated test suite defined in `test/FarmerCertification.test.js`.

You should see all tests passing with output similar to:

