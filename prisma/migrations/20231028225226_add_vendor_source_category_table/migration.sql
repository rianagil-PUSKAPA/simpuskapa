/*
  Warnings:

  - You are about to drop the column `action_vy` on the `vendor_categories` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `vendor_categories` table. All the data in the column will be lost.
  - Added the required column `vendor_category_info_id` to the `vendor_categories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `vendor_categories` DROP COLUMN `action_vy`,
    DROP COLUMN `name`,
    ADD COLUMN `vendor_category_info_id` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `vendor_category_information` (
    `id` VARCHAR(55) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `action_vy` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vendor_categories` ADD CONSTRAINT `vendor_categories_vendor_category_info_id_fkey` FOREIGN KEY (`vendor_category_info_id`) REFERENCES `vendor_category_information`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
