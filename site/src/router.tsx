import { Outlet, createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router";
import { Bar, Footer } from "./app/Chrome";
import { DOCS, DOC_SLUGS, loadDoc } from "./pages/docs-data";
import { DocPage, DocsLayout } from "./pages/Docs";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Bar />
      <Outlet />
      <Footer />
    </>
  ),
  notFoundComponent: NotFound,
});

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Home });

const docsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/docs", component: DocsLayout });

const docsIndexRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "/",
  validateSearch: (search: Record<string, unknown>): { p?: string } => (typeof search.p === "string" ? { p: search.p } : {}),
  beforeLoad: ({ search }) => {
    const legacy = search.p && DOC_SLUGS.has(search.p) ? search.p : DOCS[0]?.slug ?? "getting-started";
    throw redirect({ to: "/docs/$", params: { _splat: legacy }, replace: true });
  },
});

const docRoute = createRoute({
  getParentRoute: () => docsRoute,
  path: "$",
  loader: ({ params }) => loadDoc(params._splat ?? ""),
  component: DocPage,
});

const routeTree = rootRoute.addChildren([homeRoute, docsRoute.addChildren([docsIndexRoute, docRoute])]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultViewTransition: {
    types: ({ fromLocation, toLocation, pathChanged }) => {
      if (!pathChanged || matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
      const inDocs = (path?: string) => path?.startsWith("/docs/") ?? false;
      return inDocs(fromLocation?.pathname) && inDocs(toLocation.pathname) ? ["doc"] : ["page"];
    },
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
