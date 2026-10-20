# Versioning

Current release: **1.21.3** (`2026-10-20-release-1.21.3`).

`package.json` is the release version. `/api/health` exposes both the semantic
version and the exact build identifier; the footer and changelog show versions
in the game. Compare the health response after deploying to confirm which code
is actually running. Restart Node after replacing server files and reload the
browser after deployment.

Historical development groups in `release-notes.js` have retrospectively assigned
`0.1.x` numbers, from oldest to newest. These are reconstructed development
milestones, not claims that those tags were published on GitHub. Future release
entries must explicitly retain their assigned version; do not renumber history.
Release source is published to the main branch after validation.

Use patch versions for fixes, minor versions for new compatible features, and
major versions for breaking changes. Keep the package version, health version,
footer, release note and archive name aligned.
