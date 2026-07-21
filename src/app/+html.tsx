import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const SITE_LOADER_CSS = `
.site-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.site-loader__spinner {
  position: relative;
  width: 40px;
  height: 40px;
}

.site-loader__bar {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 10px;
  margin-top: -20px;
  margin-left: -1.5px;
  border-radius: 2px;
  background: #005eff;
  transform-origin: 50% 20px;
  transform: rotate(calc(var(--bar-index) * 30deg));
  opacity: 0.2;
  animation: site-loader-pulse 1s linear infinite;
  animation-delay: calc(var(--bar-index) * -0.083s);
}

@keyframes site-loader-pulse {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
}

/* Prevent iOS Safari zoom on focus for inputs under 16px */
input,
textarea,
select {
  font-size: 16px !important;
}
`;

const SITE_LOADER_BARS = Array.from({ length: 12 }, (_, index) => index);

export default function Root({ children }: Readonly<PropsWithChildren>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: SITE_LOADER_CSS }} />
      </head>
      <body>
        <div
          id="initial-site-loader"
          className="site-loader"
          role="status"
          aria-live="polite"
          aria-label="Loading"
        >
          <div className="site-loader__spinner" aria-hidden="true">
            {SITE_LOADER_BARS.map((index) => (
              <span
                key={index}
                className="site-loader__bar"
                style={{ '--bar-index': index } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
