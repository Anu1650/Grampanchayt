# Dumbarwadi Gram Panchayat — Complete Official Portal with Backend - Product Requirements Document

## Overview
- **Summary**: Build a fully-featured, authentic Indian-government-style Gram Panchayat portal for Dumbarwadi (LGD: 185937) with Navy/Blue + White theme, bilingual English/Marathi support, and a complete backend covering: Home, About/Panchayat Members & Map, Online Services (7 certificate types + tax + complaints), Citizen Registration/Login Portal, Grievance Redressal with status workflow, Notices/Tenders/Holidays/PDFs, Gram Sabha management, Development Projects tracker, Government Schemes (PMAY/Swachh/JJM/MGNREGA), and Contact page with Google Maps + contact form. Every system connects to a Node.js/Express/SQLite backend with persistent data, authenticated admin CRUD, citizen login, and dynamic frontend rendering.
- **Purpose**: (1) Deliver a production-quality official-looking e-Governance portal matching NIC/Government of India visual standards (navy blue/white, tricolour strip, bilingual headers, structured sections). (2) Provide a complete vertical of backend-integrated citizen services — apply for certificates, file complaints, track status, manage applications — so each feature saves data to the DB and surfaces it in admin. (3) Add structural UX features: global search bar, breadcrumbs, accessibility controls, notice ticker, secure login, proper success/error messages.
- **Target Users**:
  - **Citizens of Dumbarwadi (1430)**: Browse info, register/login, apply for services, upload documents, track statuses, file complaints, view notices/gram sabha/projects/schemes, contact panchayat.
  - **Panchayat Staff**: Sarpanch Shital Atul Gore, Deputy Sarpanch, Gram Sevak Ashish Kolhe, Panchayat Members — Admin panel to manage all content, review & approve applications, reply to complaints, post notices, update gram sabha, manage projects, manage schemes.
  - **Demo Evaluators**: Run `npm start`, login, CRUD content, apply as citizen, see full workflow end-to-end.

## Goals
1. **Visual rebrand**: Replace existing green theme with authentic Navy/Blue (#002868 / #0b3d91 / #004c8c) + White government-style palette, tricolour header strip, Ashoka Chakra motif, official logo-strips (GoI / Maharashtra / Dumbarwadi GP), structured footer with disclaimer/sitemap/accessibility/last-updated.
2. **Complete section coverage (11+)**: Home, About (village info + population + area + sarpanch/deputy/gram sevak/members + map), Online Services (Birth/Death/Residence/Income/Water/Property Tax/Complaint), Citizen Portal (register/login/apply/upload/track/download), Complaints/Grievance (workflow Submitted → Under Review → In Progress → Resolved, admin reply), Notices (Gram Sabha/Tenders/Schemes/Water/Holidays + PDF), Gram Sabha (dates/agenda/minutes/resolutions/attendance), Development & Projects (6 categories with cost/dates/status/photos), Government Schemes (PMAY/Swachh/JJM/MGNREGA + eligibility), Contact (office/phone/email/timings/Google Maps/contact form).
3. **Full backend integration per system**:
   - **Citizen Auth**: Register + login (bcrypt), session, profile.
   - **Service Applications**: 7 service types (Birth / Death / Residence / Income / Water Connection / Property Tax), each with its own fields, document upload metadata (stored as base64 or paths), status workflow (Submitted → Under Review → Approved → Rejected → Issued), admin review, downloadable certificate placeholder.
   - **Complaints/Grievance**: Complaint table with photo/doc upload metadata, 4-step status, admin replies, complaint ID lookup.
   - **Gram Sabha**: Meetings table + agenda items + minutes + resolutions + attendance records.
   - **Projects**: Development projects with category (Road/Drainage/StreetLight/Water/Solar/Other), cost, start/end dates, status, photo metadata.
   - **Notices**: Tenders, holidays, water supply, schemes, gram sabha notices — each with optional PDF attachment metadata.
   - **Panchayat Members**: Roles Sarpanch / Deputy Sarpanch / Gram Sevak / Ward Members with photos/contact.
4. **UX & Accessibility features**: Top search bar (searches schemes/notices/services/projects), breadcrumbs navigation, accessibility toolbar (font-size ± / high-contrast / grayscale / reset), notice ticker, toast-style success/error messages, breadcrumb trail, mobile-responsive everything.
5. **Frontend rewrite to dynamic SPA-style**: No hardcoded content — every section (home, about, services, citizen, complaints, notices, gramsabha, projects, schemes, contact) fetches from backend API and renders via DOM templates. Preserve bilingual EN/Marathi end-to-end. Add a multi-page navigation model with hash-routed views.
6. **Admin panel expansion**: Add tabs for Panchayat Members, Service Applications (by type), Complaints/Grievance, Gram Sabha, Development Projects, Tenders/Notices PDFs, and Contact form messages.

## Non-Goals
1. **No production SSL/HTTPS setup in code**. Deploy note: use reverse proxy (Nginx) with Let's Encrypt. Code will still set secure-cookie flags when `NODE_ENV=production` and `X-Forwarded-Proto` to make SSL-ready.
2. **No real SMS/Email/OTP delivery**. Application IDs and complaint IDs are returned in responses and stored; they can be shown on-screen. No email/sms gateway.
3. **No actual PDF generation library**. Download certificate returns a styled HTML page rendered as printable view (window.print) or a placeholder JSON payload with status. A real PDF lib (pdfkit) can be plugged later but is out of scope to keep deps minimal.
4. **No actual file-system storage for uploads in v1**. File uploads are read as base64 data URLs and stored in SQLite blob/text columns with size limits (≤5 MB each, ≤3 per submission). Keeps portability high without requiring filesystem permission setup.
5. **No payment/tax collection gateway**. Property Tax is recorded as an application/payment record (amount, receipt no, status), no real UPI/card integration.
6. **No Supabase/Postgres/MySQL**. Keep single-file SQLite for zero-config local runs.
7. **No map tiles serving**. Village map section: embed iframe Google Maps using the known Lat/Lon (19.25, 74.01) + placeholder village boundary outline SVG fallback.
8. **No multi-role admin permissions (Sarpanch vs Secretary) in v1**. Admin login has one role "admin" with full CRUD; role column exists for future expansion.

## Background & Context
- **Existing codebase** (at project root): `index.html`, `styles.css`, `script.js` — a single-page static design in green theme with 6 sections (Home, Profile, Schemes, Notices, Services, Contacts) + Marathi/EN toggle using `data-en` / `data-mr` attributes.
- **Existing backend** (`server/`): Express + better-sqlite3 + bcryptjs + cookie-session. Tables: `village`, `profile_stats`, `schemes`, `notices`, `services`, `contacts`, `scheme_applications`, `admins`. CRUD for schemes/notices/services/contacts, scheme application submit/track, admin login/logout/me. Auto-seed with real Dumbarwadi data.
- **Seed data (Meri Panchayat — exact values required to remain)**: GP LGD 185937, Village LGD 555263, Area 36.11 sq km, Population 1430 (717 M / 713 F), ST 63, SC 43, 0-6 children 148, HHs 321, JJM 321 connected, 3 drinking water sources, 2 Anganwadi, 2 Primary Schools, 1 PHC, 1 Health Sub-Centre, 1 Children Park, 12 SHGs, 1 Standing Committee, Sarpanch Shital Atul Gore (📞xxxxxx2857, shitalgore2468@gmail.com), Sachiv / Gram Sevak Ashish Prakash Kolhe (📞xxxxxx6401, aashish.kolhe@gmail.com).
- **Design constraints**: Navy/Blue + White color scheme. Existing bilingual model preserved.

## Functional Requirements

### Theme, Layout & Navigation
- **FR-1 (Navy Blue + White Theme)**: Rewrite CSS variables from green-based palette to official navy-blue palette: `--primary: #002868`, `--primary-dark: #001a4a`, `--primary-light: #0b3d91`, `--accent: #004c8c`, `--secondary: #c9a227` (golden), `--success: #138808`, `--danger: #dc2626`, `--warning: #f59e0b`, `--bg-light: #f5f7fb`, `--bg-white: #ffffff`, `--border: #d8e0f0`. Apply to all cards, buttons, nav, footer.
- **FR-2 (Tricolour Strip + Logo Strip)**: Add top `<header>` tricolour band (1.5rem saffron / white / green) with 24-spoke Ashoka Chakra inline SVG centred. Below it a government logo strip row with three blocks: (1) "भारत सरकार / Government of India" (placeholder emblem SVG), (2) "महाराष्ट्र राज्य / Government of Maharashtra", (3) "डुंबरवाडी ग्राम पंचायत / Dumbarwadi Gram Panchayat" + LGD code.
- **FR-3 (Main Nav + Search + Breadcrumbs + Accessibility)**: Main nav with links: Home / About / Online Services / Citizen Portal / Complaints / Notices / Gram Sabha / Projects / Schemes / Contact. Right side: global search input (🔍), accessibility toolbar icon (⚙️ → popover: Font ± / High contrast / Grayscale / Reset), user account menu (Citizen Login / Register / My Applications), admin login entry. Every interior page shows a breadcrumb bar `Home > Section > Subpage` derived from current hash route.
- **FR-4 (Footer)**: Four-column footer: (1) About + Panchayat address & LGD, (2) Quick Links — all nav items + Sitemap, (3) Accessibility links — Accessibility statement / Screen reader info / Skip to content, (4) Contact Us. Below, a government-disclaimer bar ("This is the official website of Dumbarwadi Gram Panchayat. Contents published and managed by Panchayat Office. Site designed for NIC-style common template."), last-updated date from `village.updated_at`, copyright, "Best viewed in Chrome/Edge/Firefox, Resolution 1024×768+".
- **FR-5 (SPA Hash Routing)**: Frontend switches sections using single-page `#/home`, `#/about`, `#/services`, `#/citizen`, `#/complaints`, `#/notices`, `#/gramsabha`, `#/projects`, `#/schemes`, `#/contact`, `#/apply/:serviceType`, `#/track/:id`, `#/complaint/new`, `#/complaint/:id`.
- **FR-6 (Notice Ticker)**: Horizontal scrolling notice ticker fed from `notices` table (top 5 latest), each notice is clickable → opens notice detail modal.
- **FR-7 (Global Search)**: `GET /api/search?q=...` searches across `schemes`, `notices`, `services`, `projects`, `gramsabha` (agenda/minutes) with bilingual text fields. Returns grouped results.
- **FR-8 (Accessibility Toolbar)**: Font size ± (3 steps), high-contrast mode (inverts blue/white), grayscale mode. Preferences stored in `localStorage`. All controls have aria-labels. Focus indicators visible. Skip-to-content link at top.
- **FR-9 (Toast Messages)**: Centralised toast system for success/warning/error messages. Every form submit and fetch error triggers a toast with EN/Marathi text based on current language.

### Home Section
- **FR-10 (Home Page)**: Hero banner with village photo (placeholder generated image URL per spec), "Welcome to Dumbarwadi Gram Panchayat" bilingual heading, subheading with LGD codes + lat/lon. Row of 4 Quick Service tiles (Birth Cert / Apply Online / Track Application / File Complaint), each deep-links to respective route. Below: Latest Notices grid (3 cards), Important Announcements (2 callouts), Hero stats (Population / Area / HHs / Tap Connections).

### About Gram Panchayat + Members + Map
- **FR-11 (Village Info)**: Tabbed About page — Tab 1: Village overview (name, LGD codes, lat/lon, area, river/block info if known, description), Tab 2: Demographics (population, category, age groups, health/edu stats from `profile_stats`), Tab 3: Panchayat Body (list of members from `panchayat_members` table: Sarpanch, Deputy Sarpanch, Gram Sevak, 5+ ward members with photo placeholder, name, role, ward, contact), Tab 4: Village Map — Google Maps embed iframe using lat=19.25 lon=74.01 + boundary SVG.

### Online Services (8 service types)
- **FR-12 (Services Directory)**: Grid of 8 service cards: Birth Certificate, Death Certificate, Residence Certificate, Income Certificate, Water Connection, Property/House Tax, Complaint Registration, Application Status Tracking. Each with icon + EN/MR title + short desc + "Apply Now" / "Track" CTAs.
- **FR-13 (Certificate Application Forms)**: Per-service custom forms with bilingual labels. Shared fields: applicant_fullname_en/mr, father_husband_name, mobile, email, address_en/mr, ward_no, household_no, aadhaar_last4, gender, dob, id_proof_upload (≤5 MB). Per-service extras: Birth → place_of_birth, hospital_name, mother_name, weight_g; Death → date_of_death, place_of_death, cause_of_death, relation_to_applicant; Residence → duration_stay_years, purpose; Income → annual_income_rs, occupation, employer_name; Water Connection → connection_type (domestic/commercial), premise_address, existing_meter_no; Property Tax → property_id, property_type, builtup_area_sqft, tax_amount, assessment_year, payment_mode, receipt_no (optional).
- **FR-14 (Upload)**: File inputs accept JPG/PNG/PDF up to 5 MB each; read as data URLs, attached as metadata array in JSON `documents: [{name, type, size, data}]`. Stored in DB text/blob columns.
- **FR-15 (Status Workflow)**: All services (except Complaint which has its own) share status `submitted → under_review → approved → rejected → issued`. DB `service_applications.status` enum. Admin can change status + write admin_note. Status change timestamps stored in `status_history` JSON column.
- **FR-16 (Application ID)**: Auto-generated human-friendly ID per service type, e.g. `DGP-BIR-2026-000123` (village code prefix + service prefix + year + seq). Sequences tracked per type.
- **FR-17 (Download Certificate)**: When status = issued, citizen sees "Download Certificate" button → opens a printable A4-style HTML certificate view (with panchayat letterhead, name, service type, issue date, authorised signatory placeholder) and triggers `window.print()`.

### Citizen Portal ⭐
- **FR-18 (Citizen Register)**: `POST /api/citizen/register` fields: fullname_en/mr, mobile (unique, 10-digit), email optional, password (min 6 chars, bcrypt-hashed), gender, dob, address_en/mr, ward_no, household_no, aadhaar_last4. Validates mobile uniqueness. Returns `{ citizen_id, ok: true }`.
- **FR-19 (Citizen Login)**: `POST /api/citizen/login` with mobile + password → sets httpOnly signed session cookie. `GET /api/citizen/me` returns profile. `POST /api/citizen/logout` clears session.
- **FR-20 (My Applications)**: Logged-in citizen sees list of all their service applications + complaints grouped by status, with links to detail and download. Backend: `GET /api/citizen/me/applications` and `GET /api/citizen/me/complaints`.
- **FR-21 (Apply while logged in)**: When a citizen applies for a service while logged in, `citizen_id` is attached automatically; profile fields pre-fill the form.

### Complaints / Grievance Redressal
- **FR-22 (Complaint Registration)**: Complaint form: complaint_type_enum (water / electricity / road / drainage / streetlight / sanitation / other), location_ward / landmark, description_en/mr, severity (low/medium/high), photo_upload 1-3 images, complainant_name/mobile (auto-filled if logged in). Auto-generates `complaint_id` like `DGP-GRV-2026-000123`.
- **FR-23 (Complaint Status Workflow)**: 4 steps: `submitted → under_review → in_progress → resolved`. Each step transition has a timestamp + optional note. Admin can add reply/message entries (admin_reply list JSON). Status badge color-coded.
- **FR-24 (Track Complaint)**: Publicly accessible lookup by `complaint_id` + registered mobile. Shows timeline of all status transitions + admin replies.
- **FR-25 (Admin Dashboard Complaints)**: Admin can filter complaints by status/ward/type, assign a responsible officer (text), update status, write replies, attach resolution photos (metadata).

### Notices & Announcements
- **FR-26 (Notice Types)**: Extend `notices` table with `notice_type` enum: `gram_sabha`, `tender`, `scheme`, `water_supply`, `holiday_event`, `general`. Add `pdf_attachment` (data URL or null, ≤10 MB) and `download_filename`.
- **FR-27 (Notices Page)**: Filter tabs (All / Gram Sabha / Tenders / Schemes / Water / Holidays), search box, date range. Each notice shows date badge, title, desc, type tag, PDF download button (if attachment present).

### Gram Sabha
- **FR-28 (Gram Sabha DB tables)**: `gram_sabha_meetings` (id, meeting_date, agenda_published_date, venue_en/mr, chairperson, minutes_text_en/mr, attendance_count, created_at) + `gram_sabha_agenda` (meeting_id FK, serial_no, title_en/mr, description_en/mr, resolution_en/mr, decision_status: discussed/approved/postponed) + `gram_sabha_attendance` (meeting_id FK, member_name, role, ward, present true/false, signature placeholder).
- **FR-29 (Gram Sabha Public Page)**: Upcoming meeting card (next meeting date, venue, agenda list link), past meetings list with date → view agenda / minutes / resolutions / attendance count. Upcoming meeting notice auto-publishes to Notices.

### Development & Projects
- **FR-30 (Projects Table)**: `projects` (id, title_en/mr, desc_en/mr, category: road | drainage | streetlight | water | solar | other, cost_rs, start_date, end_date, status: planning | in_progress | completed | halted, contractor, officer_incharge, photos JSON array of data URLs, ward, progress_pct, created_at).
- **FR-31 (Projects Page)**: Filter by category/status, progress bar per project, timeline of project milestones. Grid view with photos + "View Details" modal. Summary stat cards (total spent, completed count, in-progress, upcoming).

### Government Schemes
- **FR-32 (Schemes Expanded)**: Extend `schemes` table with `eligibility_en/mr`, `application_process_en/mr`, `benefits_en/mr`, `documents_required_en/mr`, `scheme_code`. Default seed: PMAY, Swachh Bharat, Jal Jeevan Mission, MGNREGA, Ayushman Bharat, Mid-Day Meal, PM-KISAN, plus 2-3 more.
- **FR-33 (Scheme Detail Page)**: Full detail view: banner, description, eligibility, benefits, required documents, how-to-apply steps, "Apply Now" buttons linking to the relevant service application flow (if applicable).

### Contact Us
- **FR-34 (Contact Page)**: 4 blocks: (1) Office address, phone, email, timings (from village + contacts tables), (2) Google Maps embed iframe, (3) Contact form (name, email, phone, subject, message_en/mr), (4) Panchayat officials contact grid (Sarpanch, Deputy, Gram Sevak from panchayat_members table).
- **FR-35 (Contact Messages in DB)**: `contact_messages` (id, name, email, phone, subject, message_en/mr, status: new/replied/archived, admin_reply text, created_at). Admin panel shows list + can reply (mark replied).

### Backend API Coverage Summary
- **FR-36 (Auth)**: `/api/citizen/register`, `/api/citizen/login`, `/api/citizen/logout`, `/api/citizen/me`; existing `/api/admin/login`, `/api/admin/logout`, `/api/admin/me`.
- **FR-37 (Public reads)**: `/api/village`, `/api/panchayat-members`, `/api/profile-stats`, `/api/schemes`, `/api/schemes/:id`, `/api/notices` (with type filter), `/api/notices/:id`, `/api/gramsabha/upcoming`, `/api/gramsabha/past`, `/api/gramsabha/:id`, `/api/projects`, `/api/projects/:id`, `/api/projects/summary`, `/api/contacts`, `/api/services`, `/api/search?q=`.
- **FR-38 (Public writes)**: `/api/service-applications` (submit service application), `/api/service-applications/track` (by application_id + mobile), `/api/complaints` (file complaint), `/api/complaints/:id` (view single), `/api/complaints/:id/track` (status + replies), `/api/contact-messages` (send contact form), `/api/citizen/*` above.
- **FR-39 (Admin CRUD gated)**: Full CRUD for village/profile-stats/schemes/notices/contacts/services/panchayat-members, `service-applications` status update + listing, `complaints` status update + reply, `gramsabha` CRUD, `projects` CRUD, `contact-messages` reply + listing, `admins` list (read-only), `pdf/attachment` upload helpers.
- **FR-40 (Error/Success Messages)**: Every endpoint returns consistent JSON shape: success → `{ ok: true, data: ..., message: ... }`; error → `{ ok: false, error: "message", code: "...", details?: [] }` with correct HTTP status (400/401/403/404/409/413/500).

### Bilingual (EN/Marathi) end-to-end
- **FR-41**: Every text field shown in public UI has `_en` + `_mr` DB twin. Admin CRUD forms provide side-by-side inputs. Frontend `setLanguage(lang)` swaps *all* text including dynamic content (reads `record.title_en` vs `record.title_mr`). Body class toggles `lang-en`/`lang-mr`; correct font family (Poppins / Noto Sans Devanagari) and direction applied.

### Secure Login & CSRF
- **FR-42**: Admin + Citizen logins use bcrypt password hashes; session cookies `httpOnly`, `sameSite: 'lax'`, `signed: true`. Public write endpoints (`POST /service-applications`, `/complaints`, `/contact-messages`, `/citizen/*`) pass CSRF nonce via `X-CSRF-TOKEN` header. Existing CSRF middleware is extended to all writes.

## Non-Functional Requirements
- **NFR-1 (Theme Authenticity - Navy/Blue Govt)**: CSS palette exactly matches navy blue tones; tricolour strip, ashoka chakra, logo-strip, footer disclaimer all rendered. Official blue header links, golden accent, white bodies.
- **NFR-2 (Performance)**: First paint <2s locally, each API response <200ms with seeded data (~100 records per table). Intersection observer + skeleton loaders for big grids.
- **NFR-3 (Reliability)**: DB seed idempotent; schema auto-migration via `ALTER TABLE ADD COLUMN` for new columns added to existing tables. No data loss on restart.
- **NFR-4 (Security)**: bcrypt cost ≥10, max file upload size ≤5 MB per file, JSON body limit increased to 8 MB for data-URL uploads (but documented as demo-only), CSRF on all mutating endpoints, XSS-safe textContent (not innerHTML) for user-generated strings.
- **NFR-5 (Accessibility - WCAG AA)**: Text-contrast ratio ≥4.5:1 for navy blue on white, focus rings visible, keyboard-only navigable, skip-to-content link present, all icons have aria-labels, toolbar settings persistent, forms have labels + errors.
- **NFR-6 (Mobile Responsive)**: Breakpoints at 320/480/768/1024px; nav collapses to hamburger menu, grids stack, maps iframes resize 100%.
- **NFR-7 (Code Maintainability)**: Backend routes separated per concern (citizenAuth, citizen, services, complaints, gramsabha, projects, contactMessages, adminAuth, adminCRUD). Frontend has clear view renderers per section, centralized API helper, language helper, toast helper, CSRF helper.
- **NFR-8 (Backwards Compatibility)**: Existing seeded village/profile/schemes/notices/contacts/services/admin rows are preserved and extended; existing admin login still works with demo password.

## Constraints
- **Technical**: Node.js ≥22, Express 4, better-sqlite3, bcryptjs, cookie-session, morgan. No bundlers, no React/Vue — vanilla HTML/CSS/JS. SQLite single file. Uploads stored as data URLs.
- **Business**: Exact Dumbarwadi seeded data (LGD, population, 321 JJM, 1430 people, Sarpanch/Sachiv names, 12 SHGs, etc.) must remain; extended rows add to it. Demo admin password `admin123`, demo citizen: register any mobile number.
- **Visual**: Mandatory navy/blue + white, tricolour, ashoka chakra, government footer disclaimer.

## Dependencies
- Existing deps: `express`, `better-sqlite3`, `bcryptjs`, `cookie-session`, `morgan`. No new required deps for v1.
- Google Fonts: Poppins + Noto Sans Devanagari (existing).
- Google Maps: embed iframe (no API key required for embed with lat/lon fallback).
- Generated banner/photo placeholders via the text_to_image URL endpoint with proper prompts.

## Assumptions
1. Demo admin password `admin123` is acceptable for local demo with a clear "DEMO ONLY" banner on login screen; user can change hash via env.
2. File uploads as data URLs ≤5 MB are acceptable for a demo-scale local system; production would migrate to filesystem/S3.
3. Google Maps embed via public iframe at known LAT/LON is acceptable without a paid API key.
4. Certificate "Download" = printable HTML view (window.print) is acceptable without a PDF library.
5. User accepts hash-route SPA style; no server-side rendering needed.

## Acceptance Criteria

### AC-1: Theme + government look is Navy/Blue + White with all tricolour/logo/header/footer bits
- **Type**: `rubric`
- **Dimension**: Authenticity of GoI portal look and completeness of official chrome
- **Scale**: 1-5
- **Anchors**: 1 = still green, nothing changed; 2 = only palette changed to blue, no header/footer chrome; 3 = blue palette + tricolour strip + blue header present, logo strip partial, no disclaimer footer; 4 = all header pieces (tricolour, ashoka, 3-block logo strip) + full footer (4 cols, disclaimer bar, last-updated), breadcrumbs; 5 = indistinguishable from a real state-Govt NIC portal including accessibility toolbar, proper typography, structured layouts, gold accents, official spacing.
- **Pass Threshold**: >= 4
- **Evidence**: Full-page public home screenshot + about page screenshot in EN state.

### AC-2: All 11 sections render dynamically from backend
- **Type**: `rule`
- **Given**: Server running, fresh DB seeded.
- **When**: Visit `/#/home`, `/#/about`, `/#/services`, `/#/citizen`, `/#/complaints`, `/#/notices`, `/#/gramsabha`, `/#/projects`, `/#/schemes`, `/#/contact`, `/#/apply/birth`, `/#/track/BIR-00001`
- **Then**: Every section header, card title, stat numbers, and official names appear exactly as per seeded DB data. Network tab shows ≥15 distinct `GET /api/*` calls with 200 status; no hardcoded scheme/notice/service names remain in static HTML.
- **Pass Condition**: DOM queries for `.scheme-card`, `.service-card`, `.notice-item`, `.project-card`, `.gramsabha-meeting`, `.complaint-card`, `.panchayat-member` contain seeded content; Home page stats show "1430 / 36.11 / 321 / 100%".
- **Evidence**: Browser network panel screenshot + home-page content snapshot.

### AC-3: Bilingual EN/Marathi toggle works across all dynamic sections
- **Type**: `rule`
- **Given**: Public site loaded in EN default
- **When**: Click मराठी → verify scheme headings, notice titles, service labels, project names, complaint types, gram sabha agenda, member roles switch to MR; click EN → switch back.
- **Then**: Every dynamic text block correctly reads `_mr` and `_en` fields. Body class is `lang-mr` with Devanagari font active. Page title, nav links, breadcrumbs, and toasts all switch. No mixed-language text outside LGD-codes and numbers.
- **Pass Condition**: First scheme heading in MR is Marathi, first service heading in MR is Marathi, About tab "पंचायत सदस्य" visible. Switch back → first scheme is "Pradhan Mantri Awas Yojana" EN.
- **Evidence**: Two side-by-side browser snapshots (EN & MR states) of the Schemes page.

### AC-4: Citizen register → login → apply for Birth Certificate → track status → admin approves → download works
- **Type**: `rule`
- **Given**: Server running
- **When**: (1) Citizen registers new mobile + password via register form. (2) Logs in with those credentials → cookie set. (3) Goes to Apply → Birth Certificate → fills required fields + uploads ≤5 MB JPG as ID proof. (4) Submits → success toast with application ID. (5) Clicks "Track" → status = Submitted. (6) Admin logs in, finds application in Service Applications, changes status to Approved → then Issued. (7) Citizen refreshes "My Applications" → sees status = Issued, clicks Download Certificate → printable view opens.
- **Then**: Each step returns HTTP 2xx/201 with JSON `{ ok: true }`. Rows in `citizens`, `service_applications` tables present with correct data. Admin login cookie is separate from citizen cookie.
- **Pass Condition**: DB `SELECT service_type, status FROM service_applications WHERE mobile = ?` → row with status 'issued'. Download view page contains `window.print()` call.
- **Evidence**: Terminal curl snippets for register/login/apply, admin approve API call output, citizen track JSON, DB query output.

### AC-5: Complaint 4-step status workflow with admin replies + public lookup
- **Type**: `rule`
- **Given**: Server running
- **When**: (1) Citizen files complaint type "water" ward "3" severity medium with photo. (2) Complaint ID returned. (3) Public complaint lookup page using ID + mobile shows timeline with "Submitted" step. (4) Admin transitions status → Under Review → In Progress (with note "Team dispatched") → Resolved (with note and resolution photo metadata). (5) Lookup page refreshes → 4-step timeline visible with step 4 "Resolved" complete, replies visible.
- **Then**: Status enum row counts increment correctly. `complaints.status_history` array has 4 entries with timestamps. Admin replies list JSON is non-empty.
- **Pass Condition**: Timeline HTML shows 4 nodes; final node green. `SELECT COUNT(*) FROM complaints WHERE type='water'` = 1.
- **Evidence**: Complaint detail page screenshot + timeline visible + admin replies panel.

### AC-6: Notices expanded with types + PDF attachments; Gram Sabha + Projects + Schemes expanded pages fully functional
- **Type**: `rule`
- **Given**: DB seeded with ≥4 notices, ≥1 gram sabha meeting, ≥6 projects, ≥8 schemes
- **When**: Navigate to Notices → Tenders tab filters only tenders. Click PDF download button on a notice → browser initiates data URL download. Gram Sabha page: "Next Meeting" card with date, past meetings with agenda/minutes links, attendee count. Projects page: Filter by "road", see progress bar. Schemes page: Open PMAY → eligibility section visible, Eligibility list + Apply buttons.
- **Then**: Each of Notices (type filter + PDF), Gram Sabha (upcoming + agenda/minutes), Projects (category filter + progress pct), Schemes (eligibility + benefits) pages render populated content.
- **Pass Condition**: Notices tab click changes URL hash and filters list (network params include `type=tender`). Projects page for category "road" returns 1+ rows. Gram Sabha upcoming card matches DB max date record.
- **Evidence**: Screenshot of each of the 4 pages (Notices, Gram Sabha, Projects, Schemes detail).

### AC-7: Global search + breadcrumbs + accessibility toolbar functional & persisted
- **Type**: `rule`
- **Given**: Public site loaded
- **When**: (1) Type "आवास" / "Awas" in top search bar. (2) Click scheme result → jumps to scheme detail page. (3) Breadcrumbs read: "Home > Schemes > PM Awas Yojana". (4) Open Accessibility toolbar → Font+ twice → High Contrast → Grayscale. (5) Reload page.
- **Then**: Search results API returns matching records from schemes/notices/projects. Breadcrumb matches the route hierarchy. Accessibility settings: body classes for large-font/high-contrast/grayscale remain active after reload (localStorage).
- **Pass Condition**: localStorage keys `gp_font_size` / `gp_highcontrast` / `gp_grayscale` have non-default values; breadcrumb DOM count ≥ 3 items; search results ≥ 1 row for "awas".
- **Evidence**: Browser DevTools storage screenshot + accessibility state DOM class list + search result popover.

### AC-8: Contact page renders full details + contact form saves to DB + admin can reply; About page has Members tab + Map iframe
- **Type**: `rule`
- **Given**: Server running
- **When**: Open Contact page → Office info rendered, Google Maps embed iframe loads. Submit contact form "Hi my name is Test" → success toast. Admin panel → Contact Messages tab → open message, write reply, save.
- **Then**: Panchayat office address + Sarpanch/Gram Sevak contacts render. DB `contact_messages` row exists; after admin reply, status = 'replied' and admin_reply column populated. About → Members tab shows ≥ 4 rows (Sarpanch / Deputy / Gram Sevak / 1 member); Map tab contains iframe with coordinates 19.25,74.01.
- **Pass Condition**: SELECT COUNT(*) FROM contact_messages = 1 (after submit). About Members grid count ≥ 4. Map iframe src contains "19.25" and "74.01".
- **Evidence**: Contact page screenshot + admin contact messages screenshot + About Members/Map tabs screenshot.

### AC-9: Secure sessions, CSRF, bcrypt hashes, consistent error shapes
- **Type**: `rule`
- **Given**: Server running with default config
- **When**: (1) Try `POST /api/schemes` without login → HTTP 401. (2) Try `POST /api/complaints` without CSRF header → HTTP 403, INVALID_CSRF. (3) Login with wrong admin password → HTTP 401, INVALID_PASSWORD. (4) Submit birth application with mobile=123 (not 10 digits) → HTTP 400, BAD_MOBILE. (5) DB citizens row password_hash starts `$2a$` / `$2b$`. (6) Admin cookie has HttpOnly; SameSite=Lax.
- **Then**: All 6 checks return the expected HTTP status + JSON error shape with `{ ok: false, error, code }`. Password columns store bcrypt only.
- **Pass Condition**: 6 curl checks all match.
- **Evidence**: Curl outputs for each of 6 cases, sqlite query of password column, copy-paste of Set-Cookie header attributes.

### AC-10: Idempotent seed + backwards compatibility (existing data preserved)
- **Type**: `rule`
- **Given**: Existing DB from older version (with only original 8 tables).
- **When**: Stop server; run `npm run seed` (force off / idempotent); restart.
- **Then**: New tables (`citizens`, `service_applications`, `complaints`, `gram_sabha_meetings`, `gram_sabha_agenda`, `gram_sabha_attendance`, `projects`, `panchayat_members`, `contact_messages`) are created and seeded with demo rows. Original 6 schemes / 4 notices / 6 services / 1 admin row IDs and content remain identical; village table still has Dumbarwadi 185937 with pop 1430.
- **Pass Condition**: count(schemes) ≥ 8, count(services) ≥ 8, count(notices) ≥ 6, count(projects) ≥ 6, count(panchayat_members) ≥ 4. village.total_population = 1430, admins username 'admin' present.
- **Evidence**: npm run seed terminal counts output, sqlite counts query.

## Open Questions
- [ ] Citizen upload limit per service: 3 files × 5 MB acceptable or reduce to 3×2 MB? Assumption 3×5 MB holds.
- [ ] Property Tax service: should "payment" status auto mark as paid when submitted (receipt_no provided) or always start Submitted? Assumption: always start Submitted, admin marks Paid/Approved.
- [ ] Gram Sabha attendance: do we need member photo/signature upload (stored as data URL)? Assumption: v1 stores name/role/ward/present boolean only.
