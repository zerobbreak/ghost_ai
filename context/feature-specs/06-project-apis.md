The database schema is read. Build the backend project API routes only 

## Routes
Create Rest endpoints for:

- `Get /api/projects`, list current users projects
- `POST /api/projects`, create project
- `PATCH /api/projects/[projectId]`, rename project
- `DELE /api/projects/[projectId]`, delete project

## Rules

Use the authenticated Clerk user ID as `ownerId`

When creating: 
- default missing project name to `Untitled Project`
- use the schema's existing ID strategy, do not add sequential IDs

Security: 
- unauthenticated requests return `401`
- only the project owner can rename or delete
- non-owner mutations return `403`

Keep this backend only. Do not wire the UI yet