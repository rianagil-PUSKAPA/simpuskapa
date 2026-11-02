-- AlterTable
ALTER TABLE `vendor_categories` ADD COLUMN `attachment_list` JSON NULL;

-- CreateTable
CREATE TABLE `tax_tier` (
    `id` VARCHAR(55) NOT NULL,
    `tier` INTEGER NOT NULL,
    `min_cap` INTEGER NOT NULL,
    `max_cap` INTEGER NOT NULL,
    `tax_npwp` DOUBLE NOT NULL,
    `tax_non_npwp` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_request` (
    `id` VARCHAR(55) NOT NULL,
    `rf_id` VARCHAR(55) NOT NULL,
    `vendor_id` VARCHAR(55) NOT NULL,
    `payment_date` DATETIME(3) NULL,
    `with_ppn` BOOLEAN NULL,
    `requested_by` VARCHAR(55) NULL,
    `requested_at` DATETIME(3) NULL,
    `pr_budgets` JSON NULL,
    `budget_controller_approval` BOOLEAN NULL,
    `head_of_finance_approval` BOOLEAN NULL,
    `attachments` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payment_request` ADD CONSTRAINT `payment_request_rf_id_fkey` FOREIGN KEY (`rf_id`) REFERENCES `requisition_form`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_request` ADD CONSTRAINT `payment_request_vendor_id_fkey` FOREIGN KEY (`vendor_id`) REFERENCES `vendor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
