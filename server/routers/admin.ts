import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getAllPromoCodes,
  getPromoCodeUsageStats,
  updatePromoCode,
  deletePromoCode,
  getPromoCodeUsageHistory,
  createPromoCode,
} from "../db";

/**
 * Admin router - protected procedures for admin-only operations
 * All procedures require admin role
 */
export const adminRouter = router({
  /**
   * Get all promo codes with usage stats
   */
  getAllPromoCodesWithStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can access this endpoint",
        });
      }

      const codes = await getAllPromoCodes();
      const codesWithStats = await Promise.all(
        codes.map(async (code) => {
          const stats = await getPromoCodeUsageStats(code.id);
          return {
            ...code,
            stats,
          };
        })
      );

      return codesWithStats;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error("[Admin] Error fetching promo codes:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch promo codes",
      });
    }
  }),

  /**
   * Get usage history for a specific promo code
   */
  getPromoCodeUsageHistory: protectedProcedure
    .input(
      z.object({
        promoCodeId: z.number().int(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can access this endpoint",
          });
        }

        const history = await getPromoCodeUsageHistory(input.promoCodeId, input.limit);
        return history;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Admin] Error fetching usage history:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch usage history",
        });
      }
    }),

  /**
   * Create a new promo code
   */
  createPromoCode: protectedProcedure
    .input(
      z.object({
        code: z.string().min(3).max(50),
        type: z.enum(["lifetime_free", "one_time_free", "discount_percent"]),
        discountPercent: z.number().int().min(0).max(100).default(0),
        maxUses: z.number().int().min(1).optional(),
        expiryDate: z.date().optional(),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can create promo codes",
          });
        }

        await createPromoCode(input.code, input.type, {
          discountPercent: input.discountPercent,
          maxUses: input.maxUses,
          expiryDate: input.expiryDate,
          description: input.description,
        });

        return {
          success: true,
          message: `Promo code ${input.code} created successfully`,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Admin] Error creating promo code:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create promo code",
        });
      }
    }),

  /**
   * Update an existing promo code
   */
  updatePromoCode: protectedProcedure
    .input(
      z.object({
        promoCodeId: z.number().int(),
        isActive: z.boolean().optional(),
        maxUses: z.number().int().min(1).optional(),
        expiryDate: z.date().optional(),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can update promo codes",
          });
        }

        await updatePromoCode(input.promoCodeId, {
          isActive: input.isActive,
          maxUses: input.maxUses,
          expiryDate: input.expiryDate,
          description: input.description,
        });

        return {
          success: true,
          message: "Promo code updated successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Admin] Error updating promo code:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update promo code",
        });
      }
    }),

  /**
   * Disable a promo code
   */
  disablePromoCode: protectedProcedure
    .input(
      z.object({
        promoCodeId: z.number().int(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user?.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can disable promo codes",
          });
        }

        await deletePromoCode(input.promoCodeId);

        return {
          success: true,
          message: "Promo code disabled successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Admin] Error disabling promo code:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to disable promo code",
        });
      }
    }),

  /**
   * Get analytics summary
   */
  getAnalyticsSummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can access this endpoint",
        });
      }

      const codes = await getAllPromoCodes();
      let totalPromos = codes.length;
      let activePromos = codes.filter((c) => c.isActive).length;
      let totalUsesAcrossAll = 0;
      let totalSavingsAcrossAll = BigInt(0);

      for (const code of codes) {
        const stats = await getPromoCodeUsageStats(code.id);
        if (stats) {
          totalUsesAcrossAll += stats.totalUses;
          totalSavingsAcrossAll += BigInt(stats.totalAmountSaved || "0");
        }
      }

      return {
        totalPromos,
        activePromos,
        inactivePromos: totalPromos - activePromos,
        totalUsesAcrossAll,
        totalSavingsAcrossAll: totalSavingsAcrossAll.toString(),
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error("[Admin] Error fetching analytics:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch analytics",
      });
    }
  }),
});
