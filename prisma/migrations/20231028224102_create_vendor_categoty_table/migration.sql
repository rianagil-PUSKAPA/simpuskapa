/*
  Warnings:

  - You are about to drop the column `vendor_categories` on the `vendor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `vendor` DROP COLUMN `vendor_categories`;

-- CreateTable
CREATE TABLE `vendor_categories` (
    `id` VARCHAR(55) NOT NULL,
    `vendor_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `action_vy` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vendor_categories` ADD CONSTRAINT `vendor_categories_vendor_id_fkey` FOREIGN KEY (`vendor_id`) REFERENCES `vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
