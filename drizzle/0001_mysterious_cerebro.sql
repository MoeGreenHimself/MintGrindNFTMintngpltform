CREATE TABLE `mint_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`walletAddress` varchar(42) NOT NULL,
	`chainId` int NOT NULL,
	`quantity` int NOT NULL,
	`transactionHash` varchar(66),
	`pricePerNft` varchar(78),
	`totalAmount` varchar(78),
	`status` enum('pending','success','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mint_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signature_nonces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`walletAddress` varchar(42) NOT NULL,
	`chainId` int NOT NULL,
	`nonce` bigint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `signature_nonces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whitelist_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`walletAddress` varchar(42) NOT NULL,
	`chainId` int NOT NULL,
	`maxMintCount` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whitelist_entries_id` PRIMARY KEY(`id`)
);
