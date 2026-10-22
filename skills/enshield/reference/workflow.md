# One audit, two complementary methods

## Orchestration and precedence

Cloudflare owns the native run lifecycle: reconnaissance, ledger-led hunting, candidate validation, structured output, independent final-record verification and reporting. Codex Security contributes resource/consumer threat modelling, investigation packets, an unanchored baseline perspective, source-to-sink and counterevidence analysis, root-cause grouping and fix verification.

Read the pinned upstream documents listed in upstream.md before a run. Do not blindly load both top-level skills as competing coordinators. Codex's host handoff, no-ledger rule, proprietary tool calls and canonical output protocol apply only to an actual Codex backend run. They do not override the native Cloudflare ledger. The stricter sandbox, independent verification and uncertainty rules govern the unified report. This is an adaptation, not a claim that the Codex CLI ran.

## Scope and profiles

Record requested target and paths, commit, dirty files, exact profile, backend, models, upstream revisions, budget, prior runs and exclusions in run-metadata.json. Source may change during a shared-worktree audit: re-read affected evidence, record its revision and leave unresolved changes incomplete. Do not invent an immutable checkout.

Use Cloudflare standard by default. Quick uses its coarser units, one hunting wave and one final critic; deep adds independent passes and separate candidate/final verification. Profiles change breadth, never evidence requirements. A diff or path scope is explicitly partial. Supporting code may be traced outside named paths, but an affected entry point, control or operation must be in scope.

Before reconnaissance, reserve all Cloudflare-mandated reconnaissance, critic and verification calls. Reserve again before every hunting wave. Do not silently exceed budget, drop validation or replace independent agents with the coordinator rereading its own claims. If the minimum cannot be funded or isolated agents are unavailable, record an incomplete run and the exact missing capability.

## Run storage and ownership

Create a fresh owner-private external directory such as ~/enshield-audits/<repo-id>/run-<N>, exclusively and without overwriting a previous run. Resolve real paths, reject symlinked output ancestors and ensure the result is outside the target. An in-repository directory is allowed only if explicitly selected by the user and verified wholly ignored by version control.

The parent alone writes run-metadata.json, architecture.md, coverage-ledger.json, findings.json, REPORT.md, FINDINGS-DETAIL.md and NEEDS-VALIDATION.md. Workers receive unique canonical IDs and isolated scratch directories; no shared writes or source edits. Follow Cloudflare's exact scratch/artifacts ownership and descriptor-relative, no-follow, bounded artifact-promotion contract. If promotion cannot be enforced, do not copy sandbox files into retained evidence.

Record original backend, worker, source ref, fingerprint, evidence and verifier in a separate candidate-provenance.json rather than extending the upstream findings schema. Keep real Codex output separate and untouched. Do not invent scan IDs or forge a backend's canonical files.

## Evidence gates

Every candidate needs a lower-trust principal, accepted input/action, intended control, crossed boundary, protected resource/principal, source anchors, prerequisites and concrete result. Trace effective mitigations and strongest counterevidence. Missing best practices, intended same-principal authority and unsupported impact are not confirmed vulnerabilities.

Use Codex's special disclosure-path analysis for embedded credentials: execution of the containing file is not required, but source access alone must expose authority beyond reading that source. Distinguish real credential material from public keys, identifiers and demonstrable placeholders. Never test live credentials or include their values in output; unknown validity/privileges constrain conclusions.

A verifier may confirm a source-proven boundary without runtime execution; explicitly label evidence static. When a decisive fact depends on unseen deployment, platform or runtime behavior, use needs_validation with the missing fact and safe plan, not a severity-bearing guess. Each rejected claim retains source-backed counterevidence. Pending unverified candidates stay linked to their ledger units.

Only confirmed findings receive severity calibrated to demonstrated impact. Imported advisory/scanner ratings are provenance, not automatically the unified rating. Recommend the narrowest invariant-enforcing change at the trusted decision point; an audit does not apply it.

## Completion

Use the pinned Cloudflare report-schema.json and validators documented in upstream.md. Read their usage before invocation; run trusted validators only on bounded, parent-owned records. Preserve nonzero exits and malformed output. Both findings and ledger validation must pass, all required verifications must finish, and the report must reflect deferred/out-of-scope units before declaring completion.

Otherwise set run_status to incomplete with an exact reason. Budget-exhausted candidates remain pending and listed in the partial report. Do not convert a validator/tool failure into an empty clean report. Write the narrative from reconciled JSON, not the reverse.

## Recurring runs and fix verification

Read compatible previous findings and ledgers, then compare actual relevant current source and conditions. Preserve fingerprints for the same broken control. Revalidate unchanged confirmations through current independent verification. Changed source, unresolved hypotheses, previous blockers and deferred units are current work. Prior rejected claims suppress only unchanged failed claims, never review of the whole surface.

Report new, persistent, changed, verified-fixed and unresolved items separately. New dependencies, versions, advisories or reachability reopen coverage. A deleted file or upgraded version does not alone prove a fix. Fix verification returns fixed, still_vulnerable or inconclusive, with evidence. Do not automatically patch, schedule, publish or send notifications.
