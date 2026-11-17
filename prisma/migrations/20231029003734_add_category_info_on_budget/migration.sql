/*
  Warnings:

  - You are about to drop the column `category` on the `budgets` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `budgets` table. All the data in the column will be lost.
  - Added the required column `vendor_category_info_id` to the `budgets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `budgets` DROP COLUMN `category`,
    DROP COLUMN `type`,
    ADD COLUMN `vendor_category_info_id` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_vendor_category_info_id_fkey` FOREIGN KEY (`vendor_category_info_id`) REFERENCES `vendor_category_information`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
