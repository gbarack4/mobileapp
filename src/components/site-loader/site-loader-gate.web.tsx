import { useSiteLoaderVisible } from '@/hooks/use-site-loader-state';
import { SiteLoader } from './site-loader';

export function SiteLoaderGate() {
  const visible = useSiteLoaderVisible();

  if (!visible) {
    return null;
  }

  return <SiteLoader />;
}
