# MintGrind Frontend Integration Guide

## Overview

This guide explains how to integrate the MintGrind NFT minting flow into your frontend application. It covers chain configuration, tRPC API usage, signature generation, token selection, and the complete mint flow.

---

## Table of Contents

1. [Chain Configuration](#chain-configuration)
2. [tRPC API Reference](#trpc-api-reference)
3. [Signature Generation Flow](#signature-generation-flow)
4. [Token Selection](#token-selection)
5. [Complete Mint Flow](#complete-mint-flow)
6. [Error Handling](#error-handling)
7. [Code Examples](#code-examples)

---

## Chain Configuration

### Setup

Import the chain configuration in your component:

```typescript
import { DEFAULT_CHAINS, CHAIN_CONFIG, getChainCurrency } from "@shared/chainConfig";
import type { ChainId } from "@shared/chainConfig";
```

### Available Chains

```typescript
// Ethereum Sepolia (Testnet)
const sepoliaConfig = CHAIN_CONFIG[11155111];
// {
//   name: "Ethereum Sepolia",
//   contractAddress: "0x...",
//   rpcUrl: "https://rpc.sepolia.org",
//   chainId: 11155111,
//   blockExplorer: "https://sepolia.etherscan.io",
//   gasSettings: { baseFee: 20, priorityFee: 2 }
// }

// Polygon Amoy (Testnet)
const amoyConfig = CHAIN_CONFIG[80002];
// {
//   name: "Polygon Amoy",
//   contractAddress: "0x...",
//   rpcUrl: "https://rpc-amoy.polygon.technology",
//   chainId: 80002,
//   blockExplorer: "https://amoy.polygonscan.com",
//   gasSettings: { baseFee: 30, priorityFee: 1 }
// }
```

### Get Currency Symbol

```typescript
const currency = getChainCurrency(chainId);
// Returns: "ETH" for Sepolia, "MATIC" for Polygon
```

---

## tRPC API Reference

### 1. Get Signature for Minting

**Endpoint:** `mint.getSignature`

**Request:**
```typescript
{
  walletAddress: string;      // User's wallet (0x...)
  quantity: number;           // Number of NFTs to mint
  chainId: ChainId;          // Target chain
  paymentToken: string;      // ERC-20 token address
}
```

**Response:**
```typescript
{
  signature: string;         // Signed message for mint()
  expiry: number;           // Unix timestamp (valid for 5 minutes)
  nonce: number;            // Replay protection nonce
}
```

**Usage:**
```typescript
const { data: signatureData } = await trpc.mint.getSignature.useQuery({
  walletAddress: "0x...",
  quantity: 1,
  chainId: 11155111,
  paymentToken: "0x...",
});
```

### 2. Validate Whitelist

**Endpoint:** `mint.validateWhitelist`

**Request:**
```typescript
{
  walletAddress: string;
  chainId: ChainId;
}
```

**Response:**
```typescript
{
  isWhitelisted: boolean;
  reason?: string;
}
```

**Usage:**
```typescript
const { data: validation } = await trpc.mint.validateWhitelist.useQuery({
  walletAddress: "0x...",
  chainId: 11155111,
});
```

---

## Signature Generation Flow

### Overview

The signature generation flow provides cryptographic proof that a wallet is authorized to mint, preventing unauthorized minting and replay attacks.

### Step-by-Step Flow

1. **User Initiates Mint**
   - User enters wallet address
   - Frontend requests signature from backend

2. **Backend Generates Signature**
   ```
   Message = keccak256(
     abi.encodePacked(
       walletAddress,
       quantity,
       chainId,
       paymentToken,
       nonce,
       expiry
     )
   )
   Signature = sign(Message, MINT_SIGNER_PRIVATE_KEY)
   ```

3. **Signature Validation**
   - Signature is valid for 5 minutes
   - Each wallet has a unique nonce (prevents replay)
   - Chain ID is verified (prevents cross-chain attacks)
   - Canonical signature check (prevents signature malleability)

4. **Frontend Submits Mint**
   - Send signature + expiry + nonce to smart contract
   - Contract verifies signature matches message
   - Contract checks nonce hasn't been used
   - Contract mints NFT to wallet

### Replay Protection

**Nonce Mechanism:**
- Each wallet has a unique nonce stored on-chain
- Nonce increments after each successful mint
- Old signatures with old nonces are rejected

**Chain ID Verification:**
- Signature includes target chain ID
- Prevents using Sepolia signature on Polygon
- Prevents cross-chain replay attacks

**Canonical Signature Check:**
- Verifies s-value is in lower half (< secp256k1n/2)
- Prevents signature malleability attacks
- Ensures only one valid signature per message

---

## Token Selection

### Supported Tokens

```typescript
import { TESTNET_TOKENS } from "@shared/chainConfig";

// Get tokens for a specific chain
const sepoliaTokens = TESTNET_TOKENS[11155111];
// [
//   { address: "0x...", symbol: "USDC", name: "USD Coin", decimals: 6 },
//   { address: "0x...", symbol: "USDT", name: "Tether USD", decimals: 6 },
//   { address: "0x...", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
//   { address: "0x...", symbol: "WBTC", name: "Wrapped Bitcoin", decimals: 8 },
// ]
```

### Token Approval Flow

Before minting, users must approve the contract to spend their tokens:

```typescript
import { ethers } from "ethers";

// 1. Create contract instance
const tokenContract = new ethers.Contract(
  tokenAddress,
  ERC20_ABI,
  signer
);

// 2. Approve spending
const approveTx = await tokenContract.approve(
  contractAddress,
  ethers.parseUnits(amount, decimals)
);
await approveTx.wait();

// 3. Now user can mint
```

### Custom Token Support

Users can add custom ERC-20 tokens:

```typescript
const customToken = {
  address: "0x...",
  symbol: "CUSTOM",
  name: "Custom Token",
  decimals: 18,
};
```

---

## Complete Mint Flow

### Full User Journey

```typescript
import { mintNFT } from "@/lib/mintingEngine";

async function completeMintFlow(
  chainId: ChainId,
  walletAddress: string,
  paymentToken: Token,
  file: File,
  title: string,
  description: string
) {
  try {
    // Step 1: Get signature from backend
    const signatureResponse = await fetch("/api/trpc/mint.getSignature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress,
        quantity: 1,
        chainId,
        paymentToken: paymentToken.address,
      }),
    });

    const { signature, expiry } = await signatureResponse.json();

    // Step 2: Approve token spending (if needed)
    const provider = new ethers.JsonRpcProvider(CHAIN_CONFIG[chainId].rpcUrl);
    const signer = new ethers.Wallet(userPrivateKey, provider); // In real app, use MetaMask
    
    const tokenContract = new ethers.Contract(
      paymentToken.address,
      ERC20_ABI,
      signer
    );

    const approveTx = await tokenContract.approve(
      CHAIN_CONFIG[chainId].contractAddress,
      ethers.parseUnits("100", paymentToken.decimals)
    );
    await approveTx.wait();

    // Step 3: Mint NFT
    const result = await mintNFT({
      chainId,
      contractAddress: CHAIN_CONFIG[chainId].contractAddress,
      rpcUrl: CHAIN_CONFIG[chainId].rpcUrl,
      walletAddress,
      paymentToken: paymentToken.address,
      title,
      description,
      quantity: 1,
      signature,
      expiry,
    });

    if (result.success) {
      console.log("NFT minted:", result.transactionHash);
      return result;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Mint failed:", error);
    throw error;
  }
}
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid Ethereum Address` | Malformed wallet address | Validate with regex: `/^0x[a-fA-F0-9]{40}$/` |
| `Insufficient Balance` | Not enough tokens | Check balance before minting |
| `Signature Expired` | >5 minutes since generation | Request new signature |
| `Nonce Already Used` | Replay attack attempt | Increment nonce automatically |
| `Chain ID Mismatch` | Wrong chain selected | Verify chain before minting |
| `Approval Failed` | Token approval rejected | Retry approval or use different token |
| `Mint Failed` | Contract error | Check gas, contract status, whitelist |

### Error Handling Pattern

```typescript
try {
  const result = await mintNFT({...});
  
  if (result.success) {
    // Success - show confirmation
    showNotification("NFT minted successfully!");
  } else {
    // Handle specific errors
    if (result.error.includes("Signature expired")) {
      // Request new signature
      await getNewSignature();
    } else if (result.error.includes("Insufficient balance")) {
      // Show balance warning
      showWarning("Insufficient token balance");
    } else {
      // Generic error
      showError(result.error);
    }
  }
} catch (error) {
  console.error("Unexpected error:", error);
  showError("An unexpected error occurred");
}
```

---

## Code Examples

### Example 1: Chain Selector Component

```typescript
import { DEFAULT_CHAINS, CHAIN_CONFIG } from "@shared/chainConfig";
import type { ChainId } from "@shared/chainConfig";

export function ChainSelector({ 
  onSelect 
}: { 
  onSelect: (chainId: ChainId) => void 
}) {
  return (
    <div className="space-y-4">
      {DEFAULT_CHAINS.map((chainId) => {
        const config = CHAIN_CONFIG[chainId];
        return (
          <button
            key={chainId}
            onClick={() => onSelect(chainId)}
            className="w-full p-4 border border-cyan-500/40 rounded-lg hover:bg-cyan-950/30"
          >
            <h3 className="font-bold text-cyan-300">{config.name}</h3>
            <p className="text-sm text-cyan-300/60">
              Gas: {config.gasSettings.baseFee} Gwei
            </p>
          </button>
        );
      })}
    </div>
  );
}
```

### Example 2: Token Selector Component

```typescript
import { TESTNET_TOKENS } from "@shared/chainConfig";
import type { ChainId, Token } from "@shared/chainConfig";

export function TokenSelector({ 
  chainId, 
  onSelect 
}: { 
  chainId: ChainId;
  onSelect: (token: Token) => void;
}) {
  const tokens = TESTNET_TOKENS[chainId];

  return (
    <select 
      onChange={(e) => {
        const token = tokens.find(t => t.address === e.target.value);
        if (token) onSelect(token);
      }}
      className="w-full p-2 bg-cyan-950/30 border border-cyan-500/40 rounded text-cyan-300"
    >
      <option value="">Select a token</option>
      {tokens.map((token) => (
        <option key={token.address} value={token.address}>
          {token.symbol} - {token.name}
        </option>
      ))}
    </select>
  );
}
```

### Example 3: Mint Button with Error Handling

```typescript
import { useState } from "react";
import { mintNFT } from "@/lib/mintingEngine";
import { CHAIN_CONFIG } from "@shared/chainConfig";
import type { ChainId, Token } from "@shared/chainConfig";

export function MintButton({
  chainId,
  walletAddress,
  paymentToken,
  file,
  title,
  description,
}: {
  chainId: ChainId;
  walletAddress: string;
  paymentToken: Token;
  file: File;
  title: string;
  description: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMint = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get signature
      const signatureResponse = await fetch("/api/trpc/mint.getSignature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          quantity: 1,
          chainId,
          paymentToken: paymentToken.address,
        }),
      });

      if (!signatureResponse.ok) {
        throw new Error("Failed to get signature");
      }

      const { signature, expiry } = await signatureResponse.json();

      // Mint NFT
      const result = await mintNFT({
        chainId,
        contractAddress: CHAIN_CONFIG[chainId].contractAddress,
        rpcUrl: CHAIN_CONFIG[chainId].rpcUrl,
        walletAddress,
        paymentToken: paymentToken.address,
        title,
        description,
        quantity: 1,
        signature,
        expiry,
      });

      if (result.success) {
        alert(`NFT minted! TX: ${result.transactionHash}`);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleMint}
        disabled={isLoading}
        className="px-6 py-2 bg-emerald-500/40 border border-emerald-400 rounded text-emerald-300 disabled:opacity-50"
      >
        {isLoading ? "Minting..." : "Mint NFT"}
      </button>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  );
}
```

---

## Best Practices

1. **Always validate user input** before sending to backend
2. **Handle signature expiry** - request new signature if >5 minutes old
3. **Show loading states** during async operations
4. **Implement proper error handling** with user-friendly messages
5. **Verify chain ID** matches user's selected chain
6. **Check token balance** before attempting approval
7. **Use environment variables** for contract addresses
8. **Test on testnets first** before mainnet deployment

---

## Support

For issues or questions:
1. Check the [COMPLETE_GUIDE.md](./COMPLETE_GUIDE.md)
2. Review the example components in `client/src/components/`
3. Check the test files in `server/routers/`
4. Contact the development team

---

**Happy Building! 🚀**
