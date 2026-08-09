import { type ReactNode, useEffect } from "react";

const SPLASH_MS = 2000;

type SiteLoaderGateProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Single splash only: keep the HTML initial loader for 2 seconds.
 */
export function SiteLoaderGate({ children }: SiteLoaderGateProps) {
  useEffect(() => {
    const t = setTimeout(() => {
      document.getElementById("initial-site-loader")?.remove();
    }, SPLASH_MS);

    return () => clearTimeout(t);
  }, []);

  return <>{children}</>;
}
