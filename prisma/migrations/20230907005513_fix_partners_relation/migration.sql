/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `partners` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `programs` DROP FOREIGN KEY `programs_partner_code_fkey`;

-- CreateIndex
CREATE UNIQUE INDEX `partners_code_key` ON `partners`(`code`);

-- AddForeignKey
ALTER TABLE `programs` ADD CONSTRAINT `programs_partner_code_fkey` FOREIGN KEY (`partner_code`) REFERENCES `partners`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;
