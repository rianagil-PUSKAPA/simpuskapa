/*
  Warnings:

  - Added the required column `request_number` to the `payment_request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `request_number_seq` to the `payment_request` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `payment_request` ADD COLUMN `request_number` VARCHAR(200) NOT NULL,
    ADD COLUMN `request_number_seq` INTEGER NOT NULL;
