# MintGrind Signature Generation Flow - Technical Documentation

## Overview

The signature generation flow is the core security mechanism of MintGrind. It ensures that only authorized wallets can mint NFTs and prevents replay attacks, signature malleability, and cross-chain attacks.

---

## Architecture

### Components

1. **Frontend**: Requests signature from backend
2. **Backend**: Generates and signs the message
3. **Smart Contract**: Validates signature on-chain
4. **Database**: Tracks nonces to prevent replay

---

## Detailed Flow

### Phase 1: Signature Request

**User Action:**
```
User enters wallet address → Clicks "Mint" → Frontend requests signature
```

**Frontend Request:**
```typescript
POST /api/trpc/mint.getSignature
Content-Type: application/json

{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
  "quantity": 1,
  "chainId": 11155111,
  "paymentToken": "0x1c7D4B196cb0C6f48185d377e1B51EDF08CD7f55"
}
```

### Phase 2: Backend Message Construction

**Message Creation:**
```solidity
// Backend constructs the message in the same format as the contract expects
bytes32 messageHash = keccak256(
  abi.encodePacked(
    walletAddress,           // 0x742d35Cc6634C0532925a3b844Bc9e7595f42bE
    quantity,                // 1
    chainId,                 // 11155111 (Ethereum Sepolia)
    paymentToken,            // 0x1c7D4B196cb0C6f48185d377e1B51EDF08CD7f55
    nonce,                   // 0 (first mint for this wallet)
    expiry                   // 1720000000 (5 minutes from now)
  )
);
```

**Nonce Lookup:**
```typescript
// Backend queries database for wallet's current nonce
const nonce = await db.query(
  "SELECT nonce FROM wallet_nonces WHERE address = ?",
  [walletAddress]
);
// Returns: 0 (first mint), 1 (second mint), etc.
```

**Expiry Calculation:**
```typescript
// Signature valid for 5 minutes
const expiry = Math.floor(Date.now() / 1000) + 300; // +5 minutes
```

### Phase 3: Message Signing

**Signature Generation:**
```typescript
import { ethers } from "ethers";

// Create wallet from signer private key
const signer = new ethers.Wallet(MINT_SIGNER_PRIVATE_KEY);

// Hash the message (EIP-191 format)
const messageHash = ethers.solidityPacked(
  ["address", "uint256", "uint256", "address", "uint256", "uint256"],
  [walletAddress, quantity, chainId, paymentToken, nonce, expiry]
);

const hash = ethers.keccak256(messageHash);

// Sign the hash
const signature = signer.signMessage(ethers.getBytes(hash));
// Returns: 0x1234...5678 (132 characters)
```

**Signature Components:**
```
Signature = r (32 bytes) + s (32 bytes) + v (1 byte)
Total: 65 bytes = 130 hex characters + 0x prefix
```

### Phase 4: Backend Response

**Signature Response:**
```typescript
{
  "signature": "0x1234567890abcdef...",
  "expiry": 1720000000,
  "nonce": 0
}
```

### Phase 5: Frontend Submission to Contract

**User submits mint transaction:**
```typescript
const tx = await contract.mint(
  walletAddress,
  quantity,
  paymentToken,
  nonce,
  expiry,
  signature
);
```

### Phase 6: On-Chain Signature Verification

**Smart Contract Validation:**
```solidity
function mint(
  address to,
  uint256 quantity,
  address paymentToken,
  uint256 nonce,
  uint256 expiry,
  bytes calldata signature
) external nonReentrant whenNotPaused {
  // 1. Check expiry
  require(block.timestamp <= expiry, "Signature expired");

  // 2. Check nonce hasn't been used
  require(!usedHashes[keccak256(abi.encodePacked(to, nonce))], "Nonce used");

  // 3. Reconstruct message
  bytes32 messageHash = keccak256(
    abi.encodePacked(
      to,
      quantity,
      block.chainid,
      paymentToken,
      nonce,
      expiry
    )
  );

  // 4. Verify signature
  address recoveredSigner = recoverSigner(messageHash, signature);
  require(recoveredSigner == signer, "Invalid signature");

  // 5. Mark nonce as used
  usedHashes[messageHash] = true;

  // 6. Process payment and mint
  // ...
}
```

---

## Security Features

### 1. Replay Attack Prevention

**Mechanism: Nonce Tracking**

```typescript
// Each wallet has a unique nonce
// Nonce increments after each successful mint
// Old signatures with old nonces are rejected

// Example:
// Wallet A, Nonce 0 → Mint #1 ✓
// Wallet A, Nonce 0 → Mint #2 ✗ (nonce already used)
// Wallet A, Nonce 1 → Mint #2 ✓
```

**Database Schema:**
```sql
CREATE TABLE wallet_nonces (
  address VARCHAR(42) PRIMARY KEY,
  nonce INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Cross-Chain Replay Prevention

**Mechanism: Chain ID Inclusion**

```typescript
// Message includes block.chainid
// Prevents using Sepolia signature on Polygon

// Sepolia (chainId: 11155111)
messageHash = keccak256(abi.encodePacked(wallet, ..., 11155111, ...));

// Polygon (chainId: 137)
messageHash = keccak256(abi.encodePacked(wallet, ..., 137, ...));

// Different hashes → Different signatures → Cross-chain replay prevented
```

### 3. Signature Expiry

**Mechanism: Time-Based Validation**

```typescript
// Signature valid for 5 minutes
// Prevents using old signatures

// Example:
// Generated: 10:00:00
// Expires: 10:05:00
// 10:04:59 → ✓ Valid
// 10:05:01 → ✗ Expired
```

### 4. Signature Malleability Prevention

**Mechanism: Canonical S-Value Check**

```solidity
// Verify s-value is in lower half of curve
// Prevents creating multiple valid signatures from one message

require(
  uint256(s) <= 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0,
  "Invalid signature s-value"
);
```

### 5. Address Validation

**Mechanism: Zero Address Check**

```solidity
// Prevent minting to address(0)
require(to != address(0), "Invalid recipient");
```

---

## Request/Response Examples

### Example 1: First-Time Mint

**Request:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
  "quantity": 1,
  "chainId": 11155111,
  "paymentToken": "0x1c7D4B196cb0C6f48185d377e1B51EDF08CD7f55"
}
```

**Backend Processing:**
```
1. Lookup nonce for wallet: 0
2. Calculate expiry: now + 5 minutes
3. Construct message with (wallet, quantity, chainId, token, nonce=0, expiry)
4. Sign message with MINT_SIGNER_PRIVATE_KEY
5. Return signature
```

**Response:**
```json
{
  "signature": "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z",
  "expiry": 1720000300,
  "nonce": 0
}
```

### Example 2: Replay Attack Attempt

**Attacker tries to use same signature twice:**

**First Mint (Success):**
```json
{
  "signature": "0x...",
  "expiry": 1720000300,
  "nonce": 0
}
```
✓ Contract accepts, marks nonce 0 as used

**Second Mint (Failure):**
```json
{
  "signature": "0x...",
  "expiry": 1720000300,
  "nonce": 0
}
```
✗ Contract rejects: "Nonce already used"

### Example 3: Cross-Chain Replay Attempt

**Attacker tries to use Sepolia signature on Polygon:**

**Original Signature (Sepolia):**
```
Message includes: chainId = 11155111
Signature = sign(message_sepolia)
```

**Attempted Replay (Polygon):**
```
Contract reconstructs: chainId = 137
messageHash_polygon ≠ messageHash_sepolia
Recovered signer ≠ expected signer
✗ Contract rejects: "Invalid signature"
```

---

## Error Scenarios

### Scenario 1: Signature Expired

```
Time: 10:05:01
Signature expiry: 10:05:00
Error: "Signature expired"
Solution: Request new signature
```

### Scenario 2: Nonce Already Used

```
Wallet A, Nonce 0 → Already minted
User tries: Wallet A, Nonce 0 again
Error: "Nonce already used"
Solution: Backend should provide new nonce (1) for next mint
```

### Scenario 3: Invalid Signature

```
User modifies signature bytes
Contract verifies: signature doesn't match message
Error: "Invalid signature"
Solution: Request new signature from backend
```

### Scenario 4: Wrong Chain

```
Generated on: Sepolia (chainId: 11155111)
Submitted on: Polygon (chainId: 137)
Error: "Invalid signature" (different message hash)
Solution: Ensure user is on correct chain
```

---

## Backend Implementation

### Signature Generation Code

```typescript
// server/routers/mint.ts

export async function generateSignature(
  walletAddress: string,
  quantity: number,
  chainId: number,
  paymentToken: string
) {
  // 1. Validate inputs
  if (!ethers.isAddress(walletAddress)) {
    throw new Error("Invalid wallet address");
  }

  // 2. Get current nonce
  const nonce = await db.query(
    "SELECT nonce FROM wallet_nonces WHERE address = ?",
    [walletAddress.toLowerCase()]
  );

  const currentNonce = nonce?.[0]?.nonce ?? 0;

  // 3. Calculate expiry (5 minutes from now)
  const expiry = Math.floor(Date.now() / 1000) + 300;

  // 4. Create message
  const messageHash = ethers.solidityPacked(
    ["address", "uint256", "uint256", "address", "uint256", "uint256"],
    [walletAddress, quantity, chainId, paymentToken, currentNonce, expiry]
  );

  const hash = ethers.keccak256(messageHash);

  // 5. Sign message
  const signer = new ethers.Wallet(process.env.MINT_SIGNER_PRIVATE_KEY!);
  const signature = signer.signMessage(ethers.getBytes(hash));

  // 6. Return signature
  return {
    signature,
    expiry,
    nonce: currentNonce,
  };
}
```

---

## Testing

### Unit Tests

```typescript
describe("Signature Generation", () => {
  it("should generate valid signature", async () => {
    const sig = await generateSignature(
      "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE",
      1,
      11155111,
      "0x1c7D4B196cb0C6f48185d377e1B51EDF08CD7f55"
    );

    expect(sig.signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    expect(sig.expiry).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(sig.nonce).toBe(0);
  });

  it("should prevent replay attacks", async () => {
    // First mint succeeds
    const sig1 = await generateSignature(...);
    await contract.mint(..., sig1.signature);

    // Second mint with same signature fails
    await expect(
      contract.mint(..., sig1.signature)
    ).rejects.toThrow("Nonce already used");
  });
});
```

---

## Monitoring & Debugging

### Log Signature Generation

```typescript
console.log("Signature Generated:", {
  wallet: walletAddress,
  nonce: currentNonce,
  expiry: new Date(expiry * 1000).toISOString(),
  signature: signature.substring(0, 20) + "...",
});
```

### Verify Signature On-Chain

```typescript
// Use ethers.js to verify
const recovered = ethers.recoverAddress(hash, signature);
console.log("Recovered signer:", recovered);
console.log("Expected signer:", process.env.MINT_SIGNER_ADDRESS);
console.log("Match:", recovered === process.env.MINT_SIGNER_ADDRESS);
```

---

## Summary

The signature generation flow provides multi-layered security:

1. **Nonce** prevents replay attacks
2. **Chain ID** prevents cross-chain attacks
3. **Expiry** limits signature lifetime
4. **Canonical S-value** prevents malleability
5. **Address validation** prevents edge cases

This ensures only authorized wallets can mint, and each signature can only be used once on its intended chain.

---

**For questions or issues, contact the development team.**
