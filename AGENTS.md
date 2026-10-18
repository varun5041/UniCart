# AGENTS.md — Instructions for the AI Coding Agent (UniCart)

> READ THIS FILE FIRST. Then read, in order: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DATABASE.md`, `docs/API_SPEC.md`, `docs/PHASES.md`.
> (Copy this file as `CLAUDE.md` / `.cursorrules` / `.github/copilot-instructions.md` depending on the tool.)

## 1. Mission
Build **UniCart**, an e-commerce website on the **MERN stack** (MongoDB, Express, React, Node.js).
**The goal is NOT many features.** The goal is a small, clean feature set that is:
1. **Secure** (OWASP Top 10 covered)
2. **Horizontally scalable** (stateless API, cache, queue, many concurrent users)
3. **Meets all non-functional requirements** in `docs/PRD.md` §4

If a choice is between "another feature" and "more secure / scalable / tested", choose the latter.

## 2. Speed rules — we have 4 DAYS total
- Work **phase by phase** exactly as in `docs/PHASES.md`. Do not jump ahead. Do not gold-plate.
- **One phase = one commit.** Finish the phase, verify it, commit, then stop and report.
- Prefer proven libraries over custom code (see approved list in `docs/ARCHITECTURE.md` §3). Never write your own crypto, auth tokens, or validation engine.
- Do not ask questions about things already decided in these docs. Only ask when genuinely blocked.
- Generate complete files, not fragments with "// TODO implement". No placeholder logic in security-critical code.
- Keep the UI simple and functional (Tailwind). Polish is the last priority.

## 3. Phase / commit protocol (MANDATORY)
For every phase:
1. Read the phase section in `docs/PHASES.md` (scope + acceptance criteria).
2. Implement ONLY that scope.
3. Run: `npm run lint` and `npm test` in affected packages. Fix until green.
4. Tick the acceptance checklist for that phase in your report.
5. Commit with the exact message given in `docs/PHASES.md`, using Conventional Commits:
   `git add -A && git commit -m "feat(phase-N): <title>"`
6. Stop and print: files changed, how to run/verify, any known limitations.

Never put two phases in one commit. Never commit secrets, `.env`, `node_modules`, or build output.

## 4. Non-negotiable coding rules
- **Language:** TypeScript on both server and client. `strict: true`.
- **Validation:** every request body/query/params validated with **Zod** before reaching the controller. Reject unknown fields (`.strict()`).
- **Never trust the client** for prices, totals, stock, roles, or user IDs. Server recomputes order totals from DB prices.
- **Auth:** short-lived JWT access token (15 min) in memory + rotating refresh token in `httpOnly; Secure; SameSite=Strict` cookie. Passwords hashed with **argon2id** (or bcrypt cost 12).
- **Authorization:** check ownership on every resource (`order.userId === req.user.id`) — prevents IDOR. Admin routes behind `requireRole('admin')`.
- **Statelessness:** no in-memory sessions, no in-memory rate-limit store, no local file uploads. Everything shared goes to MongoDB / Redis / object storage. Any API instance must be killable at any time.
- **DB:** always use indexes for queried fields; always paginate lists (max 50/page); use `.lean()` for reads; use **transactions** for order creation + stock decrement.
- **Errors:** central error handler; never leak stack traces or DB errors to clients in production. Return `{ success:false, error:{ code, message } }`.
- **Logging:** structured JSON via **pino** with request ID. Never log passwords, tokens, card data, or full PII.
- **Config:** all config via env vars, validated at boot with Zod; app refuses to start if invalid.
- **No `eval`, no `dangerouslySetInnerHTML`, no raw string-built Mongo queries from user input.**
- Keep functions small; layer as `routes → middleware → controller → service → model`. Business logic lives in services only.

## 5. Definition of Done (every phase)
- Lint + type-check + tests pass
- No new `npm audit` high/critical vulnerabilities
- Env vars documented in `.env.example`
- Acceptance criteria in `docs/PHASES.md` met
- Committed with the specified message
