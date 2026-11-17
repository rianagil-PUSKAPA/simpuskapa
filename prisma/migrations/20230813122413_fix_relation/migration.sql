/*
  Warnings:

  - Added the required column `vendor_id` to the `vendor_packages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `vendor_packages` ADD COLUMN `vendor_id` VARCHAR(191) NOT NULL;
