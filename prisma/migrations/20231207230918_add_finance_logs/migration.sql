-- CreateTable
CREATE TABLE `finance_logs` (
    `id` VARCHAR(55) NOT NULL,
    `log_type` VARCHAR(191) NOT NULL,
    `rf_id` VARCHAR(55) NOT NULL,
    `program_id` VARCHAR(55) NOT NULL,
    `pr_id` VARCHAR(55) NOT NULL,
    `user_id` VARCHAR(55) NOT NULL,
    `raw_data` TEXT NOT NULL,
    `message` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
