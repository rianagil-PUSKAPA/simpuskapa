-- CreateTable
CREATE TABLE `perdiem_settings` (
    `id` VARCHAR(55) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `partner_code` VARCHAR(20) NOT NULL,
    `program_id` VARCHAR(55) NOT NULL,

    UNIQUE INDEX `perdiem_settings_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `perdiem_settings` ADD CONSTRAINT `perdiem_settings_program_id_fkey` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
