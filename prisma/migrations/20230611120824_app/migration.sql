/*
  Warnings:

  - You are about to alter the column `certificate_path` on the `trainings` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.

*/
-- AlterTable
ALTER TABLE `trainings` MODIFY `certificate_path` JSON NULL;
