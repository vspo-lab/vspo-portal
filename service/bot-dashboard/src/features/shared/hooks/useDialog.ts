import { useCallback, useRef, useState } from "react";

export interface DialogHook {
  ref: React.RefObject<HTMLDialogElement | null>;
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/**
 * Manages a native `<dialog>` element's open/close state.
 * Handles showModal/close and tracks open state.
 */
export function useDialog(): DialogHook {
  const ref = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    if (ref.current && !ref.current.open) {
      ref.current.showModal();
      setIsOpen(true);
    }
  }, []);

  const close = useCallback(() => {
    ref.current?.close();
    setIsOpen(false);
  }, []);

  return { ref, isOpen, open, close };
}
