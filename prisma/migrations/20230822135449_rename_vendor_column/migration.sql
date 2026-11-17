/*
  Warnings:

  - You are about to drop the column `about_vendor` on the `vendor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `vendor` DROP COLUMN `about_vendor`,
    ADD COLUMN `vendor_information` JSON NULL;
