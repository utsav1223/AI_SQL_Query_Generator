import { createElement, useCallback, useRef, useState } from "react";
import ConfirmationDialog from "../components/ui/ConfirmationDialog";

export function useConfirmationDialog() {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const closeDialog = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setDialog(null);
  }, []);

  const confirmAction = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        id: Date.now(),
        title: "Confirm action",
        description: "",
        confirmLabel: "Confirm",
        cancelLabel: "Cancel",
        tone: "default",
        requireReason: false,
        reasonLabel: "Reason",
        reasonPlaceholder: "Enter reason",
        confirmText: "",
        ...options
      });
    });
  }, []);

  const ConfirmationDialogView = useCallback(() => {
    return createElement(ConfirmationDialog, {
      key: dialog?.id || "closed",
      dialog,
      onClose: closeDialog
    });
  }, [closeDialog, dialog]);

  return { confirmAction, ConfirmationDialog: ConfirmationDialogView };
}
