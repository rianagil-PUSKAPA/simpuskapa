/*
  Warnings:

  - The values [sicl_uncertified] on the enum `time_off_request_leave_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `time_off_request` MODIFY `leave_type` ENUM('annual', 'sick_certified', 'sick_uncertified', 'special', 'compensatory', 'maternity', 'paternity', 'work_remotely', 'isolation', 'caregiving') NULL;
