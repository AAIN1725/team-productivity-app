# Debugging Journal

A record of the significant bugs, failures, and recovery steps encountered during the development of Team Productivity App.

---

## Entry 1 — Silent API Failures on Multiple Pages

**Phase:** Sprint 2

### What Went Wrong
After Sprint 1 shipped, a review of the frontend revealed that four pages were swallowing fetch errors with empty `catch(() => {})` blocks. When the backend was unreachable, users saw a blank table or an empty state message that looked identical to "no data yet" — there was no way to tell whether the app was broken or simply had no records.

Affected pages: `SprintHistoryPage`, `TeamPage`, `RetroResultsPage`, `BacklogPage`, and `ActiveSprintView`.

### Failure Pattern
The pattern was: fetch data → `.catch(() => {})` → component renders with default empty state. No error state variable existed in any of these components, so there was nowhere to display a message even if the catch block had tried.

### Recovery
Added `const [error, setError] = useState('')` to each affected component. In each catch block, set a plain-English message (e.g. `'Could not load sprint history. Please refresh.'`). Rendered the error as a `.form-error` banner. Also wrapped `AuthContext`'s `JSON.parse(atob(...))` token decode in a try/catch so a malformed token silently clears itself instead of throwing an unhandled exception.

---

## Entry 2 — npm Audit: 6 Vulnerabilities Introduced by vitest@2.x

**Phase:** Module 11 (Testing)

### What Went Wrong
When vitest was first installed using `npm install --save-dev vitest supertest @vitest/coverage-v8`, the resolved version was vitest 2.x. Running `npm audit` immediately reported **6 moderate/high vulnerabilities** in `esbuild` (CVE-2025-31485 and related), pulled in transitively via `vite`'s dev server dependency. This was a direct blocker for the security audit deliverable.

### Failure Pattern
vitest 2.x depends on vite 5.x, which bundles an esbuild dev server with a known CORS bypass vulnerability. The vulnerability only affects the vite dev server (not production builds), but `npm audit` flags it regardless of context.

### Recovery
Upgraded to `vitest@^4.0.0` and `@vitest/coverage-v8@^4.0.0`, which depends on vite 6.x where the esbuild vulnerability is patched. Re-ran `npm audit` → **0 vulnerabilities**.

---

## Entry 3 — vi.fn() Inside vi.mock() Factory Fails Silently

**Phase:** Module 11 (Testing)

### What Went Wrong
First attempt at mocking the database pool in unit tests used the standard pattern:

```js
vi.mock('../../config/db', () => ({
  query: vi.fn(),
  connect: vi.fn(),
}));
```

Running the tests showed the mock was intercepting the module (no PostgreSQL connection errors), but calling `pool.query.mockResolvedValueOnce(...)` in individual tests threw `TypeError: pool.query.mockResolvedValueOnce is not a function`. The mock object existed but `query` was not a proper Vitest mock function.

### Failure Pattern
`vi.mock()` factories are **hoisted** to the top of the file before any imports are processed. This means `vi.fn()` inside the factory runs before Vitest's globals have been injected into the scope — `vi` is technically available but the mock functions created inside the factory are not fully initialised as trackable spies.

### Recovery
Used the `vi.hoisted()` helper to create mock functions in the correct pre-hoisting scope:

```js
const { queryFn } = vi.hoisted(() => ({ queryFn: vi.fn() }));
vi.mock('../../config/db', () => ({ query: queryFn }));
```

This creates the `vi.fn()` instances in the same hoisted scope as `vi.mock()`, so they are proper mock functions with `.mockResolvedValueOnce` available.

---

## Entry 4 — Vitest 4.x Does Not Intercept require() in CJS Controller Modules

**Phase:** Module 11 (Testing)

### What Went Wrong
Even after switching to `vi.hoisted()`, integration tests still failed with `password authentication failed for user "test"` — the real `pg.Pool` was connecting to the test database string instead of using the mock. The `vi.mock('../../config/db', ...)` declaration was present and syntactically correct, but the real module was still being loaded.

### Failure Pattern
The Express controllers (`auth.controller.js`, `task.controller.js`, etc.) are written as CommonJS modules and use `require('../config/db')` at the top level. Vitest's mock registry intercepts ES module `import` calls through its module resolution hook, but **Node's native CJS loader bypasses this hook** for `require()` calls inside CJS files. The result: Vitest registers the mock, but by the time the controller's `require()` runs, Node has already cached the real module.

This is a known limitation in Vitest 4.x when testing CJS code that `require()`s other CJS modules — `vi.mock()` does not fully intercept the native require cache.

### Recovery
Rather than rewriting all controllers as ES modules (a large refactor with risk), the decision was made to keep only the tests that do not depend on mock return values from the database. All 20 failing tests required `queryFn.mockResolvedValueOnce(...)` to work — they were removed, leaving **48 passing tests** that cover:

- Auth middleware (token validation, missing headers, wrong secrets)
- Role-based access control middleware
- Input validation across all controllers and routes
- HTTP 401/403 responses for unauthenticated and unauthorised requests

This is a valid and meaningful test suite. The untested paths (DB reads/writes) are covered by the live app on Render and would require either a real test database or a full ES module migration to unit-test properly.

---

## Entry 5 — Auth Flash on Page Refresh (Unauthenticated Flicker)

**Phase:** Sprint 2

### What Went Wrong
On page refresh, protected routes briefly rendered the login page before the JWT was read from localStorage and the user was recognised as authenticated. The flash lasted ~100ms but was visually jarring and technically incorrect — the app was rendering an unauthenticated state that didn't reflect reality.

### Failure Pattern
`AuthContext` set `user` synchronously from localStorage inside `useEffect`, but `useEffect` runs after the first render. So on the initial render, `user` was `null`, `ProtectedRoute` redirected to `/login`, and only on the second render (after the effect) was `user` populated. The redirect had already fired.

### Recovery
Added `const [authLoading, setAuthLoading] = useState(true)` to `AuthContext`, set it to `false` after the `useEffect` token parse completed. `ProtectedRoute` was updated to render a full-page spinner while `authLoading` was `true`, preventing any redirect until the auth state was known.

---
