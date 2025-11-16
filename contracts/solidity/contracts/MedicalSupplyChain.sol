// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MedicalSupplyChain
 * @dev Blockchain-based medical supply chain transparency platform
 * @notice Tracks pharmaceutical products from manufacturer to patient
 */
contract MedicalSupplyChain {
    
    // ============ Structs ============
    
    struct Product {
        uint32 id;
        string name;
        string batchNumber;
        address manufacturer;
        string manufacturerName;
        uint32 quantity;
        uint64 mfgDate;
        uint64 expiryDate;
        string category;
        address currentHolder;
        bool isAuthentic;
        uint64 createdAt;
    }
    
    struct Transfer {
        uint32 productId;
        address from;
        address to;
        uint64 timestamp;
        string location;
        bool verified;
    }
    
    // ============ State Variables ============
    
    address public owner;
    uint32 public nextProductId;
    
    mapping(uint32 => Product) public products;
    mapping(uint32 => Transfer[]) public transferHistory;
    mapping(address => bool) public authorizedManufacturers;
    
    // ============ Events ============
    
    event ProductRegistered(
        uint32 indexed productId,
        address indexed manufacturer,
        string name,
        string batchNumber
    );
    
    event CustodyTransferred(
        uint32 indexed productId,
        address indexed from,
        address indexed to,
        string location
    );
    
    event ManufacturerAuthorized(
        address indexed manufacturer,
        bool authorized
    );
    
    // ============ Errors ============
    
    error ProductNotFound();
    error NotAuthorizedManufacturer();
    error NotCurrentHolder();
    error OnlyOwner();
    error InvalidTransfer();
    
    // ============ Modifiers ============
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
    
    modifier onlyAuthorizedManufacturer() {
        if (!authorizedManufacturers[msg.sender]) revert NotAuthorizedManufacturer();
        _;
    }
    
    modifier productExists(uint32 productId) {
        if (products[productId].id == 0) revert ProductNotFound();
        _;
    }
    
    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
        nextProductId = 1;
        authorizedManufacturers[msg.sender] = true; // Owner is automatically authorized
    }
    
    // ============ Product Management ============
    
    /**
     * @dev Register a new medical product on the blockchain
     * @param name Product name (e.g., "Amoxicillin 500mg")
     * @param batchNumber Batch identifier
     * @param manufacturerName Name of manufacturing company
     * @param quantity Number of units in batch
     * @param mfgDate Manufacturing date (Unix timestamp)
     * @param expiryDate Expiration date (Unix timestamp)
     * @param category Product category (e.g., "Antibiotic")
     * @return productId The unique ID assigned to the product
     */
    function registerProduct(
        string memory name,
        string memory batchNumber,
        string memory manufacturerName,
        uint32 quantity,
        uint64 mfgDate,
        uint64 expiryDate,
        string memory category
    ) external onlyAuthorizedManufacturer returns (uint32) {
        uint32 productId = nextProductId;
        
        products[productId] = Product({
            id: productId,
            name: name,
            batchNumber: batchNumber,
            manufacturer: msg.sender,
            manufacturerName: manufacturerName,
            quantity: quantity,
            mfgDate: mfgDate,
            expiryDate: expiryDate,
            category: category,
            currentHolder: msg.sender,
            isAuthentic: true,
            createdAt: uint64(block.timestamp)
        });
        
        nextProductId++;
        
        emit ProductRegistered(productId, msg.sender, name, batchNumber);
        
        return productId;
    }
    
    /**
     * @dev Transfer custody of a product to another party
     * @param productId ID of the product to transfer
     * @param to Address of the new holder
     * @param location Current location of the product
     */
    function transferCustody(
        uint32 productId,
        address to,
        string memory location
    ) external productExists(productId) {
        Product storage product = products[productId];
        
        if (product.currentHolder != msg.sender) revert NotCurrentHolder();
        if (to == address(0)) revert InvalidTransfer();
        
        // Update product holder
        product.currentHolder = to;
        
        // Record transfer
        transferHistory[productId].push(Transfer({
            productId: productId,
            from: msg.sender,
            to: to,
            timestamp: uint64(block.timestamp),
            location: location,
            verified: true
        }));
        
        emit CustodyTransferred(productId, msg.sender, to, location);
    }
    
    /**
     * @dev Verify product authenticity and get details
     * @param productId ID of the product to verify
     * @return Product struct with all details
     */
    function verifyProduct(uint32 productId) 
        external 
        view 
        productExists(productId) 
        returns (Product memory) 
    {
        return products[productId];
    }
    
    /**
     * @dev Get complete transfer history for a product
     * @param productId ID of the product
     * @return Array of all transfers
     */
    function getTransferHistory(uint32 productId) 
        external 
        view 
        returns (Transfer[] memory) 
    {
        return transferHistory[productId];
    }
    
    // ============ Manufacturer Management ============
    
    /**
     * @dev Authorize or revoke manufacturer status
     * @param manufacturer Address to authorize/revoke
     * @param authorized True to authorize, false to revoke
     */
    function authorizeManufacturer(address manufacturer, bool authorized) 
        external 
        onlyOwner 
    {
        authorizedManufacturers[manufacturer] = authorized;
        emit ManufacturerAuthorized(manufacturer, authorized);
    }
    
    /**
     * @dev Check if an address is an authorized manufacturer
     * @param account Address to check
     * @return True if authorized, false otherwise
     */
    function isAuthorizedManufacturer(address account) 
        external 
        view 
        returns (bool) 
    {
        return authorizedManufacturers[account];
    }
    
    // ============ Utility Functions ============
    
    /**
     * @dev Get all products registered by a specific manufacturer
     * @param manufacturer Address of the manufacturer
     * @return Array of product IDs
     */
    function getProductsByManufacturer(address manufacturer) 
        external 
        view 
        returns (uint32[] memory) 
    {
        // Count products first
        uint32 count = 0;
        for (uint32 i = 1; i < nextProductId; i++) {
            if (products[i].manufacturer == manufacturer) {
                count++;
            }
        }
        
        // Create array and populate
        uint32[] memory productIds = new uint32[](count);
        uint32 index = 0;
        for (uint32 i = 1; i < nextProductId; i++) {
            if (products[i].manufacturer == manufacturer) {
                productIds[index] = i;
                index++;
            }
        }
        
        return productIds;
    }
    
    /**
     * @dev Get the contract owner address
     * @return Address of the owner
     */
    function getOwner() external view returns (address) {
        return owner;
    }
    
    /**
     * @dev Get the next product ID that will be assigned
     * @return Next product ID
     */
    function getNextProductId() external view returns (uint32) {
        return nextProductId;
    }
    
    /**
     * @dev Check if a product exists
     * @param productId ID to check
     * @return True if exists, false otherwise
     */
    function productExistsCheck(uint32 productId) external view returns (bool) {
        return products[productId].id != 0;
    }
    
    /**
     * @dev Get transfer count for a product
     * @param productId ID of the product
     * @return Number of transfers
     */
    function getTransferCount(uint32 productId) external view returns (uint256) {
        return transferHistory[productId].length;
    }
}
