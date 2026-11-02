-- AlterTable
ALTER TABLE `payment_request` ADD COLUMN `finance_checking_process_by` VARCHAR(191) NULL,
    ADD COLUMN `finance_checking_process_status` VARCHAR(191) NULL;
