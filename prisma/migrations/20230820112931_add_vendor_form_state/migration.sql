/*
  Warnings:

  - Added the required column `form_progress` to the `vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `form_state` to the `vendor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `vendor` ADD COLUMN `form_progress` INTEGER NOT NULL,
    ADD COLUMN `form_state` TEXT NOT NULL;
