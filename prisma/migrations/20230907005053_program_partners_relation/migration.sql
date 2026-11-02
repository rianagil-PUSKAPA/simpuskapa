-- AddForeignKey
ALTER TABLE `programs` ADD CONSTRAINT `programs_partner_code_fkey` FOREIGN KEY (`partner_code`) REFERENCES `partners`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
