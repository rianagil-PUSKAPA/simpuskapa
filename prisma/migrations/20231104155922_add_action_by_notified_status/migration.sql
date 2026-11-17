-- AlterTable
ALTER TABLE `requisition_form` ADD COLUMN `action_by_notified_status` BOOLEAN NULL,
    MODIFY `budget_controller_approval_status` VARCHAR(55) NULL,
    MODIFY `program_manager_approval_status` VARCHAR(55) NULL;
