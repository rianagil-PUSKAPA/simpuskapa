-- AlterTable
ALTER TABLE `time_off_request` MODIFY `status` ENUM('requested', 'approved', 'declined', 'cancelled', 'fine') NULL;
