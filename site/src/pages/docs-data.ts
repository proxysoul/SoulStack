import { notFound } from "@tanstack/react-router";
import index from "../generated/docs.json";

export interface DocEntry {
  slug: string;
  title: string;
  summary: string;
  group: string;
}

export interface LoadedDoc {
  entry: DocEntry;
  html: string;
}

export const DOCS: DocEntry[] = index;
export const DOC_SLUGS = new Set(DOCS.map((d) => d.slug));

const pages = import.meta.glob<string>("../generated/docs/**/*.html", { query: "?raw", import: "default" });

export async function loadDoc(slug: string): Promise<LoadedDoc> {
  const entry = DOCS.find((d) => d.slug === slug);
  const load = pages[`../generated/docs/${slug}.html`];
  if (!entry || !load) throw notFound();
  return { entry, html: await load() };
}
