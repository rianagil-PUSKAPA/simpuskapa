/*
  Warnings:

  - You are about to drop the column `action_vy` on the `vendor_category_information` table. All the data in the column will be lost.
  - Added the required column `action_by` to the `vendor_category_information` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `vendor_category_information` DROP COLUMN `action_vy`,
    ADD COLUMN `action_by` VARCHAR(100) NOT NULL;
