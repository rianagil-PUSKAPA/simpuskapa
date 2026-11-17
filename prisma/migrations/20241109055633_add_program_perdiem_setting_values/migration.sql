/*
  Warnings:

  - You are about to drop the column `code` on the `perdiem_settings` table. All the data in the column will be lost.
  - You are about to drop the column `partner_code` on the `perdiem_settings` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `perdiem_settings_code_key` ON `perdiem_settings`;

-- AlterTable
ALTER TABLE `perdiem_settings` DROP COLUMN `code`,
    DROP COLUMN `partner_code`,
    ADD COLUMN `activity_perdiem` BIGINT NULL,
    ADD COLUMN `base_value` BIGINT NULL,
    ADD COLUMN `note` TEXT NULL,
    ADD COLUMN `travel_expense_percentages_breakfast` BIGINT NULL,
    ADD COLUMN `travel_expense_percentages_dinner` BIGINT NULL,
    ADD COLUMN `travel_expense_percentages_lunch` BIGINT NULL,
    ADD COLUMN `travel_perdiem` BIGINT NULL;
