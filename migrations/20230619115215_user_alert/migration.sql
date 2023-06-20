-- AddForeignKey
ALTER TABLE `Alert` ADD CONSTRAINT `Alert_username_fkey` FOREIGN KEY (`username`) REFERENCES `AppUser`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;
