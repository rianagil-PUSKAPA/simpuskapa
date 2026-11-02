-- AlterTable
ALTER TABLE `programs` ADD COLUMN `created_by` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `vendor` ADD COLUMN `created_by` VARCHAR(191) NULL;
