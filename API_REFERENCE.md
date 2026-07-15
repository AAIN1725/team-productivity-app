# API Reference

Base URL:
- Local: `http://localhost:5000/api`
- Production: `https://team-productivity-app.vercel.app/api`

All authenticated endpoints require the header:
```
Authorization: Bearer <jwt_token>
```

The token is returned by `/auth/login` and `/auth/register`. It expires in 24 hours.

---

## Health

### `GET /health`

Returns API status. No authentication required.

**Response 200:**
```json
{ "status": "ok" }
```

---

## Auth

### `POST /auth/register`

Register a new account. Role determines the registration flow.

**Request body:**
```json
{
  "name": "string",       // required, 1–100 chars
  "email": "string",      // required, valid email
  "password": "string",   // required, 8–128 chars
  "role": "pm | developer",  // required
  "inviteCode": "string"  // required when role = developer (6 alphanumeric chars)
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| `201` | `{ token, user: { id, name, email, role, teamId } }` |
| `400` | Validation error: `{ error, field }` |

When `role = pm`, a new team is created and an invite code is generated automatically.

---

### `POST /auth/login`

Authenticate and receive a JWT.

**Rate limit:** 10 requests per 15 minutes per IP.

**Request body:**
```json
{ "email": "string", "password": "string" }
```

**Responses:**

| Status | Description |
|--------|-------------|
| `200` | `{ token, user: { id, name, email, role, teamId } }` |
| `400` | Missing fields |
| `401` | `{ error: "Invalid email or password." }` |

---

## Team

### `GET /team` *(auth required)*

Get the current user's team info and member list.

**Response 200:**
```json
{
  "team": { "id": 1, "name": "Alice's Team", "createdAt": "2026-06-01T00:00:00.000Z" },
  "members": [
    { "id": 1, "name": "Alice", "role": "pm", "createdAt": "..." },
    { "id": 2, "name": "Bob", "role": "developer", "createdAt": "..." }
  ]
}
```

---

### `GET /team/invite-code` *(PM only)*

Get the team's invite code to share with new developers.

**Response 200:**
```json
{ "inviteCode": "A3F9B2" }
```

---

## Tasks

### Task shape

```json
{
  "id": 1,
  "title": "Fix login redirect",
  "description": "string | null",
  "priority": "low | medium | high",
  "status": "backlog | todo | in_progress | done",
  "sprintId": "number | null",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "assignee": { "id": 2, "name": "Bob" } | null
}
```

---

### `GET /tasks/backlog` *(auth)*

Returns all tasks not assigned to any sprint, ordered by creation date (newest first). Limited to 100 results.

**Response 200:** `{ tasks: Task[] }`

---

### `GET /tasks/sprint/:sprintId` *(auth)*

Returns all tasks assigned to the specified sprint.

**Response 200:** `{ tasks: Task[] }`

| Status | Description |
|--------|-------------|
| `200` | Task list |
| `404` | Sprint not found or does not belong to your team |

---

### `POST /tasks` *(PM only)*

Create a new task.

**Request body:**
```json
{
  "title": "string",          // required, 1–100 chars
  "description": "string",    // optional, max 1000 chars
  "priority": "low | medium | high",  // default: medium
  "assigneeId": "number",     // optional
  "sprintId": "number"        // optional — assigns directly to an active sprint
}
```

**Response 201:** `{ task: Task }`

| Status | Description |
|--------|-------------|
| `201` | Task created |
| `400` | Validation error: `{ error, field }` |
| `404` | sprintId provided but no active sprint found |

---

### `PATCH /tasks/:id` *(PM only)*

Update task fields. All fields are optional — only provided fields are updated.

**Request body:** same shape as `POST /tasks`, all fields optional.

**Response 200:** `{ task: Task }`

| Status | Description |
|--------|-------------|
| `200` | Task updated |
| `400` | Validation error |
| `404` | Task not found |

---

### `PATCH /tasks/:id/status` *(auth)*

Update the Kanban status of a task (used by drag-and-drop).

**Request body:**
```json
{ "status": "todo | in_progress | done" }
```

**Response 200:** `{ task: { id, status, updated_at } }`

| Status | Description |
|--------|-------------|
| `200` | Status updated |
| `400` | Invalid status value, or task is in backlog |
| `403` | Sprint is completed — board is locked |
| `404` | Task not found |

---

### `DELETE /tasks/:id` *(PM only)*

Delete a backlog task. Tasks assigned to a sprint cannot be deleted.

**Response 204:** No content.

| Status | Description |
|--------|-------------|
| `204` | Deleted |
| `404` | Task not found |
| `409` | Task is assigned to a sprint |

---

## Sprints

### Sprint shape

```json
{
  "id": 1,
  "name": "Sprint 1",
  "goal": "string | null",
  "startDate": "ISO date",
  "endDate": "ISO date",
  "status": "active | completed",
  "retroClosed": false,
  "teamMemberCount": 3,
  "createdAt": "ISO timestamp"
}
```

---

### `GET /sprints/active` *(auth)*

Returns the current active sprint, or `null` if none exists.

**Response 200:** `{ sprint: Sprint | null }`

---

### `GET /sprints/history` *(PM only)*

Returns all completed sprints with participation and task stats.

**Response 200:**
```json
{
  "sprints": [{
    "id": 1,
    "name": "Sprint 1",
    "startDate": "2026-06-15",
    "endDate": "2026-06-28",
    "tasksTotal": 8,
    "tasksDone": 6,
    "retroTotal": 3,
    "retroSubmitted": 2
  }]
}
```

---

### `POST /sprints` *(PM only)*

Create a new sprint. Fails if another sprint is active or a retrospective is still open.

**Request body:**
```json
{
  "name": "string",    // required, 1–100 chars
  "endDate": "string", // required, ISO date (today or future)
  "goal": "string"     // optional
}
```

**Response 201:** `{ sprint: Sprint }`

| Status | Description |
|--------|-------------|
| `201` | Sprint created |
| `400` | Validation error |
| `409` | Active sprint exists, or open retrospective not yet closed |

---

### `DELETE /sprints/:id` *(PM only)*

Delete a sprint that has no tasks.

**Response 204:** No content.

| Status | Description |
|--------|-------------|
| `204` | Deleted |
| `404` | Sprint not found |
| `409` | Sprint still has tasks |

---

### `PATCH /sprints/:id/complete` *(PM only)*

Mark a sprint as completed. Tasks with status `todo` or `in_progress` are automatically moved back to the backlog.

**Response 200:**
```json
{ "sprint": { "id": 1, "status": "completed" }, "tasksReturned": 2 }
```

| Status | Description |
|--------|-------------|
| `200` | Sprint completed |
| `404` | Sprint not found |
| `409` | Sprint is already completed |

---

## Retrospectives

### `POST /retro/:sprintId` *(auth)*

Submit retrospective feedback. Each user may only submit once per sprint.

**Request body:**
```json
{
  "answer_1": "string",  // 10–500 chars — What went well?
  "answer_2": "string",  // 10–500 chars — What could be improved?
  "answer_3": "string"   // 10–500 chars — What will you do differently?
}
```

| Status | Description |
|--------|-------------|
| `201` | `{ message: "Submission recorded." }` |
| `400` | Answer too short or too long |
| `403` | Sprint is not completed yet |
| `404` | Sprint not found |
| `409` | Already submitted for this sprint |

---

### `GET /retro/:sprintId/status` *(auth)*

Check whether the current user has already submitted retro feedback.

**Response 200:** `{ submitted: true | false }`

---

### `GET /retro/:sprintId/results` *(PM only)*

View aggregated results. Answers are returned anonymously (no user IDs).

**Response 200:**
```json
{
  "sprint": { "id": 1, "name": "Sprint 1", "retroClosed": false },
  "participation": { "submitted": 2, "total": 3 },
  "tasks": [
    { "id": 5, "title": "Fix bug", "priority": "high", "assignee": { "name": "Bob" } }
  ],
  "responses": {
    "question1": ["It went really well.", "Good collaboration."],
    "question2": ["Unclear requirements.", "Stand-ups ran long."],
    "question3": ["Write clearer tickets.", "Keep stand-ups under 15 min."]
  }
}
```

---

### `PATCH /retro/:sprintId/close` *(PM only)*

Close the retrospective to prevent further submissions.

| Status | Description |
|--------|-------------|
| `200` | `{ message: "Retrospective closed." }` |
| `404` | Sprint not found |
| `409` | Retrospective already closed |

---

## Error format

All errors follow this shape:

```json
{
  "error": "Human-readable message.",
  "field": "fieldName"   // only present for validation errors
}
```
