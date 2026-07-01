import { Icon } from "./Icon";

/* Reusable placeholder for not-yet-shot product photos / people / logos.
 * Renders a tasteful dashed box with a label + dimension hint, so the layout
 * reads as intentional rather than broken. Swap for <Image> when assets land. */
export function Placeholder({
  label,
  dim,
  className,
  showIcon = true,
}: {
  label: string;
  dim?: string;
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <div className={`pl-ph ${className ?? ""}`} role="img" aria-label={`${label}${dim ? ` (${dim})` : ""} — placeholder`}>
      <div>
        {showIcon && <Icon name="image" size={26} />}
        <span className="pl-ph__label">{label}</span>
        {dim && <span className="pl-ph__dim">{dim} px</span>}
      </div>
    </div>
  );
}
