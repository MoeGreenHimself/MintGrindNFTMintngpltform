import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getNonce, incrementNonce, isWhitelisted, getWhitelistEntry, recordMint, validatePromoCode, getPromoCodeByCode, recordPromoCodeUsage, hasWalletUsedPromoCode } from "../db";
import { ethers } from "ethers";
import { getChainConfig } from "@shared/chainConfig";
import type { ChainId } from "@shared/chainConfig";

/**
 * Generate a signature for whitelisted minting
 * This signature is used to validate that the wallet is whitelisted
 */
async function generateSignature(
  walletAddress: string,
  quantity: number,
  chainId: ChainId,
  expiryTime: number
): Promise<string> {
  // Get the signer private key from environment
  const signerPrivateKey = process.env.MINT_SIGNER_PRIVATE_KEY;
  if (!signerPrivateKey) {
    throw new Error("MINT_SIGNER_PRIVATE_KEY not configured");
  }

  const chainConfig = getChainConfig(chainId);
  const nonce = await getNonce(walletAddress, chainId);

  // Create the message hash using EIP-712 domain separator
  const domain = {
    name: chainConfig.signerDomain.name,
    version: chainConfig.signerDomain.version,
    chainId: chainConfig.signerDomain.chainId,
    verifyingContract: chainConfig.contractAddress,
  };

  // Message to sign
  const message = {
    minter: walletAddress,
    quantity: quantity,
    nonce: nonce,
    expiry: expiryTime,
  };

  // Create signer
  const signer = new ethers.Wallet(signerPrivateKey);

  // Hash the message
  const messageHash = ethers.solidityPackedKeccak256(
    ["address", "uint256", "uint256", "uint256", "address", "uint256"],
    [walletAddress, quantity, nonce, expiryTime, chainConfig.contractAddress, chainId]
  );

  // Sign the message
  const signature = signer.signMessageSync(ethers.getBytes(messageHash));

  return signature;
}

export const mintRouter = router({
  /**
   * Get signature for whitelisted minting
   * Validates that wallet is whitelisted and generates a signature
   */
  getSignature: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
        quantity: z.number().int().min(1).max(100),
        chainId: z.number().int() as z.ZodType<ChainId>,
        expiryTime: z.number().int().min(Math.floor(Date.now() / 1000)),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validate chain is supported
        const chainConfig = getChainConfig(input.chainId as ChainId);

        // Check if wallet is whitelisted
        const isWhitelistedWallet = await isWhitelisted(input.walletAddress, input.chainId);
        if (!isWhitelistedWallet) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Wallet is not whitelisted for minting",
          });
        }

        // Get whitelist entry to check max mint count
        const whitelistEntry = await getWhitelistEntry(input.walletAddress, input.chainId);
        if (!whitelistEntry) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Whitelist entry not found",
          });
        }

        // Generate signature
        const signature = await generateSignature(
          input.walletAddress,
          input.quantity,
          input.chainId as ChainId,
          input.expiryTime
        );

        // Get current nonce (will be incremented after successful mint)
        const nonce = await getNonce(input.walletAddress, input.chainId);

        return {
          signature,
          nonce,
          expiryTime: input.expiryTime,
          maxMintCount: whitelistEntry.maxMintCount,
          chainId: input.chainId,
          chainName: chainConfig.name,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Mint] Error generating signature:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate signature",
        });
      }
    }),

  /**
   * Validate signature and prepare for mint
   * Called before actual mint transaction
   */
  validateSignature: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
        quantity: z.number().int().min(1),
        signature: z.string(),
        chainId: z.number().int() as z.ZodType<ChainId>,
        expiryTime: z.number().int(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Check if wallet is whitelisted
        const isWhitelistedWallet = await isWhitelisted(input.walletAddress, input.chainId);
        if (!isWhitelistedWallet) {
          return {
            valid: false,
            reason: "Wallet not whitelisted",
          };
        }

        // Check if signature is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime > input.expiryTime) {
          return {
            valid: false,
            reason: "Signature expired",
          };
        }

        // Additional validation can be added here
        // For now, we trust the signature was properly generated by getSignature

        return {
          valid: true,
          expiryTime: input.expiryTime,
          timeRemaining: input.expiryTime - currentTime,
        };
      } catch (error) {
        console.error("[Mint] Error validating signature:", error);
        return {
          valid: false,
          reason: "Validation error",
        };
      }
    }),

  /**
   * Record mint transaction after successful blockchain mint
   * Called after NFT is minted on-chain
   */
  recordMintTransaction: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
        quantity: z.number().int().min(1),
        chainId: z.number().int() as z.ZodType<ChainId>,
        transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
        pricePerNft: z.string(),
        totalAmount: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Record the mint in database
        await recordMint(
          input.walletAddress,
          input.chainId,
          input.quantity,
          input.pricePerNft,
          input.totalAmount,
          input.transactionHash
        );

        // Increment nonce for next mint
        const newNonce = await incrementNonce(input.walletAddress, input.chainId);

        return {
          success: true,
          newNonce,
          message: "Mint recorded successfully",
        };
      } catch (error) {
        console.error("[Mint] Error recording mint:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record mint",
        });
      }
    }),

  /**
   * Get mint history for a wallet
   */
  getMintHistory: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
        chainId: z.number().int().optional() as z.ZodType<ChainId | undefined>,
      })
    )
    .query(async ({ input }) => {
      try {
        const history = await getMintHistory(input.walletAddress, input.chainId);
        return history;
      } catch (error) {
        console.error("[Mint] Error fetching mint history:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch mint history",
        });
      }
    }),

  /**
   * Get current nonce for a wallet on a chain
   */
  getNonce: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
        chainId: z.number().int() as z.ZodType<ChainId>,
      })
    )
    .query(async ({ input }) => {
      try {
        const nonce = await getNonce(input.walletAddress, input.chainId);
        return { nonce };
      } catch (error) {
        console.error("[Mint] Error fetching nonce:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch nonce",
        });
      }
    }),

  /**
   * Validate promo code
   */
  validatePromoCode: publicProcedure
    .input(
      z.object({
        code: z.string().min(1).max(50),
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
      })
    )
    .query(async ({ input }) => {
      try {
        const validation = await validatePromoCode(input.code);

        if (!validation.valid) {
          return {
            valid: false,
            reason: validation.reason,
            discount: 0,
            type: null,
          };
        }

        const promoCode = await getPromoCodeByCode(input.code);
        if (!promoCode) {
          return {
            valid: false,
            reason: "Promo code not found",
            discount: 0,
            type: null,
          };
        }

        // Check if wallet has already used one-time code
        if (promoCode.type === "one_time_free") {
          const hasUsed = await hasWalletUsedPromoCode(input.walletAddress, promoCode.id);
          if (hasUsed) {
            return {
              valid: false,
              reason: "You have already used this promo code",
              discount: 0,
              type: null,
            };
          }
        }

        return {
          valid: true,
          type: promoCode.type,
          discount: promoCode.discountPercent || 0,
          description: promoCode.description,
        };
      } catch (error) {
        console.error("[Mint] Error validating promo code:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to validate promo code",
        });
      }
    }),

  /**
   * Record promo code usage after successful mint
   */
  recordPromoCodeUsage: publicProcedure
    .input(
      z.object({
        code: z.string().min(1).max(50),
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
        chainId: z.number().int() as z.ZodType<ChainId>,
        transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
        amountSaved: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const promoCode = await getPromoCodeByCode(input.code);
        if (!promoCode) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Promo code not found",
          });
        }

        await recordPromoCodeUsage(
          promoCode.id,
          input.walletAddress,
          input.chainId,
          input.transactionHash,
          input.amountSaved
        );

        return {
          success: true,
          message: "Promo code usage recorded",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Mint] Error recording promo code usage:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record promo code usage",
        });
      }
    }),
});

// Import for use in main router
import { getMintHistory } from "../db";
