-- CreateTable
CREATE TABLE `vendor_packages` (
    `id` VARCHAR(55) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `price` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor` (
    `id` VARCHAR(55) NOT NULL,
    `vendor_type` VARCHAR(100) NOT NULL,
    `products_categories` JSON NULL,
    `about_vendor` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vendor_packages` ADD CONSTRAINT `vendor_packages_id_fkey` FOREIGN KEY (`id`) REFERENCES `vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
