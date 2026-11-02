/*
  Warnings:

  - Added the required column `submitted_by` to the `programs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `programs` ADD COLUMN `submitted_by` VARCHAR(55) NOT NULL;
