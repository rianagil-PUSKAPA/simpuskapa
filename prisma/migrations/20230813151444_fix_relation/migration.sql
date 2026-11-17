-- DropForeignKey
ALTER TABLE `vendor_packages` DROP FOREIGN KEY `vendor_packages_id_fkey`;

-- AddForeignKey
ALTER TABLE `vendor_packages` ADD CONSTRAINT `vendor_packages_vendor_id_fkey` FOREIGN KEY (`vendor_id`) REFERENCES `vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
