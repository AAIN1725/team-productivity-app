# Retrospective

**Project:** Team Productivity App
**Stack:** React + Vite, Express, PostgreSQL (Neon), deployed on Vercel + Render
**Duration:** Sprints 1–2 + Module 11 (Testing, Documentation, Security)

---

## Project Overview

Built a full-stack team productivity application from scratch. The app supports two roles — Project Manager and Developer — with features including task backlog management, sprint planning, kanban board, team management, and retrospectives. The project progressed through an initial build sprint, a stakeholder-driven change sprint, and a final testing and documentation phase.

---

## What I Am Proud Of

**A working full-stack app deployed end-to-end.**
The app is live at [https://team-productivity-app.vercel.app](https://team-productivity-app.vercel.app) with a real PostgreSQL database on Neon and a Node.js backend on Render. Getting all three services talking to each other in production — with environment variables, CORS, and JWT auth working correctly across origins — was a meaningful milestone.

**Role-based access control done properly.**
Rather than just hiding UI elements, access control is enforced at the API layer with middleware on every protected route. A developer cannot create tasks, manage sprints, or view retrospective history even if they call the API directly. This was a deliberate design decision and it held up throughout the project.

**A meaningful test suite despite tooling constraints.**
Hitting the Vitest 4.x CJS mock limitation was frustrating, but the 48 passing tests that remain cover the parts of the codebase that are most likely to break silently: auth token validation, role enforcement, and input validation across every endpoint. These tests would have caught the most common class of regression.

**Complete documentation.**
README with 12 sections, API reference for all 18 endpoints, a debugging journal, and a retrospective. Documentation is often the first thing cut when time is short — shipping all of it feels like finishing the job properly.

---

## What Went Wrong

**Silent error swallowing in the frontend.**
Four pages shipped in Sprint 1 with `catch(() => {})` — errors were swallowed completely. This was caught in Sprint 2 only because it was on a checklist. Without that review, users would have seen blank screens with no explanation whenever the backend was unavailable. This should have been caught during Sprint 1 development.

**JWT stored in localStorage.**
This is a known security risk (vulnerable to XSS attacks). It was chosen for simplicity in Sprint 1 with the intention of moving to HttpOnly cookies in Sprint 3. The risk is documented in the README and security audit, but it means the current production app has a HIGH severity security gap. Shipping a known vulnerability — even with a documented plan to fix it — is not ideal.

**Test tooling chosen without verifying CJS compatibility.**
Vitest was added in Module 11 without first verifying that `vi.mock()` would intercept `require()` calls inside CJS controllers. The incompatibility between Vitest's ESM-based mock registry and Node's CJS loader cost significant debugging time and ultimately meant 20 tests had to be dropped. Checking the tooling against the module format of the codebase upfront would have saved several hours.

**No tests written during development.**
Tests were written at the end (Module 11) rather than alongside the code. This meant the test phase was about reverse-engineering what the code does rather than defining what it should do. Several bugs were only visible in retrospect.

---

## What I Would Do Differently

**Write tests as I go, not at the end.**
At minimum, write validation tests for each controller as it is built. They take 10 minutes per function and immediately expose edge cases. Writing them at the end is harder, more time-consuming, and produces tests that verify existing behaviour rather than intended behaviour.

**Store JWT in HttpOnly cookies from day one.**
The localStorage approach was chosen for simplicity, but swapping to cookies later is non-trivial — it requires changes to the frontend fetch calls, backend cookie parsing, CORS credentials config, and the auth middleware. It is much easier to do it correctly from the start than to retrofit it.

**Verify tooling compatibility before committing to it.**
Before choosing a test framework, write one small proof-of-concept test against an actual controller. If it works, proceed. If it surfaces a CJS/ESM incompatibility, discover that in 30 minutes rather than after writing the full test suite.

**Add error states to every data-fetching component from the start.**
The pattern `const [data, setData] = useState([])` should always be `const [data, setData] = useState([])` + `const [error, setError] = useState('')`. It takes one extra line and prevents the "blank screen on network failure" problem entirely.

**Use a database migration tool from the beginning.**
Raw SQL migration scripts work, but a proper migration tool (Drizzle ORM, node-pg-migrate) would have made schema changes safer and the deployment process more repeatable. Managing migration order manually is error-prone as the schema grows.

---

## What I Learned

**Full-stack deployment is harder than full-stack development.**
Writing the code was the straightforward part. Getting Vercel (frontend), Render (backend), and Neon (database) to work together — with the right environment variables, CORS origins, and database connection strings — required understanding how each platform handles configuration and what it injects at runtime.

**Middleware is the right place to enforce security.**
Putting auth and role checks in middleware rather than in each controller keeps controllers focused on business logic and makes security auditing straightforward — there is one place to look to verify that a route is protected.

**The gap between "tests pass" and "software works" is large.**
The 48 passing tests verify input validation and auth enforcement. They say nothing about whether the database queries return the right data, whether the kanban drag-and-drop state is consistent, or whether the sprint completion flow handles edge cases correctly. Tests are necessary but not sufficient — manual testing and integration testing against a real database are irreplaceable.

**Documentation written at the end is harder to write well.**
The README and API reference are accurate, but they were written from memory and code inspection rather than from notes taken during development. Key decisions (why raw SQL instead of an ORM, why localStorage for JWT) had to be reconstructed. Writing one paragraph of context notes after each major decision would have made this phase much faster and more accurate.

**Incremental delivery reduces risk.**
Sprint 2 was driven entirely by stakeholder feedback on Sprint 1. Having a working app in production at the end of Sprint 1 — even an imperfect one — made the feedback concrete and actionable. Building everything before shipping would have meant discovering all the gaps at once, with no user feedback to prioritise them.

---
