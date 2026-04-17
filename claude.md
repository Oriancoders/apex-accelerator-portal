# Netinshell — Claude Code Instructions

## Project
On-demand Salesforce consulting platform. Clients create tickets, consultants send proposals, clients approve, work is done in Salesforce sandbox.

## Stack
- Frontend: React + Vite
- Backend: [Supabase Edge Functions ]
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth

## Current Task
Implementing the Salesforce Sandbox OAuth2 Integration Module.
Full spec is in BLUEPRINT.md.
Agent orchestration is in AGENTS.md.

## Rules
- Always read BLUEPRINT.md before writing any code
- Always read supabase/migrations/ before touching the database
- Never create a separate backend — add to the existing one
- Never put SF_CLIENT_SECRET in any frontend file
- Never accept production Salesforce org URLs (login.salesforce.com)
- Match existing code patterns exactly — read the file before editing it

## Key Files
- BLUEPRINT.md — full feature spec
- AGENTS.md — parallel agent execution plan
- GEMINI.md — Gemini context (ignore in Claude Code)
- supabase/migrations/ — source of truth for all DB schema

## Skills Installed
- frontend-design — use for SandboxConnect and SandboxDashboard components
- docx, pdf, pptx, xlsx — available if needed