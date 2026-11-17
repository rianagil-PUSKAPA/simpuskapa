-- AlterTable
ALTER TABLE `payment_request` ADD COLUMN `program_manager_approval` VARCHAR(55) NULL,
    ADD COLUMN `program_manager_approval_by` VARCHAR(55) NULL;

-- AlterTable
ALTER TABLE `programs` MODIFY `grant_manager` VARCHAR(55) NULL,
    MODIFY `program_manager` VARCHAR(55) NULL,
    MODIFY `program_officer` VARCHAR(55) NULL;
