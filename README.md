# KrusthiSetu

KrusthiSetu is a role-based web platform that connects smallholder farmers, administrators and consumers. It provides secure document upload and admin verification, blockchain-backed certificate issuance, a geofenced marketplace (consumers buy within 100 km), and role-specific analytics and dashboards.

---

## Key features
- Role-based authentication: admin, farmer, consumer.
- Farmer: upload identity/certification documents, inline preview, product listing, view orders & analytics.
- Admin: review pending documents, verify/reject, issue immutable certificate (store hash on blockchain), audit trail.
- Consumer: verify blockchain-backed certificate, browse products filtered by distance (≤100 km), place orders, view analytics.
- File handling: MongoDB + GridFS for file storage; client-side preview via blob streams.
- Blockchain integration: store certificate hashes on-chain (Solidity + Ethers.js/Web3.js). Optionally use IPFS for certificate files.
- Security: JWT auth, role middleware, bcrypt for passwords, upload validation, HTTPS-ready.

---

## End-to-end workflow
1. Register / login as Farmer / Admin / Consumer.  
2. Farmer uploads documents (Aadhaar/certificate).  
3. Admin reviews and verifies; on verification backend issues certificate and records file hash on blockchain.  
4. Consumer verifies certificate against blockchain and can purchase products listed by farmers (geofenced to 100 km).  
5. Farmer and consumer access analytics relevant to their roles.

---

## Tech stack
- Frontend: React + Vite, Tailwind CSS, Framer Motion, Recharts, axios, lucide-react
- Backend: Node.js, Express, Mongoose (MongoDB)
- File storage: MongoDB GridFS (streaming uploads)
- Blockchain: Solidity smart contract, Ethers.js or Web3.js (Ethereum testnet or private chain). IPFS optional.
- Auth & security: JWT, bcrypt

---

## Repository layout (example)
- frontend/ — React app (Vite)
- backend/ — Express app (routes, controllers, models)
- docker-compose.yml (optional)
- README.md

---

## Geofencing (distance check)
- Consumer purchase restricted to farmers within a 100 km radius.
- Use Haversine formula server-side to compute distance between consumer and farmer coordinates (validate on backend).

---

## Blockchain certificate flow (concept)
- On admin verification: compute document/certificate file hash (SHA256).
- Optional: upload certificate file to IPFS and get CID.
- Call smart contract method to register {farmerId, docType, fileHash, ipfsCid, timestamp} and store tx hash in DB.
- Consumer verification: compare file hash or IPFS CID against on-chain record.

---

## Notes & recommendations
- Email update: client intentionally marks email readonly and excludes it from profile update payload. Use support flow for email changes.
- Keep file uploads size/type validated; GridFS avoids storing files on server disk.
- Use testnets (Goerli, Sepolia) or private chains when developing blockchain features to avoid costs.
