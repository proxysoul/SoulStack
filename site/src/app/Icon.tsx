import { icon } from "../icons";
import { LOGO_PATHS } from "../logos";

export function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={className ? `ic ${className}` : "ic"} dangerouslySetInnerHTML={{ __html: icon(name) }} />;
}

export function AgentLogo({ id, size = 22 }: { id: string; size?: number }) {
  if (id === "pi") {
    return (
      <span className="lg lg-pi" style={{ width: size, height: size, fontSize: Math.round(size * 0.8) }} aria-hidden="true">
        π
      </span>
    );
  }
  const body = (LOGO_PATHS[id] ?? []).map((d) => `<path d="${d}"/>`).join("");
  return (
    <svg
      className={`lg lg-${id}`}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      fillRule="evenodd"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
