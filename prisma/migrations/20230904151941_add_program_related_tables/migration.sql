-- CreateTable
CREATE TABLE `partners` (
    `id` VARCHAR(55) NOT NULL,
    `name` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `programs` (
    `id` VARCHAR(55) NOT NULL,
    `partner_code` VARCHAR(20) NOT NULL,
    `program_name` VARCHAR(100) NOT NULL,
    `program_description` TEXT NULL,
    `currency` VARCHAR(10) NOT NULL,
    `estimated_budget` INTEGER NOT NULL,
    `grant_manager` VARCHAR(55) NOT NULL,
    `program_manager` VARCHAR(55) NOT NULL,
    `program_officer` VARCHAR(55) NOT NULL,
    `timeline` JSON NULL,
    `contract` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` VARCHAR(55) NOT NULL,
    `ordering_seq` INTEGER NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `description` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `id` VARCHAR(55) NOT NULL,
    `project_id` VARCHAR(55) NOT NULL,
    `ordering_seq` INTEGER NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `description` TEXT NOT NULL,
    `notes` TEXT NOT NULL,
    `timeline` JSON NULL,
    `proposed_milestone` VARCHAR(200) NOT NULL,
    `due_date` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
