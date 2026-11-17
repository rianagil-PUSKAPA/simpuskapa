-- AlterTable
ALTER TABLE `payment_request` ADD COLUMN `budget_controller_approval_by` VARCHAR(191) NULL,
    ADD COLUMN `head_of_finance_approval_by` VARCHAR(191) NULL;
