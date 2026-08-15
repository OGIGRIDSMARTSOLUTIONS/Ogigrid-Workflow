"use client";

import { Modal } from "./Modal";
import { PrimaryButton, SecondaryButton } from "./FormControls";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-ink-muted">{description}</p>
      <div className="mt-5 flex justify-end gap-2">
        <SecondaryButton type="button" onClick={onCancel}>
          Cancel
        </SecondaryButton>
        <PrimaryButton
          type="button"
          onClick={onConfirm}
          className={danger ? "bg-status-notsubmitted hover:bg-status-notsubmitted" : ""}
        >
          {confirmLabel}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
