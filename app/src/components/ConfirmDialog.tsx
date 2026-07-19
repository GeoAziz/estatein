import { useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useModalA11y } from "../lib/useModalA11y";

export type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  requireText?: string;
  prompt?: { label: string; placeholder?: string; required?: boolean };
  onConfirm: (promptValue?: string) => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  requireText,
  prompt,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const [promptValue, setPromptValue] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(dialogRef, onCancel);

  const canConfirm = (!requireText || typed.trim() === requireText) && (!prompt?.required || promptValue.trim().length > 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-5 rounded-xl border border-border bg-base p-6 shadow-2xl focus:outline-none"
      >
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? "bg-red-500/10 text-red-400" : "bg-primary/10 text-primary-text"}`}>
            <AlertTriangle size={20} />
          </span>
          <div className="flex flex-col gap-1">
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
            <p className="text-sm text-muted">{message}</p>
          </div>
        </div>

        {requireText && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">
              Type <span className="font-semibold text-white">{requireText}</span> to confirm
            </span>
            <input
              autoFocus
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            />
          </label>
        )}

        {prompt && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">{prompt.label}</span>
            <textarea
              autoFocus={!requireText}
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              placeholder={prompt.placeholder}
              rows={3}
              className="resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-white placeholder:text-muted/50 focus:border-primary focus:outline-none"
            />
          </label>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-[10px] border border-border px-5 py-2.5 text-sm font-medium text-white hover:border-white/40"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => onConfirm(prompt ? promptValue.trim() : undefined)}
            disabled={!canConfirm}
            className={`rounded-[10px] px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 ${
              danger ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
