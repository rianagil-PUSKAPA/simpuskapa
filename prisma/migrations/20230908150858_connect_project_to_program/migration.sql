/*
  Warnings:

  - Added the required column `program_id` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `projects` ADD COLUMN `program_id` VARCHAR(55) NOT NULL;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
