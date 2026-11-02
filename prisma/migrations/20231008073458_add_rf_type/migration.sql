/*
  Warnings:

  - Added the required column `rf_type` to the `requisition_form` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `requisition_form` ADD COLUMN `rf_type` VARCHAR(55) NOT NULL;
