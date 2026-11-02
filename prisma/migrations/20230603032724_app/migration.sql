/*
  Warnings:

  - You are about to drop the column `emergency_contact` on the `employee` table. All the data in the column will be lost.
  - You are about to drop the column `emergency_contact_relation` on the `employee` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `employee` DROP COLUMN `emergency_contact`,
    DROP COLUMN `emergency_contact_relation`,
    ADD COLUMN `emergency_contacts` TEXT NULL;

-- AlterTable
ALTER TABLE `time_off_request` ADD COLUMN `duration` INTEGER NULL;
