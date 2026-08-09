import { useEffect, useRef, useState } from "react";

const MIN_VISIBLE_MS = 1800;
const MAX_VISIBLE_MS = 3500;

/**
 * Shows splash until `ready` and at least MIN_VISIBLE_MS.
 * Always dismisses by MAX_VISIBLE_MS so it can't get stuck.
 */
export function useSiteLoaderVisible(ready = true): boolean {
  const [visible, setVisible] = useState(true);
  const startedAt = useRef(Date.now());
  const dismissed = useRef(false);

  useEffect(() => {
    if (dismissed.current) {
      return;
    }

    const dismiss = () => {
      if (dismissed.current) return;
      dismissed.current = true;
      setVisible(false);
    };

    const maxTimer = setTimeout(dismiss, MAX_VISIBLE_MS);

    if (!ready) {
      return () => clearTimeout(maxTimer);
    }

    const elapsed = Date.now() - startedAt.current;
    const minTimer = setTimeout(dismiss, Math.max(0, MIN_VISIBLE_MS - elapsed));

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, [ready]);

  return visible;
}
