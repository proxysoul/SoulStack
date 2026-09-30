---
name: marketing
description: Build an evidence-backed marketing system from product code and authorized analytics, covering positioning, discovery, launches, conversion, and retention. Use for marketing audits, go-to-market work, measurement reviews, or synchronized reports, slide decks, and videos without inventing results.
---

# Marketing

Turn what a product actually does into clear reasons to try it, useful paths into it, and measurable learning. Work at the requested scope: an audit reports; an implementation changes assets; neither authorizes spending, sending, publishing, or deployment.

## 1. Establish the evidence

- Read project instructions, existing marketing context, product surfaces, docs, content, analytics code and relevant history. Use repository tools if available; ordinary file search and git are enough.
- Inventory positioning, landing pages, pricing, proof, search pages, machine-readable exports, launch assets, distribution, lifecycle messages and attribution. Include each product, audience and entry point. Do not confuse product functionality with a campaign.
- Record source path or URL, revision/date, audience, status and uncertainty. Separate local work, implementation, verified publication, observed behavior and measured outcomes. Memory and commit messages are leads, not proof.
- Search for work outside the repo only in authorized sources. “Not found here” does not mean “never done.” Never infer sends, paid campaigns, reach or revenue from source code.
- Before reading account dashboards or APIs, agree the output contract from the request: authorized sources, permitted fields, excluded categories, audience and deliverables. Use read-only access and source-side aggregates. Keep credentials in an approved runtime secret mechanism, never exports or public diffs.
- Apply exclusions to every output, including screenshots, captions and source appendices. If financial data is excluded, do not capture whole financial dashboards and redact later; select only allowed fields. Account access is not permission to publish its data.

Use the [evidence ledger and audit template](reference/playbooks.md#evidence-and-audit). Freeze an as-of date; preserve concurrent work. Keep private evidence local and redact before sharing.

## 2. Choose an audience and a useful next action

Write a brief for each distinct product: who it serves, their job, the current alternative, the specific promise, the proof and the next action. State uncertain audience assumptions as hypotheses; seek user or customer evidence before treating them as facts.

- Share navigation across a portfolio, not an identical pitch. Keep product names, domains, docs and prices consistent across every surface.
- Lead with the customer’s job. Follow a brand metaphor with a plain explanation of what the product does.
- Give each page one primary action appropriate to intent: evaluate, try, set up, contact or buy. Route enterprise evaluation differently from self-service activation when the product requires it.
- Prefer the smallest useful change to the largest pile of assets. Prioritize by evidence of a bottleneck, expected value, effort and confidence. No invented impact scores.

## 3. Make claims maintainable

Keep a claims register with the exact wording, source, scope, as-of date, owner and review or expiry condition. Reuse canonical product data where available; shared constants are not evidence by themselves.

- Define what a count includes. Exclude records that do not satisfy the advertised availability or eligibility. Compute display labels from verified counts; do not copy stale lists between pages.
- Check prices, limits, privacy, licensing, security and competitor claims against current authoritative sources. Put qualifications beside the claim. Never convert an uptime target into observed uptime or a feature into a certification.
- Make promotion eligibility, dates, timezone, billing behavior and expiry explicit. Update landing pages, banners, docs and announcements together. Historical launch copy is not today’s offer.
- Use genuine, permissioned quotes and real product imagery. Never invent customers, testimonials or endorsements.
- For benchmarks, preserve the workload, versions, date, harness, baseline, full costs, failures and uncertainty. Report where the product loses. An unequal before/after comparison does not demonstrate improvement.

## 4. Build a connected marketing path

Choose only the channels warranted by the brief. Use the [channel playbooks](reference/playbooks.md#channel-playbooks) for implementation checks.

- **Owned content:** turn shipped work into a useful announcement, tutorial or comparison, with proof and a working next action. Prefer a question answered well to many near-duplicate pages.
- **Search:** match search intent, show useful public content, and verify canonicals, indexing, sitemaps, links and applicable structured data. No fabricated freshness dates.
- **Agent discovery:** keep machine-readable product/pricing/docs exports consistent with their human pages. These files do not establish ranking or citation gains, and crawler access does not imply permission to train.
- **Conversion:** connect content to the right product, setup guide and successful first action. Put security, procurement and deployment evidence near assisted buying decisions.
- **Proof assets:** show the real workflow with safe data. If making video, create a readable storyboard, render an actual playable file, add captions/transcript and inspect representative frames. A slide source is not a finished video.
- **Distribution:** name the destination, audience, format, timing, owner, permission and tracking for every asset. Repurpose the proof for the channel; a blog file is not distribution.
- **Lifecycle and referrals:** choose messages from relevant behavior, verify consent and suppression at the send boundary, test unsubscribe, and validate reward eligibility and abuse controls. Never equate a signup form with a delivered campaign.

If visual work needs a design system, use the repository’s existing one; use `ensoul` if it is installed and applicable. Performance claims need measurements from the real build, which is what `enliven` produces; never quote a speed number you did not measure. Other specialist skills are optional: inspect their availability, then load only what the task needs. Never assume a tool, account, key or paid service exists.

## 5. Measure the intended value

Define one qualified activation or business outcome per product before scaling a tactic. Use the [authorized analytics checks](reference/playbooks.md#authorized-account-analytics) and [experiment contract](reference/playbooks.md#measurement-contract).

- Trace discovery → qualified visit → intended action → product success → retained or paid value. Define denominators, eligibility, attribution window, exclusions and privacy-safe identity rules. Never put personal data in campaign parameters.
- Reuse existing event names and helpers. Verify a real interaction emits the expected event once and reaches an authorized sink. Confirm consent behavior. Implementation and delivery are separate checks.
- Record a comparable baseline with exact interval boundaries, timezone, grain and population. Keep native search-console windows and reporting lag explicit; preserve rounded UI labels instead of inventing precision. Do not compare all-time account stocks with weekly events.
- Name the unit correctly: identifiers are not people, pageviews are not sessions, verification is not activation, and independent stage counts are not a joined funnel. Reconcile totals without double-counting overlapping products or cohorts.
- Treat UTM field presence and pageview referrers as descriptive evidence, not complete attribution. Untagged organic/direct traffic is normal; AI-assistant referrals do not measure citations.
- Predefine the primary metric, quality and retention guardrails, observation window and stop/rollout rule. Do not invent a sample size or significance result; use a justified analysis plan.
- Prefer a controlled experiment where appropriate. For observational changes, disclose confounding and avoid causal claims. Low traffic may justify usability evidence or a longer window, not fabricated certainty.
- Separate asset counts, instrumented events, observed behavior and measured lift in every report. If analytics access is absent, mark results unmeasured and ship the measurement plan, not a success story.

## 6. Verify and hand off

- Validate claims and links against the final artifact, not only the source notes. Check the actual user path on representative screen sizes, including errors and empty states.
- Test relevant forms, redirects, campaign parameters, event delivery, consent, unsubscribe and promotion expiry in a safe environment. Do not create real subscriptions, send campaigns or spend money to prove a local change without permission.
- For reports, provide source-linked findings, dated status, unknowns, takeaways and prioritized experiments. For a large audit, prefer a visual HTML report to a wall of prose. Keep accessible text and an evidence appendix.
- Maintain a [deliverable freshness contract](reference/playbooks.md#deliverable-freshness): every in-scope report, deck, script, narration, caption track and final video must share the same evidence revision. A changed report does not update an already rendered video. Regenerate dependents, or explicitly label out-of-scope versions as historical.
- Respect requested voice/provider and output formats. Check what actually rendered, including provenance, captions, timing, private-data exclusions and representative frames; metadata alone is not proof.
- Have an independent reviewer check facts, privacy and execution when requested or required by project rules. Resolve findings; a failed check stays failed. Never claim a review that did not happen.
- Deliver working artifacts and repeatable checks. When asked to open or reveal them, observe the actual visible document, selected file or playing media; a successful launch command alone does not establish delivery.
- Keep private reports, analytics exports and recordings out of public diffs. Public skills receive generalized methods, not private metrics, identifiers or dashboard links. Publish, push, post, deploy or launch a campaign only within explicit authorization.

Done means the requested assets exist, the relevant path was checked, evidence limits are visible, and the next decision can be made without redoing the investigation.
