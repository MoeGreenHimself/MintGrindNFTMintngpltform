# MintGrind NFT Platform - Deployment Guide

## Overview

MintGrind is a multi-chain NFT minting platform supporting Ethereum and Polygon networks with signature-based whitelisting. This guide covers deployment of both the smart contract and the web application.

## Prerequisites

- Node.js 18+ and pnpm
- Ethereum wallet with testnet/mainnet funds
- Private key for contract deployment (keep secure)
- Remix IDE or Hardhat for smart contract deployment
- Environment variables configured

## Smart Contract Deployment

### 1. Prepare Deployment Parameters

Before deploying, gather the following information:

```typescript
// Constructor parameters for MintGrindNFT contract
const deploymentParams = {
  name: "MintGrind NFT",              // Collection name
  symbol: "MGN",                      // Collection symbol
  mintPrice: "1000000000000000000",   // 1 ETH in wei (adjust as needed)
  maxSupply: 10000,                   // Total NFTs to mint
  maxPerWallet: 5,                    // Max mints per wallet
  signer: "0x...",                    // Signer address (for signature generation)
  initialOwner: "0x...",              // Contract owner address
  targetChainId: 1,                   // 1 for Ethereum, 137 for Polygon
  payees: ["0x...", "0x..."],         // Addresses to receive funds
  shares: [70, 30],                   // Percentage shares (must sum to 100)
};
```

### 2. Deploy to Ethereum

**Using Remix:**

1. Open [Remix IDE](https://remix.ethereum.org)
2. Upload `MintGrindNFT_v1.0.5.sol`
3. Compile with Solidity 0.8.20
4. Deploy to Ethereum Mainnet or Sepolia Testnet
5. Fill in constructor parameters
6. Save the deployed contract address

**Using Hardhat:**

```bash
# Create deployment script
npx hardhat run scripts/deploy.ts --network ethereum
```

### 3. Deploy to Polygon

Repeat the process for Polygon Mainnet or Amoy Testnet with:
- Same contract code
- `targetChainId: 137` for Polygon
- Adjusted `mintPrice` for MATIC (typically 1-10 MATIC)

### 4. Update Environment Variables

After deployment, update `.env` with contract addresses:

```env
# Ethereum
VITE_ETHEREUM_CONTRACT_ADDRESS=0x...
VITE_ETHEREUM_RPC_URL=https://eth.llamarpc.com

# Polygon
VITE_POLYGON_CONTRACT_ADDRESS=0x...
VITE_POLYGON_RPC_URL=https://polygon-rpc.com

# Testnets (optional)
VITE_SEPOLIA_CONTRACT_ADDRESS=0x...
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

VITE_AMOY_CONTRACT_ADDRESS=0x...
VITE_AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# Signature Signer
MINT_SIGNER_PRIVATE_KEY=0x... # Private key of the signer account
```

## Web Application Deployment

### 1. Build the Application

```bash
cd /home/ubuntu/mintgrind

# Install dependencies
pnpm install

# Build frontend and backend
pnpm build
```

### 2. Configure Environment Variables

Create `.env.production` with:

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/mintgrind

# OAuth
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth

# Blockchain RPC URLs
VITE_ETHEREUM_RPC_URL=https://eth.llamarpc.com
VITE_POLYGON_RPC_URL=https://polygon-rpc.com

# Contract Addresses
VITE_ETHEREUM_CONTRACT_ADDRESS=0x...
VITE_POLYGON_CONTRACT_ADDRESS=0x...

# Signature Signer
MINT_SIGNER_PRIVATE_KEY=0x...

# Wallet Connect (optional)
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id
```

### 3. Deploy to Manus Hosting

1. Click **Publish** button in Management UI
2. Configure custom domain (optional)
3. Enable SSL/TLS
4. Set environment variables in Settings → Secrets
5. Deploy

## Whitelist Management

### Adding Wallets to Whitelist

```bash
# Access database UI in Management Panel
# Navigate to Database tab
# Insert into whitelist_entries table:

INSERT INTO whitelist_entries (
  walletAddress, 
  chainId, 
  maxMintCount, 
  isActive, 
  reason
) VALUES (
  '0x1234567890123456789012345678901234567890',
  1,
  5,
  true,
  'Early supporter'
);
```

### Bulk Import Whitelist

Use the Database UI to import CSV:

```csv
walletAddress,chainId,maxMintCount,isActive,reason
0x1234567890123456789012345678901234567890,1,5,true,Early supporter
0xabcdefabcdefabcdefabcdefabcdefabcdefabcd,137,3,true,Community member
```

## API Endpoints

### Get Signature for Minting

```bash
POST /api/trpc/mint.getSignature

{
  "walletAddress": "0x...",
  "quantity": 1,
  "chainId": 1,
  "expiryTime": 1704067200
}

Response:
{
  "signature": "0x...",
  "nonce": 0,
  "expiryTime": 1704067200,
  "maxMintCount": 5,
  "chainId": 1,
  "chainName": "Ethereum"
}
```

### Validate Signature

```bash
GET /api/trpc/mint.validateSignature?walletAddress=0x...&quantity=1&signature=0x...&chainId=1&expiryTime=1704067200

Response:
{
  "valid": true,
  "expiryTime": 1704067200,
  "timeRemaining": 3600
}
```

### Record Mint Transaction

```bash
POST /api/trpc/mint.recordMintTransaction

{
  "walletAddress": "0x...",
  "quantity": 1,
  "chainId": 1,
  "transactionHash": "0x...",
  "pricePerNft": "1000000000000000000",
  "totalAmount": "1000000000000000000"
}

Response:
{
  "success": true,
  "newNonce": 1,
  "message": "Mint recorded successfully"
}
```

## Security Checklist

- [ ] Private keys stored securely (never commit to git)
- [ ] Contract verified on block explorers (Etherscan, PolygonScan)
- [ ] Whitelist properly configured
- [ ] PaymentSplitter addresses verified
- [ ] Signature expiry times set appropriately
- [ ] Gas limits tested on testnet
- [ ] Rate limiting configured on API
- [ ] CORS properly configured
- [ ] SSL/TLS enabled on production
- [ ] Database backups configured

## Testing

### Local Testing

```bash
# Start dev server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm check
```

### Testnet Testing

1. Deploy to Sepolia (Ethereum) and Amoy (Polygon)
2. Add test wallets to whitelist
3. Test minting flow on both chains
4. Verify PaymentSplitter distribution
5. Test chain switching
6. Verify signature validation

## Monitoring

### Key Metrics to Monitor

- Mint transaction success rate
- Average gas costs per chain
- Signature validation failures
- Wallet connection issues
- API response times
- Database query performance

### Logs

Access logs in Management UI → Dashboard

## Support

For issues or questions:
1. Check the troubleshooting section below
2. Review contract events on block explorer
3. Check database for mint history
4. Verify environment variables

## Troubleshooting

### "Wallet not whitelisted" Error

- Check wallet address in database (case-insensitive)
- Verify `isActive` flag is true
- Confirm correct chain ID

### "Signature expired" Error

- Increase expiry time in signature generation
- Check server time synchronization
- Verify client clock is accurate

### "Wrong chain ID" Error

- Ensure wallet is connected to correct network
- Verify `targetChainId` in contract matches selected chain
- Check chain configuration in `shared/chainConfig.ts`

### Transaction Fails on-chain

- Verify sufficient wallet balance
- Check gas price and gas limit
- Confirm contract address is correct
- Verify signature format and validity
