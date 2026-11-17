/*
  Warnings:

  - You are about to drop the `rf_budgets` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `rf_budgets` to the `requisition_form` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `rf_budgets` DROP FOREIGN KEY `rf_budgets_requisition_form_id_fkey`;

-- AlterTable
ALTER TABLE `requisition_form` ADD COLUMN `rf_budgets` JSON NOT NULL;

-- DropTable
DROP TABLE `rf_budgets`;
