# Working on KUROTORA DRIVE

- Read README.md, docs/ARCHITECTURE.md and docs/MAINTENANCE.md before changes.
- This repository owns the game, vehicle, controls, renderer and physics. Course source is https://github.com/Sunwood-ai-labs/ashinoko-course-data.
- The course files inside dist are a pinned vendored snapshot. Change course data/contract at its source, then use scripts/sync-course.mjs. Never update a checksum to conceal unreviewed changes.
- Preserve the public Pages path, relative runtime URLs, attribution and original rights. No external CDN is required.
- Run npm test against final files. Keep course.lock.json and distribution checksums consistent. Check added files and payload sizes before publishing.
- Keep original Blender files, raw logs, local paths, credentials and dependency directories out of commits.
- Distinguish local checks, remote CI, public delivery, actual 3D rendering and hardware performance. Blender previews are not browser screenshots.
- Keep README.md and README.ja.md structurally parallel. Record changes and limitations honestly.
