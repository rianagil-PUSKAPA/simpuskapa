/*
  Warnings:

  - You are about to drop the column `departement` on the `employee_contracts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `employee_contracts` DROP COLUMN `departement`,
    ADD COLUMN `department` VARCHAR(255) NULL;
