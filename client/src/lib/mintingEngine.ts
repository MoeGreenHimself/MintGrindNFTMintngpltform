import { ethers } from "ethers";

// Declare window.ethereum for MetaMask
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface MintConfig {
  chainId: number;
  contractAddress: string;
  rpcUrl: string;
  walletAddress: string;
  paymentToken: string;
  title: string;
  description: string;
  quantity: number;
  signature: string;
  expiry: number;
}

interface MintResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  message?: string;
}

const MINT_GRIND_ABI = [
  "function mint(uint256 quantity, string memory title, string memory description, address token, uint256 expiry, bytes memory signature) public payable",
  "function mintPrice() public view returns (uint256)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function balanceOf(address account) public view returns (uint256)",
];

/**
 * Mint NFT using ethers.js
 * Requires user to have MetaMask or compatible wallet
 */
export async function mintNFT(config: MintConfig): Promise<MintResult> {
  try {
    // Check if window.ethereum exists (MetaMask or compatible wallet)
    if (!window.ethereum) {
      return {
        success: false,
        error: "No Web3 wallet detected. Please install MetaMask or compatible wallet.",
      };
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      return {
        success: false,
        error: "No accounts available in wallet",
      };
    }

    // Create provider from window.ethereum
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Verify connected wallet matches input wallet
    const connectedAddress = await signer.getAddress();
    if (connectedAddress.toLowerCase() !== config.walletAddress.toLowerCase()) {
      return {
        success: false,
        error: `Wallet mismatch. Connected: ${connectedAddress}, Expected: ${config.walletAddress}`,
      };
    }

    // Verify chain
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(config.chainId)) {
      return {
        success: false,
        error: `Wrong chain. Connected to chain ${network.chainId}, expected ${config.chainId}. Please switch networks.`,
      };
    }

    // Get contract instance
    const contract = new ethers.Contract(
      config.contractAddress,
      MINT_GRIND_ABI,
      signer
    );

    // Get mint price
    const mintPrice = await contract.mintPrice();
    const totalCost = mintPrice * BigInt(config.quantity);

    // Handle token payment
    if (config.paymentToken !== "0x0000000000000000000000000000000000000000") {
      // ERC-20 token payment
      const tokenContract = new ethers.Contract(
        config.paymentToken,
        ERC20_ABI,
        signer
      );

      // Check balance
      const balance = await tokenContract.balanceOf(config.walletAddress);
      if (balance < totalCost) {
        return {
          success: false,
          error: `Insufficient token balance. Need ${ethers.formatUnits(totalCost, 18)}, have ${ethers.formatUnits(balance, 18)}`,
        };
      }

      // Approve token transfer
      const approveTx = await tokenContract.approve(config.contractAddress, totalCost);
      await approveTx.wait();
    } else {
      // Native coin payment - check balance
      const balance = await provider.getBalance(config.walletAddress);
      if (balance < totalCost) {
        return {
          success: false,
          error: `Insufficient balance. Need ${ethers.formatEther(totalCost)} ETH/MATIC, have ${ethers.formatEther(balance)}`,
        };
      }
    }

    // Execute mint
    const tx = await contract.mint(
      config.quantity,
      config.title,
      config.description,
      config.paymentToken,
      config.expiry,
      config.signature,
      {
        value: config.paymentToken === "0x0000000000000000000000000000000000000000" ? totalCost : 0,
      }
    );

    // Wait for confirmation
    const receipt = await tx.wait();

    if (!receipt || !receipt.hash) {
      return {
        success: false,
        error: "Transaction failed - no receipt",
      };
    }

    return {
      success: true,
      transactionHash: receipt.hash,
      message: `NFT minted successfully! Transaction: ${receipt.hash}`,
    };
  } catch (error: any) {
    console.error("Minting error:", error);
    return {
      success: false,
      error: error?.message || "Unknown minting error",
    };
  }
}

/**
 * Request user to switch to a specific chain
 */
export async function switchChain(chainId: number): Promise<boolean> {
  try {
    if (!window.ethereum) {
      return false;
    }

    const chainIdHex = `0x${chainId.toString(16)}`;

    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });

    return true;
  } catch (error: any) {
    console.error("Chain switch error:", error);
    return false;
  }
}

/**
 * Get current connected wallet and chain
 */
export async function getWalletInfo(): Promise<{
  address?: string;
  chainId?: number;
  error?: string;
}> {
  try {
    if (!window.ethereum) {
      return { error: "No wallet detected" };
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();

    return {
      address,
      chainId: Number(network.chainId),
    };
  } catch (error: any) {
    return { error: error?.message || "Failed to get wallet info" };
  }
}
