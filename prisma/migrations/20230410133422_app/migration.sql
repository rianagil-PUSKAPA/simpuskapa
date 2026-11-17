/*
  Warnings:

  - Added the required column `supervisor_id` to the `employee_contracts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `employee_contracts` ADD COLUMN `supervisor_id` VARCHAR(55) NOT NULL;
