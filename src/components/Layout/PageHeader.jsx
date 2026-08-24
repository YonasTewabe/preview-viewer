/**
 * PageHeader — consistent page title block with a visual bottom-border separator.
 *
 * Props:
 *   title       string | ReactNode  — main heading (string renders in <h1>, node renders as-is)
 *   subtitle    string?             — muted description line below the title
 *   actions     ReactNode?          — optional right-side buttons/controls
 */
export default function PageHeader({ title, subtitle, actions }) {
  const isString = typeof title === "string";

  return (
    <div
      className="mb-6 border-b pb-5"
      style={{ borderColor: "var(--app-border)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {isString ? (
            <h1
              className="text-2xl font-bold leading-tight"
              style={{ color: "var(--app-text)" }}
            >
              {title}
            </h1>
          ) : (
            <div
              className="text-2xl font-bold leading-tight"
              style={{ color: "var(--app-text)" }}
            >
              {title}
            </div>
          )}
          {subtitle && (
            <p className="mt-0.5 text-sm" style={{ color: "var(--app-text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        )}
      </div>
    </div>
  );
}
