import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, whitelistEntries, signatureNonces, mintHistory, promoCodes, promoCodeUsage } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// User Management
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// Whitelist Management
// ============================================================================

export async function isWhitelisted(walletAddress: string, chainId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot check whitelist: database not available");
    return false;
  }

  const result = await db
    .select()
    .from(whitelistEntries)
    .where(
      and(
        eq(whitelistEntries.walletAddress, walletAddress.toLowerCase()),
        eq(whitelistEntries.chainId, chainId),
        eq(whitelistEntries.isActive, true)
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function getWhitelistEntry(walletAddress: string, chainId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get whitelist entry: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(whitelistEntries)
    .where(
      and(
        eq(whitelistEntries.walletAddress, walletAddress.toLowerCase()),
        eq(whitelistEntries.chainId, chainId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function addToWhitelist(walletAddress: string, chainId: number, maxMintCount: number = 1, reason?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add to whitelist: database not available");
    return;
  }

  await db.insert(whitelistEntries).values({
    walletAddress: walletAddress.toLowerCase(),
    chainId,
    maxMintCount,
    reason,
    isActive: true,
  });
}

// ============================================================================
// Signature Nonce Management
// ============================================================================

export async function getNonce(walletAddress: string, chainId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get nonce: database not available");
    return 0;
  }

  const result = await db
    .select()
    .from(signatureNonces)
    .where(
      and(
        eq(signatureNonces.walletAddress, walletAddress.toLowerCase()),
        eq(signatureNonces.chainId, chainId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0].nonce : 0;
}

export async function incrementNonce(walletAddress: string, chainId: number): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot increment nonce: database not available");
    return 0;
  }

  const currentNonce = await getNonce(walletAddress, chainId);
  const newNonce = currentNonce + 1;

  const existing = await db
    .select()
    .from(signatureNonces)
    .where(
      and(
        eq(signatureNonces.walletAddress, walletAddress.toLowerCase()),
        eq(signatureNonces.chainId, chainId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(signatureNonces)
      .set({ nonce: newNonce })
      .where(
        and(
          eq(signatureNonces.walletAddress, walletAddress.toLowerCase()),
          eq(signatureNonces.chainId, chainId)
        )
      );
  } else {
    await db.insert(signatureNonces).values({
      walletAddress: walletAddress.toLowerCase(),
      chainId,
      nonce: newNonce,
    });
  }

  return newNonce;
}

// ============================================================================
// Mint History
// ============================================================================

export async function recordMint(
  walletAddress: string,
  chainId: number,
  quantity: number,
  pricePerNft: string,
  totalAmount: string,
  transactionHash?: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot record mint: database not available");
    return;
  }

  await db.insert(mintHistory).values({
    walletAddress: walletAddress.toLowerCase(),
    chainId,
    quantity,
    pricePerNft,
    totalAmount,
    transactionHash,
    status: "pending",
  });
}

export async function getMintHistory(walletAddress: string, chainId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get mint history: database not available");
    return [];
  }

  if (chainId !== undefined) {
    return db
      .select()
      .from(mintHistory)
      .where(
        and(
          eq(mintHistory.walletAddress, walletAddress.toLowerCase()),
          eq(mintHistory.chainId, chainId)
        )
      );
  }

  return db
    .select()
    .from(mintHistory)
    .where(eq(mintHistory.walletAddress, walletAddress.toLowerCase()));
}

// ============================================================================
// Promo Code Management
// ============================================================================

export async function getPromoCodeByCode(code: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get promo code: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(promoCodes)
    .where(
      and(
        eq(promoCodes.code, code.toUpperCase()),
        eq(promoCodes.isActive, true)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function validatePromoCode(code: string): Promise<{ valid: boolean; reason?: string }> {
  const promoCode = await getPromoCodeByCode(code);

  if (!promoCode) {
    return { valid: false, reason: "Promo code not found" };
  }

  if (!promoCode.isActive) {
    return { valid: false, reason: "Promo code is not active" };
  }

  // Check expiry date
  if (promoCode.expiryDate && new Date() > promoCode.expiryDate) {
    return { valid: false, reason: "Promo code has expired" };
  }

  // Check max uses
  if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
    return { valid: false, reason: "Promo code has reached maximum uses" };
  }

  return { valid: true };
}

export async function recordPromoCodeUsage(
  promoCodeId: number,
  walletAddress: string,
  chainId: number,
  transactionHash?: string,
  amountSaved?: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot record promo code usage: database not available");
    return;
  }

  // Record usage
  await db.insert(promoCodeUsage).values({
    promoCodeId,
    walletAddress: walletAddress.toLowerCase(),
    chainId,
    transactionHash,
    amountSaved,
  });

  // Increment usage count
  const promoCode = await db.select().from(promoCodes).where(eq(promoCodes.id, promoCodeId)).limit(1);
  if (promoCode.length > 0) {
    await db
      .update(promoCodes)
      .set({ currentUses: promoCode[0].currentUses + 1 })
      .where(eq(promoCodes.id, promoCodeId));
  }
}

export async function hasWalletUsedPromoCode(walletAddress: string, promoCodeId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot check promo code usage: database not available");
    return false;
  }

  const result = await db
    .select()
    .from(promoCodeUsage)
    .where(
      and(
        eq(promoCodeUsage.walletAddress, walletAddress.toLowerCase()),
        eq(promoCodeUsage.promoCodeId, promoCodeId)
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function createPromoCode(
  code: string,
  type: "lifetime_free" | "one_time_free" | "discount_percent",
  options?: {
    discountPercent?: number;
    maxUses?: number;
    expiryDate?: Date;
    description?: string;
  }
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create promo code: database not available");
    return;
  }

  await db.insert(promoCodes).values({
    code: code.toUpperCase(),
    type,
    discountPercent: options?.discountPercent || 0,
    maxUses: options?.maxUses,
    expiryDate: options?.expiryDate,
    description: options?.description,
    isActive: true,
    currentUses: 0,
  });
}


// ============================================================================
// Admin Dashboard Functions
// ============================================================================

export async function getAllPromoCodes() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get promo codes: database not available");
    return [];
  }

  return db.select().from(promoCodes).orderBy(promoCodes.createdAt);
}

export async function getPromoCodeUsageStats(promoCodeId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get usage stats: database not available");
    return null;
  }

  const usage = await db
    .select()
    .from(promoCodeUsage)
    .where(eq(promoCodeUsage.promoCodeId, promoCodeId));

  const totalUses = usage.length;
  const totalAmountSaved = usage.reduce((sum, u) => {
    const amount = BigInt(u.amountSaved || "0");
    return sum + amount;
  }, BigInt(0));

  return {
    totalUses,
    totalAmountSaved: totalAmountSaved.toString(),
    uniqueWallets: new Set(usage.map((u) => u.walletAddress)).size,
  };
}

export async function updatePromoCode(
  promoCodeId: number,
  updates: {
    isActive?: boolean;
    maxUses?: number;
    expiryDate?: Date;
    description?: string;
  }
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update promo code: database not available");
    return;
  }

  const updateData: Record<string, unknown> = {};

  if (updates.isActive !== undefined) {
    updateData.isActive = updates.isActive;
  }
  if (updates.maxUses !== undefined) {
    updateData.maxUses = updates.maxUses;
  }
  if (updates.expiryDate !== undefined) {
    updateData.expiryDate = updates.expiryDate;
  }
  if (updates.description !== undefined) {
    updateData.description = updates.description;
  }

  if (Object.keys(updateData).length === 0) {
    return;
  }

  await db.update(promoCodes).set(updateData).where(eq(promoCodes.id, promoCodeId));
}

export async function deletePromoCode(promoCodeId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete promo code: database not available");
    return;
  }

  // Soft delete by marking as inactive
  await db
    .update(promoCodes)
    .set({ isActive: false })
    .where(eq(promoCodes.id, promoCodeId));
}

export async function getPromoCodeUsageHistory(promoCodeId: number, limit = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get usage history: database not available");
    return [];
  }

  return db
    .select()
    .from(promoCodeUsage)
    .where(eq(promoCodeUsage.promoCodeId, promoCodeId))
    .orderBy(promoCodeUsage.createdAt)
    .limit(limit);
}
