CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`company` text NOT NULL,
	`action` text NOT NULL,
	`object_id` text,
	`details` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `business_state` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`last_operation` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`company` text NOT NULL,
	`role` text NOT NULL,
	`user_id` text,
	`active` integer DEFAULT 1 NOT NULL,
	`is_owner` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
