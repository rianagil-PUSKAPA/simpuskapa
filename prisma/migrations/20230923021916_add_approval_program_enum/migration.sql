-- AlterTable
ALTER TABLE `programs` MODIFY `approval` ENUM('success', 'pending', 'rejected', 'deafted') NULL;
