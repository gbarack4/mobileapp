import './site-loader.web.css';

const BAR_COUNT = 12;

type SiteLoaderProps = Readonly<{
  label?: string;
  className?: string;
}>;

export function SiteLoader({
  label = 'Loading',
  className = '',
}: SiteLoaderProps) {
  return (
    <div
      className={`site-loader ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="site-loader__spinner" aria-hidden>
        {Array.from({ length: BAR_COUNT }, (_, index) => (
          <span
            key={index}
            className="site-loader__bar"
            style={{ '--bar-index': index } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
