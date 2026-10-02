# Working on the OctoScript website

Read [README.md](README.md) and the bilingual app guides under
`src/content/guides/octosense-apps.*.md` before changing architecture copy.

- This repository owns website content and a pinned demonstration package.
  It does not build the production OctoSense shell or run its app agents.
- Keep English and Chinese claims aligned. Add a guide to `src/data/docs.ts`,
  both locale lists in `src/data/content.ts`, and `scripts/doc-links.mjs`.
- Distinguish workflow source, contained Splash apps, L0 card realization,
  renderer nodes and native mounting. Explain new terms at their first use.
- Trace permissions and tools to their host implementation. A language
  capability, bundle declaration or UI demo does not establish a runtime
  service, account access or cross-app grant. State current integration gaps.
- Preserve source provenance: corrections to checked-in upstream snapshots
  require updated hashes and an explicit correction record in `sources.json`.
  The consuming app's runtime and Cargo locks select its actual implementation.
- Keep browser sample state and historical design examples labelled. Preserve
  demo behavior and the prebuilt WASM package unless the task changes them.
- For content/navigation changes run `npm run test:unit`, `npm run build`,
  relevant existing Playwright checks, and `git diff --check`. Include a new
  guide in the existing guide-navigation test loop when adding a route.
  Native build/device commands documented here need separate validation.
- Changes to `main` trigger the Pages deployment workflow. Prepare a PR for
  review; do not merge or deploy as part of a documentation task unless asked.
