# Dumbarwadi GP Government Portal with Backend - Implementation Plan

## Overview
- Start server command: `npm start` (Express on port 3000)
- Seed command: `npm run seed` (idempotent)
- Demo admin password: `admin123` (assumption, configurable in `server/config.js`)
- Tech stack: Node 22, Express, better-sqlite3, bcryptjs, cookie-session; no frontend bundler
- Folder structure to create:
  - `server/` — `server.js` (entry), `app.js` (Express setup), `config.js`, `db.js`, `seed.js`, `csrf.js`
    - `routes/public.js` — /api/village, /api/profile-stats, /api/schemes, /api/notices, /api/services, /api/contacts, /api/scheme-applications (POST public + GET admin-only list + PATCH admin-only)
    - `routes/adminAuth.js` — login/logout/me
    - `middleware/auth.js`, `middleware/csrf.js`
  - `data/` — gitignored folder, holds `gp.db`
  - `public/` — move existing `index.html`, `styles.css`, `script.js` here; add `admin.html` inside `views/` OR `public/admin/`; add `public/admin/admin.js`, `public/admin/admin.css`; add SVG logo strip assets inline
  - `package.json` — deps + `start`, `seed` scripts

## Task 1: Project scaffold - package.json, folders, server entry, DB bootstrap, seed with real Dumbarwadi data
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Create `package.json` with dependencies: `express`, `better-sqlite3`, `bcryptjs`, `cookie-session`, `morgan`, plus devDependency placeholder (no build step needed). Scripts: `start` → `node server/server.js`, `seed` → `node server/seed.js --force`.
  - Create `server/db.js`: exports single `Database('./data/gp.db')` instance via `better-sqlite3`; auto-creates `data/` folder.
  - Create `server/config.js`: `PORT=3000`, `SESSION_SECRET=dev-secret-change-me`, `DEMO_ADMIN_PASSWORD_HASH` (pre-computed bcrypt for `admin123`).
  - Create `server/seed.js`: defines 8 CREATE TABLE statements (village, profile_stats, schemes, notices, services, contacts, scheme_applications, admins) + 1 block of INSERT/UPSERT data matching the exact Dumbarwadi Meri Panchayat values from session memory (GP LGD 185937, Village LGD 555263, pop 1430, male 717/female 713, ST 63 SC 43 OBC 0, children 0-6 148, 6-18 0, HHs 321, PHC 1 Sub 1 Anganwadi 2 Primary 2, water sources 3 parks 1, standing 1 SHG 12, Sarpanch Shital Atul Gore email shitalgore2468@gmail.com mobile xxxxxx2857, Sachiv Ashish Prakash Kolhe email aashish.kolhe@gmail.com mobile xxxxxx6401, lat 19.25 lon 74.01, 6 schemes (Awas, PM-KISAN, JJM, MGNREGA, Ayushman, Midday Meal), 4 notices (Gram Sabha 28 Sep, Health Camp 2 Oct, Application Deadline 15 Oct, Cleanliness Drive 20 Oct), 6 services (Water, Electricity, Health, Education, Certificates, Infrastructure)). Seed admin row with bcrypt-hashed `admin123`. Seed is idempotent: --force drops tables before insert; otherwise upsert by ID.
  - Create `server/app.js`: initialise Express, `express.json()`, `morgan('dev')`, `cookie-session({ httpOnly: true, sameSite: 'lax', signed: true, secret, maxAge: 8h })`, mount `express.static('public')` on `/`, mount `/api` router for public routes, `/api/admin` for admin-auth routes, serve `views/admin.html` at `/admin`.
  - Create `server/server.js`: require `app.js`, listen on `config.PORT`, log "Listening on 3000", ensure seed runs once on first boot if tables empty (auto-seed).
- **Acceptance Criteria Addressed**: AC-1, AC-9
- **Test Requirements**:
  - `rule` TR-1.1: Running `npm install` then `npm start` on clean checkout logs "DB seeded ✓" + "Listening on 3000" and curl http://localhost:3000/ returns 200 with page text containing "Dumbarwadi" or "डुंबरवाडी". Evidence: terminal start log + curl output.
  - `rule` TR-1.2: `npm run seed` counts printed match: 1 village, 9 profile_stats, 6 schemes, 4 notices, 6 services, 4 contacts, 1 admin. Evidence: seed.js console output block captured.
  - `rule` TR-1.3: Stop server, modify schemes (add), run `npm run seed`, restart, GET /api/schemes returns exactly 6 entries matching pristine seed. Evidence: before & after JSON counts.
- **Notes**: Pre-compute bcrypt hash at build-time using a one-liner: `node -e "console.log(require('bcryptjs').hashSync('admin123',10))"`.

## Task 2: Implement REST API routes (public read + admin write + auth + scheme-applications)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - `server/middleware/auth.js`: `requireAdmin` middleware returns 401 JSON if `req.session.userId !== 'admin'`.
  - `server/middleware/csrf.js`: Simple nonce — server exposes endpoint `/api/csrf-token` that sets a per-session nonce in `req.session.csrf` and returns it; any mutating public POST (application submit) requires `x-csrf-token` header to match. For admin write routes, cookie-session SameSite already provides CSRF protection for browser clients, but we still require the same nonce header for consistency.
  - `server/routes/public.js`: GET /api/village (single row); GET /api/profile-stats; GET /api/schemes; GET /api/notices; GET /api/services; GET /api/contacts. All return JSON with `{data}` envelope. POST /api/scheme-applications validates fields, checks CSRF nonce, status defaults to `pending`, inserts row, returns `{id}`. POST /api/scheme-applications/track (optional public): takes `{mobile}` + optional `application_id` and returns matching records scrubbed of personal notes.
  - `server/routes/adminAuth.js`: POST /api/admin/login reads `{password}`, compares bcrypt vs stored hash in admins table; on match sets `req.session.userId='admin'`, returns `{ok:true, user:{role:'admin'}}`. POST /api/admin/logout clears session, returns 204. GET /api/admin/me returns 200 with `{role:'admin'}` or 401.
  - `server/routes/admin.js`: All routes prefixed `/api/admin` and gated with `requireAdmin`. PUT /api/admin/village (upsert village row). PUT /api/admin/profile-stats/:id (update stat row). Full CRUD: /api/admin/schemes, /api/admin/notices, /api/admin/services, /api/admin/contacts each with GET list, POST create, PUT update, DELETE. GET /api/admin/scheme-applications (list with query param `?status=pending|approved|rejected`; optional `?q=` for name search). PATCH /api/admin/scheme-applications/:id to change `status` + optional admin note.
  - Consistent 400/404 error middleware at bottom of `app.js`: JSON `{error, code}` envelope.
- **Acceptance Criteria Addressed**: AC-2, AC-4, AC-5, AC-6, AC-8
- **Test Requirements**:
  - `rule` TR-2.1: GET /api/schemes returns 6 entries, first has both `title_en` and `title_mr` non-empty and includes "Awas" (or Marathi equivalent). Evidence: curl JSON.
  - `rule` TR-2.2: POST /api/admin/login with wrong password → 401; correct `admin123` → 200 + Set-Cookie with `HttpOnly` and `SameSite=Lax` (or browser-enforced attributes visible in curl -v). Evidence: two curl -v outputs.
  - `rule` TR-2.3: Without session, `POST /api/admin/schemes` → 401. After login, same POST with new scheme → 201; GET /api/schemes count = 7. DELETE that new ID → 204; count back to 6. Evidence: curl chain outputs.
  - `rule` TR-2.4: POST /api/scheme-applications as public (valid payload + correct csrf from /api/csrf-token) → 201 with `id`. Admin GET /api/admin/scheme-applications includes it with status=pending. Admin PATCH `{status:'approved'}` → 200, subsequent track query shows approved. Evidence: JSON payloads.
  - `rule` TR-2.5: `SELECT password FROM admins` returns a string beginning with `$2a$` or `$2b$` (bcrypt). Evidence: sqlite3 CLI one-liner output.

## Task 3: Refactor public frontend (index.html + script.js + styles.css) — dynamic fetching from API + govt theme
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - Move current `index.html`, `styles.css`, `script.js` under `public/`. Rewrite `index.html` to keep ONLY the skeleton (head, lang switcher, logo strip placeholder, hero container empty, profile container empty, schemes container empty, notices container empty, services container empty, contacts container empty, footer metadata placeholders, application form modal placeholder, ticker strip empty container).
  - **Government visual theme additions to `styles.css`**:
    - `.govt-tristrip`: 6px high top bar, 3 equal segments — saffron `#FF9933` / white / green `#138808` with a 16px navy-blue Ashoka-Chakra SVG circle inline in the white segment, absolutely centred.
    - `.govt-emblem-strip`: full-width header bar under tristrip with 3 logos: Left `🇮🇳 GoI` inline SVG + text "Government of India / भारत सरकार", Middle `MH state emblem` inline SVG + "Government of Maharashtra / महाराष्ट्र शासन", Right "Dumbarwadi Gram Panchayat / डुंबरवाडी ग्राम पंचायत" with GP LGD 185937 subline. Govt palette: header navy `#004c8c`, accent text `#d97706` (saffron).
    - Cards: remove old gradient green, use clean `border: 1px solid #d5d9e0`, `border-radius: 6px`, soft shadow, header bands in navy for section titles; Buttons: navy fill with white text, hover `#0b3d91`; green only for success statuses and JJM.
    - Footer `.govt-footer`: multi-line disclaimer "This is the official website of Dumbarwadi Gram Panchayat under the e-Panchayat Mission Mode Project, National Informatics Centre.", then "Site maintained by: Panchayat Office Dumbarwadi", then "Last updated: <date>", then sitemap links row in 4 columns (About, Services, Schemes, Contact).
  - **Script.js rewrite into API-first modules (still vanilla, one file)**:
    - Add `api.js`-like namespace at top of script.js: `window.GP = { baseURL: '', csrf: null, fetchJSON, async init() {...} }`.
    - On DOMContentLoaded: fetch `/api/csrf-token` then `Promise.all([ village, profileStats, schemes, notices, services, contacts ])`.
    - Render functions for each container: `renderHero(village, stats)`, `renderTicker(village, notices)`, `renderProfile(profileStats)`, `renderSchemes(schemes)`, `renderNotices(notices)`, `renderServices(services)`, `renderContacts(village, contacts)`, `renderFooter(village, contacts)`. Each function builds elements and sets `dataset.en` / `dataset.mr` attributes on every text-bearing node so the existing `setLanguage()` function works unchanged.
    - Extend `setLanguage()` to accept a parent element scope (default to document) so newly rendered nodes are processed on each language switch. Call `setLanguage(currentLang)` after each render.
    - Attach intersection observer to dynamically created cards so fade-in animations still trigger.
    - Scheme "Know More" opens a modal (`<div id="schemeDetail" class="govt-modal">`) with full en/mr scheme content and an "Apply" button → opens application form pre-filled with `scheme_id`.
    - Scheme application form: bilingual fields (`name_en`, `name_mr`, `mobile`, `household_no`, `address_en`, `address_mr`, `notes_en`/mr). Submit uses `GP.csrf` token → success toast, then shows inline application ID and status tracking link that opens mobile lookup.
    - Back-to-top, smooth scroll, hamburger menu, ticker duplication loop: keep existing logic but hook onto new dynamic DOM.
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-7
- **Test Requirements**:
  - `rule` TR-3.1: Load public page; Network panel shows 6 successful GET calls under `/api/*`; DOM after load contains 6 `.scheme-card` nodes; 9 `.profile-category` nodes; 4 `.notice-card`; 6 `.service-card`; 4 `.contact-card`. Evidence: browser snapshot + network log.
  - `rule` TR-3.2: Click मराठी button → first nav link `textContent === 'मुख्यपृष्ठ'`; first scheme h3 contains `आवास`; profile heading e30 equivalent `'जनसांख्यिकी प्रोफाइल'`. Click EN → back to English. Evidence: 2 snapshots.
  - `rubric` TR-3.3: Government theme fidelity; scale 1-5; anchors 1=no change, 3=tristrip+navy header only, 5=full emblem strip+govt footer+accessibility links+card palette navy+saffron borders+last-updated date line. Threshold >=4. Evidence: full page desktop screenshot.

## Task 4: Build admin panel UI (/admin with login + 7 tabs CRUD)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3
- **Description**:
  - Create `views/admin.html` served from `/admin` route. Government-styled like public: tristrip, simplified emblem strip, navy header, bilingual lang switcher, `<div id="app-root"></div>`.
  - Create `public/admin/admin.js`: single vanilla JS app. On load, call `/api/admin/me`:
    - 401 → render login form (username label "Admin", password field, submit button). POST `/api/admin/login` via fetch; inline red error for 401, redirect-reload to dashboard on 200. Bilingual EN/मराठी labels via data attribute pattern.
    - 200 → render dashboard: top bar (app title + logout button + EN/मराठी switcher + pending-application badge). 7 `<nav>` tabs: Village, Profile Stats, Schemes, Notices, Services, Contacts, Applications. Content area switches per tab.
  - Each CRUD tab:
    - Village tab: form with all 10+ village fields (name_en/mr, lgd_gp, lgd_village, lat, lon, area_sqkm, total_population, total_hhs, office_timings_en/mr, address_en/mr, last_updated auto-display). Save button PUTs `/api/admin/village` → success toast.
    - Profile Stats tab: table of 9 rows with 3 numeric inputs each (male/female/total + label_en/mr + category icon). One SAVE ALL button PUTs each stat endpoint in parallel.
    - Schemes / Notices / Services / Contacts tabs: same pattern → list panel (card/table) on left + form panel on right (or modal for add/edit). Each row has EDIT / DELETE buttons. Form has bilingual side-by-side inputs: `title_en` | `title_mr`, `desc_en` | `desc_mr`, `tags_en/mr` as comma-separated. List shows both language columns abbreviated.
    - Applications tab: Stats summary badges (Pending / Approved / Rejected counts). Filter select + search by name/mobile. Table rows: ID, Scheme, Applicant, Mobile, HH, Status, Applied Date, Actions. Action dropdown: Mark Approved / Rejected / Pending + textarea for Admin Note. Click row → open detail with all fields + comment thread (admin notes only).
  - Create `public/admin/admin.css`: Govt theme matching public palette, but denser layout (tables, forms, badges). Share `.govt-tristrip`, `.govt-emblem-strip` classes from public styles — import them or inline copy.
  - Reusable `showToast(type, text_en, text_mr)` helper, fetches current body language to display the right string.
  - Reuse the existing `setLanguage()` logic as a small copy inside admin.js for its own nodes.
- **Acceptance Criteria Addressed**: AC-4, AC-5, AC-6, AC-7, AC-8
- **Test Requirements**:
  - `rule` TR-4.1: Navigate /admin while logged out → login form visible. Wrong password shows inline error. Correct password → dashboard shows 7 tabs, Applications badge=0 initially. Evidence: 2 snapshots.
  - `rule` TR-4.2: Schemes tab → Add Scheme → fill en/mr title/desc → Save → list row appears → GET /api/schemes (in second tab) returns 7 entries → Delete new scheme → list 6 again. Evidence: 3 screenshots (before add / after add / after delete) + JSON counts.
  - `rule` TR-4.3: Submit an application from public site, refresh admin Applications tab → row visible with Pending badge. Click Approve → status chip turns green. Track in public by mobile shows Approved. Evidence: screenshots + track lookup JSON.
  - `rubric` TR-4.4: Admin panel UI cohesion with public portal; scale 1-5; anchors 1=unrelated blank page, 3=functional but unstyled, 5=consistent govt palette, tristrip, emblem strip, same fonts, tabular CRUD with govt-table feel. Threshold >=4. Evidence: Admin dashboard screenshot.

## Task 5: Scheme application public track-by-mobile page & Know More modal UX polish
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 4
- **Description**:
  - Add a small public "Track Application" widget embedded below the Scheme list section (or inside Know More modal footer) — mobile number input + "Track" button → calls POST /api/scheme-applications/track → displays result cards (application ID, scheme, applicant name, status badge with colour coding, admin note if any).
  - Scheme Know More modal: apply scheme_id to form hidden field, autofill scheme name EN/मराठी visible in form header. After successful submit, form is replaced by inline success card showing "Application ID: #XXXX saved. Status: Pending. Track using mobile XXX" with one-click Track button.
  - Toast notifications for all user-initiated actions on both public (Save / Login / Apply / Track / Language switch) and admin (Save / Delete / Login / Logout / Status change).
  - Minor polish: Govt-theme loading skeleton CSS classes (animated grey bars) shown while API data is loading; remove skeletons when render completes.
- **Acceptance Criteria Addressed**: AC-6, AC-7
- **Test Requirements**:
  - `rule` TR-5.1: Submit a scheme app (see Task 2) then enter same mobile in Track → status card appears showing scheme name + pending badge. After admin approval → same Track shows Approved. Evidence: 2 track snapshots.
  - `rule` TR-5.2: Know More button (any scheme) → modal opens with scheme.en desc + scheme_id in form hidden field → submit → success card with ID appears. Evidence: single screenshot sequence.

## Task 6: Integration run-through, error handling pass, docs in code comments, final start-to-finish verification
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 5
- **Description**:
  - Run full end-to-end scenario manually:
    1. Clean checkout → `npm install` → `npm start`
    2. Public site loads → verify 9 profile/6 scheme/4 notice/6 service/4 contact cards visually
    3. Switch languages twice → verify
    4. Submit an application → success
    5. Login admin → verify application pending, change to approved → log out
    6. Track application by mobile → approved shows
    7. Add/edit/delete scheme in admin → verify on public after reload
    8. Run `npm run seed` → restart → everything back to pristine seed state
  - Add top-of-file module comments for server files so a new reader can understand the flow.
  - Add a small `README-like banner print` in `server/server.js` console on listen that tells admin the URL and demo login password (so user has discoverable instructions without opening a doc file).
  - Ensure error handling: (a) network failure (retry button + toast) (b) 401 auto redirect to /admin login (c) 404 for missing schemes (d) empty states in admin list panels ("No schemes yet. Click Add Scheme.").
  - Add a `.gitignore` with `/data/`, `/node_modules/`.
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9
- **Test Requirements**:
  - `rule` TR-6.1: Full E2E scenario above runs without any errors in console; every toast/redirect/state change as described. Evidence: captured terminal npm start log + set of E2E screenshots OR a single summary snapshot showing the 8 key screens.
  - `rule` TR-6.2: Deleting data/gp.db then `npm start` auto-seeds cleanly (no errors). Evidence: terminal output.
  - `rubric` TR-6.3: Overall production readiness of the demo; scale 1-5; anchors 1=broken, 3=mostly works with errors, 5=zero console errors + graceful empty states + discoverable login instructions + consistent UX. Threshold >=4. Evidence: browser console screenshot (empty errors).
