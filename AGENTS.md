<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Development Discipline

- Implement the smallest correct change for the stated objective. Reuse existing code and patterns; avoid unrelated refactors, speculative features, premature optimization, and new dependencies, files, abstractions, or documentation unless required.
- Inspect only relevant code with targeted searches and avoid repeated reads or unchanged commands. Run focused tests first and the broader suite only when the change warrants it.
- Keep diffs focused and preserve unrelated work. Never discard uncommitted changes or modify unrelated files.
- Preserve necessary security, privacy, authentication, validation, error handling, recovery behavior, and meaningful tests. Token or code reduction never justifies weakening them.
- Keep progress and final reports concise: state meaningful changes, tests, and genuine blockers. Stop when the requested result is implemented and verified.
- Never commit, push, merge, deploy, or modify production without explicit user approval.
