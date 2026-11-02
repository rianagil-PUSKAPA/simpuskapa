/*
  Warnings:

  - You are about to alter the column `budget_controller_approval` on the `payment_request` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `VarChar(191)`.
  - You are about to alter the column `head_of_finance_approval` on the `payment_request` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `payment_request` MODIFY `budget_controller_approval` VARCHAR(191) NULL,
    MODIFY `head_of_finance_approval` VARCHAR(191) NULL;
