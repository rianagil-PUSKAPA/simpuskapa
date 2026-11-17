-- AlterTable
ALTER TABLE `programs` ADD COLUMN `approval` ENUM('success', 'pending', 'rejected') NULL;
