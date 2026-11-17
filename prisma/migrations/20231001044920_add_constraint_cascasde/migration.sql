-- DropForeignKey
ALTER TABLE `activities` DROP FOREIGN KEY `activities_project_id_fkey`;

-- DropForeignKey
ALTER TABLE `budgets` DROP FOREIGN KEY `budgets_activity_id_fkey`;

-- DropForeignKey
ALTER TABLE `projects` DROP FOREIGN KEY `projects_program_id_fkey`;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
