/*
  Warnings:

  - The `start_date` column on the `time_off_request` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `end_date` column on the `time_off_request` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE `time_off_request` DROP COLUMN `start_date`,
    ADD COLUMN `start_date` DATETIME(3) NULL,
    DROP COLUMN `end_date`,
    ADD COLUMN `end_date` DATETIME(3) NULL;
