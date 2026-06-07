import { BottomSheet } from "./BottomSheet";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm", destructive, onConfirm, onCancel,
}: Props) {
  return (
    <BottomSheet open={open} onClose={onCancel} title={title}>
      <div className="flex flex-col gap-5 pb-2">
        <p className="text-muted">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-border py-3 font-semibold text-foreground transition-colors hover:bg-surface"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={[
              "flex-1 rounded-full py-3 font-semibold text-white transition-opacity active:opacity-80",
              destructive ? "bg-red-600" : "bg-accent",
            ].join(" ")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
