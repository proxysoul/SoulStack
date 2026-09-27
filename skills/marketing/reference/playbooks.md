# Marketing playbooks

Use the sections needed for the task. These are execution templates, not proof that a channel will work.

## Evidence and audit

Create a ledger before writing conclusions:

| Field | Record |
|---|---|
| Surface | Product, audience, channel and asset |
| Evidence | Path or public URL, revision, observation date and relevant excerpt |
| Status | Local work / implemented / verified published / observed / measured |
| Claim | Exact statement the evidence supports, with scope and caveats |
| Outcome | Metric, numerator, denominator, cohort and window; otherwise unmeasured |
| Follow-up | Owner, uncertainty, next check and review date |

An audit should cover positioning and identity; product/landing/pricing pages; content, comparisons and migration paths; search and machine-readable surfaces; demos and benchmarks; distribution and launches; conversion and assisted sales; lifecycle and referrals; claim freshness; and measurement. Include a full inventory as an appendix rather than burying the findings in it.

Source snapshots show what exists. Git history establishes when something changed, not when it reached users. A past audit’s checks stay attributed to that audit. Never present them as checks you just performed.

## Channel playbooks

### Product family and positioning

For each audience, record the job, alternative, promise, proof, objection, destination and qualified first success. Audit naming across navigation, metadata, docs, support, pricing and social previews after a rebrand. Keep the products distinguishable even when they share billing or infrastructure. Validate assumptions with user evidence when available.

### Release to content

Choose the actual user question, not just the feature name. Explain the change, demonstrate it, link the setup path, state limitations and pick an intent-matched action. Give each derivative asset its own job: announcement for awareness, guide for activation, comparison for evaluation, demo for proof. Reuse the facts, not identical copy everywhere.

### Search and AI-readable content

Check the rendered response, not metadata declarations alone:

- Public content is visible without login. Private/account content uses an appropriate indexing policy. Do not block a page in robots.txt if you rely on its `noindex`; a crawler that cannot fetch the page cannot read the tag.
- Titles, descriptions, headings and canonicals agree with the page’s actual purpose. Internal links resolve. Sitemaps contain canonical indexable URLs and honest modification dates.
- Structured data matches visible content and current search-engine requirements; do not add schema types just to inflate coverage.
- Programmatic pages offer unique utility or data. Consolidate thin duplicates.
- Markdown, context and pricing mirrors match human-readable facts and link to canonical/live sources. Distinguish search crawling from training policy.

Assess discoverability with dated index/traffic evidence when authorized. Assess AI citations with a repeatable set of queries, products, engines, dates and response captures. Neither a context file nor a search spot-check establishes improvement.

### Proof and sales assistance

Use a real workflow with approved public or seeded data. Keep screenshots current and theme-consistent. Pair benchmark results with a reproducible protocol and the negative results. Document methodology changes instead of comparing incompatible measurements. Keep demos, migration instructions, security, procurement, licensing and deployment options close to the buyer’s decision.

For a video: one takeaway per scene; readable safe margins; narration aligned to timing; accurate captions and transcript; a playable export with verified streams/duration; visual inspection of the beginning, middle, end and every distinct layout. Use current tool documentation, existing assets and approved services. Do not fabricate UI or use private screens.

### Launch and distribution

Before execution, fill in: audience; change worth announcing; promise; evidence; owned destination; requested action; launch date/timezone; channel-native assets; owner; publication permission; attribution; support readiness; rollback/correction path.

A distribution checklist includes the authorized relevant channels, such as community, email, partner, launch directory, social or paid media. Do not post to all channels by default. Record the published URL or send receipt separately from the drafted asset. Do not buy votes, reviews or deceptive endorsements; follow community and platform rules.

### Offers and promotions

Define eligibility, economic cost, start/end time, timezone, exclusions, stacking and redemption limits. Verify the displayed offer against billing behavior before launch and across the expiry boundary. Label historical offers. Test eligible, ineligible and expired cases without real charges. Measure retained value net of discounts, refunds and abuse, not only redemption.

### Newsletter, lifecycle and referrals

Use the correct consent/legal basis for the audience and channel; verify current requirements rather than assuming one jurisdiction. Keep optional marketing distinct from required service communications. Test suppression, duplicate submission, unsubscribe and resubscription rules without re-enrolling an opted-out contact silently.

Behavioral nudges require a relevant trigger, cadence cap, current account state and exclusion rules. Evaluate incremental activation or retention alongside opt-outs and complaints. A delivered message still does not prove a business outcome.

Referral programs need a usable sharing path, attribution window, qualifying event, reward cap, self-referral/abuse protection and refund handling. State which rewards exist and test the qualifying purchase boundary; a bonus helper does not prove every caller gates it correctly.

## Measurement contract

Before making a performance claim, record:

1. **Hypothesis:** audience, bottleneck, proposed change and expected mechanism.
2. **Decision:** what evidence would cause a rollout, iteration or stop.
3. **Primary outcome:** event or business value with numerator, denominator and window.
4. **Eligibility:** inclusion/exclusion rules, assignment unit and comparison/control method.
5. **Attribution:** campaign taxonomy, cross-domain handling, identity/consent rules and attribution window.
6. **Guardrails:** quality, retention, complaints, refunds, costs or other relevant harms.
7. **Baseline and method:** data source, dates, sample, instrumentation checks, power or precision rationale where applicable.
8. **Result:** exact observed values, uncertainty, failures, confounders and decision. If unavailable, write “unmeasured.”

Changing several things at once, unequal traffic mix, different page elements, selection bias and instrumentation changes weaken causal inference. Say so. A release count is output; an event count is behavior; measured incremental value is an outcome.

## Worked pattern and provenance

This workflow generalizes practices visible in the public [LLM Gateway source](https://github.com/theopenco/llmgateway), reviewed at revision `01da451e5c7569297d8f1ec93debaa55297ad639` on 2026-09-27. These are examples to inspect, not prerequisites or current product promises:

- [Product SEO audit](https://github.com/theopenco/llmgateway/blob/01da451e5c7569297d8f1ec93debaa55297ad639/reports/seo-audit-2026-09-05.md): crawlability, honest sitemap dates and explicit limits on performance and citation claims.
- [Smart routing benchmark](https://github.com/theopenco/llmgateway/blob/01da451e5c7569297d8f1ec93debaa55297ad639/apps/ui/src/content/blog/2026-09-26-smart-routing-benchmark.md): comparable requests, full costs, losing baselines and uncertainty.
- [Content conversion rail](https://github.com/theopenco/llmgateway/blob/01da451e5c7569297d8f1ec93debaa55297ad639/apps/ui/src/components/content-conversion-rail.tsx): separate exposure, dismissal and action instrumentation. These events alone do not establish conversion lift.

Example decision: a comparison page exists and its CTA event is implemented, but no downstream dataset is available. Record implementation as verified source evidence; leave effectiveness unmeasured. The next task is to validate event delivery and the qualified-activation join, not to announce growth.
