/*
  Warnings:

  - Added the required column `code` to the `partners` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `partners` ADD COLUMN `code` VARCHAR(20) NOT NULL;
