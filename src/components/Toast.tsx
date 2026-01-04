import { useEffect } from "react";

export interface ToastMessage {
  id: string;
  title: string;
  variant?: "success" | "error";
}

interface ToastProps {
  message: ToastMessage | null;
  onDismiss: () => void;
}

export const Toast = ({ message, onDismiss }: ToastProps) => {
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(onDismiss, 3500);
    return () => window.clearTimeout(id);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-border bg-surface px-4 py-3 shadow-lg">
      <p className="text-sm font-semibold text-text">
        {message.title}
      </p>
      <p className="text-xs text-text-muted">
        {message.variant === "error" ? "Please try again." : ""}
      </p>
    </div>
  );
};
