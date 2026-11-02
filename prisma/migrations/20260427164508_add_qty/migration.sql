/*
  Warnings:

  - You are about to alter the column `pkg_qty` on the `budgets` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.
  - You are about to alter the column `qty` on the `budgets` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.

*/
-- AlterTable
ALTER TABLE `budgets` ADD COLUMN `retur` INTEGER NULL,
    MODIFY `pkg_qty` DOUBLE NULL,
    MODIFY `qty` DOUBLE NULL;

-- AlterTable
ALTER TABLE `employee` ADD COLUMN `annual_quota` INTEGER NULL DEFAULT 0,
    ADD COLUMN `perdiem_tax_percentage` DOUBLE NULL;

-- AlterTable
ALTER TABLE `finance_logs` ADD COLUMN `body` TEXT NULL;

-- AlterTable
ALTER TABLE `payment_request` ADD COLUMN `budget_controller_approval_at` DATETIME(3) NULL,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `finance_checking_process_at` DATETIME(3) NULL,
    ADD COLUMN `processed_at` DATETIME(3) NULL,
    ADD COLUMN `program_manager_approval_at` DATETIME(3) NULL,
    ADD COLUMN `rejection_note` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `perdiem_settings` ADD COLUMN `base_value_normal` BIGINT NULL,
    ADD COLUMN `base_value_overseas` BIGINT NULL,
    ADD COLUMN `base_value_remote_area` BIGINT NULL,
    ADD COLUMN `travel_expense_non_overnight` BIGINT NULL,
    ADD COLUMN `travel_expense_travel_days` BIGINT NULL;

-- AlterTable
ALTER TABLE `programs` ADD COLUMN `approval_note` TEXT NULL,
    ADD COLUMN `budget_revision_note` VARCHAR(191) NULL,
    ADD COLUMN `budget_revision_requested_at` DATETIME(3) NULL,
    ADD COLUMN `revise_amount` BIGINT NULL,
    MODIFY `approval` ENUM('success', 'pending', 'rejected', 'deafted', 'revision', 'cancelled') NULL;

-- AlterTable
ALTER TABLE `requisition_form` ADD COLUMN `action_at` DATETIME(3) NULL,
    ADD COLUMN `budget_controller_approval_status_at` DATETIME(3) NULL,
    ADD COLUMN `closed_at` DATETIME(3) NULL,
    ADD COLUMN `closed_by` VARCHAR(55) NULL,
    ADD COLUMN `has_retur` BOOLEAN NULL,
    ADD COLUMN `program_manager_approval_status_at` DATETIME(3) NULL,
    ADD COLUMN `rejection_note` VARCHAR(191) NULL,
    ADD COLUMN `staff_id` VARCHAR(55) NULL;

-- AlterTable
ALTER TABLE `time_off_request` ADD COLUMN `resetted_at` DATETIME(3) NULL,
    MODIFY `leave_type` ENUM('annual', 'sick_certified', 'sick_uncertified', 'special', 'compensatory', 'maternity', 'paternity', 'work_remotely', 'isolation', 'caregiving', 'fine', 'joint_holiday') NULL;

-- AlterTable
ALTER TABLE `vendor` ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(55) NOT NULL,
    `notif_type` VARCHAR(191) NOT NULL,
    `ref_id` VARCHAR(55) NOT NULL,
    `employee_id` VARCHAR(55) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fund_received_history` (
    `id` VARCHAR(55) NOT NULL,
    `program_id` VARCHAR(55) NOT NULL,
    `amount` BIGINT NULL,
    `submitted_by` VARCHAR(55) NULL,
    `documents` JSON NULL,
    `source` VARCHAR(55) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `annual_timeoff_reset_history` (
    `id` VARCHAR(55) NOT NULL,
    `year` INTEGER NULL,
    `reset_date` DATETIME(3) NULL,
    `captured` JSON NULL,
    `reseted_by` VARCHAR(55) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
