# MintGrind NFT Platform - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Getting Started](#getting-started)
4. [Deployment](#deployment)
5. [User Guide](#user-guide)
6. [Self-Hosting](#self-hosting)
7. [Troubleshooting](#troubleshooting)

---

## Overview

**MintGrind** is a multi-chain NFT minting platform that allows users to mint digital artifacts as NFTs on Ethereum and Polygon blockchains. The platform features:

- **Cyberpunk Aesthetic**: Dark theme with neon green/gold styling
- **Multi-Chain Support**: Ethereum Sepolia & Polygon Amoy testnets
- **Flexible Token Payments**: Support for any ERC-20 token
- **Secure Whitelisting**: Signature-based whitelist validation
- **3D Visual Effects**: Spinning logo bookends and floating neon cube upload interface
- **Gas Estimation**: Real-time gas cost calculations

---

## Features

### Core Functionality
- **Chain Selection**: Choose between Ethereum (Premium Layer) or Polygon (Mass Mint Layer)
- **Wallet Connection**: Simple wallet address input (no MetaMask extension required)
- **Token Selection**: Choose from popular tokens (USDC, USDT, DAI, WBTC) or add custom
- **File Upload**: Drag-and-drop interface with 3D neon effects
- **Metadata Editing**: Add title and description to your NFT
- **Payment Processing**: Automatic gas estimation and cost breakdown
- **Affiliate Bypass**: Owner can mint for free using promo codes

### Security Features
- ✅ Reentrancy Guard
- ✅ Signature Replay Protection
- ✅ Canonical Signature Validation
- ✅ Chain ID Verification
- ✅ PaymentSplitter for Fund Distribution
- ✅ Pausable Emergency Stop

---

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- A testnet wallet (Ethereum Sepolia or Polygon Amoy)
- Testnet ETH/MATIC for gas fees
- An ERC-20 token on your chosen testnet

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd mintgrind

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000`

---

## Deployment

### Smart Contract Deployment

#### Step 1: Prepare Environment

Create a `.env.local` file in the project root:

```env
# Deployment wallet private key (testnet only)
TESTNET_DEPLOYER_KEY=your_private_key_here

# RPC Endpoints
SEPOLIA_RPC_URL=https://rpc.sepolia.org
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# Signer address (for whitelist signatures)
MINT_SIGNER_ADDRESS=0x...

# Owner address (receives funds)
OWNER_ADDRESS=0x3Cec101153d84b4686BeEA4de0e99e08004A3fa0
```

#### Step 2: Deploy to Testnets

```bash
# Deploy to Ethereum Sepolia
node scripts/deploy-testnet.mjs

# Deploy to Polygon Amoy
node scripts/deploy-testnet.mjs
```

#### Step 3: Update Frontend Configuration

After deployment, update `shared/chainConfig.ts` with your contract addresses:

```typescript
export const CHAIN_CONFIG: Record<ChainId, ChainConfig> = {
  11155111: {
    name: "Ethereum Sepolia",
    contractAddress: "0x...", // Your deployed contract
    rpcUrl: "https://rpc.sepolia.org",
    // ... rest of config
  },
  80002: {
    name: "Polygon Amoy",
    contractAddress: "0x...", // Your deployed contract
    rpcUrl: "https://rpc-amoy.polygon.technology",
    // ... rest of config
  },
};
```

#### Step 4: Configure Payment Tokens

Update the token lists in `shared/chainConfig.ts` to match your testnet tokens:

```typescript
export const TESTNET_TOKENS: Record<ChainId, Token[]> = {
  11155111: [
    {
      address: "0x...", // USDC on Sepolia
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
    // Add more tokens
  ],
  // ... other chains
};
```

### Web Application Deployment

#### Option 1: Deploy to Manus (Recommended)

```bash
# Create a checkpoint (required before publishing)
pnpm checkpoint

# Then click "Publish" in the Manus UI
```

#### Option 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Option 3: Deploy to Railway/Render

```bash
# Follow platform-specific deployment guides
# Ensure DATABASE_URL is set in environment variables
```

---

## User Guide

### Step 1: Select Your Chain

1. Visit the MintGrind homepage
2. Choose between:
   - **Ethereum Sepolia** (Premium Layer) - Higher security, higher gas costs
   - **Polygon Amoy** (Mass Mint Layer) - Lower costs, faster transactions
3. View gas price and network details

### Step 2: Connect Your Wallet

1. Enter your Ethereum wallet address (0x...)
2. Click "Connect Wallet"
3. Verify the address is correct (this is where your NFT will be sent)

### Step 3: Select Payment Token

1. Choose a token from the dropdown (USDC, USDT, DAI, WBTC)
2. Or enter a custom ERC-20 token address
3. Confirm you have sufficient balance

### Step 4: Upload Your Artifact

1. Drag and drop your file or click to browse
2. Supported formats: Images (PNG, JPG, GIF, WebP), Video (MP4, WebM), PDF, Text
3. Maximum file size: 100MB
4. Wait for file preview to load

### Step 5: Edit Metadata (Optional)

1. Enter a title for your NFT (defaults to filename)
2. Add a description (optional)
3. Review the file preview

### Step 6: Review and Mint

1. Confirm the payment amount (mint price + gas fees)
2. Verify your wallet address
3. Click "Mint NFT"
4. Wait for transaction confirmation
5. Your NFT will appear in your wallet

---

## Self-Hosting

### Prerequisites
- Docker or Node.js 18+
- MySQL/TiDB database
- Environment variables configured

### Docker Deployment

```bash
# Build Docker image
docker build -t mintgrind .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=mysql://... \
  -e JWT_SECRET=your_secret \
  mintgrind
```

### Manual Deployment

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/mintgrind

# Authentication
JWT_SECRET=your_jwt_secret_key
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im

# Smart Contracts
MINT_SIGNER_PRIVATE_KEY=your_signer_private_key
SEPOLIA_RPC_URL=https://rpc.sepolia.org
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# Branding
VITE_APP_TITLE=MintGrind
VITE_APP_LOGO=https://your-logo-url.png
```

---

## Troubleshooting

### Common Issues

#### "Invalid Ethereum Address"
- Ensure your wallet address starts with `0x`
- Address must be exactly 42 characters
- Check for typos

#### "Insufficient Balance"
- Verify you have enough of the selected token
- Include gas fees in your calculation
- Request testnet tokens from faucets

#### "Transaction Failed"
- Check network connection
- Verify contract is not paused
- Ensure you're on the correct chain
- Check gas price hasn't spiked

#### "File Upload Failed"
- File exceeds 100MB limit
- File format not supported
- Network connection interrupted
- Try uploading a smaller file

#### "Signature Validation Failed"
- Wallet address doesn't match whitelist
- Signature has expired (5 minutes)
- Request a new signature
- Contact support if issue persists

### Getting Help

1. **Check Logs**: Look at browser console (F12) for error messages
2. **Verify Configuration**: Ensure all environment variables are set
3. **Test Network**: Verify you're on the correct testnet
4. **Contact Support**: Reach out to the development team

---

## Architecture

### Frontend Stack
- React 19 + Vite
- Tailwind CSS 4 (cyberpunk theme)
- Ethers.js for blockchain interaction
- tRPC for API communication

### Backend Stack
- Express.js
- tRPC for type-safe APIs
- Drizzle ORM for database
- JWT for authentication

### Smart Contracts
- Solidity ^0.8.20
- OpenZeppelin contracts
- ERC721A for efficient minting
- PaymentSplitter for fund distribution

---

## Security Considerations

### For Users
- ✅ Never share your private key
- ✅ Verify contract address before minting
- ✅ Use testnet for initial testing
- ✅ Check gas prices before confirming

### For Operators
- ✅ Use multisig wallet for production
- ✅ Implement rate limiting
- ✅ Monitor contract for unusual activity
- ✅ Regular security audits recommended
- ✅ Keep private keys in secure vaults

---

## License

This project is provided as-is for educational and commercial use.

---

## Support

For issues, questions, or contributions:
1. Check this guide first
2. Review GitHub issues
3. Contact the development team

---

**Happy Minting! 🚀**
