/*
  Warnings:

  - Added the required column `category` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cost` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ordering_seq` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pkg_qty` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pkg_unit` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qty` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `budgets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `budgets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `budgets` ADD COLUMN `category` VARCHAR(100) NOT NULL,
    ADD COLUMN `code` VARCHAR(100) NOT NULL,
    ADD COLUMN `cost` INTEGER NOT NULL,
    ADD COLUMN `description` VARCHAR(100) NOT NULL,
    ADD COLUMN `ordering_seq` VARCHAR(100) NOT NULL,
    ADD COLUMN `pkg_qty` INTEGER NOT NULL,
    ADD COLUMN `pkg_unit` VARCHAR(100) NOT NULL,
    ADD COLUMN `qty` INTEGER NOT NULL,
    ADD COLUMN `type` VARCHAR(100) NOT NULL,
    ADD COLUMN `unit` VARCHAR(100) NOT NULL;
