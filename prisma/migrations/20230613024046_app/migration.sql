-- AlterTable
ALTER TABLE `employee` ADD COLUMN `health_insurance_number` VARCHAR(255) NULL,
    ADD COLUMN `health_insurance_path` JSON NULL,
    ADD COLUMN `recruitment_documents` JSON NULL;
