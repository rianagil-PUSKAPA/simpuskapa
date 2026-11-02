/*
  Warnings:

  - Made the column `program_manager` on table `programs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `programs` MODIFY `program_manager` VARCHAR(55) NOT NULL;

-- AddForeignKey
ALTER TABLE `programs` ADD CONSTRAINT `programs_program_manager_fkey` FOREIGN KEY (`program_manager`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
