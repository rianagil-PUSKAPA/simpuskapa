/*
  Warnings:

  - You are about to drop the column `vendor_type` on the `vendor` table. All the data in the column will be lost.
  - Added the required column `vendor_type_id` to the `vendor_category_information` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `vendor` DROP COLUMN `vendor_type`;

-- AlterTable
ALTER TABLE `vendor_category_information` ADD COLUMN `vendor_type_id` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `vendor_type` (
    `id` VARCHAR(55) NOT NULL,
    `name` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vendor_category_information` ADD CONSTRAINT `vendor_category_information_vendor_type_id_fkey` FOREIGN KEY (`vendor_type_id`) REFERENCES `vendor_type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
