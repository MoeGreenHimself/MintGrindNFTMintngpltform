# MintGrindNFT Contract Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the **MintGrindNFT_v1.5.sol** contract to Ethereum Sepolia and Polygon Amoy testnets, and eventually to mainnet.

## Contract Security Features

✅ **Reentrancy Protection** - ReentrancyGuard prevents reentrancy attacks  
✅ **Signature Replay Protection** - Chain ID check + nonce + usedHashes mapping  
✅ **Canonical Signature Check** - Prevents malleable signatures  
✅ **PaymentSplitter** - Safe fund distribution (no risky withdraw())  
✅ **Pausable** - Emergency stop mechanism  
✅ **Input Validation** - Checks for address(0), expiry, supply limits, payment  

## Prerequisites

1. **Node.js & npm/pnpm** installed
2. **Hardhat** or **Foundry** for contract compilation and deployment
3. **Private key** of deployment wallet (with testnet ETH/MATIC)
4. **RPC endpoints** for Sepolia and Polygon Amoy
5. **Signer address** (the address that will sign mint messages for whitelisting)

## Environment Setup

### 1. Install Dependencies

```bash
cd /home/ubuntu/mintgrind
pnpm install hardhat @nomicfoundation/hardhat-toolbox
```

### 2. Create `.env` File

```env
# Deployment Wallet
PRIVATE_KEY=your_private_key_here

# RPC Endpoints
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# Signer Address (for whitelisting)
MINT_SIGNER_ADDRESS=0x...

# Etherscan API Keys (for verification)
ETHERSCAN_API_KEY=your_etherscan_key
POLYGONSCAN_API_KEY=your_polygonscan_key
```

## Deployment Steps

### Step 1: Compile the Contract

```bash
npx hardhat compile
```

### Step 2: Deploy to Sepolia Testnet

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**Constructor Arguments for Sepolia:**

```javascript
{
  name_: "MintGrind NFT",
  symbol_: "MGND",
  mintPrice_: ethers.parseEther("0.01"), // 0.01 ETH
  maxSupply_: 10000,
  maxPerWallet_: 10,
  signer_: "0x...", // Your signer address
  initialOwner_: "0x...", // Deployment wallet
  targetChainId_: 11155111, // Sepolia chain ID
  payees_: ["0x..."], // Payment recipient addresses
  shares_: [100], // Percentage shares (must sum to 100)
}
```

### Step 3: Deploy to Polygon Amoy Testnet

```bash
npx hardhat run scripts/deploy.js --network polygonAmoy
```

**Constructor Arguments for Polygon Amoy:**

```javascript
{
  name_: "MintGrind NFT",
  symbol_: "MGND",
  mintPrice_: ethers.parseEther("0.001"), // 0.001 MATIC
  maxSupply_: 10000,
  maxPerWallet_: 10,
  signer_: "0x...", // Your signer address
  initialOwner_: "0x...", // Deployment wallet
  targetChainId_: 80002, // Polygon Amoy chain ID
  payees_: ["0x..."], // Payment recipient addresses
  shares_: [100], // Percentage shares (must sum to 100)
}
```

### Step 4: Verify Contracts on Block Explorers

**Sepolia:**
```bash
npx hardhat verify --network sepolia DEPLOYED_ADDRESS "arg1" "arg2" ...
```

**Polygon Amoy:**
```bash
npx hardhat verify --network polygonAmoy DEPLOYED_ADDRESS "arg1" "arg2" ...
```

## Post-Deployment Configuration

### 1. Update Environment Variables

After deployment, update the MintGrind platform with contract addresses:

```env
# Ethereum Sepolia
VITE_SEPOLIA_CONTRACT_ADDRESS=0x...
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...

# Polygon Amoy
VITE_POLYGON_AMOY_CONTRACT_ADDRESS=0x...
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# Signer Configuration
MINT_SIGNER_ADDRESS=0x...
MINT_SIGNER_PRIVATE_KEY=0x... # For backend signature generation
```

### 2. Configure Whitelist

Add whitelisted wallet addresses to the database:

```sql
INSERT INTO whitelisted_wallets (wallet_address, chain_id, max_mint_count, is_active)
VALUES 
  ('0xWallet1', 11155111, 5, true),
  ('0xWallet2', 11155111, 5, true),
  ('0xWallet1', 80002, 5, true),
  ('0xWallet2', 80002, 5, true);
```

### 3. Test Minting Flow

1. Connect wallet to Sepolia testnet
2. Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com)
3. Request signature from backend API
4. Execute mint transaction
5. Verify NFT in wallet

## Mainnet Deployment

### Before Going Live

- [ ] Conduct full security audit
- [ ] Test all features on testnet thoroughly
- [ ] Set up monitoring and alerting
- [ ] Implement timelock for `setMaxSupply()` function
- [ ] Consider multisig for owner functions
- [ ] Set realistic mint prices based on market conditions
- [ ] Prepare marketing and communication plan

### Mainnet Deployment

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

**Constructor Arguments for Mainnet (Ethereum):**

```javascript
{
  name_: "MintGrind NFT",
  symbol_: "MGND",
  mintPrice_: ethers.parseEther("0.05"), // Adjust based on market
  maxSupply_: 10000,
  maxPerWallet_: 10,
  signer_: "0x...",
  initialOwner_: "0x...",
  targetChainId_: 1, // Ethereum Mainnet
  payees_: ["0x..."],
  shares_: [100],
}
```

## Troubleshooting

### Common Issues

**"Wrong chain ID" error**
- Ensure `targetChainId_` matches the network you're deploying to
- Verify wallet is connected to correct network

**"Signature expired" error**
- Increase expiry time in signature generation
- Sync server time with blockchain

**"Exceeds per-wallet limit" error**
- User has already minted maximum allowed
- Check `maxPerWallet` setting

**"Insufficient balance" error**
- Deployment wallet needs ETH/MATIC for gas
- Get testnet tokens from faucet

## Contract Functions Reference

### User Functions

- `mint(quantity, expiryTime, signature)` - Mint NFTs with signature
- `getMintedCount(account)` - Check how many NFTs an address has minted
- `getNonce(account)` - Get current nonce for signature generation

### Admin Functions

- `setSigner(newSigner)` - Update signer address
- `setMintPrice(newPrice)` - Update mint price
- `setMaxSupply(newMaxSupply)` - Update max supply
- `setMaxPerWallet(newLimit)` - Update per-wallet limit
- `pause()` / `unpause()` - Emergency pause/unpause
- `releasePayee(account)` - Release funds to payee

## Support & Resources

- **Contract Address:** Will be provided after deployment
- **Etherscan:** https://sepolia.etherscan.io (Sepolia)
- **PolygonScan:** https://amoy.polygonscan.com (Polygon Amoy)
- **OpenZeppelin Docs:** https://docs.openzeppelin.com
- **ERC721A Docs:** https://chiru-labs.github.io/ERC721A/

---

**Last Updated:** March 2026  
**Contract Version:** v1.5  
**Status:** Production Ready
