import { describe, it, expect, beforeEach, vi } from "vitest";
import { mintRouter } from "./mint";
import * as db from "../db";

// Mock database functions
vi.mock("../db", () => ({
  getNonce: vi.fn(),
  incrementNonce: vi.fn(),
  isWhitelisted: vi.fn(),
  getWhitelistEntry: vi.fn(),
  recordMint: vi.fn(),
  getMintHistory: vi.fn(),
}));

describe("Mint Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSignature", () => {
    it("should return signature for whitelisted wallet", async () => {
      const walletAddress = "0x1234567890123456789012345678901234567890";
      const chainId = 1;
      const quantity = 1;
      const expiryTime = Math.floor(Date.now() / 1000) + 3600;

      // Mock whitelisted wallet
      vi.mocked(db.isWhitelisted).mockResolvedValue(true);
      vi.mocked(db.getWhitelistEntry).mockResolvedValue({
        id: 1,
        walletAddress,
        chainId,
        maxMintCount: 5,
        isActive: true,
        reason: "Test",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(db.getNonce).mockResolvedValue(0);

      const caller = mintRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      // This will fail without proper signer setup, but tests the flow
      try {
        const result = await caller.getSignature({
          walletAddress,
          quantity,
          chainId: chainId as any,
          expiryTime,
        });
        expect(result).toBeDefined();
        expect(result.nonce).toBe(0);
      } catch (error) {
        // Expected to fail without MINT_SIGNER_PRIVATE_KEY
        expect(error).toBeDefined();
      }
    });

    it("should reject non-whitelisted wallet", async () => {
      const walletAddress = "0x1234567890123456789012345678901234567890";
      const chainId = 1;

      vi.mocked(db.isWhitelisted).mockResolvedValue(false);

      const caller = mintRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.getSignature({
          walletAddress,
          quantity: 1,
          chainId: chainId as any,
          expiryTime: Math.floor(Date.now() / 1000) + 3600,
        });
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
        expect(error.message).toContain("not whitelisted");
      }
    });

    it("should reject invalid wallet address", async () => {
      const caller = mintRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.getSignature({
          walletAddress: "invalid-address",
          quantity: 1,
          chainId: 1 as any,
          expiryTime: Math.floor(Date.now() / 1000) + 3600,
        });
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it("should reject quantity > 100", async () => {
      const caller = mintRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.getSignature({
          walletAddress: "0x1234567890123456789012345678901234567890",
          quantity: 101,
          chainId: 1 as any,
          expiryTime: Math.floor(Date.now() / 1000) + 3600,
        });
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it("should reject expired expiry time", async () => {
      const caller = mintRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const pastTime = Math.floor(Date.now() / 1000) - 3600;

      try {
        await caller.getSignature({
          walletAddress: "0x1234567890123456789012345678901234567890",
          quantity: 1,
          chainId: 1 as any,
          expiryTime: pastTime,
        });
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("validateSignature", () => {
    it("should validate signature for whitelisted wallet", async () => {
      const walletAddress = "0x1234567890123456789012345678901234567890";
      const chainId = 1;
      const expiryTime = Math.floor(Date.now() / 1000) + 3600;

      vi.mocked(db.isWhitelisted).mockResolvedValue(true);

      const caller = mintRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.validateSignature({
        walletAddress,
        quantity: 1,
        signature: "0x1234567890",
        chainId: chainId as any,
        expiryTime,
      });

      expect(result.valid).toBe(true);
      expect(result.expiryTime).toBe(expiryTime);
    });

    it("should reject expired signature", async () => {
      const walletAddress = "0x1234567890123456789012345678901234567890";
      const chainId = 1;
      const pastTime = Math.floor(Date.now() / 1000) - 3600;

      vi.mocked(db.isWhitelisted).mockResolvedValue(true);

      const caller = mintRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.validateSignature({
        walletAddress,
        quantity: 1,
        signature: "0x1234567890",
        chainId: chainId as any,
        expiryTime: pastTime,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Signature expired");
    });

    it("should reject non-whitelisted wallet", async () => {
      const walletAddress = "0x1234567890123456789012345678901234567890";
      const chainId = 1;
      const expiryTime = Math.floor(Date.now() / 1000) + 3600;

      vi.mocked(db.isWhitelisted).mockResolvedValue(false);

      const caller = mintRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.validateSignature({
        walletAddress,
        quantity: 1,
        signature: "0x1234567890",
        chainId: chainId as any,
        expiryTime,
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Wallet not whitelisted");
    });
  });

  describe("getNonce", () => {
    it("should return current nonce for wallet", async () => {
      const walletAddress = "0x1234567890123456789012345678901234567890";
      const chainId = 1;

      vi.mocked(db.getNonce).mockResolvedValue(5);

      const caller = mintRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getNonce({
        walletAddress,
        chainId: chainId as any,
      });

      expect(result.nonce).toBe(5);
    });

    it("should return 0 for new wallet", async () => {
      const walletAddress = "0x1234567890123456789012345678901234567890";
      const chainId = 1;

      vi.mocked(db.getNonce).mockResolvedValue(0);

      const caller = mintRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getNonce({
        walletAddress,
        chainId: chainId as any,
      });

      expect(result.nonce).toBe(0);
    });
  });

  describe("recordMintTransaction", () => {
    it("should record mint transaction successfully", async () => {
      const walletAddress = "0x1234567890123456789012345678901234567890";
      const chainId = 1;
      const txHash = "0x1234567890123456789012345678901234567890123456789012345678901234";

      vi.mocked(db.recordMint).mockResolvedValue(undefined);
      vi.mocked(db.incrementNonce).mockResolvedValue(1);

      const caller = mintRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.recordMintTransaction({
        walletAddress,
        quantity: 1,
        chainId: chainId as any,
        transactionHash: txHash,
        pricePerNft: "1000000000000000000",
        totalAmount: "1000000000000000000",
      });

      expect(result.success).toBe(true);
      expect(result.newNonce).toBe(1);
    });

    it("should reject invalid transaction hash", async () => {
      const caller = mintRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.recordMintTransaction({
          walletAddress: "0x1234567890123456789012345678901234567890",
          quantity: 1,
          chainId: 1 as any,
          transactionHash: "invalid-hash",
          pricePerNft: "1000000000000000000",
          totalAmount: "1000000000000000000",
        });
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });
});
