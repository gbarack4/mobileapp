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
  border-radius: 20px;
  background: #005eff;
  overflow: hidden;
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
          <img
            className="site-loader__logo"
            src="/logo.png"
            width={88}
            height={88}
            alt=""
            aria-hidden="true"
          />
          <p className="site-loader__brand">Instructor Hub</p>
        </div>
        {children}
      </body>
    </html>
  );
}
