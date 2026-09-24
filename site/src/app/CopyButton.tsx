import { useState } from "react";
import { Icon } from "./Icon";

export function CopyButton({ text, className = "copy" }: { text: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={done ? `${className} is-done` : className}
      aria-label={done ? "Copied" : "Copy"}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
      }}
      onPointerLeave={() => setDone(false)}
      onBlur={() => setDone(false)}
    >
      <Icon name={done ? "check" : "copy"} />
    </button>
  );
}
