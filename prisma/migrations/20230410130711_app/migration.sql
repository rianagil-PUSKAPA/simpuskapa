/*
  Warnings:

  - Added the required column `departement` to the `employee_contracts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emp_status` to the `employee_contracts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `employee_contracts` ADD COLUMN `departement` VARCHAR(255) NOT NULL,
    ADD COLUMN `emp_status` VARCHAR(255) NOT NULL;
