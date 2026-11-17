/*
  Warnings:

  - You are about to drop the column `submitted_at` on the `requisition_form` table. All the data in the column will be lost.
  - You are about to drop the column `submitted_by` on the `requisition_form` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `requisition_form` DROP COLUMN `submitted_at`,
    DROP COLUMN `submitted_by`;
