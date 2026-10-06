(function () {
  'use strict';

  const state = {
    currentLang: 'en',
    citizen: null,
    csrfToken: null,
    village: null,
    searchDebounceTimer: null
  };

  const routeTable = new Map();
  let currentHash = '';

  async function ensureCsrf() {
    if (state.csrfToken) return state.csrfToken;
    try {
      const res = await fetch('/api/csrf-token', { credentials: 'same-origin' });
      const data = await res.json();
      if (data && data.csrfToken) {
        state.csrfToken = data.csrfToken;
      }
      return state.csrfToken;
    } catch (e) {
      return null;
    }
  }

  async function api(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};
    headers['Accept'] = 'application/json';
    headers['Accept-Language'] = state.currentLang === 'mr' ? 'mr-IN, mr' : 'en-IN, en';

    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      await ensureCsrf();
      if (state.csrfToken) {
        headers['X-CSRF-Token'] = state.csrfToken;
      }
    }

    let errorMsgEn = 'Something went wrong. Please try again.';
    let errorMsgMr = 'काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.';

    try {
      const res = await fetch(path, {
        ...options,
        method,
        headers,
        credentials: 'same-origin'
      });

      let data = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try { data = await res.json(); } catch (_) { data = null; }
      }

      if (res.ok) {
        return { ok: true, data: data || null, error: null, code: res.status };
      }

      let errMsg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
      showToast('error', errMsg, errMsg);
      return { ok: false, data: null, error: errMsg, code: res.status };
    } catch (err) {
      const msg = err && err.message ? err.message : errorMsgEn;
      showToast('error', msg, errorMsgMr);
      return { ok: false, data: null, error: msg, code: 0 };
    }
  }

  function t(record, field) {
    if (!record) return '';
    const mrVal = record[field + '_mr'];
    const enVal = record[field + '_en'];
    if (state.currentLang === 'mr' && (mrVal !== undefined && mrVal !== null && mrVal !== '')) {
      return mrVal;
    }
    if (enVal !== undefined && enVal !== null) return enVal;
    if (mrVal !== undefined && mrVal !== null) return mrVal;
    return '';
  }

  function labelSet(en, mr) {
    return state.currentLang === 'mr' ? (mr || en || '') : (en || mr || '');
  }

  function showToast(type, msgEn, msgMr = null, timeoutMs = 5000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const message = state.currentLang === 'mr' && msgMr ? msgMr : (msgEn || msgMr || '');

    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'success');
    const iconMap = { success: '✓', error: '✕', warning: '⚠' };
    const icon = document.createElement('span');
    icon.textContent = iconMap[type] || 'ℹ';
    icon.style.fontWeight = '700';
    icon.style.flexShrink = '0';
    const msg = document.createElement('span');
    msg.textContent = message;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    });
    toast.appendChild(icon);
    toast.appendChild(msg);
    toast.appendChild(closeBtn);
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('active'));

    if (timeoutMs > 0) {
      setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 300);
      }, timeoutMs);
    }
  }

  function applyLangToElement(el, lang) {
    const enText = el.getAttribute('data-en');
    const mrText = el.getAttribute('data-mr');
    if (enText !== null || mrText !== null) {
      const text = lang === 'mr' ? (mrText ?? enText ?? '') : (enText ?? mrText ?? '');
      if (el.tagName === 'TITLE') {
        document.title = text;
      } else {
        el.textContent = text;
      }
    }

    const enPlaceholder = el.getAttribute('data-en-placeholder');
    const mrPlaceholder = el.getAttribute('data-mr-placeholder');
    if (enPlaceholder !== null || mrPlaceholder !== null) {
      const placeholder = lang === 'mr' ? (mrPlaceholder ?? enPlaceholder ?? '') : (enPlaceholder ?? mrPlaceholder ?? '');
      el.setAttribute('placeholder', placeholder);
    }

    for (const child of el.children) {
      applyLangToElement(child, lang);
    }
  }

  function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'mr') lang = 'en';
    state.currentLang = lang;

    applyLangToElement(document.documentElement, lang);

    document.documentElement.setAttribute('lang', lang === 'mr' ? 'mr' : 'en');
    document.body.setAttribute('data-current-lang', lang);
    document.body.classList.remove('lang-en', 'lang-mr');
    document.body.classList.add('lang-' + lang);

    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach(btn => {
      const isActive = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    try {
      localStorage.setItem('dumbarwadi-lang', lang);
    } catch (e) { }

    if (currentHash) {
      route(currentHash, true);
    }
  }

  function bindLangSwitcher() {
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        setLanguage(lang);
      });
    });
  }

  let a11yPanelEl = null;

  function createA11yPanel() {
    const toolbar = document.querySelector('.a11y-toolbar');
    if (!toolbar || a11yPanelEl) return;

    a11yPanelEl = document.createElement('div');
    a11yPanelEl.className = 'a11y-panel';
    a11yPanelEl.setAttribute('role', 'dialog');
    a11yPanelEl.setAttribute('aria-label', 'Accessibility options');
    a11yPanelEl.innerHTML = `
      <h5 data-en="Font Size" data-mr="फॉन्ट आकार">Font Size</h5>
      <div class="a11y-font-group">
        <button class="a11y-font-btn" data-font="0" aria-label="Small font">A-</button>
        <button class="a11y-font-btn active" data-font="1" aria-label="Default font">A</button>
        <button class="a11y-font-btn" data-font="2" aria-label="Large font">A+</button>
      </div>
      <h5 data-en="Options" data-mr="पर्याय">Options</h5>
      <div class="a11y-toggle-group">
        <button class="a11y-toggle-btn" data-toggle="hc">
          <span data-en="High Contrast" data-mr="उच्च कॉन्ट्रास्ट">High Contrast</span>: <span class="val" data-en="Off" data-mr="बंद">Off</span>
        </button>
        <button class="a11y-toggle-btn" data-toggle="gs">
          <span data-en="Grayscale" data-mr="ग्रेस्केल">Grayscale</span>: <span class="val" data-en="Off" data-mr="बंद">Off</span>
        </button>
      </div>
      <button class="a11y-reset-btn" data-action="reset" data-en="Reset" data-mr="रीसेट">Reset</button>
    `;
    toolbar.appendChild(a11yPanelEl);

    a11yPanelEl.querySelectorAll('.a11y-font-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const level = parseInt(btn.getAttribute('data-font'), 10);
        applyFontLevel(level);
        try { localStorage.setItem('gp_font', String(level)); } catch (e) { }
        updateA11yActiveStates();
      });
    });

    a11yPanelEl.querySelectorAll('.a11y-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const toggle = btn.getAttribute('data-toggle');
        if (toggle === 'hc') {
          const isOn = document.body.classList.toggle('high-contrast');
          try { localStorage.setItem('gp_hc', isOn ? '1' : '0'); } catch (e) { }
        } else if (toggle === 'gs') {
          const isOn = document.body.classList.toggle('grayscale');
          try { localStorage.setItem('gp_gs', isOn ? '1' : '0'); } catch (e) { }
        }
        updateA11yActiveStates();
      });
    });

    const resetBtn = a11yPanelEl.querySelector('[data-action="reset"]');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        document.body.classList.remove('font-lg', 'font-xl', 'high-contrast', 'grayscale');
        try {
          localStorage.removeItem('gp_font');
          localStorage.removeItem('gp_hc');
          localStorage.removeItem('gp_gs');
        } catch (e) { }
        updateA11yActiveStates();
      });
    }
  }

  function applyFontLevel(level) {
    document.body.classList.remove('font-lg', 'font-xl');
    if (level === 1) return;
    if (level === 0) return;
    if (level === 2) document.body.classList.add('font-lg');
    if (level >= 2) document.body.classList.add(level === 2 ? 'font-lg' : 'font-xl');
    if (level >= 3) document.body.classList.add('font-xl');
  }

  function updateA11yActiveStates() {
    if (!a11yPanelEl) return;

    let fontLevel = 1;
    try {
      const f = localStorage.getItem('gp_font');
      if (f !== null) fontLevel = parseInt(f, 10);
    } catch (e) { }
    if (document.body.classList.contains('font-xl')) fontLevel = 3;
    else if (document.body.classList.contains('font-lg')) fontLevel = 2;

    a11yPanelEl.querySelectorAll('.a11y-font-btn').forEach(btn => {
      const lv = parseInt(btn.getAttribute('data-font'), 10);
      btn.classList.toggle('active', lv === (fontLevel >= 2 ? 2 : fontLevel));
    });

    const hcOn = document.body.classList.contains('high-contrast');
    const gsOn = document.body.classList.contains('grayscale');
    a11yPanelEl.querySelectorAll('.a11y-toggle-btn').forEach(btn => {
      const toggle = btn.getAttribute('data-toggle');
      const isOn = toggle === 'hc' ? hcOn : gsOn;
      btn.classList.toggle('active', isOn);
      const valSpan = btn.querySelector('.val');
      if (valSpan) {
        valSpan.textContent = isOn
          ? (state.currentLang === 'mr' ? 'चालू' : 'On')
          : (state.currentLang === 'mr' ? 'बंद' : 'Off');
      }
    });
  }

  function initA11y() {
    let fontLevel = 1, hc = 0, gs = 0;
    try {
      const f = localStorage.getItem('gp_font');
      const h = localStorage.getItem('gp_hc');
      const g = localStorage.getItem('gp_gs');
      if (f !== null) fontLevel = parseInt(f, 10);
      if (h !== null) hc = parseInt(h, 10);
      if (g !== null) gs = parseInt(g, 10);
    } catch (e) { }

    if (fontLevel === 2) document.body.classList.add('font-lg');
    if (fontLevel >= 3) document.body.classList.add('font-xl');
    if (hc) document.body.classList.add('high-contrast');
    if (gs) document.body.classList.add('grayscale');
  }

  function bindA11y() {
    createA11yPanel();
    const btn = document.getElementById('a11yBtn');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!a11yPanelEl) return;
      const isVisible = a11yPanelEl.classList.toggle('visible');
      btn.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
      updateA11yActiveStates();
    });

    document.addEventListener('click', (e) => {
      if (!a11yPanelEl) return;
      const toolbar = document.querySelector('.a11y-toolbar');
      if (toolbar && !toolbar.contains(e.target)) {
        a11yPanelEl.classList.remove('visible');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initSearch() {
    const input = document.getElementById('globalSearch');
    const results = document.getElementById('searchResults');
    if (!input || !results) return;

    function closeDropdown() {
      results.classList.remove('visible');
      results.innerHTML = '';
    }

    input.addEventListener('keyup', (e) => {
      clearTimeout(state.searchDebounceTimer);
      const q = input.value.trim();
      if (q.length < 2) {
        closeDropdown();
        return;
      }
      state.searchDebounceTimer = setTimeout(async () => {
        const res = await api('/api/search?q=' + encodeURIComponent(q));
        results.innerHTML = '';
        if (!res.ok || !res.data) {
          results.innerHTML = `<div class="search-empty" data-en="No results found" data-mr="कोणतेही परिणाम सापडले नाहीत">No results found</div>`;
          results.classList.add('visible');
          return;
        }

        const groups = res.data.groups || res.data;
        let hasResults = false;
        if (Array.isArray(groups)) {
          groups.forEach(item => {
            hasResults = true;
            const route = item.hash || item.url || '#/home';
            const a = document.createElement('a');
            a.href = route;
            a.setAttribute('role', 'option');
            const label = state.currentLang === 'mr'
              ? (item.title_mr || item.label_mr || item.title || item.label || '')
              : (item.title_en || item.label_en || item.title || item.label || '');
            a.textContent = label || route;
            a.addEventListener('click', (ev) => {
              ev.preventDefault();
              location.hash = route.replace(/^#/, '');
              closeDropdown();
              input.value = '';
            });
            results.appendChild(a);
          });
        } else if (typeof groups === 'object') {
          Object.keys(groups).forEach(groupKey => {
            const groupLabel = {
              schemes: 'Schemes / योजना',
              notices: 'Notices / सूचना',
              services: 'Services / सुविधा',
              projects: 'Projects / प्रकल्प',
              gramsabha: 'Gram Sabha / ग्रामसभा'
            }[groupKey] || groupKey;
            const items = groups[groupKey];
            if (!Array.isArray(items) || items.length === 0) return;
            hasResults = true;
            const labelDiv = document.createElement('div');
            labelDiv.className = 'search-group-label';
            labelDiv.textContent = groupLabel;
            results.appendChild(labelDiv);
            items.forEach(item => {
              const route = item.hash || item.url || '#/home';
              const a = document.createElement('a');
              a.href = route;
              a.setAttribute('role', 'option');
              const label = state.currentLang === 'mr'
                ? (item.title_mr || item.label_mr || item.title || item.label || '')
                : (item.title_en || item.label_en || item.title || item.label || '');
              a.textContent = label || route;
              a.addEventListener('click', (ev) => {
                ev.preventDefault();
                location.hash = route.replace(/^#/, '');
                closeDropdown();
                input.value = '';
              });
              results.appendChild(a);
            });
          });
        }

        if (!hasResults) {
          results.innerHTML = `<div class="search-empty" data-en="No results found" data-mr="कोणतेही परिणाम सापडले नाहीत">No results found</div>`;
        }
        results.classList.add('visible');
      }, 300);
    });

    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('.search-wrap');
      if (wrap && !wrap.contains(e.target)) closeDropdown();
    });
  }

  const defaultBreadcrumbMap = {
    'home':       { en: 'Home',          mr: 'मुख्यपृष्ठ' },
    'about':      { en: 'About',         mr: 'बद्दल' },
    'services':   { en: 'Services',      mr: 'सुविधा' },
    'citizen':    { en: 'Citizen',       mr: 'नागरिक' },
    'complaints': { en: 'Complaints',    mr: 'तक्रारी' },
    'notices':    { en: 'Notices',       mr: 'सूचना' },
    'gramsabha':  { en: 'Gram Sabha',    mr: 'ग्रामसभा' },
    'projects':   { en: 'Projects',      mr: 'प्रकल्प' },
    'schemes':    { en: 'Schemes',       mr: 'योजना' },
    'contact':    { en: 'Contact',       mr: 'संपर्क' }
  };

  let manualBreadcrumbs = null;

  function setBreadcrumbs(itemsArray) {
    manualBreadcrumbs = itemsArray;
    renderBreadcrumbs(itemsArray);
  }

  function renderBreadcrumbs(items) {
    const container = document.getElementById('breadcrumbs');
    if (!container) return;
    if (!items || items.length === 0) {
      container.innerHTML = '';
      return;
    }
    const parts = [];
    items.forEach((item, idx) => {
      const isLast = idx === items.length - 1;
      const label = state.currentLang === 'mr'
        ? (item.labelMr || item.labelEn || '')
        : (item.labelEn || item.labelMr || '');
      if (isLast) {
        parts.push(`<span class="breadcrumbs-current">${escapeHtml(label)}</span>`);
      } else {
        parts.push(`<a href="${item.hash || '#'}">${escapeHtml(label)}</a>`);
      }
      if (!isLast) parts.push(`<span class="breadcrumbs-separator" aria-hidden="true">›</span>`);
    });
    container.innerHTML = parts.join('');
  }

  function autoBreadcrumbFor(params) {
    if (manualBreadcrumbs !== null) {
      renderBreadcrumbs(manualBreadcrumbs);
      return;
    }
    const items = [];
    if (!params || params.length === 0) params = ['home'];
    const root = params[0];
    items.push({ labelEn: 'Home', labelMr: 'मुख्यपृष्ठ', hash: '#/home' });
    if (root !== 'home') {
      const info = defaultBreadcrumbMap[root];
      if (info) {
        if (params.length === 1) {
          items.push({ labelEn: info.en, labelMr: info.mr });
        } else {
          items.push({ labelEn: info.en, labelMr: info.mr, hash: '#/' + root });
        }
      }
    }
    for (let i = 1; i < params.length; i++) {
      const sub = params[i];
      const label = sub.charAt(0).toUpperCase() + sub.slice(1);
      if (i === params.length - 1) {
        items.push({ labelEn: label, labelMr: label });
      } else {
        const hash = '#/' + params.slice(0, i + 1).join('/');
        items.push({ labelEn: label, labelMr: label, hash });
      }
    }
    if (root === 'home' && params.length === 1) {
      renderBreadcrumbs([]);
    } else {
      renderBreadcrumbs(items);
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function parseHash(hash) {
    if (!hash) hash = '#/home';
    if (!hash.startsWith('#')) hash = '#' + hash;
    const raw = hash.substring(1);
    const [pathAndQuery] = raw.split('#');
    const [pathPart, queryPart = ''] = pathAndQuery.split('?');
    const cleanPath = pathPart.replace(/^\/+/, '').replace(/\/+$/, '');
    const params = cleanPath ? cleanPath.split('/').filter(Boolean) : [];
    const query = {};
    if (queryPart) {
      queryPart.split('&').forEach(kv => {
        if (!kv) return;
        const [k, v = ''] = kv.split('=');
        try { query[decodeURIComponent(k)] = decodeURIComponent(v); }
        catch (_) { query[k] = v; }
      });
    }
    return { params, query, hash };
  }

  function registerRoute(path, handler) {
    const clean = path.replace(/^\/+/, '').replace(/\/+$/, '');
    routeTable.set(clean, handler);
  }

  async function route(hash, isLangRefresh = false) {
    manualBreadcrumbs = null;
    if (!hash) hash = location.hash || '#/home';
    currentHash = hash;
    const parsed = parseHash(hash);
    const { params, query } = parsed;

    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
      searchResults.classList.remove('visible');
      searchResults.innerHTML = '';
    }
    closeAccountMenu();
    closeHamburger();

    let handler = null;
    let bestMatch = -1;
    for (const [pathKey, fn] of routeTable.entries()) {
      const keyParts = pathKey ? pathKey.split('/') : [];
      if (keyParts.length > params.length) continue;
      let matches = true;
      for (let i = 0; i < keyParts.length; i++) {
        if (keyParts[i] !== params[i]) { matches = false; break; }
      }
      if (matches && keyParts.length > bestMatch) {
        bestMatch = keyParts.length;
        handler = fn;
      }
    }

    if (!handler) {
      location.hash = '/home';
      return;
    }

    const context = {
      params: params.slice(bestMatch),
      query,
      hash
    };

    try {
      await handler(context);
    } catch (e) {
      console.error('Route handler error:', e);
      const appEl = document.getElementById('app');
      if (appEl) {
        appEl.innerHTML = `<div class="container section-padding"><h2 style="color:var(--danger)">Error loading page</h2><p>${escapeHtml(e && e.message ? e.message : 'Please try again.')}</p></div>`;
      }
    }

    autoBreadcrumbFor(params);
    if (!isLangRefresh) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function bindHashchange() {
    window.addEventListener('hashchange', () => {
      route(location.hash || '#/home');
    });
  }

  async function loadTicker() {
    const container = document.getElementById('tickerContent');
    if (!container) return;
    const defaultItems = [
      { en: 'Dumbarwadi Gram Panchayat Meeting scheduled', mr: 'डुंबरवाडी ग्राम पंचायत सभा नियोजित' },
      { en: 'Water Supply Timings: 7-9 AM & 5-7 PM', mr: 'पाणी पुरवठा वेळ: सकाळी 7-9 आणि संध्याकाळी 5-7' },
      { en: 'New PM Awas Yojana applications open', mr: 'नवीन पीएम आवास योजना अर्ज सुरू' }
    ];
    try {
      const res = await api('/api/notices?limit=5');
      let items = [];
      if (res.ok && res.data) {
        const arr = Array.isArray(res.data) ? res.data : (res.data.notices || []);
        items = arr.map(n => ({
          en: n.title_en || n.title || '',
          mr: n.title_mr || n.title || ''
        }));
      }
      if (items.length === 0) items = defaultItems;

      const spans = [];
      items.forEach((it, i) => {
        const text = state.currentLang === 'mr' ? (it.mr || it.en) : (it.en || it.mr);
        if (i > 0) spans.push('<span class="ticker-item">•</span>');
        spans.push(`<span class="ticker-item">${escapeHtml(text)}</span>`);
      });
      const content = spans.join('');
      container.innerHTML = content + content;
    } catch (e) {
      const spans = [];
      defaultItems.forEach((it, i) => {
        const text = state.currentLang === 'mr' ? it.mr : it.en;
        if (i > 0) spans.push('<span class="ticker-item">•</span>');
        spans.push(`<span class="ticker-item">${escapeHtml(text)}</span>`);
      });
      const content = spans.join('');
      container.innerHTML = content + content;
    }
  }

  function closeAccountMenu() {
    const menu = document.getElementById('accountMenu');
    const btn = document.getElementById('accountBtn');
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function initAccountMenu() {
    const btn = document.getElementById('accountBtn');
    const menu = document.getElementById('accountMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = menu.hidden;
      menu.hidden = !isHidden;
      btn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      const wrap = document.querySelector('.account-menu-wrap');
      if (wrap && !wrap.contains(e.target)) closeAccountMenu();
    });

    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const res = await api('/api/citizen/logout', { method: 'POST', body: JSON.stringify({}) });
        state.citizen = null;
        updateAccountUI();
        closeAccountMenu();
        location.hash = '/home';
        showToast('success', 'Logged out successfully', 'यशस्वीरित्या बाहेर पडले');
      });
    }
  }

  async function loadAccountSession() {
    try {
      const res = await api('/api/citizen/me');
      if (res.ok && res.data) {
        state.citizen = res.data;
        updateAccountUI();
      }
    } catch (e) { }
  }

  function updateAccountUI() {
    const label = document.getElementById('accountLabel');
    const dashLink = document.getElementById('dashLink');
    const logoutLink = document.getElementById('logoutLink');

    if (state.citizen) {
      const name = state.citizen.name || state.citizen.full_name || 'Citizen';
      if (label) {
        label.textContent = name;
        label.setAttribute('data-en', name);
        label.setAttribute('data-mr', name);
      }
      if (dashLink) dashLink.hidden = false;
      if (logoutLink) logoutLink.hidden = false;
    } else {
      if (label) {
        label.textContent = 'Login/Register';
        label.setAttribute('data-en', 'Login');
        label.setAttribute('data-mr', 'लॉगिन');
      }
      if (dashLink) dashLink.hidden = true;
      if (logoutLink) logoutLink.hidden = true;
    }
  }

  async function loadVillage() {
    try {
      const res = await api('/api/village');
      if (res.ok && res.data) {
        state.village = res.data;
        const lastUpdated = document.getElementById('lastUpdated');
        if (lastUpdated && state.village.updated_at) {
          try {
            const d = new Date(state.village.updated_at);
            if (!isNaN(d.getTime())) {
              lastUpdated.textContent = d.toLocaleDateString(state.currentLang === 'mr' ? 'mr-IN' : 'en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            }
          } catch (_) { }
        }
      }
    } catch (e) { }
  }

  function bindHamburger() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (!hamburger || !navLinks) return;

    function toggle() {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
      const expanded = hamburger.classList.contains('active');
      hamburger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }

    function close() {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    }

    hamburger.addEventListener('click', toggle);
    hamburger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', close);
    });
  }

  function closeHamburger() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger) hamburger.classList.remove('active');
    if (navLinks) navLinks.classList.remove('active');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
  }

  function bindScrollTop() {
    const btn = document.getElementById('scrollTopBtn');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 400) btn.classList.add('visible');
      else btn.classList.remove('visible');
    });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  window.GP = {
    registerRoute,
    api,
    t,
    labelSet,
    setBreadcrumbs,
    showToast,
    state,
    currentLang: () => state.currentLang,
    ensureCsrf,
    setLanguage,
    escapeHtml
  };

  document.addEventListener('DOMContentLoaded', async () => {
    await ensureCsrf();
    initA11y();

    let savedLang = 'en';
    try {
      const stored = localStorage.getItem('dumbarwadi-lang');
      if (stored === 'mr') savedLang = 'mr';
    } catch (e) { }
    setLanguage(savedLang);

    await loadVillage();
    await loadTicker();
    initSearch();
    initAccountMenu();
    await loadAccountSession();
    bindLangSwitcher();
    bindA11y();
    bindHamburger();
    bindScrollTop();
    bindHashchange();

    updateA11yActiveStates();

    const initialHash = location.hash || '#/home';
    await route(initialHash);
  });
})();
