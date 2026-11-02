-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(55) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` TEXT NOT NULL,
    `acl` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `avatar` TEXT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `acl_templates` (
    `id` VARCHAR(55) NOT NULL,
    `role_name` VARCHAR(100) NOT NULL,
    `acl` JSON NULL,

    UNIQUE INDEX `acl_templates_role_name_key`(`role_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee` (
    `id` VARCHAR(55) NOT NULL,
    `staff_id` VARCHAR(55) NULL,
    `user_id` VARCHAR(55) NOT NULL,
    `gender` ENUM('male', 'female') NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `pob` VARCHAR(255) NULL,
    `dob` DATETIME(3) NULL,
    `religion` VARCHAR(255) NULL,
    `marital_status` ENUM('maried', 'not_maried') NULL,
    `nationality` VARCHAR(255) NULL,
    `id_card_address` TEXT NULL,
    `residence_address` TEXT NULL,
    `phone_number` VARCHAR(55) NULL,
    `identity_number` VARCHAR(55) NULL,
    `npwp_number` VARCHAR(255) NULL,
    `bpjs_number` VARCHAR(255) NULL,
    `bpjs_tkn_number` VARCHAR(255) NULL,
    `kk_number` VARCHAR(255) NULL,
    `insurance_number` VARCHAR(255) NULL,
    `emergency_contact` VARCHAR(255) NULL,
    `bank_name` VARCHAR(255) NULL,
    `bank_branch` VARCHAR(255) NULL,
    `bank_acc_number` VARCHAR(255) NULL,
    `bank_acc_name` VARCHAR(255) NULL,
    `cv_path` TEXT NULL,
    `identity_path` TEXT NULL,
    `passport_path` TEXT NULL,
    `npwp_path` TEXT NULL,
    `bpjs_path` TEXT NULL,
    `bpjs_emp_path` TEXT NULL,
    `kk_path` TEXT NULL,
    `insurance_path` TEXT NULL,
    `emergency_path` TEXT NULL,
    `bank_path` TEXT NULL,
    `pass_photo_path` TEXT NULL,
    `status` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `performances` (
    `id` VARCHAR(55) NOT NULL,
    `employee_id` VARCHAR(55) NOT NULL,
    `year` INTEGER NOT NULL,
    `doc_path` TEXT NULL,
    `doc_type` ENUM('planning', 'mid_year', 'end_year') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `performances_id_employee_id_key`(`id`, `employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_contracts` (
    `id` VARCHAR(55) NOT NULL,
    `employee_id` VARCHAR(55) NOT NULL,
    `contract_name` VARCHAR(255) NOT NULL,
    `position` VARCHAR(255) NOT NULL,
    `contract_started` DATETIME(3) NULL,
    `contract_ended` DATETIME(3) NULL,
    `doc_path` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trainings` (
    `id` VARCHAR(55) NOT NULL,
    `employee_id` VARCHAR(55) NOT NULL,
    `training_name` VARCHAR(255) NOT NULL,
    `training_date` DATETIME(3) NULL,
    `organizer` VARCHAR(255) NOT NULL,
    `source_fund` VARCHAR(255) NOT NULL,
    `certificate_path` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `time_off_request` (
    `id` VARCHAR(55) NOT NULL,
    `employee_id` VARCHAR(55) NOT NULL,
    `leave_type` ENUM('annual', 'sick_certified', 'sicl_uncertified', 'special', 'compensatory', 'maternity', 'paternity', 'work_remotely', 'isolation', 'caregiving') NULL,
    `start_date` BIGINT NULL,
    `end_date` BIGINT NULL,
    `total_day` INTEGER NULL,
    `notes` TEXT NULL,
    `doc_path` TEXT NULL,
    `status` ENUM('requested', 'approved', 'declined', 'cancelled') NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `employee` ADD CONSTRAINT `employee_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performances` ADD CONSTRAINT `performances_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_contracts` ADD CONSTRAINT `employee_contracts_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trainings` ADD CONSTRAINT `trainings_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_off_request` ADD CONSTRAINT `time_off_request_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
