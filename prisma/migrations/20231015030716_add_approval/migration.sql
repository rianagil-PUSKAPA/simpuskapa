/*
  Warnings:

  - You are about to drop the column `approval_status` on the `requisition_form` table. All the data in the column will be lost.
  - Added the required column `budget_controller_approval_status` to the `requisition_form` table without a default value. This is not possible if the table is not empty.
  - Added the required column `program_manager_approval_status` to the `requisition_form` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `requisition_form` DROP COLUMN `approval_status`,
    ADD COLUMN `budget_controller_approval_status` VARCHAR(55) NOT NULL,
    ADD COLUMN `program_manager_approval_status` VARCHAR(55) NOT NULL;
