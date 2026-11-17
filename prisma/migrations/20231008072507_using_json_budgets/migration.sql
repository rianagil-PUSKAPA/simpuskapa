/*
  Warnings:

  - You are about to drop the column `rf_activity_id` on the `rf_budgets` table. All the data in the column will be lost.
  - You are about to drop the `rf_activities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rf_projects` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `requisition_form_id` to the `rf_budgets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `rf_activities` DROP FOREIGN KEY `rf_activities_projectsId_fkey`;

-- DropForeignKey
ALTER TABLE `rf_activities` DROP FOREIGN KEY `rf_activities_rf_project_id_fkey`;

-- DropForeignKey
ALTER TABLE `rf_budgets` DROP FOREIGN KEY `rf_budgets_rf_activity_id_fkey`;

-- DropForeignKey
ALTER TABLE `rf_projects` DROP FOREIGN KEY `rf_projects_requisition_form_id_fkey`;

-- AlterTable
ALTER TABLE `rf_budgets` DROP COLUMN `rf_activity_id`,
    ADD COLUMN `requisition_form_id` VARCHAR(55) NOT NULL;

-- DropTable
DROP TABLE `rf_activities`;

-- DropTable
DROP TABLE `rf_projects`;

-- AddForeignKey
ALTER TABLE `rf_budgets` ADD CONSTRAINT `rf_budgets_requisition_form_id_fkey` FOREIGN KEY (`requisition_form_id`) REFERENCES `requisition_form`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
