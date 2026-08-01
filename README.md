# MintGrind - Multi-Chain NFT Minting Platform

> **Your pixels. Your chain. Your riot.** 🚀

A production-ready NFT minting platform with cyberpunk aesthetics, multi-chain support, and secure signature-based whitelisting.

![MintGrind](https://files.manuscdn.com/user_upload_by_module/session_file/310519663047978561/QcvrCZKnQllMXZtZ.png)

---

## ✨ Features

- **Multi-Chain Support**: Ethereum Sepolia & Polygon Amoy testnets
- **Flexible Token Payments**: Support for any ERC-20 token (USDC, USDT, DAI, WBTC, custom)
- **Secure Whitelisting**: Signature-based validation with replay attack prevention
- **3D Visual Effects**: Spinning logo bookends and floating neon cube upload interface
- **Gas Estimation**: Real-time gas cost calculations
- **Affiliate Bypass**: Owner can mint for free using promo codes
- **Cyberpunk Aesthetic**: Dark theme with neon green/gold styling
- **Responsive Design**: Works on desktop, tablet, and mobile

---

## 🔒 Security Features

✅ **Reentrancy Guard** - Prevents reentrancy attacks  
✅ **Signature Replay Protection** - Chain ID + nonce validation  
✅ **Canonical Signature Check** - Prevents signature malleability  
✅ **PaymentSplitter** - Safe fund distribution  
✅ **Pausable Mechanism** - Emergency stop capability  
✅ **Input Validation** - Comprehensive checks for all inputs  

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- A testnet wallet (Ethereum Sepolia or Polygon Amoy)

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd mintgrind

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to see the app running.

---

## 📚 Documentation

### For Users
- **[COMPLETE_GUIDE.md](./COMPLETE_GUIDE.md)** - Full user guide, deployment, self-hosting instructions

### For Developers
- **[FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)** - Frontend integration with code examples
- **[SIGNATURE_GENERATION_FLOW.md](./SIGNATURE_GENERATION_FLOW.md)** - Technical deep-dive on security
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Smart contract deployment steps

---

## 🏗️ Architecture

### Frontend
- **React 19** + Vite
- **Tailwind CSS 4** (cyberpunk theme)
- **Ethers.js** for blockchain interaction
- **tRPC** for type-safe APIs

### Backend
- **Express.js**
- **tRPC** procedures
- **Drizzle ORM** for database
- **JWT** authentication

### Smart Contracts
- **Solidity ^0.8.20**
- **OpenZeppelin** contracts
- **ERC721A** for efficient minting
- **PaymentSplitter** for fund distribution

---

## 🎮 User Flow

```
1. Select Chain (Ethereum Sepolia or Polygon Amoy)
   ↓
2. Connect Wallet (enter 0x address)
   ↓
3. Select Payment Token (USDC, USDT, DAI, WBTC, or custom)
   ↓
4. Upload Artifact (drag & drop or click)
   ↓
5. Edit Metadata (title + description)
   ↓
6. Review & Mint (confirm payment)
   ↓
7. NFT in Wallet ✨
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

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

### Chain Configuration

Update `shared/chainConfig.ts` with your deployed contract addresses:

```typescript
export const CHAIN_CONFIG: Record<ChainId, ChainConfig> = {
  11155111: {
    name: "Ethereum Sepolia",
    contractAddress: "0x...", // Your deployed contract
    rpcUrl: "https://rpc.sepolia.org",
    // ... rest of config
  },
  // ... other chains
};
```

---

## 📦 Deployment

### Testnet Deployment

```bash
# Deploy smart contract
node scripts/deploy-testnet.mjs

# Update frontend config with deployed addresses
# Edit shared/chainConfig.ts

# Deploy web app
pnpm build
pnpm start
```

### Production Deployment

See [COMPLETE_GUIDE.md](./COMPLETE_GUIDE.md) for detailed instructions on:
- Docker deployment
- Vercel/Railway/Render deployment
- Self-hosting setup
- Mainnet deployment checklist

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test server/routers/mint.test.ts
```

**Current Status**: ✅ 13/13 tests passing

---

## 📊 Project Structure

```
mintgrind/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities (minting engine, etc)
│   │   └── App.tsx        # Main app component
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── routers/           # tRPC procedures
│   ├── db.ts              # Database helpers
│   └── _core/             # Framework code
├── contracts/             # Solidity smart contracts
├── drizzle/               # Database schema
├── shared/                # Shared types & config
├── scripts/               # Deployment scripts
└── docs/                  # Documentation
```

---

## 🔐 Security Considerations

### For Users
- Never share your private key
- Verify contract address before minting
- Use testnet for initial testing
- Check gas prices before confirming

### For Operators
- Use multisig wallet for production
- Implement rate limiting
- Monitor contract for unusual activity
- Regular security audits recommended
- Keep private keys in secure vaults

---

## 🐛 Troubleshooting

### Common Issues

**"Invalid Ethereum Address"**
- Ensure address starts with `0x` and is 42 characters

**"Insufficient Balance"**
- Verify you have enough tokens + gas fees

**"Signature Expired"**
- Request new signature (valid for 5 minutes)

**"Transaction Failed"**
- Check network connection
- Verify contract is not paused
- Ensure you're on correct chain

See [COMPLETE_GUIDE.md](./COMPLETE_GUIDE.md) for more troubleshooting.

---

## 📝 License

This project is provided as-is for educational and commercial use.

---

## 🤝 Support

For issues, questions, or contributions:

1. Check the [COMPLETE_GUIDE.md](./COMPLETE_GUIDE.md)
2. Review [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)
3. Read [SIGNATURE_GENERATION_FLOW.md](./SIGNATURE_GENERATION_FLOW.md)
4. Contact the development team

---

## 🎯 Roadmap

- [ ] Mainnet deployment
- [ ] Additional chain support (Arbitrum, Optimism)
- [ ] Credit card payment integration
- [ ] User portfolio/gallery
- [ ] Batch minting support
- [ ] Custom royalty settings
- [ ] DAO governance

---

**Built with ❤️ for the crypto community**

**Happy Minting! 🚀**
