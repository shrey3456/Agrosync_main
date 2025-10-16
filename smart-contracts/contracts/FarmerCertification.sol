// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title FarmerCertification
 * @dev Smart contract for issuing and verifying farmer certificates
 */
contract FarmerCertification {
    struct Certificate {
        bool isValid;
        uint256 issuedAt;
        uint256 expiryDate;
        string aadharHash;
        string certificateHash;
        string farmerId;      // Store the farmer's database ID instead of wallet address
        string farmerName;    // Include farmer name for readable verification
    }

    address public admin;
    mapping(string => Certificate) public certificates;  // Map by certificateId instead of farmer address
    
    // Events
    event CertificateIssued(string certificateId, string farmerId, uint256 expiryDate);
    event CertificateRevoked(string certificateId, string reason);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    
    // Errors
    error Unauthorized();
    error InvalidParameters();
    error CertificateIdAlreadyUsed();

    modifier onlyAdmin() {
        if (msg.sender != admin) {
            revert Unauthorized();
        }
        _;
    }

    constructor() {
        admin = msg.sender;
    }
    
    /**
     * @dev Issues a certificate to a farmer
     * @param _certificateId Unique certificate ID
     * @param _farmerId The database ID of the farmer
     * @param _farmerName The name of the farmer
     * @param _aadharHash Hash of the Aadhar card
     * @param _certificateHash Hash of the government certificate
     */
    function issueCertificate(
        string memory _certificateId,
        string memory _farmerId,
        string memory _farmerName,
        string memory _aadharHash,
        string memory _certificateHash
    ) public onlyAdmin {
        if (bytes(_certificateId).length == 0 || bytes(_farmerId).length == 0) {
            revert InvalidParameters();
        }
        
        if (bytes(_aadharHash).length == 0 || bytes(_certificateHash).length == 0) {
            revert InvalidParameters();
        }
        
        if (certificates[_certificateId].issuedAt != 0) {
            revert CertificateIdAlreadyUsed();
        }
        
        uint256 issuanceTime = block.timestamp;
        uint256 expiryDate = issuanceTime + 365 days; // 1 year validity
        
        certificates[_certificateId] = Certificate({
            isValid: true,
            issuedAt: issuanceTime,
            expiryDate: expiryDate,
            aadharHash: _aadharHash,
            certificateHash: _certificateHash,
            farmerId: _farmerId,
            farmerName: _farmerName
        });
        
        emit CertificateIssued(_certificateId, _farmerId, expiryDate);
    }
    
    /**
     * @dev Revokes a certificate
     * @param _certificateId The certificate ID to revoke
     * @param _reason Reason for revocation
     */
    function revokeCertificate(string memory _certificateId, string memory _reason) public onlyAdmin {
        if (certificates[_certificateId].issuedAt == 0) {
            revert InvalidParameters();
        }
        
        certificates[_certificateId].isValid = false;
        
        emit CertificateRevoked(_certificateId, _reason);
    }
    
    /**
     * @dev Verifies a certificate by ID
     * @param _certificateId Certificate ID
     * @return isValid Whether the certificate is valid
     * @return farmerId The database ID of the farmer
     * @return farmerName The name of the farmer
     * @return expiryDate When the certificate expires
     */
    function verifyCertificateById(string memory _certificateId) public view returns (
        bool isValid,
        string memory farmerId,
        string memory farmerName,
        uint256 expiryDate
    ) {
        Certificate memory cert = certificates[_certificateId];
        
        if (cert.issuedAt == 0) {
            return (false, "", "", 0);
        }
        
        // Certificate is valid if it is marked as valid and not expired
        bool valid = cert.isValid && block.timestamp <= cert.expiryDate;
        
        return (
            valid,
            cert.farmerId,
            cert.farmerName,
            cert.expiryDate
        );
    }
    
    /**
     * @dev Changes the admin address
     * @param _newAdmin New admin address
     */
    function changeAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        
        address oldAdmin = admin;
        admin = _newAdmin;
        
        emit AdminChanged(oldAdmin, _newAdmin);
    }
}