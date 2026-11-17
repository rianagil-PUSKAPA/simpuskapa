-- AlterTable
ALTER TABLE `payment_request` ADD COLUMN `aps_budget_controller_approval` VARCHAR(191) NULL,
    ADD COLUMN `aps_budget_controller_approval_by` VARCHAR(191) NULL,
    ADD COLUMN `aps_haed_of_finance_approval` VARCHAR(191) NULL,
    ADD COLUMN `aps_haed_of_finance_approval_by` VARCHAR(191) NULL;
