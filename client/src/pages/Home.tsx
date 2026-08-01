import { useState } from "react";
import CyberpunkChainToggle from "@/components/CyberpunkChainToggle";
import ArtifactUpload from "@/components/ArtifactUpload";
import TokenSelector from "@/components/TokenSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_CHAINS } from "@shared/chainConfig";
import type { ChainId } from "@shared/chainConfig";

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export default function Home() {
  const [selectedChain, setSelectedChain] = useState<ChainId>(DEFAULT_CHAINS[0]);
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [chainSelected, setChainSelected] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [nftTitle, setNftTitle] = useState("");
  const [nftDescription, setNftDescription] = useState("");
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [walletInput, setWalletInput] = useState("");
  const [walletError, setWalletError] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [tokenSelected, setTokenSelected] = useState(false);

  const handleChainSelect = (chainId: ChainId) => {
    setSelectedChain(chainId);
    setChainSelected(true);
  };

  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleConnectWallet = () => {
    const trimmedAddress = walletInput.trim();
    
    if (!trimmedAddress) {
      setWalletError("Please enter a wallet address");
      return;
    }

    if (!isValidEthereumAddress(trimmedAddress)) {
      setWalletError("Invalid Ethereum address. Must start with 0x and be 42 characters long");
      return;
    }

    setWalletAddress(trimmedAddress);
    setIsConnected(true);
    setWalletError("");
    setWalletInput("");
  };

  const handleDisconnectWallet = () => {
    setWalletAddress("");
    setIsConnected(false);
    setSelectedToken(null);
    setTokenSelected(false);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setShowMetadataEditor(true);

    // Create preview for images/videos
    const reader = new FileReader();
    reader.onload = (e) => {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        setFilePreview(e.target?.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMint = async () => {
    if (!walletAddress || !selectedFile || !selectedToken) {
      alert("Please connect wallet, select token, and select a file");
      return;
    }

    setIsMinting(true);
    try {
      const { mintNFT } = await import("@/lib/mintingEngine");

      // Get signature from backend
      const signatureResponse = await fetch("/api/trpc/mint.getSignature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          quantity: 1,
          chainId: selectedChain,
          expiryTime: Math.floor(Date.now() / 1000) + 24 * 3600,
        }),
      });

      if (!signatureResponse.ok) {
        const error = await signatureResponse.json();
        throw new Error(error.message || "Failed to get signature");
      }

      const signatureData = await signatureResponse.json();
      const { signature, expiry } = signatureData.result || signatureData;

      // Chain configuration
      const chainConfigs: Record<number, { contractAddress: string; rpcUrl: string }> = {
        11155111: {
          contractAddress: "0x0000000000000000000000000000000000000000", // Deploy contract first
          rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
        },
        80002: {
          contractAddress: "0x0000000000000000000000000000000000000000", // Deploy contract first
          rpcUrl: "https://rpc-amoy.polygon.technology",
        },
      };

      const chainConfig = chainConfigs[selectedChain];
      if (!chainConfig) {
        throw new Error("Unsupported chain");
      }

      // Execute mint
      const result = await mintNFT({
        chainId: selectedChain,
        contractAddress: chainConfig.contractAddress,
        rpcUrl: chainConfig.rpcUrl,
        walletAddress,
        paymentToken: selectedToken.address,
        title: nftTitle || selectedFile.name,
        description: nftDescription,
        quantity: 1,
        signature,
        expiry,
      });

      if (result.success) {
        alert(`✓ NFT minted successfully!\nTransaction: ${result.transactionHash}`);
        setSelectedFile(null);
        setFilePreview(null);
        setNftTitle("");
        setNftDescription("");
        setShowMetadataEditor(false);
      } else {
        alert(`✗ Minting failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Minting error:", error);
      alert(`Error during minting: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-emerald-300 font-mono overflow-hidden">
      <style>{`
        @keyframes spin {
          from {
            transform: rotateY(0deg) rotateX(5deg) rotateZ(2deg);
          }
          to {
            transform: rotateY(360deg) rotateX(5deg) rotateZ(2deg);
          }
        }
        .logo-3d {
          position: relative;
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.6)) drop-shadow(0 4px 8px rgba(180, 83, 9, 0.4));
        }
        .logo-3d img {
          position: relative;
          z-index: 2;
          filter: drop-shadow(-2px -2px 4px rgba(255, 255, 255, 0.2)) drop-shadow(3px 3px 6px rgba(0, 0, 0, 0.8));
        }
      `}</style>
      {/* Animated background grid with green tones */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 24%, rgba(52, 211, 153, 0.05) 25%, rgba(52, 211, 153, 0.05) 26%, transparent 27%, transparent 74%, rgba(52, 211, 153, 0.05) 75%, rgba(52, 211, 153, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(52, 211, 153, 0.05) 25%, rgba(52, 211, 153, 0.05) 26%, transparent 27%, transparent 74%, rgba(52, 211, 153, 0.05) 75%, rgba(52, 211, 153, 0.05) 76%, transparent 77%, transparent)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-wider flex items-center justify-center gap-6">
            {/* Left spinning logo */}
            <div className="logo-3d w-16 h-16 md:w-20 md:h-20" style={{
              perspective: "1200px",
              animation: "spin 8s linear infinite",
              transformStyle: "preserve-3d",
            }}>
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663047978561/QcvrCZKnQllMXZtZ.png"
                alt="MintGrind Logo"
                className="w-full h-full object-contain"
              />
            </div>
            
            <span className="text-emerald-400 drop-shadow-lg" style={{ textShadow: "0 0 20px rgba(52, 211, 153, 0.8)" }}>
              MINTGRIND
            </span>
            
            {/* Right spinning logo */}
            <div className="logo-3d w-16 h-16 md:w-20 md:h-20" style={{
              perspective: "1200px",
              animation: "spin 8s linear infinite",
              transformStyle: "preserve-3d",
            }}>
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663047978561/QcvrCZKnQllMXZtZ.png"
                alt="MintGrind Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </h1>
          <p className="text-emerald-300/80 text-lg tracking-wider">
            Your pixels. Your chain. Your riot.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Step 1: Chain Selection */}
          <div className="space-y-4">
            <div className="text-sm text-emerald-400/70 font-mono tracking-wider">
              ▶ STEP 1 / 3
            </div>

            <CyberpunkChainToggle selectedChain={selectedChain} onChainChange={handleChainSelect} />
          </div>

          {/* Step 2: Wallet Connection - Only show after chain selection */}
          {chainSelected && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="text-sm text-emerald-400/70 font-mono tracking-wider">
                ▶ STEP 2 / 3
              </div>

              <div className="border border-emerald-600/30 rounded-lg p-6 bg-emerald-950/10 space-y-4">
                {!isConnected ? (
                  <>
                    <h3 className="text-lg font-bold text-emerald-300 tracking-wider">
                      ⚡ CONNECT YOUR WALLET
                    </h3>
                    <p className="text-xs text-emerald-300/70">
                      Enter your Ethereum wallet address to receive your minted NFT
                    </p>
                    
                    <Input
                      type="text"
                      placeholder="0x..."
                      value={walletInput}
                      onChange={(e) => {
                        setWalletInput(e.target.value);
                        setWalletError("");
                      }}
                      className="bg-black border-emerald-500/30 text-emerald-300 placeholder-emerald-500/30 font-mono"
                    />
                    
                    {walletError && (
                      <p className="text-xs text-red-400">{walletError}</p>
                    )}

                    <Button
                      onClick={handleConnectWallet}
                      className="w-full bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-black font-bold py-3 rounded font-mono tracking-wider"
                    >
                      ▶ CONNECT WALLET
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 bg-emerald-950/20 rounded border border-emerald-500/30">
                      <p className="text-xs text-emerald-300/70 mb-1">Connected Wallet:</p>
                      <p className="text-sm text-emerald-400 font-mono break-all">{walletAddress}</p>
                    </div>

                    <TokenSelector
                      selectedToken={selectedToken}
                      onTokenSelect={(token) => {
                        setSelectedToken(token);
                        setTokenSelected(true);
                      }}
                      chainId={selectedChain}
                    />

                    <Button
                      onClick={handleDisconnectWallet}
                      variant="outline"
                      className="w-full border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/20"
                    >
                      ▶ DISCONNECT WALLET
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Minting - Only show after wallet connection and token selection */}
          {chainSelected && isConnected && tokenSelected && selectedToken && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="text-sm text-emerald-400/70 font-mono tracking-wider">
                ▶ STEP 3 / 3
              </div>

              <ArtifactUpload
                onFileSelect={handleFileSelect}
                isLoading={isMinting}
              />

              {/* File Preview and Metadata Editor */}
              {selectedFile && showMetadataEditor && (
                <div className="border border-emerald-600/30 rounded-lg p-6 bg-emerald-950/10 space-y-4">
                  <h3 className="text-lg font-bold text-emerald-300 tracking-wider">
                    ⚡ PREVIEW & METADATA
                  </h3>

                  {/* Image/Video Preview */}
                  {filePreview && (
                    <div className="mb-4">
                      {selectedFile.type.startsWith("image/") ? (
                        <img
                          src={filePreview}
                          alt="NFT Preview"
                          className="w-full max-h-64 object-cover rounded border border-emerald-500/30"
                        />
                      ) : selectedFile.type.startsWith("video/") ? (
                        <video
                          src={filePreview}
                          className="w-full max-h-64 rounded border border-emerald-500/30"
                          controls
                        />
                      ) : null}
                    </div>
                  )}

                  {/* File Info */}
                  <div className="text-xs text-emerald-300/70 space-y-1">
                    <p>File: {selectedFile.name}</p>
                    <p>Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
                    <p>Type: {selectedFile.type}</p>
                  </div>

                  {/* Metadata Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-emerald-400/70 font-mono">NFT TITLE</label>
                      <Input
                        type="text"
                        placeholder="Enter NFT title"
                        value={nftTitle}
                        onChange={(e) => setNftTitle(e.target.value)}
                        className="mt-1 bg-black border-emerald-500/30 text-emerald-300 placeholder-emerald-500/30"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-emerald-400/70 font-mono">DESCRIPTION</label>
                      <Textarea
                        placeholder="Enter NFT description"
                        value={nftDescription}
                        onChange={(e) => setNftDescription(e.target.value)}
                        className="mt-1 bg-black border-emerald-500/30 text-emerald-300 placeholder-emerald-500/30 h-24"
                      />
                    </div>
                  </div>

                  {/* Mint Button */}
                  <Button
                    onClick={handleMint}
                    disabled={isMinting || !nftTitle}
                    className="w-full bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-black font-bold py-3 rounded font-mono tracking-wider disabled:opacity-50"
                  >
                    {isMinting ? "⏳ MINTING..." : "▶ MINT NFT"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
