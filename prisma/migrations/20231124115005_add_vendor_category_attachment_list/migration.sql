/*
  Warnings:

  - You are about to drop the column `attachment_list` on the `vendor_categories` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `vendor_categories` DROP COLUMN `attachment_list`;

-- AlterTable
ALTER TABLE `vendor_category_information` ADD COLUMN `attachment_list` JSON NULL;
