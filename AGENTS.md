<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Memory

## Product

This project is a Chinese vocabulary learning web app. All product decisions should support learning, reviewing, organizing, and remembering Chinese words.

Core domain concepts:

- Chinese vocabulary words and phrases
- Pinyin
- Vietnamese meaning
- Example sentences
- Topics, tags, and levels
- Review progress and memorization state
- User-owned vocabulary lists

## Tech Stack

Frontend:

- Next.js with App Router
- React 19
- TypeScript
- Tailwind CSS
- Ant Design
- Zod
- Zustand
- TanStack Query

Backend:

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security (RLS)

Deployment:

- Vercel
- Supabase Cloud

## Working Rules

- Read the relevant Next.js guide in `node_modules/next/dist/docs/` before changing Next.js APIs, routing, server actions, caching, metadata, forms, or config.
- Prefer App Router patterns already used in this repository.
- Keep TypeScript strict and avoid `any` unless there is a strong reason.
- Use Ant Design components when building common UI controls.
- Use Tailwind CSS for styling and keep UI responsive.
- Use React Hook Form plus Zod for user input validation.
- Use TanStack Query for server-state fetching, mutation, caching, and invalidation.
- Use Zustand only for client UI state or lightweight app state, not server state.
- For Supabase data access, respect RLS and design queries around authenticated users.
- Do not bypass RLS from client code.
- Keep vocabulary data user-scoped unless a feature is explicitly public/shared.
- Prefer small, focused changes over broad rewrites.
- Do not rename routes, tables, or shared components unless needed for the task.

## UX Direction

- The app should feel focused, fast, and useful for daily vocabulary study.
- Prioritize clear study flows: add word, review word, filter by topic, track progress.
- Chinese text, pinyin, and Vietnamese meaning should be easy to scan.
- Avoid marketing-style landing pages unless explicitly requested.
- Build actual learning screens and workflows first.

## Data And Security

- Assume Supabase Auth identifies the active user.
- Tables containing user vocabulary or progress should include `user_id`.
- RLS policies should ensure users can only read/write their own private data.
- Storage objects should use predictable ownership rules and RLS-compatible paths.
- Never place service-role keys or privileged Supabase credentials in client code.
