/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `programs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `programs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `programs` ADD COLUMN `code` VARCHAR(20) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `programs_code_key` ON `programs`(`code`);
