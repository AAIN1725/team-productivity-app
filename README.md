# SprintBoard — Team Productivity App

A full-stack agile project management tool for small development teams. PMs plan sprints, assign tasks, and run retrospectives. Developers track their work on a mobile-responsive Kanban board and submit anonymous sprint feedback.

**Live Demo:** https://team-productivity-app.vercel.app

---

## Features

- **Sprint Planning** — Create sprints with goals and end dates; enforce one active sprint at a time
- **Kanban Board** — Drag-and-drop task status (To Do → In Progress → Done)
- **Backlog Management** — Create, edit, and assign tasks before adding them to a sprint
- **Team Management** — PM shares an invite code; developers join the team using it
- **Retrospectives** — Three-question anonymous feedback per sprint; PM sees aggregated results
- **Role-Based Access** — PM and Developer roles enforced on every API route
- **Mobile-Responsive** — Hamburger nav, horizontal-scroll Kanban board, responsive tables

---

## Screenshot

*(add a screenshot of the Kanban board here)*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, CSS Variables |
| Drag & Drop | @dnd-kit/core |
| Backend | Node.js 20, Express 4 |
| Database | PostgreSQL 14+ (raw SQL via `pg`) |
| Auth | JWT (`jsonwebtoken`), bcrypt (`bcryptjs`) |
| Rate Limiting | `express-rate-limit` |
| Testing | Vitest, Supertest |
| Deployment | Vercel (frontend), Render (backend), Neon (database) |

---

## Prerequisites

- Node.js >= 20
- PostgreSQL >= 14
- npm >= 9

---

## Installation

```bash
# Clone the repository
git clone https://github.com/AAIN1725/team-productivity-app.git
cd team-productivity-app

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## Environment Variables

**Backend — create `backend/.env`:**

```env
DATABASE_URL=postgresql://user:password@host:5432/sprintboard
JWT_SECRET=replace-with-a-random-string-at-least-32-chars
CLIENT_URL=http://localhost:5173
PORT=5000
```

**Frontend — create `frontend/.env.local`:**

```env
VITE_API_URL=http://localhost:5000
```

---

## Running in Development

```bash
# Terminal 1 — start the backend (auto-restarts on changes)
cd backend
npm run dev

# Terminal 2 — start the frontend dev server
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Running Tests

```bash
cd backend
npm test                # run all tests once and exit
npm run test:watch      # watch mode — re-runs on file changes
npm run test:coverage   # generate HTML coverage report
```

Tests are located in `backend/tests/`:
- `unit/` — middleware and controller logic with a mocked database
- `integration/` — full HTTP request/response cycle via Supertest

---

## Deployment

### Frontend — Vercel

1. Connect your GitHub repository to [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add the environment variable `VITE_API_URL` pointing to your deployed backend URL
4. Push to `master` — Vercel auto-deploys on every push

### Backend — Render

1. Create a new Render web service pointing to the `backend` directory
2. Create a **PostgreSQL** database on [Neon](https://neon.tech) and copy the connection string
3. Set environment variables: `DATABASE_URL` (from Neon), `JWT_SECRET`, `CLIENT_URL`
4. Run the database migration once: `npm run migrate`

---

## API Reference

See [API_REFERENCE.md](./API_REFERENCE.md) for the full endpoint documentation.

---

## Security Notes

- All SQL queries use parameterized statements — no SQL injection risk
- Passwords are hashed with bcrypt (salt rounds: 10)
- Login is rate-limited to 10 attempts per 15 minutes
- All routes require a valid JWT; PM-only routes additionally verify the `pm` role
- **Known issue:** JWT is stored in `localStorage` (vulnerable to XSS). Migrating to `HttpOnly` cookies is planned for a future sprint

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push and open a Pull Request against `master`

---

## License

MIT
