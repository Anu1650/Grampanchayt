# Dumbarwadi GP Complete Official Portal - Implementation Plan

## Task 1: Database Schema Expansion & Idempotent Seed Updates
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Update `server/seed.js` / `server/db.js` to create new tables: `citizens`, `service_applications`, `complaints`, `complaint_replies`, `gram_sabha_meetings`, `gram_sabha_agenda`, `gram_sabha_attendance`, `projects`, `panchayat_members`, `contact_messages`.
  - Add new columns to existing tables: `notices.notice_type`, `notices.pdf_attachment`, `notices.download_filename`; `schemes.eligibility_en`, `.eligibility_mr`, `.application_process_en`, `.application_process_mr`, `.benefits_en`, `.benefits_mr`, `.documents_required_en`, `.documents_required_mr`, `.scheme_code`.
  - Ensure `ALTER TABLE ADD COLUMN` graceful additions (idempotent) when columns don't exist.
  - Seed new rows: 4+ panchayat_members (Sarpanch, Deputy, Gram Sevak, 2 ward members); 8 services directory rows; 6 development projects (road/drainage/streetlight/water/solar/other); 1 upcoming + 1 past gram sabha with agenda/minutes/attendance; 6+ notices with varied types + 1 with pdf_attachment placeholder; 10+ expanded schemes with eligibility fields; 2-3 demo citizens.
  - Update `tablesEmpty()` detection to check all new tables.
- **Acceptance Criteria Addressed**: AC-10, AC-2, AC-5, AC-6
- **Test Requirements**:
  - `rule` TR-1.1: After `npm run seed` on empty DB, `sqlite3 data/gp.db .tables` lists all 17+ tables; count queries per table meet the minimum counts listed in AC-10.
  - `rule` TR-1.2: Seed is idempotent — run twice consecutively; counts remain identical; no constraint errors.
- **Notes**: Keep columns TEXT-typed generous; use JSON TEXT columns for `documents`, `status_history`, `complaint_replies`, `photos`, `agenda items`.

## Task 2: Backend Route Expansion (Public + Citizen Auth)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - Create `server/routes/citizenAuth.js`: register (POST /api/citizen/register — bcrypt password, validate mobile unique/10-digit), login (POST /api/citizen/login — bcrypt verify, set session `citizenId` + `citizenMobile`), logout (POST /api/citizen/logout), me (GET /api/citizen/me — gated with new `requireCitizen` middleware).
  - Create `server/middleware/citizenAuth.js` `requireCitizen(req, res, next)` checking `req.session.citizenId`.
  - Create `server/routes/citizenPrivate.js` gated with requireCitizen: `GET /api/citizen/me/applications` (all service_applications where citizen_id matches), `GET /api/citizen/me/complaints` (same), profile update optional.
  - Create `server/routes/serviceApplications.js`: `POST /api/service-applications` (public + optional citizen linkage) — validates per-service required fields, generates service-prefixed application ID, stores documents as data-url array, status = 'submitted', status_history = [{status, ts, note}]. `POST /api/service-applications/track` (lookup by application_id + mobile). `GET /api/service-applications/:id` for detail.
  - Create `server/routes/complaints.js`: `POST /api/complaints` — generate DGP-GRV-YYYY-###### id, status submitted with history, photo uploads. `GET /api/complaints/:id` (detail). `POST /api/complaints/:id/track` (id + mobile → status timeline + replies).
  - Create `server/routes/gramsabhaPublic.js`: `GET /api/gramsabha/upcoming`, `GET /api/gramsabha/past`, `GET /api/gramsabha/:id` (includes agenda, minutes, attendance summary).
  - Create `server/routes/projectsPublic.js`: `GET /api/projects` (category/status filter optional, summary stats), `GET /api/projects/:id`.
  - Create `server/routes/search.js`: `GET /api/search?q=` — UNION search across schemes.title_en/title_mr, notices, services, projects; return grouped.
  - Create `server/routes/panchayatMembersPublic.js`: `GET /api/panchayat-members`.
  - Create `server/routes/contactMessages.js`: `POST /api/contact-messages` (save to DB, status=new).
  - Wire everything into `server/app.js`.
- **Acceptance Criteria Addressed**: AC-4, AC-5, AC-6, AC-8, AC-9
- **Test Requirements**:
  - `rule` TR-2.1: curl register → 201; login with same mobile → 200 + Set-Cookie; `/me` returns fullname + ward_no.
  - `rule` TR-2.2: POST service-applications/birth with valid 10-digit mobile + name → returns application_id starting `DGP-BIR-`, status submitted; track endpoint with id + mobile returns same row.
  - `rule` TR-2.3: POST complaint → returns complaint_id; status_history.length = 1. GET complaints/:id returns timeline.
  - `rule` TR-2.4: `/api/search?q=awas` returns ≥1 scheme.
  - `rubric` TR-2.5: Completeness of route coverage; scale 1-5; 1=missing half the routes, 3=all listed present but some filters absent, 5=every route in FR-37/38 present + filtering works; threshold >=4; evidence: list of route files + grep output showing handlers present.

## Task 3: Backend Admin Panel Expansion (New CRUD tabs)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - In `server/routes/admin.js`: add `makeCrud` calls for `panchayat_members`, `gramsabha` meetings (meeting + agenda sub-routes), `projects`, plus:
    - Service applications listing (filter by type/status/search by mobile/app_id) with `PATCH /api/admin/service-applications/:id` to change status + admin_note (appends to status_history).
    - Complaints listing (filter ward/type/status) with `PATCH /api/admin/complaints/:id` to transition status + add admin reply entry + optional resolution photo.
    - Contact messages listing + `PATCH /api/admin/contact-messages/:id/reply` (write reply, mark status=replied).
    - Notices: allow PDF attachment data-URL upload within body (existing notices CRUD already, just extend accepted fields).
    - Gram Sabha sub-routes: `POST /admin/gramsabha/:id/agenda` adds item; `PUT/DELETE` agenda item; `POST /admin/gramsabha/:id/attendance` bulk upsert.
  - Ensure the existing requireAdmin + requireToken middleware gates everything new.
  - Verify consistent error shapes `{ ok: false, error, code }`.
- **Acceptance Criteria Addressed**: AC-4, AC-5, AC-6, AC-8, AC-9
- **Test Requirements**:
  - `rule` TR-3.1: Login admin → POST `/api/admin/panchayat-members` → 201; GET back → present.
  - `rule` TR-3.2: Admin PATCH service-application status → status changes, status_history array length increments by 1.
  - `rule` TR-3.3: Admin PATCH complaint reply → complaint_replies/appends JSON length grows +1.
  - `rule` TR-3.4: Unauthenticated POST to any `/api/admin/*` write → HTTP 401.

## Task 4: CSS Theme Rebrand (Navy/Blue + White) + Government Chrome + Accessibility Toolbar Styles
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None (parallel with backend tasks; but must finish before frontend render tasks)
- **Description**:
  - Rewrite CSS variable block to Navy/Blue/White palette + golden accent.
  - Add `.govt-tricolor` top strip (saffron #FF9933 / white / green #138808) with 24-spoke Ashoka Chakra inline SVG (no external image).
  - Add `.govt-logo-strip` 3-column layout: GoI block / Maharashtra block / GP block, each with SVG emblem placeholder + bilingual names.
  - Navy blue header `.header.govt` with white text, gold hover accents.
  - Footer: 4-column grid, disclaimer bar, last-updated, sitemap/accessibility links.
  - Buttons: primary navy with white text, secondary outline, success/danger/warning.
  - Cards: light-grey/white with subtle blue borders, hover shadow.
  - Add styles for accessibility toolbar popover (`.a11y-toolbar`) with font-buttons/high-contrast/grayscale toggles; define body classes `.font-lg`, `.font-xl`, `.high-contrast`, `.grayscale`.
  - Breadcrumbs (`.breadcrumbs`) nav component styles.
  - Toast system styles (`.toast-container`, `.toast.success/warning/error`), fixed top-right with slide-in animation.
  - Hamburger + mobile nav fully responsive at 4 breakpoints.
  - Scheme/project progress bars, status badges, complaint timeline stepper.
  - Add `.govt-badge` LGD-display styles, official seals, print-friendly certificate view styles with A4 sizing.
  - Keep existing bilingual font fallbacks (Poppins/Noto Sans Devanagari) + `.lang-mr` rule.
- **Acceptance Criteria Addressed**: AC-1, NFR-1, NFR-6
- **Test Requirements**:
  - `rule` TR-4.1: On loaded home view, `getComputedStyle(document.documentElement).getPropertyValue('--primary')` = `#002868`.
  - `rule` TR-4.2: `.govt-tricolor` height 24px with 3 horizontal bands; Ashoka Chakra inline SVG present with 24-spokes detected via DOM.
  - `rubric` TR-4.3: Theme visual authenticity as per AC-1; evidence: screenshot; score >= 4.

## Task 5: Frontend Infrastructure (Hash Router, API Helper, CSRF, Toast, Language, Accessibility)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4 (CSS)
- **Description**:
  - Refactor `script.js` infrastructure into `public/` folder (move index.html, styles.css, script.js to `public/`; ensure `server/app.js` still serves them).
  - Add hash-router: map `#/home`, `#/about`, `#/about/:tab`, `#/services`, `#/apply/:type`, `#/citizen`, `#/citizen/register`, `#/citizen/login`, `#/citizen/dashboard`, `#/complaints`, `#/complaint/new`, `#/complaint/:id`, `#/notices`, `#/notices/:id`, `#/gramsabha`, `#/projects`, `#/projects/:id`, `#/schemes`, `#/schemes/:id`, `#/contact`, `#/track` (query param app_id).
  - Central `api.js` helper: fetch wrapper with auto-JSON, auto `X-CSRF-TOKEN` header (fetched from `/api/csrf-token` and stored), consistent `{ok, data, error, code}` unwrapping, triggers toast on error.
  - Toast module: `showToast(type, key_or_message_en, message_mr?)` renders into `.toast-container` using current language.
  - Language module: extend `setLanguage(lang)` so *dynamic* records expose an `$en`/`$mr` getter or pass through a helper `t(record, field)` = `record[field+'_en']` / `record[field+'_mr']`; used everywhere.
  - Accessibility toolbar module: renders popover markup into header, applies classes, persists in localStorage, initialises on boot.
  - Search module: debounced top-search bar fetches `/api/search?q=` and shows dropdown grouped results → click navigates via router.
  - Breadcrumbs module: derive trail from current route hash, render into `.breadcrumbs` placeholder.
- **Acceptance Criteria Addressed**: AC-3, AC-7, FR-5, FR-7, FR-8, FR-9
- **Test Requirements**:
  - `rule` TR-5.1: Navigate `#/schemes` then click a scheme → URL becomes `#/schemes/1`; breadcrumbs show `Home / Schemes / PMAY`; back button returns to list.
  - `rule` TR-5.2: Accessibility toolbar → Font+ twice → body has `.font-xl`; reload (manually) → class persists.
  - `rule` TR-5.3: Top-search "awas" → dropdown shows ≥1 scheme row; clicking routes to `#/schemes/:id`.
  - `rule` TR-5.4: Submit invalid form (mobile=123) → toast.error visible for 3+ seconds.

## Task 6: Home + About (Village Info, Demographics, Panchayat Members, Map) Views
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 5 (Router), Task 1 (DB)
- **Description**:
  - Home view router: fetch `/api/village`, `/api/profile-stats`, top 3 `/api/notices?_limit=3`, `/api/services` → render welcome banner with generated village photo URL (per spec image endpoint), 4 quick-service tiles, latest notices grid, important announcements callouts, 4 hero stats.
  - About view router with tabs: `#/about/info`, `/demographics`, `/members`, `/map`. Info: village detail + LGD; Demographics: profile-stats grid + JJM progress bar (reuse existing visual); Members: grid panchayat_members cards; Map: Google Maps embed iframe `src="https://maps.google.com/maps?q=19.25,74.01&z=14&output=embed"` + SVG village boundary placeholder.
  - All text uses bilingual helper; breadcrumbs reflect tab.
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-8
- **Test Requirements**:
  - `rule` TR-6.1: Home displays 4 stats with seeded numbers "1430 / 36.11 / 321 / 12".
  - `rule` TR-6.2: About → Members tab renders ≥4 cards (Sarpanch/Deputy/Gram Sevak/Ward).
  - `rule` TR-6.3: Map tab iframe src contains "19.25" and "74.01".
  - `rule` TR-6.4: Toggle language to मराठी → About tab headings switch.

## Task 7: Online Services Directory + Certificate Application Forms (7 types) + Track + Download View
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 5, Task 2
- **Description**:
  - `/services` directory page: fetch 8 service cards from DB or static list mapped to routes.
  - `/apply/birth`, `/apply/death`, `/apply/residence`, `/apply/income`, `/apply/water`, `/apply/property-tax`, `/apply/complaint` (complaint goes to own module anyway) shared form renderer that builds field sets based on `type` including:
    - Shared applicant section (name/mobile/email/ward/HH/addr/gender/dob/aadhaar_last4).
    - Type-specific extra fields (FR-13).
    - Documents upload: max 3 files, each < 5 MB, JPG/PNG/PDF, read as data URLs, preview thumbnails.
    - Pre-fill if citizen logged in (GET /api/citizen/me).
    - Submit → calls POST /service-applications → success toast + generated app_id → offers "Track" deep link or auto-route.
  - `/track` page (or `/track/:id?mobile=...`): form for app_id + mobile → if found, show big status stepper (submitted → under_review → approved → rejected → issued) with admin_note, application detail. If status = issued → "Download Certificate" button → opens `/certificate/:id` printable view (styled letterhead A4, bilingual, authorised signature).
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `rule` TR-7.1: Fill Birth Certificate form with all required fields + upload ≤5 MB JPG → submit returns 201 + application id.
  - `rule` TR-7.2: Track page returns the application; 5-step stepper shows step 1 active.
  - `rule` TR-7.3: Admin PATCH to issued → track stepper step 5 green; Download button opens certificate print view.

## Task 8: Citizen Portal Views (Register / Login / Dashboard)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 5, Task 2
- **Description**:
  - Register form: fields (FR-18), password+confirm, client-side validate mobile length 10, password min 6, match, POST /citizen/register → success toast → redirect to login.
  - Login form: mobile + password, "Remember me" optional, POST /citizen/logion → on success reloads `/api/citizen/me` → shows user greeting in header menu.
  - Header account menu: if citizen logged in → `Welcome, {name}`, links "My Applications", "My Complaints", "Logout"; else → "Login / Register".
  - Dashboard `#/citizen/dashboard`: tabbed My Applications (count by status badges + list with links), My Complaints (same), Profile summary card.
  - Logout link calls POST /citizen/logout → clears session state in UI + reload.
- **Acceptance Criteria Addressed**: AC-4, AC-3
- **Test Requirements**:
  - `rule` TR-8.1: Register new mobile → DB citizens row added; login with same → dashboard shows.
  - `rule` TR-8.2: Apply for service while logged in → service_applications.citizen_id populated automatically (check via admin GET).
  - `rule` TR-8.3: Logout → header menu reverts to Login/Register; `/me` returns 401 after refresh.

## Task 9: Complaints/Grievance Views (New Form + Public Track + Timeline)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 5, Task 2
- **Description**:
  - `#/complaint/new`: form (FR-22) — complaint_type dropdown, ward, landmark, desc_en/mr textareas, severity radio, 1-3 photo upload with preview, complainant detail (auto if citizen). Submit → generate complaint_id + success + deep link.
  - `#/complaints` directory: my complaints (if logged in) OR public lookup by complaint_id + mobile.
  - `#/complaint/:id`: public page (lookup via mobile query param or citizen own) with 4-step vertical timeline stepper (submitted / under_review / in_progress / resolved), each step with timestamp + note; admin-replies panel below as chat-like messages; upload additional-resolution-photo metadata if admin provided.
  - Badge colors match severity.
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `rule` TR-9.1: Submit complaint → success + complaint_id returned; 4-step timeline shows first step done.
  - `rule` TR-9.2: Admin transitions to resolved with note + photo → timeline 4th step green, replies visible.

## Task 10: Notices + Gram Sabha + Development Projects Views
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 5, Task 2
- **Description**:
  - Notices page: filter tabs (All / Gram Sabha / Tenders / Schemes / Water Supply / Holidays), date-badge cards, each with type tag, full detail, PDF download button (if pdf_attachment present → create data-url anchor download). Notice detail modal.
  - Gram Sabha page: "Upcoming Meeting" hero card (date, venue, chair, agenda-list collapsible); "Past Meetings" list → each opens detail with agenda table, minutes text, resolutions, attendance count + list.
  - Projects page: summary stat cards (Total Budget, Completed, In Progress, Upcoming). Filter by category/status. Project cards with progress bar, cost, dates, status badge, photo carousel (first photo). Detail modal with full photos, milestones timeline.
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `rule` TR-10.1: Notices tabs filter correctly (Tenders tab → only notice_type='tender' rows).
  - `rule` TR-10.2: PDF download button → anchor href is data-url with application/pdf or octet-stream; click triggers browser download.
  - `rule` TR-10.3: Gram Sabha upcoming card has date, agenda ≥ 2 items.
  - `rule` TR-10.4: Projects progress bar `width%` == project.progress_pct.

## Task 11: Schemes Expanded Detail View + Contact Page
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 5, Task 2
- **Description**:
  - Schemes list page: fetch expanded schemes, cards (icon, title, tags, short desc). Detail view: banner, full description, section Eligibility, Benefits, Required Documents, Application Process, "Apply Now" buttons linking to relevant service-apply route (PMAY → housing if available or to residence cert).
  - Contact page: office address block from village/contacts, officials contact grid from panchayat_members (Sarpanch/Deputy/Gram Sevak), Google Maps iframe, contact form (name/email/phone/subject/message_en/message_mr + optional attachment-less), submit → POST /contact-messages → success toast.
- **Acceptance Criteria Addressed**: AC-6, AC-8
- **Test Requirements**:
  - `rule` TR-11.1: PMAY detail page shows eligibility section with ≥ 2 bullet points.
  - `rule` TR-11.2: Contact form submit → contact_messages DB row created with status='new'.
  - `rule` TR-11.3: Contact page officials list includes Shital Atul Gore (Sarpanch) + Ashish Kolhe (Gram Sevak).

## Task 12: Notice Ticker + Admin Panel View Updates + Server Config Polish
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 5, Task 3
- **Description**:
  - Notice ticker in header: loads `/api/notices?_limit=5` latest on boot, horizontal CSS scroll animation, each item is clickable → opens notice modal.
  - Admin panel (`views/admin.html`): existing CRUD tabs expanded:
    - Add tabs: Panchayat Members, Service Applications (with type/status filters + status PATCH modal with admin_note), Complaints (with reply + status transitions), Gram Sabha (meetings + agenda editor + attendance sheet), Projects (add/edit with photo uploads), Contact Messages (reply).
    - Admin session check on load; if not logged in show login form (keep existing behaviour).
    - CRUD forms provide en/mr side-by-side fields for every bilingual table.
  - Server config polish: JSON body limit raised to `8mb` (for data-url uploads — document with warning that it's demo-only). Upload endpoints validate size server-side (≤ 5 MB per file, ≤ 3 files). Cookie `secure` flag enabled when `NODE_ENV=production` + `X-Forwarded-Proto` for SSL-ready. CSRF cookie fetch helper initialised correctly for admin + citizen.
  - Update `server/server.js` to start app.js on PORT.
- **Acceptance Criteria Addressed**: AC-4, AC-5, AC-6, AC-8, AC-9, FR-6
- **Test Requirements**:
  - `rule` TR-12.1: Notice ticker scrolls automatically; click notice → opens notice detail.
  - `rule` TR-12.2: Admin tabs Service Applications, Complaints, Gram Sabha, Projects, Panchayat Members, Contact Messages all render.
  - `rule` TR-12.3: Upload file 6 MB → server rejects with HTTP 413 / BAD_SIZE.
  - `rule` TR-12.4: NODE_ENV=production → Set-Cookie includes `Secure` attribute.

## Task 13: End-to-End Manual Testing + Seed Demos + Spec Coverage Review
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Tasks 1-12
- **Description**:
  - Full smoke test of every FR: (1) register/login citizen, (2) apply for each of 6 services (Birth/Death/Residence/Income/Water/Property-Tax), (3) admin approve + issue each, (4) download certificate printable view, (5) file complaint, admin transition all 4 steps with reply, public lookup, (6) notices tabs + PDF download, (7) gram sabha upcoming + past with agenda/minutes/attendance, (8) projects filters + progress, (9) schemes eligibility + apply CTA, (10) contact form, (11) search, (12) breadcrumbs, (13) a11y toolbar + persistence, (14) EN/MR toggle deep-dive on dynamic content, (15) admin CRUD each new tab add/edit/delete.
  - Fix any issues found.
  - Ensure DB seed includes demo enough rows for every list to look populated on first boot.
  - Update `npm start` and seed output banners for clarity.
- **Acceptance Criteria Addressed**: All ACs
- **Test Requirements**:
  - `rubric` TR-13.1: End-to-end walkthrough completeness; scale 1-5; 1=breaks immediately, 3=most flows work but 1-2 minor missing, 5=every FR from 1-42 works; threshold >= 4; evidence: step-by-step notes with pass/fail per feature list.
  - `rule` TR-13.2: Idempotent seed re-run does not duplicate rows; data matches AC-10 counts.
