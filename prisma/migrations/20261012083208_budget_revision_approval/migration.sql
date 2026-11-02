-- Budget Needs revision requests are separate from ordinary program approval.
-- Existing approval="revision" rows are preserved, without making assumptions about decisions.
ALTER TABLE `programs`
  ADD COLUMN `budget_revision_status` VARCHAR(20) NULL,
  ADD COLUMN `budget_revision_requested_by` VARCHAR(55) NULL,
  ADD COLUMN `budget_revision_decided_by` VARCHAR(55) NULL,
  ADD COLUMN `budget_revision_decided_at` DATETIME(3) NULL,
  ADD COLUMN `budget_revision_rejection_note` TEXT NULL;

-- Do NOT auto-mark legacy revision records as approved.
-- NULL status on approval='revision' retains its legacy UI behavior.
