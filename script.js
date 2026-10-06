document.addEventListener('DOMContentLoaded', function () {
    const API_BASE = '/api';
    let csrfToken = null;
    let currentScheme = null;
    let observer = null;

    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    hamburger.addEventListener('click', function () {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function () {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#' || targetId.startsWith('#/')) return;
            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    const scrollTopBtn = document.getElementById('scrollTopBtn');
    window.addEventListener('scroll', function () {
        if (window.pageYOffset > 400) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    scrollTopBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    function observeNew() {
        const els = document.querySelectorAll(
            '.scheme-card, .service-card, .contact-card, .notice-item, .stat-card, .emergency-item, .profile-category, .profile-stat'
        );
        els.forEach((el, index) => {
            if (el.style.opacity !== '') return;
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `opacity 0.6s ease ${index * 0.04}s, transform 0.6s ease ${index * 0.04}s`;
            observer.observe(el);
        });
    }

    const header = document.querySelector('.header');
    window.addEventListener('scroll', function () {
        if (window.pageYOffset > 20) {
            header.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.08)';
        } else {
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.05)';
        }
    });

    function setLanguage(lang) {
        const translatable = document.querySelectorAll('[data-en][data-mr]');
        translatable.forEach(el => {
            const text = el.getAttribute('data-' + lang);
            if (text !== null) {
                if (el.tagName === 'TITLE') {
                    document.title = text;
                } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    if (el.tagName === 'INPUT' && el.type !== 'submit' && el.type !== 'button') {
                        el.setAttribute('placeholder', text);
                    } else {
                        el.value = text;
                    }
                } else {
                    el.textContent = text;
                }
            }
        });
        const ph = document.querySelectorAll('[data-en-placeholder][data-mr-placeholder]');
        ph.forEach(el => {
            const attr = lang === 'en' ? 'data-en-placeholder' : 'data-mr-placeholder';
            const txt = el.getAttribute(attr);
            if (txt !== null) el.setAttribute('placeholder', txt);
        });
        document.body.setAttribute('data-current-lang', lang);
        document.body.classList.remove('lang-en', 'lang-mr');
        document.body.classList.add('lang-' + lang);
        document.documentElement.setAttribute('lang', lang);
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const active = btn.getAttribute('data-lang') === lang;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', String(active));
        });
        try { localStorage.setItem('dumbarwadi-lang', lang); } catch (e) {}
    }

    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            setLanguage(this.getAttribute('data-lang'));
        });
    });

    let savedLang = null;
    try { savedLang = localStorage.getItem('dumbarwadi-lang'); } catch (e) {}
    const initialLang = savedLang === 'mr' ? 'mr' : 'en';
    setLanguage(initialLang);

    // ========= API helpers =========
    async function fetchCsrf() {
        try {
            const r = await fetch(`${API_BASE}/csrf-token`);
            const d = await r.json();
            csrfToken = d.token || d.csrfToken || null;
        } catch (e) { csrfToken = null; }
    }

    async function apiGet(endpoint) {
        try {
            const r = await fetch(`${API_BASE}${endpoint}`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return await r.json();
        } catch (e) {
            console.warn('API error:', endpoint, e);
            return null;
        }
    }

    async function apiPost(endpoint, body) {
        const headers = { 'Content-Type': 'application/json' };
        if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
        const r = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body || {}),
            credentials: 'same-origin'
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
            const err = new Error(d.error || `HTTP ${r.status}`);
            err.code = d.code; err.data = d;
            throw err;
        }
        return d;
    }

    function loadingHtml(msgEn, msgMr) {
        const cur = document.body.getAttribute('data-current-lang') || 'en';
        const msg = cur === 'mr' ? msgMr : msgEn;
        return `<div class="loading-indicator">${msg}</div>`;
    }

    function bil(el, enKey, mrKey, enVal, mrVal) {
        if (enVal != null) el.setAttribute('data-en', String(enVal));
        if (mrVal != null) el.setAttribute('data-mr', String(mrVal));
        const cur = document.body.getAttribute('data-current-lang') || 'en';
        const v = cur === 'mr' && mrVal != null ? mrVal : enVal;
        el.textContent = v != null ? String(v) : '';
    }

    // ========= Renderers =========
    function renderHeroStats(village) {
        const box = document.getElementById('heroStats');
        if (!box || !village) return;
        const population = village.total_population || 1430;
        const area = village.area_sqkm || 36.11;
        const hhs = village.total_hhs || 321;
        const stats = [
            { num: population, en: 'Total Population', mr: 'एकूण जनसंख्या' },
            { num: area, en: 'Area (sq km)', mr: 'क्षेत्रफळ (चौरस किमी)' },
            { num: hhs, en: 'Tap Water HHs', mr: 'नळ पाणी घरे' },
            { num: 12, en: 'SHG Groups', mr: 'स्वयंसहाय्य गट' }
        ];
        box.innerHTML = stats.map(s => {
            const num = document.createElement('div');
            const lab = document.createElement('div');
            num.className = 'stat-number'; num.textContent = s.num;
            lab.className = 'stat-label'; bil(lab, null, null, s.en, s.mr);
            const card = document.createElement('div');
            card.className = 'stat-card'; card.appendChild(num); card.appendChild(lab);
            return card.outerHTML;
        }).join('');
        observeNew();
    }

    function renderProfileGrid(stats) {
        const box = document.getElementById('profileGrid');
        if (!box) return;
        if (!stats || !stats.length) { box.innerHTML = loadingHtml('Loading profile…', 'प्रोफाइल लोड होत आहे…'); return; }
        box.innerHTML = stats.map(cat => {
            const isJJM = cat.special === 'jjm';
            const fullW = cat.full_width ? ' full-width' : '';
            const h = document.createElement('h3');
            h.className = 'profile-cat-title';
            bil(h, null, null,
                `${cat.icon || ''} ${cat.heading_en || ''}`,
                `${cat.icon || ''} ${cat.heading_mr || cat.heading_en || ''}`);

            let inner = '';
            if (isJJM) {
                const hhsVal = parseInt(cat.stat1_value || '0', 10);
                const total = 321;
                const pct = Math.min(100, Math.round((hhsVal / total) * 100));
                const big = document.createElement('div');
                big.className = 'jj-big'; big.textContent = cat.stat1_value || '0';
                const lab = document.createElement('div');
                lab.className = 'jj-label';
                bil(lab, null, null, cat.stat1_label_en, cat.stat1_label_mr);
                const barSpan = document.createElement('span');
                bil(barSpan, null, null,
                    `${cat.stat2_value || ''} ${cat.stat2_label_en || ''}`.trim(),
                    `${cat.stat2_value || ''} ${cat.stat2_label_mr || cat.stat2_label_en || ''}`.trim());
                const fill = document.createElement('div');
                fill.className = 'jj-bar-fill'; fill.style.width = `${pct}%`; fill.appendChild(barSpan);
                const bar = document.createElement('div');
                bar.className = 'jj-bar'; bar.appendChild(fill);
                const barWrap = document.createElement('div');
                barWrap.className = 'jj-bar-wrap'; barWrap.appendChild(bar);
                const jst = document.createElement('div');
                jst.className = 'jj-stat'; jst.appendChild(big); jst.appendChild(lab);
                const jc = document.createElement('div');
                jc.className = 'jj-container'; jc.appendChild(jst); jc.appendChild(barWrap);
                inner = jc.outerHTML;
            } else {
                const items = [
                    { val: cat.stat1_value, en: cat.stat1_label_en, mr: cat.stat1_label_mr, extra: (cat.category_key === 'population' && cat.stat1_label_en === 'Male') ? ' male' : (cat.category_key === 'population' && cat.stat1_label_en === 'Female') ? ' female' : '' },
                    { val: cat.stat2_value, en: cat.stat2_label_mr ? cat.stat2_label_en : null, mr: cat.stat2_label_mr },
                    { val: cat.stat3_value, en: cat.stat3_label_mr ? cat.stat3_label_en : null, mr: cat.stat3_label_mr }
                ];
                const statsHtml = items.filter(i => i.val != null && i.val !== '').map(i => {
                    const n = document.createElement('div');
                    n.className = 'p-stat-num' + (i.extra || '');
                    n.textContent = i.val;
                    const l = document.createElement('div');
                    l.className = 'p-stat-label';
                    if (i.en) bil(l, null, null, i.en, i.mr);
                    else l.textContent = i.mr || '';
                    const ps = document.createElement('div');
                    ps.className = 'profile-stat'; ps.appendChild(n); ps.appendChild(l);
                    return ps.outerHTML;
                }).join('');
                const pb = document.createElement('div');
                pb.className = 'profile-stats'; pb.innerHTML = statsHtml;
                inner = pb.outerHTML;
            }
            const pc = document.createElement('div');
            pc.className = 'profile-category' + fullW;
            pc.appendChild(h); pc.insertAdjacentHTML('beforeend', inner);
            return pc.outerHTML;
        }).join('');
        observeNew();
    }

    function renderSchemesGrid(schemes) {
        const box = document.getElementById('schemesGrid');
        if (!box) return;
        if (!schemes || !schemes.length) { box.innerHTML = loadingHtml('Loading schemes…', 'योजना लोड होत आहेत…'); return; }
        box.innerHTML = schemes.map(s => {
            const icon = document.createElement('div');
            icon.className = 'scheme-icon'; icon.textContent = s.icon || '📜';
            const title = document.createElement('h3');
            title.className = 'scheme-title';
            bil(title, null, null, s.title_en, s.title_mr);
            const desc = document.createElement('p');
            desc.className = 'scheme-desc';
            bil(desc, null, null, s.desc_en, s.desc_mr);
            const tags = ((s.tags_en || '').split(',')[0] || '').trim();
            const tagsMr = ((s.tags_mr || '').split(',')[0] || '').trim();
            const tag = document.createElement('span');
            tag.className = 'scheme-tag';
            if (tagsMr) bil(tag, null, null, tags, tagsMr);
            else tag.textContent = tags;
            const btn = document.createElement('button');
            btn.className = 'btn-small';
            bil(btn, null, null, 'Know More', 'अधिक जाणून घ्या');
            btn.dataset.schemeId = s.id;
            const meta = document.createElement('div');
            meta.className = 'scheme-meta'; meta.appendChild(tag); meta.appendChild(btn);
            const card = document.createElement('div');
            card.className = 'scheme-card';
            if (s.accent) card.style.borderTopColor = s.accent;
            card.appendChild(icon); card.appendChild(title); card.appendChild(desc); card.appendChild(meta);
            return card.outerHTML;
        }).join('');
        box.querySelectorAll('.btn-small').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = Number(this.dataset.schemeId);
                const sch = schemes.find(x => x.id === id);
                if (sch) openSchemeModal(sch);
            });
        });
        observeNew();
    }

    function renderNotices(notices) {
        const box = document.getElementById('noticesList');
        if (!box) return;
        if (!notices || !notices.length) { box.innerHTML = loadingHtml('Loading notices…', 'सूचना लोड होत आहेत…'); return; }
        const top4 = notices.slice(0, 4);
        box.innerHTML = top4.map(n => {
            const dDay = document.createElement('div');
            dDay.className = 'date-day'; dDay.textContent = n.day || '';
            const dMo = document.createElement('div');
            dMo.className = 'date-month';
            bil(dMo, null, null, n.month_en, n.month_mr);
            const nd = document.createElement('div');
            nd.className = 'notice-date'; nd.appendChild(dDay); nd.appendChild(dMo);
            const t = document.createElement('h4');
            bil(t, null, null, n.title_en, n.title_mr);
            const p = document.createElement('p');
            bil(p, null, null, n.desc_en, n.desc_mr);
            const b = document.createElement('span');
            b.className = 'notice-badge';
            if (n.badge_color) b.style.background = n.badge_color;
            bil(b, null, null, n.badge_en, n.badge_mr);
            const nc = document.createElement('div');
            nc.className = 'notice-content'; nc.appendChild(t); nc.appendChild(p); nc.appendChild(b);
            const ni = document.createElement('div');
            ni.className = 'notice-item'; ni.appendChild(nd); ni.appendChild(nc);
            return ni.outerHTML;
        }).join('');
        observeNew();
    }

    function renderTicker(notices, schemes) {
        const box = document.getElementById('tickerContent');
        if (!box) return;
        const items = [];
        if (notices && notices.length) {
            notices.slice(0, 5).forEach(n => {
                const en = n.title_en;
                const mr = n.title_mr || n.title_en;
                items.push({ en, mr });
            });
        }
        if (schemes && schemes.length) {
            schemes.slice(0, 2).forEach(s => {
                items.push({
                    en: `New Applications Open — ${s.title_en}`,
                    mr: `नवीन अर्ज सुरू — ${s.title_mr || s.title_en}`
                });
            });
        }
        if (!items.length) return;
        const sep = '<span class="ticker-item">•</span>';
        const html = items.map(it => {
            const s = document.createElement('span');
            s.className = 'ticker-item';
            bil(s, null, null, it.en, it.mr);
            return s.outerHTML;
        }).join(sep);
        box.innerHTML = html + sep + html;
    }

    function renderServices(services) {
        const box = document.getElementById('servicesGrid');
        if (!box) return;
        if (!services || !services.length) { box.innerHTML = loadingHtml('Loading services…', 'सेवा लोड होत आहेत…'); return; }
        box.innerHTML = services.map(s => {
            const ic = document.createElement('div');
            ic.className = 'service-icon'; ic.textContent = s.icon || '🏢';
            const t = document.createElement('h3');
            bil(t, null, null, s.title_en, s.title_mr);
            const d = document.createElement('p');
            const enClean = (s.desc_en || '').replace(/\n/g, '<br>');
            const mrClean = (s.desc_mr || s.desc_en || '').replace(/\n/g, '<br>');
            d.setAttribute('data-en', s.desc_en || '');
            d.setAttribute('data-mr', s.desc_mr || s.desc_en || '');
            const cur = document.body.getAttribute('data-current-lang') || 'en';
            d.innerHTML = cur === 'mr' ? mrClean : enClean;
            const c = document.createElement('div');
            c.className = 'service-card';
            c.appendChild(ic); c.appendChild(t); c.appendChild(d);
            return c.outerHTML;
        }).join('');
        observeNew();
    }

    function renderContacts(contacts, members, village) {
        const box = document.getElementById('contactsGrid');
        if (!box) return;
        const cards = [];
        if (members && members.length) {
            members.slice(0, 3).forEach(m => {
                cards.push({
                    avatar: '👤',
                    name: m.name_en,
                    role_en: m.role_en,
                    role_mr: m.role_mr,
                    info: [
                        { icon: '📞', text: m.mobile || '-' },
                        m.email ? { icon: '✉️', text: m.email } : null
                    ].filter(Boolean),
                    cls: 'official'
                });
            });
        }
        if (village) {
            cards.push({
                avatar: '🏛️',
                name_en: 'Panchayat Office',
                name_mr: 'पंचायत कार्यालय',
                role_en: `LGD ${village.lgd_gp || '-'}`,
                role_mr: `LGD ${village.lgd_gp || '-'}`,
                info: [
                    { icon: '📍', text: `Lat ${village.lat}, Long ${village.lon}` },
                    { icon: '🕒', text_en: village.office_timings_en, text_mr: village.office_timings_mr, is_bilingual: true }
                ],
                cls: 'official'
            });
        }
        if (!cards.length) { box.innerHTML = loadingHtml('Loading contacts…', 'संपर्क लोड होत आहेत…'); return; }
        box.innerHTML = cards.map(c => {
            const av = document.createElement('div');
            av.className = 'contact-avatar'; av.textContent = c.avatar || '👤';
            const nm = document.createElement('h3');
            nm.className = 'contact-name';
            if (c.name_mr) bil(nm, null, null, c.name, c.name_mr);
            else nm.textContent = c.name;
            const rl = document.createElement('p');
            rl.className = 'contact-role';
            bil(rl, null, null, c.role_en, c.role_mr);
            const infoHtml = (c.info || []).map(i => {
                const p = document.createElement('p');
                p.className = 'contact-info';
                if (i.is_bilingual) {
                    const en = `${i.icon} ${i.text_en || i.text}`;
                    const mr = `${i.icon} ${i.text_mr || i.text}`;
                    bil(p, null, null, en, mr);
                } else {
                    p.textContent = `${i.icon} ${i.text}`;
                }
                return p.outerHTML;
            }).join('');
            const cc = document.createElement('div');
            cc.className = 'contact-card ' + (c.cls || '');
            cc.appendChild(av); cc.appendChild(nm); cc.appendChild(rl);
            cc.insertAdjacentHTML('beforeend', infoHtml);
            return cc.outerHTML;
        }).join('');
        observeNew();
    }

    function renderEmergency(contacts) {
        const box = document.getElementById('emergencyGrid');
        if (!box) return;
        const em = (contacts || []).filter(c => c.is_emergency === 1 || c.is_emergency === true);
        const defaults = [
            { icon: '🚓', en: 'Police', mr: 'पोलीस', phone: '100' },
            { icon: '🚑', en: 'Ambulance', mr: 'रुग्णवाहिका', phone: '108' },
            { icon: '🚒', en: 'Fire Brigade', mr: 'अग्निशमन', phone: '101' },
            { icon: '💡', en: 'Electricity Complaint', mr: 'वीज तक्रार', phone: '1912' }
        ];
        const items = em.length ? em.map(c => ({
            icon: /🚓|🚑|🚒|🏥|💡|💧/.test(c.extra_value || c.mobile || '') ? (c.extra_value || '') : '📞',
            en: c.role_en, mr: c.role_mr,
            phone: c.mobile || c.extra_value
        })) : defaults;
        if (!items.length) { box.innerHTML = ''; return; }
        box.innerHTML = items.map(i => {
            const ic = document.createElement('span');
            ic.className = 'emergency-icon'; ic.textContent = i.icon || '📞';
            const st = document.createElement('strong');
            bil(st, null, null, i.en, i.mr);
            const ph = document.createElement('p');
            ph.className = 'emergency-phone'; ph.textContent = i.phone || '';
            const inner = document.createElement('div');
            inner.appendChild(st); inner.appendChild(ph);
            const el = document.createElement('div');
            el.className = 'emergency-item'; el.appendChild(ic); el.appendChild(inner);
            return el.outerHTML;
        }).join('');
        observeNew();
    }

    // ========= Modal =========
    function openSchemeModal(scheme) {
        currentScheme = scheme;
        const modal = document.getElementById('schemeModal');
        const title = document.getElementById('modalTitle');
        const sub = document.getElementById('modalSubtitle');
        const cur = document.body.getAttribute('data-current-lang') || 'en';
        title.setAttribute('data-en', scheme.title_en);
        title.setAttribute('data-mr', scheme.title_mr || scheme.title_en);
        title.textContent = cur === 'mr' ? (scheme.title_mr || scheme.title_en) : scheme.title_en;
        const en = `Apply for ${scheme.title_en} (${scheme.scheme_code ? scheme.scheme_code + ' • ' : ''}Dumbarwadi GP LGD 185937)`;
        const mr = `${scheme.title_mr || scheme.title_en} साठी अर्ज (${scheme.scheme_code ? scheme.scheme_code + ' • ' : ''}LGD 185937)`;
        sub.setAttribute('data-en', en); sub.setAttribute('data-mr', mr);
        sub.textContent = cur === 'mr' ? mr : en;
        document.getElementById('schemeForm').style.display = '';
        document.getElementById('schemeSuccess').style.display = 'none';
        document.getElementById('schemeForm').reset();
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        const modal = document.getElementById('schemeModal');
        if (modal) {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
        currentScheme = null;
    }

    document.querySelectorAll('[data-close-modal]').forEach(el => {
        el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeModal();
    });

    document.getElementById('schemeForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const fd = new FormData(this);
        const body = Object.fromEntries(fd.entries());
        if (currentScheme) body.scheme_id = currentScheme.id;
        try {
            if (!csrfToken) await fetchCsrf();
            const res = await apiPost('/scheme-applications', body);
            document.getElementById('appId').textContent = res.id || '-';
            document.getElementById('appStatus').textContent = res.status || 'pending';
            this.style.display = 'none';
            document.getElementById('schemeSuccess').style.display = '';
        } catch (err) {
            const cur = document.body.getAttribute('data-current-lang') || 'en';
            const msg = cur === 'mr' ? 'त्रुटी: ' + (err.message || 'अर्ज पाठवताना समस्या') : 'Error: ' + (err.message || 'Failed to submit application');
            alert(msg);
        }
    });

    // ========= Bootstrap: fetch & render =========
    async function bootstrap() {
        await fetchCsrf();
        const [villageData, profileData, schemesData, noticesData, servicesData, contactsData, membersData] = await Promise.all([
            apiGet('/village'),
            apiGet('/profile-stats'),
            apiGet('/schemes'),
            apiGet('/notices'),
            apiGet('/services'),
            apiGet('/contacts'),
            apiGet('/panchayat-members')
        ]);
        const village = villageData ? villageData.data : null;
        const profile = profileData ? profileData.data : null;
        const schemes = schemesData ? schemesData.data : null;
        const notices = noticesData ? noticesData.data : null;
        const services = servicesData ? servicesData.data : null;
        const contacts = contactsData ? contactsData.data : null;
        const members = membersData ? membersData.data : null;
        if (village) renderHeroStats(village);
        if (profile) renderProfileGrid(profile);
        if (schemes) renderSchemesGrid(schemes);
        if (notices) renderNotices(notices);
        if (services) renderServices(services);
        renderContacts(contacts, members, village);
        renderEmergency(contacts);
        if (notices || schemes) renderTicker(notices, schemes);
        observeNew();
        setLanguage(document.body.getAttribute('data-current-lang') || 'en');
    }

    bootstrap();
});
