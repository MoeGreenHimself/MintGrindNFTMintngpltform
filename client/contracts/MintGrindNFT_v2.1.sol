// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./PaymentSplitter.sol";
import "erc721a/contracts/ERC721A.sol";

/**
 * @title MintGrindNFT
 * @dev NFT minting contract supporting any ERC-20 token for payment
 * 
 * Security Features:
 * - Reentrancy guard on all external functions
 * - Signature replay protection with chain ID validation
 * - Canonical signature check (s-value validation)
 * - PaymentSplitter for secure fund distribution
 * - Pausable for emergency stops
 * - Whitelist support with nonce-based replay prevention
 */
contract MintGrindNFT is ERC721A, Ownable, ReentrancyGuard, Pausable, PaymentSplitter {
  // ============ State Variables ============
  
  uint256 public mintPrice;
  uint256 public maxSupply;
  uint256 public maxPerWallet;
  address public signer;
  uint256 public immutable TARGET_CHAIN_ID;
  
  // ERC-20 token payment support
  address public paymentToken; // Address of ERC-20 token for payment (address(0) = native coin)
  mapping(address => bool) public acceptedTokens; // Tokens accepted for payment
  
  // Whitelist and nonce tracking
  mapping(address => uint256) public nonces;
  mapping(bytes32 => bool) public usedHashes;
  mapping(address => uint256) public mintedPerWallet;

  // ============ Events ============
  
  event Minted(
    address indexed to,
    uint256 indexed tokenId,
    string title,
    string description,
    address paymentToken,
    uint256 amount
  );
  
  event PaymentTokenUpdated(address indexed newToken);
  event TokenAcceptanceUpdated(address indexed token, bool accepted);
  event MintPriceUpdated(uint256 newPrice);
  event MaxSupplyUpdated(uint256 newMaxSupply);

  // ============ Constructor ============
  
  /**
   * @param name_ NFT collection name
   * @param symbol_ NFT collection symbol
   * @param mintPrice_ Price per mint (in payment token or native coin)
   * @param maxSupply_ Maximum number of NFTs that can be minted
   * @param maxPerWallet_ Maximum mints per wallet
   * @param signer_ Address that signs whitelist messages
   * @param initialOwner_ Contract owner address
   * @param targetChainId_ Target blockchain ID (1 for Ethereum, 137 for Polygon)
   * @param payees_ Array of addresses to receive funds
   * @param shares_ Array of share amounts (must sum to 100)
   * @param paymentToken_ ERC-20 token address for payment (address(0) for native coin)
   */
  constructor(
    string memory name_,
    string memory symbol_,
    uint256 mintPrice_,
    uint256 maxSupply_,
    uint256 maxPerWallet_,
    address signer_,
    address initialOwner_,
    uint256 targetChainId_,
    address[] memory payees_,
    uint256[] memory shares_,
    address paymentToken_
  ) ERC721A(name_, symbol_) Ownable(initialOwner_) PaymentSplitter(payees_, shares_) {
    require(mintPrice_ > 0, "Mint price must be > 0");
    require(maxSupply_ > 0, "Max supply must be > 0");
    require(maxPerWallet_ > 0, "Max per wallet must be > 0");
    require(signer_ != address(0), "Signer cannot be zero address");
    require(targetChainId_ > 0, "Chain ID must be > 0");
    
    uint256 totalShares = 0;
    for (uint256 i = 0; i < shares_.length; i++) {
      totalShares += shares_[i];
    }
    require(totalShares == 100, "Shares must sum to 100");

    mintPrice = mintPrice_;
    maxSupply = maxSupply_;
    maxPerWallet = maxPerWallet_;
    signer = signer_;
    TARGET_CHAIN_ID = targetChainId_;
    paymentToken = paymentToken_;
    
    // Accept the payment token by default
    if (paymentToken_ != address(0)) {
      acceptedTokens[paymentToken_] = true;
    }
  }

  // ============ Admin Functions ============
  
  /**
   * @dev Update the payment token
   */
  function setPaymentToken(address newToken_) external onlyOwner {
    paymentToken = newToken_;
    acceptedTokens[newToken_] = true;
    emit PaymentTokenUpdated(newToken_);
  }

  /**
   * @dev Add or remove accepted tokens
   */
  function setTokenAcceptance(address token_, bool accepted_) external onlyOwner {
    require(token_ != address(0), "Cannot set zero address");
    acceptedTokens[token_] = accepted_;
    emit TokenAcceptanceUpdated(token_, accepted_);
  }

  /**
   * @dev Update mint price
   */
  function setMintPrice(uint256 newPrice_) external onlyOwner {
    require(newPrice_ > 0, "Price must be > 0");
    mintPrice = newPrice_;
    emit MintPriceUpdated(newPrice_);
  }

  /**
   * @dev Update max supply (with timelock recommended for production)
   * ⚠️ WARNING: Front-running risk. Use a timelock for production.
   */
  function setMaxSupply(uint256 newMaxSupply_) external onlyOwner {
    require(newMaxSupply_ >= totalSupply(), "New max supply must be >= current supply");
    maxSupply = newMaxSupply_;
    emit MaxSupplyUpdated(newMaxSupply_);
  }

  /**
   * @dev Pause minting
   */
  function pause() external onlyOwner {
    _pause();
  }

  /**
   * @dev Unpause minting
   */
  function unpause() external onlyOwner {
    _unpause();
  }

  // ============ Minting Functions ============
  
  /**
   * @dev Mint NFT with ERC-20 token payment
   * @param quantity_ Number of NFTs to mint
   * @param title_ NFT title
   * @param description_ NFT description
   * @param token_ ERC-20 token address (address(0) for native coin)
   * @param expiry_ Signature expiry timestamp
   * @param signature_ Whitelist signature from signer
   */
  function mint(
    uint256 quantity_,
    string memory title_,
    string memory description_,
    address token_,
    uint256 expiry_,
    bytes memory signature_
  ) external payable nonReentrant whenNotPaused {
    // ============ Validations ============
    
    require(msg.sender != address(0), "Zero address");
    require(quantity_ > 0, "Quantity must be > 0");
    require(totalSupply() + quantity_ <= maxSupply, "Exceeds max supply");
    require(mintedPerWallet[msg.sender] + quantity_ <= maxPerWallet, "Exceeds per-wallet limit");
    require(block.chainid == TARGET_CHAIN_ID, "Wrong chain ID");
    require(block.timestamp <= expiry_, "Signature expired");
    require(acceptedTokens[token_], "Token not accepted");

    // ============ Signature Validation ============
    
    bytes32 messageHash = keccak256(
      abi.encodePacked(
        msg.sender,
        quantity_,
        token_,
        block.chainid,
        nonces[msg.sender],
        expiry_
      )
    );

    bytes32 ethSignedMessageHash = keccak256(
      abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
    );

    (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature_);
    
    // Canonical s-value check (prevent signature malleability)
    require(
      uint256(s) <= 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0,
      "Invalid s"
    );

    address recoveredSigner = ecrecover(ethSignedMessageHash, v, r, s);
    require(recoveredSigner == signer, "Invalid signature");
    require(!usedHashes[ethSignedMessageHash], "Signature already used");

    // ============ Payment Handling ============
    
    uint256 totalCost = mintPrice * quantity_;

    if (token_ == address(0)) {
      // Native coin payment (ETH or MATIC)
      require(msg.value >= totalCost, "Insufficient payment");
      
      // Refund excess
      if (msg.value > totalCost) {
        (bool success, ) = msg.sender.call{value: msg.value - totalCost}("");
        require(success, "Refund failed");
      }
    } else {
      // ERC-20 token payment
      require(msg.value == 0, "Do not send native coin with ERC-20 payment");
      
      IERC20 token = IERC20(token_);
      require(
        token.transferFrom(msg.sender, address(this), totalCost),
        "Token transfer failed"
      );
    }

    // ============ Minting ============
    
    nonces[msg.sender]++;
    usedHashes[ethSignedMessageHash] = true;
    mintedPerWallet[msg.sender] += quantity_;

    uint256 startTokenId = totalSupply();
    _safeMint(msg.sender, quantity_);

    emit Minted(
      msg.sender,
      startTokenId,
      title_,
      description_,
      token_,
      totalCost
    );
  }

  // ============ Helper Functions ============
  
  /**
   * @dev Split signature into r, s, v components
   */
  function splitSignature(bytes memory sig_)
    internal
    pure
    returns (
      bytes32 r,
      bytes32 s,
      uint8 v
    )
  {
    require(sig_.length == 65, "Invalid signature length");

    assembly {
      r := mload(add(sig_, 32))
      s := mload(add(sig_, 64))
      v := byte(0, mload(add(sig_, 96)))
    }
  }

  /**
   * @dev Check if user can mint
   */
  function canMint(address user_, uint256 quantity_) external view returns (bool) {
    return (totalSupply() + quantity_ <= maxSupply &&
      mintedPerWallet[user_] + quantity_ <= maxPerWallet);
  }

  /**
   * @dev Get remaining supply
   */
  function remainingSupply() external view returns (uint256) {
    return maxSupply - totalSupply();
  }

  /**
   * @dev Get minted count for wallet
   */
  function getMintedCount(address user_) external view returns (uint256) {
    return mintedPerWallet[user_];
  }

  /**
   * @dev Get remaining mints for wallet
   */
  function getRemainingMints(address user_) external view returns (uint256) {
    uint256 minted = mintedPerWallet[user_];
    if (minted >= maxPerWallet) return 0;
    return maxPerWallet - minted;
  }

  // ============ Token Recovery ============
  
  /**
   * @dev Recover ERC-20 tokens sent to contract
   */
  function recoverToken(address token_) external onlyOwner nonReentrant {
    IERC20 token = IERC20(token_);
    uint256 balance = token.balanceOf(address(this));
    require(balance > 0, "No tokens to recover");
    require(token.transfer(owner(), balance), "Transfer failed");
  }

  /**
   * @dev Recover native coins (use PaymentSplitter.release() for intended distribution)
   */
  function recoverNative() external onlyOwner nonReentrant {
    uint256 balance = address(this).balance;
    require(balance > 0, "No native coins to recover");
    (bool success, ) = owner().call{value: balance}("");
    require(success, "Transfer failed");
  }

  // ============ Receive Functions ============
  
  receive() external payable {}
  fallback() external payable {}
}
