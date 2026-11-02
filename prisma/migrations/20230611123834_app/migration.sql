/*
  Warnings:

  - You are about to alter the column `cv_path` on the `employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.
  - You are about to alter the column `identity_path` on the `employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.
  - You are about to alter the column `passport_path` on the `employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.
  - You are about to alter the column `npwp_path` on the `employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.
  - You are about to alter the column `bpjs_path` on the `employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.
  - You are about to alter the column `bpjs_emp_path` on the `employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.
  - You are about to alter the column `kk_path` on the `employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.
  - You are about to alter the column `insurance_path` on the `employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.
  - You are about to alter the column `emergency_path` on the `employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.
  - You are about to alter the column `bank_path` on the `employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.
  - You are about to alter the column `pass_photo_path` on the `employee` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.
  - You are about to alter the column `doc_path` on the `employee_contracts` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.
  - You are about to alter the column `doc_path` on the `performances` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.
  - You are about to alter the column `doc_path` on the `time_off_request` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.

*/
-- AlterTable
ALTER TABLE `employee` MODIFY `cv_path` JSON NULL,
    MODIFY `identity_path` JSON NULL,
    MODIFY `passport_path` JSON NULL,
    MODIFY `npwp_path` JSON NULL,
    MODIFY `bpjs_path` JSON NULL,
    MODIFY `bpjs_emp_path` JSON NULL,
    MODIFY `kk_path` JSON NULL,
    MODIFY `insurance_path` JSON NULL,
    MODIFY `emergency_path` JSON NULL,
    MODIFY `bank_path` JSON NULL,
    MODIFY `pass_photo_path` JSON NULL;

-- AlterTable
ALTER TABLE `employee_contracts` MODIFY `doc_path` JSON NULL;

-- AlterTable
ALTER TABLE `performances` MODIFY `doc_path` JSON NULL;

-- AlterTable
ALTER TABLE `time_off_request` MODIFY `doc_path` JSON NULL;
