-- CreateTable
CREATE TABLE `rf_projects` (
    `id` VARCHAR(55) NOT NULL,
    `requisition_form_id` VARCHAR(55) NOT NULL,
    `ordering_seq` INTEGER NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `description` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rf_activities` (
    `id` VARCHAR(55) NOT NULL,
    `rf_project_id` VARCHAR(55) NOT NULL,
    `ordering_seq` INTEGER NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `description` TEXT NOT NULL,
    `notes` TEXT NOT NULL,
    `timeline` JSON NULL,
    `proposed_milestone` VARCHAR(200) NOT NULL,
    `due_date` DATETIME(3) NULL,
    `projectsId` VARCHAR(55) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rf_budgets` (
    `id` VARCHAR(55) NOT NULL,
    `rf_activity_id` VARCHAR(55) NOT NULL,
    `ordering_seq` INTEGER NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `description` VARCHAR(100) NOT NULL,
    `type` VARCHAR(100) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `qty` INTEGER NOT NULL,
    `unit` VARCHAR(100) NOT NULL,
    `pkg_qty` INTEGER NOT NULL,
    `pkg_unit` VARCHAR(100) NOT NULL,
    `cost` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requisition_form` (
    `id` VARCHAR(55) NOT NULL,
    `program_id` VARCHAR(55) NOT NULL,
    `deadline` DATETIME(3) NULL,
    `action_by` VARCHAR(55) NOT NULL,
    `about_request` TEXT NOT NULL,
    `personal_hire_information` JSON NULL,
    `travel_detail` JSON NULL,
    `submitted_at` DATETIME(3) NULL,
    `requested_at` DATETIME(3) NULL,
    `requested_by` VARCHAR(55) NOT NULL,
    `request_number` VARCHAR(200) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rf_projects` ADD CONSTRAINT `rf_projects_requisition_form_id_fkey` FOREIGN KEY (`requisition_form_id`) REFERENCES `requisition_form`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rf_activities` ADD CONSTRAINT `rf_activities_rf_project_id_fkey` FOREIGN KEY (`rf_project_id`) REFERENCES `rf_projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rf_activities` ADD CONSTRAINT `rf_activities_projectsId_fkey` FOREIGN KEY (`projectsId`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rf_budgets` ADD CONSTRAINT `rf_budgets_rf_activity_id_fkey` FOREIGN KEY (`rf_activity_id`) REFERENCES `rf_activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requisition_form` ADD CONSTRAINT `requisition_form_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
