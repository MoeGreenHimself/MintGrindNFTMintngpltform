import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Whitelist entries for NFT minting
 * Tracks which wallets are whitelisted to mint on which chains
 */
export const whitelistEntries = mysqlTable("whitelist_entries", {
  id: int("id").autoincrement().primaryKey(),
  /** Wallet address (Ethereum address format) */
  walletAddress: varchar("walletAddress", { length: 42 }).notNull(),
  /** Chain ID (1 for Ethereum, 137 for Polygon, etc.) */
  chainId: int("chainId").notNull(),
  /** Maximum number of NFTs this wallet can mint on this chain */
  maxMintCount: int("maxMintCount").notNull().default(1),
  /** Whether this whitelist entry is active */
  isActive: boolean("isActive").notNull().default(true),
  /** Reason for whitelisting (optional) */
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhitelistEntry = typeof whitelistEntries.$inferSelect;
export type InsertWhitelistEntry = typeof whitelistEntries.$inferInsert;

/**
 * Signature nonce tracking for replay attack prevention
 * Each wallet maintains a nonce per chain to ensure unique signatures
 */
export const signatureNonces = mysqlTable("signature_nonces", {
  id: int("id").autoincrement().primaryKey(),
  /** Wallet address */
  walletAddress: varchar("walletAddress", { length: 42 }).notNull(),
  /** Chain ID */
  chainId: int("chainId").notNull(),
  /** Current nonce value (incremented after each mint) */
  nonce: bigint("nonce", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SignatureNonce = typeof signatureNonces.$inferSelect;
export type InsertSignatureNonce = typeof signatureNonces.$inferInsert;

/**
 * Mint history tracking
 * Records all mint transactions for auditing and analytics
 */
export const mintHistory = mysqlTable("mint_history", {
  id: int("id").autoincrement().primaryKey(),
  /** Wallet address that minted */
  walletAddress: varchar("walletAddress", { length: 42 }).notNull(),
  /** Chain ID where mint occurred */
  chainId: int("chainId").notNull(),
  /** Number of NFTs minted in this transaction */
  quantity: int("quantity").notNull(),
  /** Transaction hash on the blockchain */
  transactionHash: varchar("transactionHash", { length: 66 }),
  /** Mint price in wei */
  pricePerNft: varchar("pricePerNft", { length: 78 }),
  /** Total amount paid in wei */
  totalAmount: varchar("totalAmount", { length: 78 }),
  /** Status of the mint (pending, success, failed) */
  status: mysqlEnum("status", ["pending", "success", "failed"]).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MintHistory = typeof mintHistory.$inferSelect;
export type InsertMintHistory = typeof mintHistory.$inferInsert;


/**
 * Promo codes for NFT minting discounts
 * Supports different types: lifetime free, one-time free, percentage discount
 */
export const promoCodes = mysqlTable("promo_codes", {
  id: int("id").autoincrement().primaryKey(),
  /** Promo code (e.g., 'GRINDWORK', 'MintGrindNow') */
  code: varchar("code", { length: 50 }).notNull().unique(),
  /** Type of promo: 'lifetime_free', 'one_time_free', 'discount_percent' */
  type: mysqlEnum("type", ["lifetime_free", "one_time_free", "discount_percent"]).notNull(),
  /** Discount percentage (0-100) for discount_percent type */
  discountPercent: int("discountPercent").default(0),
  /** Maximum number of uses (null = unlimited) */
  maxUses: int("maxUses"),
  /** Current number of uses */
  currentUses: int("currentUses").notNull().default(0),
  /** Whether this promo code is active */
  isActive: boolean("isActive").notNull().default(true),
  /** Expiry date (null = no expiry) */
  expiryDate: timestamp("expiryDate"),
  /** Description of the promo code */
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = typeof promoCodes.$inferInsert;

/**
 * Promo code usage tracking
 * Records which wallets have used which promo codes
 */
export const promoCodeUsage = mysqlTable("promo_code_usage", {
  id: int("id").autoincrement().primaryKey(),
  /** Promo code ID */
  promoCodeId: int("promoCodeId").notNull(),
  /** Wallet address that used the code */
  walletAddress: varchar("walletAddress", { length: 42 }).notNull(),
  /** Chain ID where the code was used */
  chainId: int("chainId").notNull(),
  /** Mint transaction hash */
  transactionHash: varchar("transactionHash", { length: 66 }),
  /** Amount saved (in wei) */
  amountSaved: varchar("amountSaved", { length: 78 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromoCodeUsage = typeof promoCodeUsage.$inferSelect;
export type InsertPromoCodeUsage = typeof promoCodeUsage.$inferInsert;
