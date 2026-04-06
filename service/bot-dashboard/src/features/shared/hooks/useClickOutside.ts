import { useEffect, useRef } from "react";

/**
 * Detects clicks outside the referenced element and calls the handler.
 * Returns a ref to attach to the target element.
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || !(event.target instanceof Node) || ref.current.contains(event.target)) {
        return;
      }
      handler();
    };

    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [handler]);

  return ref;
}
