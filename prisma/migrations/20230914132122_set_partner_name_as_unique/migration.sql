/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `partners` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `partners_name_key` ON `partners`(`name`);
