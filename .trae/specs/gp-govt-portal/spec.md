# Dumbarwadi GP Government Portal with Backend - Product Requirements Document

## Overview
- **Summary**: Transform the existing static Dumbarwadi (डुंबरवाडी) Gram Panchayat single-page site into an authentic Indian-government-portal-style website connected to a real backend (Node.js + Express + SQLite). The frontend will render *all* content dynamically via REST API calls (no hardcoded scheme/notice/service/contact/profile data in HTML). A protected admin panel at `/admin` will allow Panchayat staff to sign in and create/read/update/delete schemes, notices, services, contacts, demographic stats, and village profile data. Village residents will be able to browse the public site, view dynamic content, and submit scheme applications that are saved to the database and visible in admin. Both public and admin views support the existing bilingual English / मराठी toggle.
- **Purpose**: (1) Deliver a visually authentic government-of-India look-and-feel (tricolour header strip, official blue/white palette, emblem/ashok-chakra motif, Hindi/Marathi bilingual typography, government-style footer disclaimer) so the site reads as a real e-Governance portal, not a demo. (2) Add a functioning backend with a persistent database so content changes survive server restarts and Panchayat staff can maintain the site without editing code.
- **Target Users**: (a) **Village Residents of Dumbarwadi (1430 people)** — browse schemes, notices, services, contacts, demographic profile, apply for schemes in English or Marathi; (b) **Panchayat Staff** — Sarpanch Shital Atul Gore & Sachiv Ashish Prakash Kolhe — log into admin panel and maintain site content; (c) **Demo Evaluators** — can run one command (`npm start`) to launch both the public portal and admin panel, login with a known demo password, edit content, reload the public site, and see changes appear live.

## Goals
1. Refactor the public frontend to fetch every dynamic block (demographic stats, schemes, notices, services, contacts, notice ticker, hero stats) from backend JSON API endpoints, rather than embedding text in HTML. Preserve the existing bilingual `EN / मराठी` switch.
2. Deliver a Node.js + Express + SQLite backend with:
   - Static file serving for the public portal (`/`)
   - Admin web panel (`/admin`) staffed with login form + CRUD dashboards
   - REST API (`/api/*`) with 6 entity routes (village, profile-stats, schemes, notices, services, contacts) + scheme applications
   - Demo session-based auth (bcrypt-hashed demo admin password; no multi-user DB required for v1)
   - Schema init script + seed script that populates the DB with the real Dumbarwadi data from Meri Panchayat (GP LGD 185937, population 1430, all 9 profile categories, 6 schemes, 4 notices, 6 services, 4 contacts) so site looks correct on first boot with no manual entry.
3. Apply a government-of-India visual theme:
   - Tricolour top banner (saffron / white / green) with Ashoka Chakra motif
   - Official government palette: deep blue (#0b3d91 / #004c8c) header + white body with light-grey cards
   - Footer with standard government disclaimer lines, "Last Updated", "Site maintained by Panchayat Office", accessibility/sitemap links (stylistic matches)
   - Logo strip: "भारत सरकार / Government of India" (placeholder) alongside "महाराष्ट्र राज्य / Government of Maharashtra" + "डुंबरवाडी ग्राम पंचायत / Dumbarwadi Gram Panchayat"
   - Authentic portal fonts: continue Poppins for English, Noto Sans Devanagari for Marathi, add a serif fallback for official headings feel.
4. Add resident-facing Scheme Application flow: resident fills a form (multilingual), submits → saved to `scheme_applications` table → admin dashboard shows pending applications with count badge, and admin can mark application as Pending / Approved / Rejected.
5. Provide operational instructions (`package.json` start script, README-less CLI docs via help banner) so site boots and runs in one command.

## Non-Goals
1. **No production-grade deployment / SSL / PM2 / cloud hosting** in scope. This is a local demo server.
2. **No SMS/email integration** for scheme application confirmations or OTP logins.
3. **No full user-registration DB for residents** (scheme applications accept name/mobile/household without requiring sign-in; resident login toggle from earlier answer is reduced to optional name field on application form — keeps scope bounded and still satisfies both public & staff flows).
4. **No file uploads** (for scheme documents, certificates, profile photos) in v1 — text fields only.
5. **No payment / treasury / taxation** modules. This is an information + application-tracking portal, not a finance portal.
6. **No Supabase / Postgres / MySQL** — keep it zero-config with a single local SQLite file `data/gp.db`.
7. **No API authentication tokens for the public read endpoints** — content is public; auth is only for admin write endpoints.

## Background & Context
The user's prior conversation (per session memory) produced a static HTML/CSS/JS site for Dumbarwadi Gram Panchayat with 8 sections: Header, Notice ticker, Hero stats, Demographic Profile (9 Meri Panchayat categories + JJM progress bar), Schemes, Notices, Village Services, Contacts, Footer. The site has a working bilingual EN/मराठी toggle using `data-en`/`data-mr` attributes + `setLanguage()` function in `script.js`. Data shown (population 1430, Sarpanch *Shital Atul Gore*, Sachiv *Ashish Prakash Kolhe*, JJM 321 tap-water HHs, etc.) was sourced from two screenshots of the Meri Panchayat Android app v1.0.85-2309, and these exact values are required as seed data. Existing files: `index.html`, `styles.css`, `script.js` in project root; a Python dev server on port 8000 was used previously — the new stack will replace this with an Express server on a single port (default `3000`) that serves both static frontend and API. Node version available: 22.18.0, npm 10.9.3, Python 3.13.1.

## Functional Requirements
- **FR-1**: On first launch, backend creates SQLite DB (`data/gp.db`) with tables for `village` (profile metadata), `profile_stats` (9 categories with male/female/total + labels in both langs), `schemes`, `notices`, `services`, `contacts`, `scheme_applications`, `admins` (demo user row only). Seeds all tables with the exact Dumbarwadi Meri Panchayat data.
- **FR-2**: Backend exposes public read-only JSON endpoints: `GET /api/village`, `GET /api/profile-stats`, `GET /api/schemes`, `GET /api/notices`, `GET /api/services`, `GET /api/contacts`. Each entity returns `title_en`/`title_mr`, `desc_en`/`desc_mr`, etc.
- **FR-3**: Backend exposes admin write endpoints protected by session auth: `POST/PUT/DELETE /api/schemes/:id`, `/api/notices/:id`, `/api/services/:id`, `/api/contacts/:id`, plus `PATCH /api/village` and `PUT /api/profile-stats/:id`.
- **FR-4**: Scheme application flow — public `POST /api/scheme-applications` accepts JSON fields (scheme_id, applicant_name_en/mr, mobile, household_no, address, notes) and writes a Pending row. Admin panel lists applications with filter by status; admin `PATCH /api/scheme-applications/:id` changes status.
- **FR-5**: Admin login `/api/admin/login` (POST) checks bcrypt-hashed demo password from env/config, sets an `httpOnly` signed session cookie; `/api/admin/logout` clears cookie; `/api/admin/me` returns 200 only when logged in.
- **FR-6**: Public frontend (`index.html` as SPA-style fetch layer) calls all public endpoints on first load, then programmatically builds the Demographic Profile grid, Scheme cards, Notice list, Service cards, Contact cards, Notice ticker, Hero stats, and footer village metadata using DOM APIs rather than hardcoded HTML nodes.
- **FR-7**: Admin panel (`/admin`) — single HTML page (`views/admin.html`) with login form, logout button, 7 tabs (Village, Profile Stats, Schemes, Notices, Services, Contacts, Applications), each with add/edit/delete forms and a list view. Uses the same bilingual toggle as the public site.
- **FR-8**: Government-style visual theming applied to BOTH public portal and admin panel: top tricolour strip, official blue header, dual-language logo strip, card borders matching govt table style, government disclaimer footer, "Last updated on …" footer line reading from village table.
- **FR-9**: Bilingual data model preserved end-to-end — every text field that appears on the public site has both `_en` and `_mr` versions in DB/API; admin forms provide side-by-side or tabbed inputs for both languages; public `setLanguage()` function continues to work with dynamically inserted nodes by reading per-node dataset.
- **FR-10**: Error handling — backend API returns JSON `{ "error": "message", "code": "..." }` with correct HTTP status (400/401/404/500); frontend fetch wrappers show toast messages instead of silent failures; admin login shows red inline error for wrong password.
- **FR-11**: Scheme card "Know More" button opens a detail view using the same scheme data from the API, and includes a prominent "Apply for Scheme" button that scrolls/appends the application form.
- **FR-12**: Package.json start script `npm start` installs dependencies if missing? No — standard: `node server/server.js`; also provides `npm run seed` to re-seed DB (useful when admin wants to reset demo).

## Non-Functional Requirements
- **NFR-1 (Reliability)**: Server must not crash on DB seed re-runs. Running `npm run seed` a second time must be idempotent — data stays identical (use REPLACE/upserts on seed IDs, or drop+recreate only when user explicitly runs seed).
- **NFR-2 (Performance)**: First paint of the public portal should be <1.5s locally; API responses must be <100ms per endpoint for the seeded data volumes.
- **NFR-3 (Portability)**: Works on Windows as the primary target (project runs on Windows). SQLite DB file stored under `./data/` relative to project root; no absolute paths anywhere.
- **NFR-4 (Security)**: Admin password stored **bcrypt-hashed** in DB (or in config with a bcrypt-hash comparison). Cookies: `httpOnly`, `sameSite: 'lax'`, `signed: true`. Write endpoints protected by session middleware. Public `POST /api/scheme-applications` has basic length limits + a honeypot or server-side nonce to deter trivial spam (simple nonce approach: server embeds `CSRF_TOKEN` in HTML; backend checks on POST).
- **NFR-5 (Accessibility)**: Government theme uses contrast ratios meeting WCAG AA for text on background (deep blue on white, green buttons on white have contrast ≥4.5:1). All button labels in both languages have readable sizes ≥14px.
- **NFR-6 (Code Maintainability)**: Clear folder structure — `server/` (Express app + routes + db + seeds), `public/` (frontend assets: index.html, styles.css, script.js moved here, plus an `admin/` subfolder for admin assets OR one `views/admin.html` served at `/admin`). Readability: small focused route files, one DB module, one seed module.
- **NFR-7 (Backwards compatibility)**: Existing feature behaviour must be preserved — bilingual toggle, smooth scroll nav, back-to-top button, notice ticker animation, intersection observer fade-in, scheme Know-More alert detail. Behaviour changes are permitted only to support dynamic data (e.g., alert now reads from scheme description instead of hardcoded strings).

## Constraints
- **Technical**: Must use Node.js v22 + Express + SQLite3 (`better-sqlite3` recommended for sync, zero callback-hell). No external services; no Postgres/MySQL/Supabase. Session store: `cookie-session` (no Redis needed) for a demo-scale single-user admin.
- **Business**: Seed data must match the exact Dumbarwadi LGD / population / demographic / official names sourced earlier. No placeholder fake data allowed in the initial load.
- **Dependencies**: Only well-known, actively maintained npm packages. Minimal set: `express`, `better-sqlite3`, `bcryptjs`, `cookie-session`, `csurf` (or minimal nonce CSRF), possibly `morgan` for request logging. No frontend build step / Vite / React — keep vanilla HTML/CSS/JS to match the current codebase and avoid introducing bundlers.

## Dependencies
- Node.js ≥22 (present on host).
- npm packages to be installed: `express`, `better-sqlite3`, `bcryptjs`, `cookie-session`.
- Google Fonts CDN for Poppins + Noto Sans Devanagari (already used — keep <link> tag).

## Assumptions
1. The admin demo password is `admin123` (clearly marked as DEMO ONLY in a banner on the login page). This is acceptable because the deliverable is explicitly a local demo, not a production deployment.
2. Village residents do NOT need to create accounts to submit scheme applications. They enter name/mobile/household; admin sees these submissions.
3. Both government-emblem and Ashoka-Chakra visuals are rendered via **CSS shapes + inline SVGs** (no external image file, no trademarked logos downloaded — safe royalty-free representation for a demo).
4. Marathi translations for the NEW admin-only strings (e.g., "Save", "Delete", "Approved", "Pending", "Login failed") are added directly into `data-en`/`data-mr` attributes inline in admin HTML, matching the existing public-site convention.
5. The "government look" can be achieved purely with CSS theming overrides (new class `.govt-theme`) on top of the existing stylesheet — no need to throw away `styles.css` entirely.

## Acceptance Criteria

### AC-1: Server boots and seeds database on first run
- **Type**: `rule`
- **Given**: A fresh project directory with no `data/gp.db` file; dependencies installed via `npm install`
- **When**: User runs `npm start`
- **Then**: Server listens on port 3000 (or env PORT), DB file `data/gp.db` is created with 8 tables, 6 schemes, 4 notices, 6 services, 4 contacts, 1 village row, 9 profile-stats rows and 1 admin row are present. HTTP `GET /` returns the public portal HTML (200). HTTP `GET /admin` returns admin panel HTML (200).
- **Pass Condition**: `curl http://localhost:3000/` returns 200 with text "Dumbarwadi" / "डुंबरवाडी"; `curl http://localhost:3000/api/schemes` returns 6 JSON entries with GP LGD references; file `./data/gp.db` exists and is ≥30KB.
- **Evidence**: Terminal output of `npm start` (shows "Listening on 3000" + "DB seeded ✓"), `curl` outputs for `/` and `/api/schemes`, `ls -la data/` showing `gp.db`.

### AC-2: Public portal is rendered dynamically from API
- **Type**: `rule`
- **Given**: Server is running
- **When**: Browser loads `http://localhost:3000/` with cache disabled
- **Then**: Every dynamic block (hero stats, notice ticker, 9 profile categories + their 27 stat boxes, 6 scheme cards, 4 notice cards, 6 service cards, 4 contact cards, footer village metadata, last-updated line) contains values fetched from API calls and identical to seeded Meri Panchayat Dumbarwadi data. No hardcoded scheme/notice/service/contact/profile text nodes remain in `index.html` outer DOM after the API hydration pass (empty placeholder containers are fine).
- **Pass Condition**: Browser network panel shows ≥7 successful XHR `GET` calls under `/api/*`; `document.querySelector('.scheme-card').textContent` matches seeded first scheme title (e.g., "PM Awas Yojana"); screenshot confirms profile grid has 9 cards with correct numeric labels (1430 total pop, 321 JJM, etc.).
- **Evidence**: Browser snapshot of loaded public page + network fetch traces from console.

### AC-3: Bilingual toggle works for API-populated content
- **Type**: `rule`
- **Given**: Public portal loaded in English default
- **When**: User clicks "मराठी" button, then "EN" button
- **Then**: All dynamically inserted text nodes (scheme title/desc, notice title/desc, service title/desc, contact labels, profile category headings, stat labels, footer lines, ticker, hero subtitle) correctly switch between English and Marathi values returned by the API. Body class toggles `lang-en`/`lang-mr`, Devanagari font is active when Marathi. Page title updates.
- **Pass Condition**: After clicking मराठी, first nav link is "मुख्यपृष्ठ"; first scheme heading is "पीएम आवास योजना"; JJM heading is "जल जीवन मिशन — नळ पाणी कनेक्शन". After clicking EN, same nodes read in English. No empty text nodes; no leftover English inside Marathi view except numeric values (which are language-agnostic).
- **Evidence**: Two browser snapshots (EN state + मराठी state) captured with refs pointing to same elements showing both language variants.

### AC-4: Admin login flow works with demo password
- **Type**: `rule`
- **Given**: Not logged in. Visit `/admin`
- **When**: User types wrong password → gets inline "Invalid password" message. User types correct demo password `admin123` → submits.
- **Then**: On correct password, browser redirects to admin dashboard (or AJAX replaces login form); session cookie is set `httpOnly`; subsequent request to `/api/admin/me` returns 200. On wrong password, status 401 and no cookie set.
- **Pass Condition**: `curl -v POST /api/admin/login` with `{password:'admin123'}` returns 200 + set-cookie header; same with wrong password returns 401 without set-cookie.
- **Evidence**: Curl commands for success + failure, browser snapshot of admin dashboard (tabs visible).

### AC-5: Admin CRUD for schemes persists and shows on public portal
- **Type**: `rule`
- **Given**: Logged into admin, on Schemes tab. Public portal open in second tab.
- **When**: Admin clicks "Add Scheme", fills title_en="Test English", title_mr="चाचणी मराठी", desc_en/desc_mr, tags_en/mr, saves → PUT request succeeds (200). Then admin edits an existing scheme's description, saves. Then admin deletes the newly created test scheme.
- **Then**: (1) New scheme appears in Schemes tab list. (2) Reload public portal second tab → new scheme card appears in English, clicking मराठी switches it to Marathi correctly. (3) Edited description changes on public reload. (4) Deleted scheme disappears from both admin and public views. DB `SELECT COUNT(*) FROM schemes` reflects each change.
- **Pass Condition**: Full add-edit-delete round trip verified by two browser snapshots (before & after each operation) + `api/schemes` JSON endpoint count changes by +1 / 0 / -1 respectively.
- **Evidence**: Screenshot of admin Schemes tab showing new row; public portal showing new card; API JSON output diffs.

### AC-6: Scheme application submission tracked in admin
- **Type**: `rule`
- **Given**: Public portal scheme detail open with "Apply" button visible
- **When**: Resident fills application form (en/mr name, mobile, HH number, address, notes) with non-empty name and valid 10-digit mobile, clicks Submit.
- **Then**: Form POSTs 200 OK. In admin → Applications tab, new row shows with status "Pending", count badge = 1. Admin changes status to "Approved" → public-facing tracking check page (or inline in the same form via lookup by mobile) shows application status changed.
- **Pass Condition**: `GET /api/scheme-applications` (admin-only) returns JSON array length 1 with status Pending, then after admin PATCH returns status Approved. Mobile-number field matches submitted.
- **Evidence**: Application form submit success toast; admin Applications tab snapshot; API JSON response.

### AC-7: Government visual theme applied to public + admin
- **Type**: `rubric`
- **Dimension**: Authenticity of government-of-India portal look
- **Scale**: 1-5
- **Anchors**: 1 = same old green scheme, nothing changed; 2 = only a colour swap; 3 = tricolour strip present + header recoloured to official blue, still missing logo/footer touches; 4 = complete with tricolour strip, dual-language (Hindi/Marathi + English) logo strip, blue header, card styles, footer disclaimer + last-updated line; 5 = indistinguishable visual style from a real GoI state rural-development portal including a footer accessibility/sitemap block and proper typography.
- **Pass Threshold**: >= 4
- **Evidence**: Browser full-page screenshot of public portal; screenshot of admin login/dashboard. Compare against a reference Indian-government-portal layout (e.g., NIC common template) and score based on anchor criteria.

### AC-8: Session security baseline met
- **Type**: `rule`
- **Given**: Server running with default config
- **When**: An unauthenticated request is made to `POST /api/schemes` (write endpoint, no credentials)
- **Then**: HTTP status = 401; response body = JSON error. Admin cookie attributes contain `HttpOnly`, `SameSite=Lax`; cookie value is signed (starts with `s:` prefix if using cookie-session default). Password column in `admins` table contains bcrypt hash (starts `$2a$` / `$2b$`), NOT plaintext.
- **Pass Condition**: Unauthenticated POST to any `/api/*` write route returns 401; `curl -v` of login response shows Set-Cookie with `HttpOnly` and `SameSite=Lax`; `sqlite3 data/gp.db 'SELECT password FROM admins LIMIT 1'` returns a bcrypt-style hash.
- **Evidence**: Curl 401 output; cookie header copy-paste; sqlite output.

### AC-9: Demo reset idempotence
- **Type**: `rule`
- **Given**: DB has been modified (added scheme, deleted a notice)
- **When**: User stops server; runs `npm run seed`; starts server again
- **Then**: DB returns exactly to the pristine Dumbarwadi-seeded state (6 schemes / 4 notices / 6 services / 4 contacts / 9 profile stats / 1 village / 1 admin rows are identical to initial seed values; any test scheme applications are cleared or preserved as per seed policy). Public site looks identical to fresh-first-run appearance.
- **Pass Condition**: `SELECT COUNT(*) FROM schemes` = 6, `SELECT COUNT(*) FROM notices` = 4, profile stat total_population = 1430.
- **Evidence**: Terminal output of `npm run seed` (prints "Seeded 6 schemes, 4 notices…" counts), SQL query results.

## Open Questions
- [x] Backend stack? → Resolved by default decision (Node.js + Express + SQLite + bcryptjs + cookie-session) because user selected Other and stated intent is realistic govt website + backend.
- [ ] Demo admin password: is `admin123` acceptable, or does the user prefer a different password? (Assumption holds for now; password can be changed in a single config var later.)
- [ ] Scheme application status tracking — should residents see a "Track application by mobile number" page on the public portal, or only admins see statuses? (Assumption: provide a simple status lookup by mobile number on the public portal — lightweight and useful.)
