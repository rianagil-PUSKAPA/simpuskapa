/*
  Warnings:

  - You are about to drop the column `ordering_seq` on the `rf_projects` table. All the data in the column will be lost.
  - Added the required column `approval_status` to the `requisition_form` table without a default value. This is not possible if the table is not empty.
  - Added the required column `program_project_related_id` to the `requisition_form` table without a default value. This is not possible if the table is not empty.
  - Added the required column `submitted_by` to the `requisition_form` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `requisition_form` ADD COLUMN `approval_status` VARCHAR(55) NOT NULL,
    ADD COLUMN `program_project_related_id` VARCHAR(55) NOT NULL,
    ADD COLUMN `submitted_by` VARCHAR(55) NOT NULL;

-- AlterTable
ALTER TABLE `rf_projects` DROP COLUMN `ordering_seq`;

-- AddForeignKey
ALTER TABLE `requisition_form` ADD CONSTRAINT `requisition_form_program_project_related_id_fkey` FOREIGN KEY (`program_project_related_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
