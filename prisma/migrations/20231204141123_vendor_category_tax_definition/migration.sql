-- AlterTable
ALTER TABLE `vendor_category_information` ADD COLUMN `npwp_tax_percentage` INTEGER NULL,
    ADD COLUMN `ppn_percentage` DOUBLE NULL,
    ADD COLUMN `tax_percentage` DOUBLE NULL;
