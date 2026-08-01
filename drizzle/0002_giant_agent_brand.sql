CREATE TABLE `promo_code_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promoCodeId` int NOT NULL,
	`walletAddress` varchar(42) NOT NULL,
	`chainId` int NOT NULL,
	`transactionHash` varchar(66),
	`amountSaved` varchar(78),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promo_code_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promo_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`type` enum('lifetime_free','one_time_free','discount_percent') NOT NULL,
	`discountPercent` int DEFAULT 0,
	`maxUses` int,
	`currentUses` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`expiryDate` timestamp,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promo_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promo_codes_code_unique` UNIQUE(`code`)
);
