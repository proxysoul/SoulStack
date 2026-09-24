import { Link } from "@tanstack/react-router";
import { usePageMeta } from "../app/Chrome";

export function NotFound() {
  usePageMeta("Not found · SoulStack", "This page does not exist.");
  return (
    <main className="wrap section lost">
      <img src="/mote.webp" alt="" width={120} height={120} />
      <h1>Nothing lives here</h1>
      <p>The page moved or never existed. The docs list every page.</p>
      <div className="best-actions">
        <Link className="btn btn-primary" to="/">Home</Link>
        <Link className="btn" to="/docs">Docs</Link>
      </div>
    </main>
  );
}
