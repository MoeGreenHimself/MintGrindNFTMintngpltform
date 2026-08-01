import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { calculateMintingCosts, estimateGasCost, getEstimatedCostInNativeToken } from "../services/gasEstimator";
import type { ChainId } from "@shared/chainConfig";

export const pricingRouter = router({
  /**
   * Get estimated gas costs for a specific chain
   */
  estimateGas: publicProcedure
    .input(
      z.object({
        chainId: z.number().int() as z.ZodType<ChainId>,
      })
    )
    .query(async ({ input }) => {
      const estimate = await estimateGasCost(input.chainId as ChainId);
      return estimate;
    }),

  /**
   * Calculate total minting costs (platform fee + gas)
   */
  calculateCosts: publicProcedure
    .input(
      z.object({
        chainId: z.number().int() as z.ZodType<ChainId>,
        platformFeeUSD: z.number().optional().default(2.99),
      })
    )
    .query(async ({ input }) => {
      const costs = await calculateMintingCosts(input.chainId as ChainId, input.platformFeeUSD);
      return costs;
    }),

  /**
   * Get cost in native token (ETH/MATIC)
   */
  getCostInNativeToken: publicProcedure
    .input(
      z.object({
        chainId: z.number().int() as z.ZodType<ChainId>,
        costUSD: z.number().min(0),
      })
    )
    .query(async ({ input }) => {
      const costInToken = await getEstimatedCostInNativeToken(input.chainId as ChainId, input.costUSD);
      return {
        costUSD: input.costUSD.toFixed(2),
        costInToken,
        chainId: input.chainId,
      };
    }),
});
