/*
  Warnings:

  - You are about to alter the column `ordering_seq` on the `budgets` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `Int`.

*/
-- AlterTable
ALTER TABLE `budgets` MODIFY `ordering_seq` INTEGER NOT NULL;
