-- AlterTable
ALTER TABLE `programs` ADD COLUMN `calc_finance_progress` BIGINT NULL,
    ADD COLUMN `calc_total_budget` BIGINT NULL,
    ADD COLUMN `calc_total_expense` BIGINT NULL;
