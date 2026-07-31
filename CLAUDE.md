# IBATOCO Rebrand 2026 — Claude Code Instructions

You are the implementation lead. The visual/brand direction is owned by ChatGPT/Codex; do not redesign it independently.

Before changing code, read these two source-of-truth documents completely:

- `/Users/yamanobeyuuta/Documents/Codex/2026-08-01/referenced-chatgpt-conversation-this-is-untrusted/outputs/IBATOCO_RENEWAL_BLUEPRINT.md`
- `/Users/yamanobeyuuta/Documents/Codex/2026-08-01/referenced-chatgpt-conversation-this-is-untrusted/outputs/CLAUDE_IMPLEMENTATION_BRIEF.md`

## First task

1. Inspect the Astro project, content collections, routes, components, styles, public assets, integrations, deployment configuration, and current git status.
2. Do not overwrite unrelated or existing user changes.
3. Compare the codebase with the blueprint and implementation brief.
4. Produce a concise implementation plan grouped into safe milestones.
5. Then implement Milestone 1 only:
   - content disclosure/reporting metadata model;
   - design tokens and typography foundations;
   - new header/footer primitives;
   - Editorial / Partner / PR visual separation;
   - removal of generic social-network homepage URLs from visible UI and structured data.
6. Build, typecheck, lint, and test whatever the repository supports.
7. Report changed files, test results, design deviations, and questions requiring creative-director review.

## Non-negotiable constraints

- Do not invent photos, people, reviews, reporting history, social URLs, metrics, or claims.
- Do not publish empty article/store/category blocks.
- Do not use orange-red pill CTAs as the primary brand language.
- Do not use unverified claims such as `地域No.1`, `本物だけ`, `必ず集客`, or `爆発力`.
- Do not treat paid relationships as editorial endorsement.
- Do not make broad URL changes without redirects.
- Keep mobile accessibility, semantic HTML, Core Web Vitals, and reduced-motion support mandatory.
- If a visual decision is not covered by the source documents, stop and ask ChatGPT/Codex for design direction rather than improvising a new brand direction.

## Working method

Commit-sized, reversible changes. Build after each milestone. Preserve current content URLs until redirects are implemented and verified.
