-- AAR table only. Does not change Project, RF, PR, or approval tables.
CREATE TABLE `aar_reports` (
  `id` VARCHAR(55) NOT NULL,
  `created_by` VARCHAR(55) NOT NULL,
  `activity_code` VARCHAR(100) NULL,
  `activity_name` VARCHAR(255) NULL,
  `organizer` VARCHAR(255) NULL,
  `author` VARCHAR(255) NULL,
  `category` VARCHAR(255) NULL,
  `start_date` DATETIME(3) NULL,
  `answers` JSON NOT NULL,
  `attachments` JSON NULL,
  `progress` INTEGER NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
  `email_status` VARCHAR(20) NOT NULL DEFAULT 'not_sent',
  `email_error` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `submitted_at` DATETIME(3) NULL,
  INDEX `aar_reports_created_by_status_idx` (`created_by`, `status`),
  INDEX `aar_reports_created_at_idx` (`created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
