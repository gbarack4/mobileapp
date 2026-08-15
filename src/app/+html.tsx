import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

const SITE_LOADER_CSS = `
html, body {
  margin: 0;
  background: #005eff;
}

.site-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: #005eff;
}

.site-loader__logo {
  width: 88px;
  height: 88px;
  display: block;
}

.site-loader__brand {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: #ffffff;
}

/* Prevent iOS Safari zoom on focus for inputs under 16px */
input,
textarea,
select {
  font-size: 16px !important;
}
`;

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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
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
          <svg
            className="site-loader__logo"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
          >
            <rect width="40" height="40" rx="10" fill="#ffffff" />
            <rect x="7" y="11" width="3" height="18" rx="1" fill="#005eff" />
            <rect x="7" y="18.5" width="10" height="3" rx="1" fill="#005eff" />
            <rect x="14" y="11" width="3" height="18" rx="1" fill="#005eff" />
            <rect x="21" y="11" width="3" height="18" rx="1" fill="#005eff" />
            <path d="M24 11h5a4 4 0 010 8h-5z" fill="#005eff" />
            <path d="M24 19h5.5a4.5 4.5 0 010 9H24z" fill="#005eff" />
          </svg>
          <p className="site-loader__brand">Instructor Hub</p>
        </div>
        {children}
      </body>
    </html>
  );
}
