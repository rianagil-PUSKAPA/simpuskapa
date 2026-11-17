/*
  Warnings:

  - You are about to drop the column `recruitment_documents` on the `employee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `employee` DROP COLUMN `recruitment_documents`,
    ADD COLUMN `recruitment_documents_path` JSON NULL;
