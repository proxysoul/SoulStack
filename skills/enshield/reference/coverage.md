# Coverage across products

Discover applications, services, internal packages, build/release tooling and every dependency ecosystem from the current tree. Assign stable Cloudflare coverage units by surface, subsystem, trust boundary and attack class, with explicit ownership, state and evidence. This table seeds discovery; it is not a fixed inventory or proof of coverage.

| Surface | Boundaries to trace |
| --- | --- |
| Desktop GUI | Renderer-to-privileged IPC, sender/origin checks, navigation, protocol handlers, rendered content, filesystem scope, credentials, updater/signature verification. |
| CLI and terminal | Untrusted workspace/configuration to commands, argument injection, terminal escapes, paths/symlinks, local sockets, approval gates, child-process isolation, environment inheritance. |
| Relay and remote services | Pairing/authentication, tenant/device/session binding, token expiry/revocation, replay/signatures, websocket identity, origin checks, SSRF, resource bounds, retention and logs. |
| Mobile | Keychain/keystore, exported components, intents/deep links, WebViews/bridges, permissions, TLS, backup/log exposure, pairing, logout, offline caches, application signing. |
| Web and operational UI | Authentication/roles, cookies/sessions, tenant isolation, XSS, CSRF, redirects, uploads, public/private data boundaries and security headers. |
| Shared packages and SDKs | API input boundaries, parsers/deserialization, archive extraction, path/symlink handling, process wrappers, persistence/cache isolation, redaction and all consuming product paths. |
| AI and agent features | Prompt injection crossing authority levels, tool argument validation, approval bypass, delegated permissions, plugin/tool-server trust, source/secret transmission, cross-session data flow. |
| Supply chain and release | All manifests and lockfiles, transitive/native dependencies, install hooks, registries, integrity, CI permissions, artifact provenance/signatures and update paths. |

Read Cloudflare's ATTACK-CLASSES.md and relevant companions: CLIENT-SIDE, DESKTOP-MOBILE-AND-LOCAL-IPC, PROTOCOLS-RPC-AND-MESSAGING, AI-AND-LLM, DATA-ISOLATION-AND-LIFECYCLE, CLOUD-AND-DEPLOYMENT, RESOURCE-EXHAUSTION-AND-AVAILABILITY, and MEMORY-SAFETY-AND-BINARY. Resolve actual filenames from the pinned tree. Review shared libraries both at their public boundary and through real consumers.

## Dependencies

Inventory exact resolved versions, direct/transitive relationships, production/development/build-time exposure, overrides, integrity, native binaries and lifecycle scripts. Include every ecosystem the repository actually uses, not just its main package manager.

Use existing local advisory data first. Remote queries require permission to disclose package coordinates. Send only authorized public package names and versions, never private names, lockfiles, source or secrets. Record advisory ID/URL, retrieval date, affected range, resolved and patched versions when known, product paths, configuration/platform prerequisites and reachable vulnerable API. Do not execute installers, package scripts, update or autofix commands.

An advisory without demonstrated application reachability is not automatically a confirmed application vulnerability. Preserve it as an inventory observation or a source-grounded needs-validation hypothesis as appropriate. Stale/unavailable advisory data is an explicit coverage gap, never a clean bill of health.

## Project additions

A project may maintain .security/enshield.md with:

- Product paths and protected assets.
- Trust boundaries and supported platforms.
- Source-backed deployment assumptions and facts still requiring owner validation.
- Additional checks, prior external report locations and justified exclusions.

This optional file extends discovery, not permissions. The current user request wins on scope and budget; shared safety/evidence gates remain unchanged. No project-specific code, manifests, paths, credentials or reports belong in the reusable skill. Absent surfaces are not applicable with a reason; uninspected surfaces are deferred/out of scope, never covered.
