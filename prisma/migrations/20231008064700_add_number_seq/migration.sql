/*
  Warnings:

  - Added the required column `request_number_seq` to the `requisition_form` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `requisition_form` ADD COLUMN `request_number_seq` INTEGER NOT NULL;
