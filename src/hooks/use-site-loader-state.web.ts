import { usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

const MIN_VISIBLE_MS = 2000;
const SLOW_NAVIGATION_MS = 2000;
const SLOW_CONNECTION_TYPES = new Set(['slow-2g', '2g', '3g']);

type NetworkInformation = EventTarget & {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
};

function readSlowConnection(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const connection = (navigator as Navigator & { connection?: NetworkInformation })
    .connection;

  if (!connection) {
    return false;
  }

  if (connection.saveData) {
    return true;
  }

  if (SLOW_CONNECTION_TYPES.has(connection.effectiveType ?? '')) {
    return true;
  }

  return typeof connection.downlink === 'number' && connection.downlink < 1.5;
}

export function useSiteLoaderVisible(): boolean {
  const pathname = usePathname();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [slowConnection, setSlowConnection] = useState(readSlowConnection);
  const [navigating, setNavigating] = useState(false);
  const bootstrapStartedAt = useRef(
    typeof performance !== 'undefined' ? performance.timeOrigin : Date.now(),
  );

  useEffect(() => {
    document.getElementById('initial-site-loader')?.remove();

    const finishBootstrap = () => {
      const elapsed = Date.now() - bootstrapStartedAt.current;
      const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);

      window.setTimeout(() => {
        setBootstrapping(false);
      }, delay);
    };

    if (document.readyState === 'complete') {
      finishBootstrap();
      return;
    }

    window.addEventListener('load', finishBootstrap, { once: true });
    return () => window.removeEventListener('load', finishBootstrap);
  }, []);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation })
      .connection;

    if (!connection) {
      return;
    }

    const onChange = () => {
      setSlowConnection(readSlowConnection());
    };

    connection.addEventListener('change', onChange);
    return () => connection.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!slowConnection || bootstrapping) {
      return;
    }

    setNavigating(true);

    const timer = window.setTimeout(() => {
      setNavigating(false);
    }, SLOW_NAVIGATION_MS);

    return () => window.clearTimeout(timer);
  }, [pathname, slowConnection, bootstrapping]);

  return bootstrapping || (slowConnection && navigating);
}
