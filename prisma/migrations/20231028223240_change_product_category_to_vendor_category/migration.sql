/*
  Warnings:

  - You are about to drop the column `products_categories` on the `vendor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `vendor` DROP COLUMN `products_categories`,
    ADD COLUMN `vendor_categories` JSON NULL;
