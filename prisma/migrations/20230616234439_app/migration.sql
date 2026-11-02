/*
  Warnings:

  - The values [fine] on the enum `time_off_request_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `time_off_request` MODIFY `leave_type` ENUM('annual', 'sick_certified', 'sick_uncertified', 'special', 'compensatory', 'maternity', 'paternity', 'work_remotely', 'isolation', 'caregiving', 'fine') NULL,
    MODIFY `status` ENUM('requested', 'approved', 'declined', 'cancelled') NULL;
