/**
 * Standardized page header with optional subtitle and action slot.
 * Spacing: padding 32px 0 24px 0, border-bottom, margin-bottom 28px.
 */
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="pb-6 pt-8 border-b border-border mb-7">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          {title && (
            <h1 className="font-heading text-3xl font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h1>
          )}
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </div>
  );
}
