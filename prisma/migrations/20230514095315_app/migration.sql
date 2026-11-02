/*
  Warnings:

  - You are about to drop the column `total_day` on the `time_off_request` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `time_off_request` DROP COLUMN `total_day`,
    ADD COLUMN `approved_at` DATETIME(3) NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `deleted_at` DATETIME(3) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
