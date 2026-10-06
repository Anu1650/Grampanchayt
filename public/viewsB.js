document.addEventListener('DOMContentLoaded', () => {
  if (!window.GP) return;
  const GP = window.GP;
  const app = () => document.getElementById('app');

  // ========== HELPER FUNCTIONS ==========

  function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function formatINR(num) {
    if (num == null) return '₹0';
    return '₹' + Number(num).toLocaleString('en-IN');
  }

  function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${m}-${day}`.replace('year', y);
  }

  function formatDateTime(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString(GP.state.currentLang === 'mr' ? 'mr-IN' : 'en-IN');
  }

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function t(rec, field) {
    if (!rec) return '';
    const lang = GP.state.currentLang || 'en';
    if (typeof rec === 'string') return rec;
    const v = rec[field + '_' + lang];
    if (v != null && v !== '') return v;
    return rec[field] != null ? rec[field] : '';
  }

  const SERVICE_INFO = {
    birth: {
      key: 'birth',
      icon: '📝',
      title_en: 'Birth Certificate',
      title_mr: 'जन्म दाखला',
      desc_en: 'Register and obtain official birth certificate for newborns.',
      desc_mr: 'नवजात बाळांसाठी अधिकृत जन्म दाखला नोंदणी व मिळवणे.',
    },
    death: {
      key: 'death',
      icon: '⚰️',
      title_en: 'Death Certificate',
      title_mr: 'मृत्यू दाखला',
      desc_en: 'Official certificate for registration of a death.',
      desc_mr: 'मृत्यूच्या नोंदणीसाठी अधिकृत दाखला.',
    },
    residence: {
      key: 'residence',
      icon: '🏠',
      title_en: 'Residence Certificate',
      title_mr: 'निवास दाखला',
      desc_en: 'Proof of permanent residency in Dumbarwadi.',
      desc_mr: 'डुंबरवाडीमध्ये कायमस्वरूपी रहिवासाचा पुरावा.',
    },
    income: {
      key: 'income',
      icon: '💰',
      title_en: 'Income Certificate',
      title_mr: 'उत्पन्न दाखला',
      desc_en: 'Certification of annual family income for schemes.',
      desc_mr: 'योजनांसाठी वार्षिक कौटुंबिक उत्पन्नाचे प्रमाणपत्र.',
    },
    water: {
      key: 'water',
      icon: '💧',
      title_en: 'Water Connection',
      title_mr: 'जल कनेक्शन',
      desc_en: 'Apply for a new domestic or commercial water tap.',
      desc_mr: 'नवीन घरगुती किंवा व्यावसायिक नळ साठी अर्ज करा.',
    },
    property_tax: {
      key: 'property_tax',
      icon: '🧾',
      title_en: 'Property / House Tax',
      title_mr: 'मालमत्ता कर',
      desc_en: 'Pay and manage property tax and assessment.',
      desc_mr: 'मालमत्ता कर व मूल्यांकन भरा व व्यवस्थापित करा.',
    },
  };

  const COMPLAINT_TYPES = {
    water: { en: 'Water Supply', mr: 'जलपुरवठा' },
    electricity: { en: 'Electricity', mr: 'वीज' },
    road: { en: 'Road / Footpath', mr: 'रस्ता / फुटपाथ' },
    drainage: { en: 'Drainage', mr: 'गटार प्रणाली' },
    streetlight: { en: 'Street Light', mr: 'स्ट्रीट लाइट' },
    sanitation: { en: 'Sanitation / Waste', mr: 'स्वच्छता / कचरा' },
    other: { en: 'Other', mr: 'इतर' },
  };

  function getServiceLabel(type) {
    const s = SERVICE_INFO[type];
    if (!s) return { en: type, mr: type };
    return { en: s.title_en, mr: s.title_mr };
  }

  function breadcrumb(items) {
    const parts = items
      .map((it, i) => {
        const label = typeof it === 'string' ? it : it.label;
        const href = typeof it === 'string' ? null : it.href;
        if (href && i < items.length - 1) {
          return `<a href="${esc(href)}">${esc(label)}</a>`;
        }
        return `<span>${esc(label)}</span>`;
      })
      .join('<span class="breadcrumbs-separator">›</span>');
    return `<div class="breadcrumbs container" style="max-width:1200px;margin:0 auto;padding:12px 20px;">${parts}</div>`;
  }

  function appContainer(inner) {
    return `<div style="padding:0 0 60px 0;background:var(--bg-light);min-height:calc(100vh - 80px);"><div style="max-width:1200px;margin:0 auto;padding:20px;">${inner}</div></div>`;
  }

  function card(inner, extra = '') {
    return `<div style="background:var(--bg-white);border-radius:12px;box-shadow:var(--shadow);border:1px solid var(--border);padding:24px;${extra}">${inner}</div>`;
  }

  function statusBadge(status) {
    const cls = `badge-${status || 'pending'}`;
    const label = (status || 'pending').replace(/_/g, ' ');
    return `<span class="${cls}">${label}</span>`;
  }

  function renderAppStepper(current, isRejected) {
    const steps = [
      { key: 'submitted', icon: '📨', en: 'Submitted', mr: 'सादर केले' },
      { key: 'under_review', icon: '🔍', en: 'Under Review', mr: 'संशोधनाधीन' },
      { key: 'approved', icon: '✅', en: 'Approved', mr: 'मंजूर' },
      {
        key: isRejected ? 'rejected' : 'issued',
        icon: isRejected ? '❌' : '📜',
        en: isRejected ? 'Rejected' : 'Issued',
        mr: isRejected ? 'नाकारले' : 'जारी',
      },
      { key: 'download', icon: '⬇️', en: 'Download', mr: 'डाउनलोड' },
    ];
    const order = ['submitted', 'under_review', 'approved', 'issued', 'download'];
    let curIdx = order.indexOf(current);
    if (current === 'rejected') curIdx = 3;
    if (curIdx < 0) curIdx = 0;
    const stepColor = (k) => {
      if (k === 'submitted') return 'var(--warning)';
      if (k === 'under_review') return 'var(--accent)';
      if (k === 'approved') return 'var(--success)';
      if (k === 'issued' || k === 'download') return 'var(--primary-dark)';
      if (k === 'rejected') return 'var(--danger)';
      return 'var(--text-light)';
    };
    const lang = GP.state.currentLang;
    let html = '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin:30px 0;overflow-x:auto;padding:10px 0;">';
    steps.forEach((step, i) => {
      const isActive = i <= curIdx;
      const isCurrent = i === curIdx;
      const color = isActive ? stepColor(step.key) : 'var(--border)';
      const textColor = isActive ? 'var(--text-dark)' : 'var(--text-light)';
      html += `<div style="flex:1;min-width:120px;display:flex;flex-direction:column;align-items:center;text-align:center;position:relative;">`;
      if (i < steps.length - 1) {
        const lineColor = i < curIdx ? stepColor(steps[i].key) : 'var(--border)';
        html += `<div style="position:absolute;top:22px;left:calc(50% + 30px);right:calc(-50% + 30px);height:3px;background:${lineColor};z-index:0;"></div>`;
      }
      html += `<div style="width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;border:3px solid ${color};background:${isCurrent ? color : 'var(--bg-white)'};color:${isCurrent ? '#fff' : color};z-index:1;box-shadow:${isCurrent ? '0 0 0 4px ' + color + '33' : 'none'}">${step.icon}</div>`;
      html += `<div style="margin-top:8px;font-size:0.85rem;font-weight:${isCurrent ? 700 : 500};color:${textColor};">${lang === 'mr' ? step.mr : step.en}</div>`;
      html += `</div>`;
    });
    html += '</div>';
    return html;
  }

  function inputField(name, label_en, label_mr, type = 'text', opts = {}) {
    const lang = GP.state.currentLang;
    const label = lang === 'mr' ? label_mr : label_en;
    const req = opts.required ? '<span style="color:var(--danger);margin-left:3px;">*</span>' : '';
    const val = opts.value != null ? ` value="${esc(opts.value)}"` : '';
    const ph = opts.placeholder ? ` placeholder="${esc(opts.placeholder)}"` : '';
    const extra = opts.extra || '';
    if (type === 'textarea') {
      return `<div style="margin-bottom:16px;"><label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.9rem;">${esc(label)}${req}</label><textarea name="${name}" ${ph} style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:0.95rem;min-height:90px;${opts.style || ''}" ${extra}>${opts.value || ''}</textarea></div>`;
    }
    if (type === 'select') {
      const options = (opts.options || []).map(o => {
        const sel = opts.value === o.value ? ' selected' : '';
        const lb = lang === 'mr' && o.label_mr ? o.label_mr : o.label;
        return `<option value="${esc(o.value)}"${sel}>${esc(lb)}</option>`;
      }).join('');
      return `<div style="margin-bottom:16px;"><label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.9rem;">${esc(label)}${req}</label><select name="${name}" style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:0.95rem;background:var(--bg-white);" ${extra}>${options}</select></div>`;
    }
    if (type === 'radio') {
      const options = (opts.options || []).map(o => {
        const lb = lang === 'mr' && o.label_mr ? o.label_mr : o.label;
        const chk = opts.value === o.value ? ' checked' : '';
        return `<label style="display:inline-flex;align-items:center;gap:6px;margin-right:18px;cursor:pointer;"><input type="radio" name="${name}" value="${esc(o.value)}"${chk} ${extra}/><span>${esc(lb)}</span></label>`;
      }).join('');
      return `<div style="margin-bottom:16px;"><label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.9rem;">${esc(label)}${req}</label><div>${options}</div></div>`;
    }
    if (type === 'file') {
      return `<div style="margin-bottom:16px;"><label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.9rem;">${esc(label)}${req}</label><input type="file" name="${name}" accept="${opts.accept || '*'}" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-white);" ${extra}/>${opts.hint ? `<div style="font-size:0.78rem;color:var(--text-light);margin-top:4px;">${esc(opts.hint)}</div>` : ''}</div>`;
    }
    return `<div style="margin-bottom:16px;"><label style="display:block;font-weight:600;margin-bottom:6px;font-size:0.9rem;">${esc(label)}${req}</label><input type="${type}" name="${name}"${val}${ph} style="width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:0.95rem;" ${extra}/></div>`;
  }

  function h2(title_en, title_mr, extra = '') {
    const lang = GP.state.currentLang;
    const title = lang === 'mr' ? title_mr : title_en;
    return `<h2 style="font-size:1.8rem;font-weight:700;margin-bottom:16px;color:var(--text-dark);${extra}">${esc(title)}</h2>`;
  }

  function bilingual(en, mr) {
    const lang = GP.state.currentLang;
    return lang === 'mr' ? mr : en;
  }

  // ========== SERVICES ==========

  GP.registerRoute('services', null, async (ctx) => {
    const homeEn = GP.state.currentLang === 'mr' ? 'मुख्यपृष्ठ' : 'Home';
    const servicesEn = GP.state.currentLang === 'mr' ? 'सेवा' : 'Services';
    GP.setBreadcrumbs([{ label: homeEn, href: '#home' }, { label: servicesEn, href: '#/services' }]);

    let services = Object.values(SERVICE_INFO);
    services.push({
      key: 'complaint',
      icon: '⚠️',
      title_en: 'Complaint Registration',
      title_mr: 'तक्रार नोंदणी',
      desc_en: 'Report civic issues and grievances to the Panchayat.',
      desc_mr: 'पंचायतकडे नागरी समस्या व तक्रारी नोंदवा.',
      href: '#/complaint/new',
    });
    services.push({
      key: 'track',
      icon: '📑',
      title_en: 'Application Status / Track',
      title_mr: 'अर्ज स्थिती',
      desc_en: 'Track your certificate, service, or complaint application.',
      desc_mr: 'तुमचा दाखला, सेवा किंवा तक्रार अर्जाचा मागोवा घ्या.',
      href: '#/track',
    });

    try {
      const res = await GP.api('GET', '/api/services');
      if (res && Array.isArray(res) && res.length) {
        services = res.map(s => ({
          key: s.service_type || s.key || s.id,
          icon: s.icon || '📋',
          title_en: s.title_en || s.name_en || s.title || s.name,
          title_mr: s.title_mr || s.name_mr || s.title_en || s.title,
          desc_en: s.description_en || s.desc_en || s.description || '',
          desc_mr: s.description_mr || s.desc_mr || s.description_en || '',
        }));
      }
    } catch (e) { /* use static list */ }

    const cards = services.map(s => {
      const href = s.href || `#/apply/${s.key}`;
      const lang = GP.state.currentLang;
      const applyText = lang === 'mr' ? 'अर्ज करा →' : 'Apply Now →';
      return `<div class="scheme-card" style="margin:0;">
        <div style="font-size:3rem;margin-bottom:16px;">${s.icon}</div>
        <h3 style="font-size:1.25rem;font-weight:600;margin-bottom:8px;color:var(--text-dark);">${esc(s.title_en)}<br><span style="font-size:0.95rem;color:var(--text-gray);font-weight:500;">${esc(s.title_mr)}</span></h3>
        <p style="font-size:0.9rem;color:var(--text-gray);margin-bottom:20px;line-height:1.6;min-height:60px;">${esc(lang === 'mr' ? s.desc_mr : s.desc_en)}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="scheme-tag">${esc(lang === 'mr' ? 'सेवा' : 'Service')}</span>
          <a href="${href}" class="btn-small" style="text-decoration:none;">${applyText}</a>
        </div>
      </div>`;
    }).join('');

    const titleEn = 'Service Directory';
    const titleMr = 'सेवा सूची';
    const subEn = 'Essential services and certificates available from Dumbarwadi Gram Panchayat.';
    const subMr = 'डुंबरवाडी ग्राम पंचायतकडून उपलब्ध आवश्यक सेवा आणि दाखले.';

    app().innerHTML = appContainer(`
      <div class="section-header" style="text-align:center;margin-bottom:40px;">
        <h2 class="section-title">${bilingual(titleEn, titleMr)}</h2>
        <p class="section-subtitle">${bilingual(subEn, subMr)}</p>
      </div>
      <div class="schemes-grid" style="grid-template-columns:repeat(4,1fr);gap:24px;display:grid;">
        ${cards}
      </div>
    `);
    if (window.innerWidth <= 1024) {
      const grid = document.querySelector('.schemes-grid');
      if (grid) grid.style.gridTemplateColumns = window.innerWidth <= 640 ? '1fr' : 'repeat(2,1fr)';
    }
  });

  // --- /apply/:serviceType ---
  GP.registerRoute('apply', null, async (ctx) => {
    const serviceType = (ctx.params && ctx.params[0]) || '';
    const info = SERVICE_INFO[serviceType];
    if (!info) {
      app().innerHTML = appContainer(card(`
        <div style="text-align:center;padding:40px 20px;">
          <div style="font-size:4rem;margin-bottom:20px;">🚫</div>
          <h2 style="font-size:1.6rem;margin-bottom:10px;">${bilingual('Service Not Found', 'सेवा सापडली नाही')}</h2>
          <p style="color:var(--text-gray);margin-bottom:20px;">${bilingual('The requested service does not exist.', 'विनंती केलेली सेवा अस्तित्वात नाही.')}</p>
          <a href="#/services" class="btn btn-primary">${bilingual('← Back to Services', '← सेवांकडे परत जा')}</a>
        </div>
      `));
      return;
    }

    const home = bilingual('Home', 'मुख्यपृष्ठ');
    const serv = bilingual('Services', 'सेवा');
    const typeName = bilingual(info.title_en, info.title_mr);
    GP.setBreadcrumbs([
      { label: home, href: '#home' },
      { label: serv, href: '#/services' },
      { label: `${typeName} ${bilingual('Application', 'अर्ज')}` },
    ]);

    const citizen = GP.state.citizen || null;

    const sharedPre = (f) => (citizen && citizen[f]) != null ? citizen[f] : '';

    const lang = GP.state.currentLang;

    const title_en = `${info.title_en} Application Form`;
    const title_mr = `${info.title_mr} अर्ज फॉर्म`;

    let extraFields = '';
    const hintEn = 'Upload 1-2 additional supporting documents (max 5 MB each)';
    const hintMr = '1-2 अतिरिक्त दस्तऐवज अपलोड करा (प्रत्येकी जास्तीत जास्त 5 MB)';

    if (serviceType === 'birth') {
      extraFields = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          ${inputField('place_of_birth', 'Place of Birth', 'जन्म ठिकाण', 'text', { required: true, placeholder: 'Hospital / Home / Other' })}
          ${inputField('hospital_name', 'Hospital Name (if any)', 'रुग्णालयाचे नाव (असेल तर)', 'text')}
        </div>
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;">
          ${inputField('mother_name', "Mother's Full Name", 'आईचे पूर्ण नाव', 'text', { required: true })}
          ${inputField('weight_g', 'Birth Weight (grams, optional)', 'जन्म वजन (ग्रॅम, पर्यायी)', 'number')}
        </div>
      `;
    } else if (serviceType === 'death') {
      extraFields = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          ${inputField('date_of_death', 'Date of Death', 'मृत्यू दिनांक', 'date', { required: true })}
          ${inputField('place_of_death', 'Place of Death', 'मृत्यू ठिकाण', 'text', { required: true })}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          ${inputField('cause_of_death', 'Cause of Death', 'मृत्यूचे कारण', 'text')}
          ${inputField('relation_to_applicant', 'Relation with Applicant', 'अर्जदाराशी नाते', 'select', {
            required: true,
            options: [
              { value: 'son', label: 'Son', label_mr: 'मुलगा' },
              { value: 'daughter', label: 'Daughter', label_mr: 'मुलगी' },
              { value: 'wife', label: 'Wife', label_mr: 'पत्नी' },
              { value: 'husband', label: 'Husband', label_mr: 'पती' },
              { value: 'other', label: 'Other', label_mr: 'इतर' },
            ],
          })}
        </div>
      `;
    } else if (serviceType === 'residence') {
      extraFields = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          ${inputField('duration_stay_years', 'Years of Stay in Village', 'गावात राहिलेले वर्षे', 'number', { required: true, placeholder: 'e.g. 10' })}
          ${inputField('purpose', 'Purpose of Certificate', 'दाखल्याचा हेतू', 'select', {
            required: true,
            options: [
              { value: 'job', label: 'Job / Service', label_mr: 'नोकरी / सेवा' },
              { value: 'education', label: 'Education', label_mr: 'शिक्षण' },
              { value: 'govt_benefit', label: 'Government Benefit / Scheme', label_mr: 'सरकारी लाभ / योजना' },
              { value: 'other', label: 'Other', label_mr: 'इतर' },
            ],
          })}
        </div>
      `;
    } else if (serviceType === 'income') {
      extraFields = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          ${inputField('annual_income_rs', 'Annual Family Income (₹)', 'वार्षिक कौटुंबिक उत्पन्न (₹)', 'number', { required: true, placeholder: 'e.g. 150000' })}
          ${inputField('occupation', 'Occupation', 'व्यवसाय', 'text', { required: true })}
        </div>
        ${inputField('employer_name', 'Employer / Business Name (optional)', 'नियोक्ता / व्यवसायाचे नाव (पर्यायी)', 'text')}
      `;
    } else if (serviceType === 'water') {
      extraFields = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          ${inputField('connection_type', 'Connection Type', 'कनेक्शन प्रकार', 'select', {
            required: true,
            options: [
              { value: 'domestic', label: 'Domestic', label_mr: 'घरगुती' },
              { value: 'commercial', label: 'Commercial', label_mr: 'व्यावसायिक' },
              { value: 'agricultural', label: 'Agricultural', label_mr: 'कृषी' },
            ],
          })}
          ${inputField('existing_meter_no', 'Existing Meter No (optional)', 'सध्याचा मीटर नं. (पर्यायी)', 'text')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          ${inputField('premise_address_en', 'Premise Address (English)', 'जागा पत्ता (इंग्रजी)', 'text', { required: true })}
          ${inputField('premise_address_mr', 'जागा पत्ता (मराठी)', 'Premise Address (Marathi)', 'text', { required: true })}
        </div>
      `;
    } else if (serviceType === 'property_tax') {
      extraFields = `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
          ${inputField('property_id', 'Property ID', 'मालमत्ता ID', 'text', { required: true })}
          ${inputField('property_type', 'Property Type', 'मालमत्तेचा प्रकार', 'select', {
            required: true,
            options: [
              { value: 'residential', label: 'Residential', label_mr: 'निवासी' },
              { value: 'commercial', label: 'Commercial', label_mr: 'व्यावसायिक' },
              { value: 'vacant', label: 'Vacant / Open Plot', label_mr: 'रिक्त / मोकळा प्लॉट' },
            ],
          })}
          ${inputField('assessment_year', 'Assessment Year', 'मूल्यांकन वर्ष', 'text', { required: true, placeholder: 'e.g. 2026-27' })}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
          ${inputField('builtup_area_sqft', 'Built-up Area (sq ft)', 'बांधकाम क्षेत्र (चौरस फूट)', 'number', { required: true })}
          ${inputField('tax_amount', 'Tax Amount (₹)', 'कर रक्कम (₹)', 'number', { required: true })}
          ${inputField('payment_mode', 'Payment Mode', 'पदावतीचे साधन', 'select', {
            required: true,
            options: [
              { value: 'cash', label: 'Cash', label_mr: 'रोख' },
              { value: 'cheque', label: 'Cheque', label_mr: 'चेक' },
              { value: 'online', label: 'Online', label_mr: 'ऑनलाइन' },
              { value: 'DD', label: 'Demand Draft', label_mr: 'डिमांड ड्राफ्ट' },
            ],
          })}
        </div>
        ${inputField('receipt_no', 'Receipt No (if paid at office)', 'पावती नं. (कार्यालयात भरल्यास)', 'text')}
      `;
    }

    const submitText = bilingual('Submit Application / अर्ज सादर करा', 'अर्ज सादर करा / Submit Application');
    const idProofEn = 'Upload ID Proof (Aadhaar / PAN / Voter)';
    const idProofMr = 'ओळख पुरावा अपलोड करा (आधार / पॅन / मतदार)';
    const submitBtn = `<button type="submit" class="btn btn-primary" style="width:100%;padding:14px;font-size:1.05rem;">${esc(bilingual('Submit Application', 'अर्ज सादर करा'))}</button>`;

    const formHtml = `
      <form id="applyForm" style="display:flex;flex-direction:column;">
        <div style="border-top:3px solid var(--primary);border-radius:8px;padding:20px;margin-bottom:20px;background:var(--bg-light);">
          <h3 style="font-size:1.1rem;margin-bottom:16px;color:var(--primary-dark);display:flex;align-items:center;gap:8px;"><span>📋</span>${bilingual('Applicant Information', 'अर्जदारांची माहिती')}</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            ${inputField('applicant_fullname_en', 'Full Name (English)', 'पूर्ण नाव (इंग्रजी)', 'text', { required: true, value: sharedPre('fullname_en') || sharedPre('applicant_fullname_en') || '' })}
            ${inputField('applicant_fullname_mr', 'पूर्ण नाव (मराठी)', 'Full Name (Marathi)', 'text', { required: true, value: sharedPre('fullname_mr') || sharedPre('applicant_fullname_mr') || '' })}
          </div>
          <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:16px;">
            ${inputField('father_husband_name', 'Father / Husband Name', 'वडील / पतीचे नाव', 'text', { required: true, value: sharedPre('father_husband_name') || '' })}
            ${inputField('mobile', 'Mobile (10 digits)', 'मोबाइल (10 अंक)', 'tel', { required: true, value: sharedPre('mobile') || '', extra: 'maxlength="10" pattern="[0-9]{10}"', placeholder: '98XXXXXX21' })}
            ${inputField('email', 'Email (optional)', 'ईमेल (पर्यायी)', 'email', { value: sharedPre('email') || '' })}
          </div>
          <div style="display:grid;grid-template-columns:2fr 2fr 1fr 1fr;gap:16px;">
            ${inputField('address_en', 'Full Address (English)', 'पूर्ण पत्ता (इंग्रजी)', 'textarea', { required: true, value: sharedPre('address_en') || '' })}
            ${inputField('address_mr', 'पूर्ण पत्ता (मराठी)', 'Full Address (Marathi)', 'textarea', { required: true, value: sharedPre('address_mr') || '' })}
            ${inputField('ward_no', 'Ward No.', 'वॉर्ड क्र.', 'number', { required: true, value: sharedPre('ward_no') || '' })}
            ${inputField('household_no', 'Household No.', 'घर क्रमांक', 'text', { value: sharedPre('household_no') || '' })}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;">
            ${inputField('aadhaar_last4', 'Aadhaar Last 4 Digits', 'आधार शेवटचे 4 अंक', 'text', { required: true, value: sharedPre('aadhaar_last4') || '', extra: 'maxlength="4" pattern="[0-9]{4}"' })}
            ${inputField('gender', 'Gender', 'लिंग', 'radio', {
              required: true,
              value: sharedPre('gender') || 'male',
              options: [
                { value: 'male', label: 'Male', label_mr: 'पुरुष' },
                { value: 'female', label: 'Female', label_mr: 'महिला' },
                { value: 'other', label: 'Other', label_mr: 'इतर' },
              ],
            })}
            ${inputField('dob', 'Date of Birth', 'जन्म तारीख', 'date', { required: true, value: sharedPre('dob') || '' })}
            <div></div>
          </div>
          ${inputField('doc_id', idProofEn, idProofMr, 'file', { required: true, accept: '.jpg,.jpeg,.png,.pdf', hint: bilingual('Accepted: JPG, PNG, PDF (max 5 MB)', 'स्वीकार्य: JPG, PNG, PDF (जास्तीत जास्त 5 MB)'), extra: 'data-role="doc"' })}
        </div>

        <div style="border-top:3px solid var(--secondary);border-radius:8px;padding:20px;margin-bottom:20px;background:var(--bg-light);">
          <h3 style="font-size:1.1rem;margin-bottom:16px;color:var(--primary-dark);display:flex;align-items:center;gap:8px;"><span>${info.icon}</span>${esc(bilingual(`${info.title_en} — Specific Details`, `${info.title_mr} — विशिष्ट तपशील`))}</h3>
          ${extraFields}
        </div>

        <div style="border-top:3px solid var(--success);border-radius:8px;padding:20px;margin-bottom:20px;background:var(--bg-light);">
          <h3 style="font-size:1.1rem;margin-bottom:16px;color:var(--success);display:flex;align-items:center;gap:8px;"><span>📎</span>${bilingual('Additional Supporting Documents', 'अतिरिक्त सहाय्यक दस्तऐवज')}</h3>
          <p style="font-size:0.85rem;color:var(--text-gray);margin-bottom:14px;">${bilingual(hintEn, hintMr)}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            ${inputField('doc_extra_1', bilingual('Additional Document 1 (optional)', 'अतिरिक्त दस्तऐवज 1 (पर्यायी)'), bilingual('अतिरिक्त दस्तऐवज 1 (पर्यायी)', 'Additional Document 1 (optional)'), 'file', { accept: '.jpg,.jpeg,.png,.pdf', hint: bilingual('Max 5 MB', 'जास्तीत जास्त 5 MB'), extra: 'data-role="doc-extra"' })}
            ${inputField('doc_extra_2', bilingual('Additional Document 2 (optional)', 'अतिरिक्त दस्तऐवज 2 (पर्यायी)'), bilingual('अतिरिक्त दस्तऐवज 2 (पर्यायी)', 'Additional Document 2 (optional)'), 'file', { accept: '.jpg,.jpeg,.png,.pdf', hint: bilingual('Max 5 MB', 'जास्तीत जास्त 5 MB'), extra: 'data-role="doc-extra"' })}
          </div>
        </div>

        <div style="padding:20px 0;">
          ${submitBtn}
        </div>
      </form>
    `;

    app().innerHTML = appContainer(`
      ${h2(title_en, title_mr)}
      <p style="color:var(--text-gray);margin-bottom:24px;">${bilingual('Fields marked with * are mandatory. Please fill all details carefully.', '* चिन्हांकित फील्ड अनिवार्य आहेत. सर्व तपशील काळजीपूर्वक भरा.')}</p>
      ${card(formHtml)}
    `);

    const form = document.getElementById('applyForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await GP.ensureCsrf();
      } catch (err) {
        GP.showToast('error', bilingual('Security error. Please refresh.', 'सुरक्षा त्रुटी. कृपया रिफ्रेश करा.'));
        return;
      }

      const fd = new FormData(form);
      const data = {};
      fd.forEach((v, k) => { if (v !== '' && !(v instanceof File)) data[k] = v; });

      const requiredShared = ['applicant_fullname_en', 'applicant_fullname_mr', 'father_husband_name', 'mobile', 'address_en', 'address_mr', 'ward_no', 'aadhaar_last4', 'gender', 'dob'];
      for (const f of requiredShared) {
        if (!data[f]) {
          GP.showToast('warning', bilingual(`Please fill all required fields. Missing: ${f}`, `सर्व आवश्यक फील्ड भरा. गहाळ: ${f}`));
          return;
        }
      }

      if (!/^[0-9]{10}$/.test(data.mobile)) {
        GP.showToast('warning', bilingual('Mobile must be 10 digits.', 'मोबाइल 10 अंकी असणे आवश्यक आहे.'));
        return;
      }
      if (!/^[0-9]{4}$/.test(data.aadhaar_last4)) {
        GP.showToast('warning', bilingual('Aadhaar last 4 digits required.', 'आधार शेवटचे 4 अंक आवश्यक आहेत.'));
        return;
      }

      let specificReq = [];
      if (serviceType === 'birth') specificReq = ['place_of_birth', 'mother_name'];
      if (serviceType === 'death') specificReq = ['date_of_death', 'place_of_death', 'relation_to_applicant'];
      if (serviceType === 'residence') specificReq = ['duration_stay_years', 'purpose'];
      if (serviceType === 'income') specificReq = ['annual_income_rs', 'occupation'];
      if (serviceType === 'water') specificReq = ['connection_type', 'premise_address_en', 'premise_address_mr'];
      if (serviceType === 'property_tax') specificReq = ['property_id', 'property_type', 'builtup_area_sqft', 'tax_amount', 'assessment_year', 'payment_mode'];
      for (const f of specificReq) {
        if (data[f] == null || data[f] === '') {
          GP.showToast('warning', bilingual(`Please fill required field: ${f}`, `आवश्यक फील्ड भरा: ${f}`));
          return;
        }
      }

      const docFiles = [];
      const maxSize = 5 * 1024 * 1024;
      const fileInputs = form.querySelectorAll('input[type="file"]');
      for (const inp of fileInputs) {
        if (!inp.files || !inp.files.length) continue;
        for (const f of inp.files) {
          if (f.size > maxSize) {
            GP.showToast('warning', bilingual(`File ${f.name} exceeds 5 MB.`, `फाईल ${f.name} 5 MB पेक्षा मोठी आहे.`));
            return;
          }
          try {
            const dataUrl = await readAsDataURL(f);
            docFiles.push({ name: f.name, type: f.type, size: f.size, data: dataUrl });
          } catch (err) {
            GP.showToast('error', bilingual(`Failed to read file: ${f.name}`, `फाईल वाचण्यात अपयश: ${f.name}`));
            return;
          }
        }
      }

      const idInput = form.querySelector('input[name="doc_id"]');
      if (!idInput || !idInput.files || !idInput.files.length) {
        GP.showToast('warning', bilingual('ID Proof document is required.', 'ओळख पुरावा दस्तऐवज आवश्यक आहे.'));
        return;
      }

      const service_specific = {};
      if (serviceType === 'birth') {
        ['place_of_birth', 'hospital_name', 'mother_name', 'weight_g'].forEach(k => { if (data[k]) service_specific[k] = data[k]; });
      } else if (serviceType === 'death') {
        ['date_of_death', 'place_of_death', 'cause_of_death', 'relation_to_applicant'].forEach(k => { if (data[k]) service_specific[k] = data[k]; });
      } else if (serviceType === 'residence') {
        ['duration_stay_years', 'purpose'].forEach(k => { if (data[k]) service_specific[k] = data[k]; });
      } else if (serviceType === 'income') {
        ['annual_income_rs', 'occupation', 'employer_name'].forEach(k => { if (data[k]) service_specific[k] = data[k]; });
      } else if (serviceType === 'water') {
        ['connection_type', 'premise_address_en', 'premise_address_mr', 'existing_meter_no'].forEach(k => { if (data[k]) service_specific[k] = data[k]; });
      } else if (serviceType === 'property_tax') {
        ['property_id', 'property_type', 'builtup_area_sqft', 'tax_amount', 'assessment_year', 'payment_mode', 'receipt_no'].forEach(k => { if (data[k]) service_specific[k] = data[k]; });
      }

      const payload = {
        service_type: serviceType,
        applicant_fullname_en: data.applicant_fullname_en,
        applicant_fullname_mr: data.applicant_fullname_mr,
        father_husband_name: data.father_husband_name,
        mobile: data.mobile,
        email: data.email || '',
        gender: data.gender,
        dob: data.dob,
        address_en: data.address_en,
        address_mr: data.address_mr,
        ward_no: data.ward_no,
        household_no: data.household_no || '',
        aadhaar_last4: data.aadhaar_last4,
        service_specific,
        documents: docFiles,
      };

      try {
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = bilingual('Submitting...', 'सादर करत आहे...');
        const res = await GP.api('POST', '/api/service-applications', payload);
        const appId = (res && (res.application_id || res.id)) || null;
        try {
          localStorage.setItem('gp_last_track_mobile', data.mobile);
        } catch (_) {}
        GP.showToast('success', 'Application submitted! / अर्ज सादर!');

        let bodyHtml = `<div style="text-align:center;padding:20px;">
          <div style="font-size:4rem;margin-bottom:16px;">✅</div>
          <h3 style="font-size:1.4rem;margin-bottom:10px;color:var(--success);">${bilingual('Application Submitted Successfully!', 'अर्ज यशस्वीरित्या सादर केला गेला!')}</h3>
          <p style="color:var(--text-gray);margin-bottom:24px;">${esc(bilingual(`${info.title_en} application received. Please keep note of the application ID.`, `${info.title_mr} अर्ज प्राप्त झाला. कृपया अर्ज क्रमांक लक्षात ठेवा.`))}</p>
          <div style="background:var(--gradient);color:#fff;padding:24px;border-radius:12px;margin-bottom:24px;box-shadow:var(--shadow-lg);">
            <div style="font-size:0.9rem;opacity:0.9;margin-bottom:6px;">${bilingual('Application ID / अर्ज क्रमांक', 'अर्ज क्रमांक / Application ID')}</div>
            <div style="font-size:2.4rem;font-weight:700;letter-spacing:1px;">${esc(appId || '-')}</div>
          </div>
          <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
            <a href="${appId ? `#/track/${appId}` : '#/track'}" class="btn btn-primary">📑 ${bilingual('Track Status', 'स्थिती मागोवा')} →</a>
            <a href="#/services" class="btn btn-secondary">${bilingual('Back to Services', 'सेवांकडे परत जा')}</a>
          </div>
        </div>`;
        app().innerHTML = appContainer(card(bodyHtml));
      } catch (err) {
        const msg = (err && err.message) ? err.message : bilingual('Submission failed. Try again.', 'सादर करणे अयशस्वी. पुन्हा प्रयत्न करा.');
        GP.showToast('error', msg);
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.textContent = bilingual('Submit Application', 'अर्ज सादर करा');
      }
    });
  });

  // --- /track or /track/:id ---
  GP.registerRoute('track', null, async (ctx) => {
    const home = bilingual('Home', 'मुख्यपृष्ठ');
    const serv = bilingual('Services', 'सेवा');
    const track = bilingual('Track Application', 'अर्ज मागोवा');
    GP.setBreadcrumbs([
      { label: home, href: '#home' },
      { label: serv, href: '#/services' },
      { label: track },
    ]);

    const paramId = (ctx.params && ctx.params[0]) || '';
    let savedMobile = '';
    try { savedMobile = localStorage.getItem('gp_last_track_mobile') || ''; } catch (_) {}

    function renderForm(prefillId = '', prefillMobile = '') {
      const titleEn = 'Track Your Application';
      const titleMr = 'तुमच्या अर्जाचा मागोवा घ्या';
      const subEn = 'Enter application ID and mobile number to view status.';
      const subMr = 'स्थिती पाहण्यासाठी अर्ज क्रमांक आणि मोबाइल नंबर टाका.';
      app().innerHTML = appContainer(`
        ${h2(titleEn, titleMr)}
        <p style="color:var(--text-gray);margin-bottom:24px;">${bilingual(subEn, subMr)}</p>
        ${card(`
          <form id="trackForm" style="max-width:540px;margin:0 auto;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
              ${inputField('application_id', 'Application ID', 'अर्ज क्रमांक', 'text', { required: true, value: prefillId, placeholder: 'e.g. APP-XXXX' })}
              ${inputField('mobile', 'Registered Mobile (10 digits)', 'नोंदणीकृत मोबाइल (10 अंक)', 'tel', { required: true, value: prefillMobile || savedMobile, placeholder: '98XXXXXX21', extra: 'maxlength="10" pattern="[0-9]{10}"' })}
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;margin-top:10px;padding:14px;">🔍 ${bilingual('Track / मागोवा', 'मागोवा / Track')}</button>
          </form>
        `)}
      `);
      const form = document.getElementById('trackForm');
      if (!form) return;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const application_id = (fd.get('application_id') || '').toString().trim();
        const mobile = (fd.get('mobile') || '').toString().trim();
        if (!application_id || !/^[0-9]{10}$/.test(mobile)) {
          GP.showToast('warning', bilingual('Valid Application ID and 10-digit mobile required.', 'वैध अर्ज क्रमांक आणि 10 अंकी मोबाइल आवश्यक.'));
          return;
        }
        try {
          await GP.ensureCsrf();
          const res = await GP.api('POST', '/api/service-applications/track', { application_id, mobile });
          const rows = Array.isArray(res) ? res : (res ? [res] : []);
          if (!rows.length) {
            GP.showToast('warning', bilingual('No application found. Check details.', 'कोणताही अर्ज सापडला नाही. तपशील तपासा.'));
            return;
          }
          renderDetail(rows[0]);
        } catch (err) {
          GP.showToast('error', (err && err.message) || bilingual('Failed to fetch.', 'मिळवणे अयशस्वी.'));
        }
      });
    }

    function renderDetail(appRec) {
      const type = appRec.service_type || 'birth';
      const label = getServiceLabel(type);
      const status = appRec.status || 'submitted';
      const isRej = status === 'rejected';
      const history = Array.isArray(appRec.status_history) ? appRec.status_history : [];
      const appId = appRec.application_id || appRec.id || '-';

      const histHtml = history.map(h => {
        const ts = h.timestamp || h.created_at || h.date;
        const lbl = (h.status || '').replace(/_/g, ' ');
        const note = h.note || h.comment || '';
        return `<div class="timeline-step ${h === history[history.length - 1] ? 'active' : ''}">
          <div class="timeline-line"></div>
          <div class="timeline-time">${esc(formatDateTime(ts))}</div>
          <div class="timeline-label">${esc(lbl)}</div>
          ${note ? `<div class="timeline-desc">${esc(note)}</div>` : ''}
        </div>`;
      }).join('');

      const downloadBtn = status === 'issued'
        ? `<a href="#/certificate/${appId}" class="btn btn-primary" style="padding:16px 28px;font-size:1.1rem;">⬇️ ${bilingual('Download Certificate', 'दाखला डाउनलोड करा')} ${statusBadge('issued')}</a>`
        : '';

      const adminNote = appRec.admin_note
        ? `<div style="background:#fffbeb;border-left:4px solid var(--warning);padding:16px;border-radius:8px;margin-top:20px;">
             <div style="font-weight:600;margin-bottom:6px;color:#92400e;">📝 ${bilingual('Admin Note', 'प्रशासक टीप')}</div>
             <div>${esc(appRec.admin_note)}</div>
           </div>`
        : '';

      const header = `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap;">
        <div>
          <div style="background:var(--gradient);color:#fff;padding:20px 28px;border-radius:12px;display:inline-block;margin-bottom:16px;">
            <div style="font-size:0.85rem;opacity:0.9;">${bilingual('Application ID', 'अर्ज क्रमांक')}</div>
            <div style="font-size:2.2rem;font-weight:700;letter-spacing:1px;">${esc(appId)}</div>
          </div>
          <h3 style="font-size:1.5rem;margin-bottom:8px;">${esc(bilingual(label.en, label.mr))} ${statusBadge(status)}</h3>
          <div style="color:var(--text-gray);">${esc(formatDateTime(appRec.created_at || appRec.submitted_at))}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${downloadBtn}
          <button onclick="location.hash='#/track'" class="btn btn-secondary">${bilingual('← Track Another', '← दुसरा मागोवा')}</button>
        </div>
      </div>`;

      const applicant = `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:10px;">
          <div><div style="font-size:0.8rem;color:var(--text-light);">${bilingual('Applicant', 'अर्जदार')}</div><div style="font-weight:600;">${esc(appRec.applicant_fullname_en || appRec.applicant_name || '-')}</div></div>
          <div><div style="font-size:0.8rem;color:var(--text-light);">${bilingual('Mobile', 'मोबाइल')}</div><div style="font-weight:600;">${esc(appRec.mobile || '-')}</div></div>
          <div><div style="font-size:0.8rem;color:var(--text-light);">${bilingual('Ward', 'वॉर्ड')}</div><div style="font-weight:600;">${esc(appRec.ward_no || '-')}</div></div>
          <div><div style="font-size:0.8rem;color:var(--text-light);">${bilingual('DOB', 'जन्म तारीख')}</div><div style="font-weight:600;">${esc(formatDate(appRec.dob))}</div></div>
        </div>`;

      app().innerHTML = appContainer(`
        ${card(`
          ${header}
          ${renderAppStepper(status, isRej)}
          ${applicant}
          ${adminNote}
          <h4 style="margin-top:30px;margin-bottom:14px;font-size:1.1rem;color:var(--primary-dark);">📜 ${bilingual('Status History', 'स्थिती इतिहास')}</h4>
          <div class="timeline">${histHtml || `<div style="color:var(--text-gray);">${bilingual('No history entries yet.', 'अद्याप कोणतेही इतिहास नोंद नाहीत.')}</div>`}</div>
        `)}
      `);
    }

    if (paramId) {
      renderForm(paramId, savedMobile);
    } else {
      renderForm('', savedMobile);
    }
  });

  // --- /certificate/:id ---
  GP.registerRoute('certificate', null, async (ctx) => {
    const id = (ctx.params && ctx.params[0]) || '';
    GP.setBreadcrumbs([
      { label: bilingual('Home', 'मुख्यपृष्ठ'), href: '#home' },
      { label: bilingual('Services', 'सेवा'), href: '#/services' },
      { label: bilingual('Certificate', 'दाखला') },
    ]);

    app().innerHTML = appContainer(card(`<div style="text-align:center;padding:30px;"><div style="font-size:2rem;animation:spin 1s linear infinite;">⏳</div><p style="margin-top:16px;">${bilingual('Loading certificate...', 'दाखला लोड होत आहे...')}</p></div>`));

    try {
      let cert = null;
      try {
        cert = await GP.api('GET', `/api/service-applications/${id}`);
      } catch (_) {
        try {
          const mob = (localStorage && localStorage.getItem('gp_last_track_mobile')) || '';
          if (mob) {
            const res = await GP.api('POST', '/api/service-applications/track', { application_id: id, mobile: mob });
            cert = Array.isArray(res) ? res[0] : res;
          }
        } catch (_) {}
      }
      if (!cert) {
        app().innerHTML = appContainer(card(`<div style="text-align:center;padding:40px;">🚫 ${bilingual('Certificate not found.', 'दाखला सापडला नाही.')} <a href="#/track" class="btn btn-primary" style="margin-left:12px;">${bilingual('← Back to Track', '← मागोव्याकडे परत जा')}</a></div>`));
        return;
      }

      const type = cert.service_type || 'birth';
      const labels = getServiceLabel(type);
      const today = new Date().toLocaleDateString(GP.state.currentLang === 'mr' ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

      const fullName = cert.applicant_fullname_en || cert.applicant_name || '-';
      const fullNameMr = cert.applicant_fullname_mr || fullName;
      const rel = cert.father_husband_name || '-';
      const addr = cert.address_en || '-';
      const ward = cert.ward_no || '-';
      const isFemale = cert.gender === 'female';
      const prefix = isFemale ? 'Ms.' : 'Mr.';
      const soStr = isFemale ? 'D/o' : 'S/o';
      const relMr = isFemale ? 'वि.' : 'पु.';

      const titleEn = `Certificate of ${labels.en}`;
      const titleMr = `${labels.mr} दाखला`;

      const certHtml = `
        <div style="position:sticky;top:10px;z-index:10;display:flex;justify-content:flex-end;gap:10px;padding:10px 0;">
          <a href="#/track" class="btn btn-secondary">← ${bilingual('Back', 'मागे')}</a>
          <button onclick="window.print()" class="btn btn-primary">🖨️ ${bilingual('Print / Download PDF', 'छापा / PDF डाउनलोड')}</button>
        </div>
        <div class="certificate-view" id="certView">
          <div class="certificate-letterhead">
            <div class="certificate-tricolor"></div>
            <div class="certificate-gp-logo">🏛️</div>
            <div class="certificate-title">Dumbarwadi Gram Panchayat</div>
            <div class="certificate-subtitle">डुंबरवाडी ग्राम पंचायत</div>
            <div class="certificate-lgd">GP LGD Code: 185937 • Village LGD: 555263 • Dumbarwadi, Maharashtra</div>
          </div>
          <div class="certificate-body">
            <h2>${esc(titleEn)}<br><span style="font-size:1rem;">${esc(titleMr)}</span></h2>
            <div style="display:flex;justify-content:space-between;margin-bottom:30px;">
              <div style="font-size:0.9rem;color:var(--text-gray);"><strong>${bilingual('Certificate No.', 'दाखला क्र.')}:</strong> ${esc(cert.application_id || cert.id || '-')}</div>
              <div style="font-size:0.9rem;color:var(--text-gray);"><strong>${bilingual('Date', 'दिनांक')}:</strong> ${esc(today)}</div>
            </div>
            <div class="certificate-line">This is to certify that <strong>${esc(prefix)} ${esc(fullName)}</strong> / <strong>${esc(fullNameMr)}</strong> ${soStr} / ${relMr} <strong>${esc(rel)}</strong>, residing at <em style="color:var(--text-gray);">${esc(addr)}</em>, Ward No. <strong>${esc(ward)}</strong>, Dumbarwadi is hereby issued the <strong>${esc(labels.en)}</strong> / <strong>${esc(labels.mr)}</strong> certificate as per the records of the Gram Panchayat.</div>
            <div class="certificate-line">याद्वारे डुंबरवाडी ग्राम पंचायतच्या नोंदणीनुसार <strong>${esc(fullNameMr)}</strong> (${esc(fullName)}), <strong>${esc(rel)}</strong> यांचा/यांच्या मुलगा/मुलगी, वॉर्ड क्र. <strong>${esc(ward)}</strong>, पूर्ण पत्ता: <em style="color:var(--text-gray);">${esc(cert.address_mr || addr)}</em> यांना/यांना <strong>${esc(labels.mr)}</strong> दाखला जारी केला जात आहे.</div>
            <div class="certificate-line" style="margin-top:25px;"><span class="label">${bilingual('Issued on / जारी दिनांक:', 'जारी दिनांक / Issued on:')}</span><span class="value">${esc(today)}</span></div>
            <div class="certificate-line"><span class="label">${bilingual('Place / ठिकाण:', 'ठिकाण / Place:')}</span><span class="value">Dumbarwadi / डुंबरवाडी</span></div>
          </div>
          <div class="certificate-signatures">
            <div class="cert-sign-block">
              <div style="font-size:2.4rem;color:var(--text-light);">📝</div>
              <div class="cert-sign-line"></div>
              <div class="cert-sign-name">Ashish Prakash Kolhe</div>
              <div class="cert-sign-role">आशिष प्रकाश कोल्हे<br>Gram Sevak / Sachiv<br>ग्राम सेवक / सचिव</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;">
              <div style="width:120px;height:120px;border-radius:50%;border:3px dashed var(--secondary);display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:var(--text-light);text-align:center;line-height:1.4;background:repeating-radial-gradient(circle at center,var(--bg-light),var(--bg-light) 2px,var(--border) 3px);">
                <strong style="color:var(--primary-dark);">सही<br>SEAL</strong>
              </div>
              <div class="certificate-seal" style="margin-top:10px;">पंचायत शिक्का / Panchayat Seal</div>
            </div>
            <div class="cert-sign-block">
              <div style="font-size:2.4rem;color:var(--text-light);">✍️</div>
              <div class="cert-sign-line"></div>
              <div class="cert-sign-name">Shital Atul Gore</div>
              <div class="cert-sign-role">शितल अतुल गोरे<br>Sarpanch<br>सरपंच</div>
            </div>
          </div>
          <div class="certificate-seal" style="margin-top:30px;">
            This is a digitally generated certificate. For official verification, contact Panchayat Office. | हे डिजिटल रीत्या तयार केलेले दाखले आहे. अधिकृत पडताळणीसाठी पंचायत कार्यालयाशी संपर्क साधा.
          </div>
        </div>
        <style>@media print { body * { visibility:hidden; } #certView, #certView * { visibility:visible; } #certView { position:absolute;left:0;top:0;width:100%;box-shadow:none;border:none; } .certificate-view { border:none!important; } }</style>
      `;
      app().innerHTML = `<div style="padding:20px;max-width:240mm;margin:0 auto;">${certHtml}</div>`;
    } catch (err) {
      GP.showToast('error', (err && err.message) || bilingual('Failed to load certificate.', 'दाखला लोड करणे अयशस्वी.'));
    }
  });

  // ========== COMPLAINTS ==========

  GP.registerRoute('complaints', null, async (ctx) => {
    GP.setBreadcrumbs([
      { label: bilingual('Home', 'मुख्यपृष्ठ'), href: '#home' },
      { label: bilingual('Complaints', 'तक्रारी') },
    ]);

    const citizen = GP.state.citizen || null;

    if (citizen) {
      app().innerHTML = appContainer(card(`<div style="text-align:center;padding:30px;"><div style="font-size:2rem;">⏳</div><p>${bilingual('Loading your complaints...', 'तुमच्या तक्रारी लोड होत आहेत...')}</p></div>`));
      try {
        let rows = [];
        try {
          rows = await GP.api('GET', '/api/complaints/mine') || [];
        } catch (_) {
          rows = [];
        }
        const items = rows.map(r => {
          const ctype = COMPLAINT_TYPES[r.complaint_type] || { en: r.complaint_type, mr: r.complaint_type };
          return `<a href="#/complaint/${r.id || r.complaint_id}" style="display:block;background:var(--bg-white);border:1px solid var(--border);border-radius:10px;padding:18px;margin-bottom:12px;box-shadow:var(--shadow);transition:all .2s;" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='translateY(0)';">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;">
              <div>
                <div style="font-weight:600;font-size:1.05rem;">${esc(r.complaint_id || r.id)} — ${esc(bilingual(ctype.en, ctype.mr))}</div>
                <div style="font-size:0.85rem;color:var(--text-gray);margin-top:4px;">${esc(formatDateTime(r.created_at))} • ${bilingual('Ward', 'वॉर्ड')} ${esc(r.location_ward || '-')}</div>
              </div>
              <div>${statusBadge(r.status || 'submitted')}</div>
            </div>
          </a>`;
        }).join('');
        app().innerHTML = appContainer(`
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
            <div>
              ${h2('My Complaints', 'माझ्या तक्रारी', 'margin-bottom:6px;')}
              <p style="color:var(--text-gray);">${bilingual('View and track all grievances submitted by you.', 'तुमच्या नोंदवलेल्या सर्व तक्रारी पहा व त्यांचा मागोवा घ्या.')}</p>
            </div>
            <a href="#/complaint/new" class="btn btn-primary">➕ ${bilingual('New Complaint', 'नवीन तक्रार')}</a>
          </div>
          ${items ? card(`<div>${items}</div>`) : card(`<div style="text-align:center;padding:40px;"><div style="font-size:3rem;margin-bottom:12px;">📭</div><h3>${bilingual('No complaints yet.', 'अद्याप कोणत्याही तक्रार नाहीत.')}</h3><p style="color:var(--text-gray);margin:12px 0 22px;">${bilingual('Submit a new grievance to get started.', 'सुरू करण्यासाठी नवीन तक्रार सबमिट करा.')}</p><a href="#/complaint/new" class="btn btn-primary">➕ ${bilingual('Register Complaint', 'तक्रार नोंदवा')}</a></div>`)}
        `);
      } catch (err) {
        GP.showToast('error', (err && err.message) || bilingual('Failed to load.', 'लोड करणे अयशस्वी.'));
      }
      return;
    }

    app().innerHTML = appContainer(`
      ${h2('Look up a Complaint', 'तक्रार चेक करा')}
      <p style="color:var(--text-gray);margin-bottom:24px;">${bilingual('Enter complaint ID and mobile number to check status.', 'स्थिती तपासण्यासाठी तक्रार क्रमांक आणि मोबाइल नंबर टाका.')}</p>
      ${card(`
        <form id="complaintLookupForm" style="max-width:540px;margin:0 auto;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            ${inputField('complaint_id', 'Complaint ID', 'तक्रार क्रमांक', 'text', { required: true, placeholder: 'e.g. CMP-XXXX' })}
            ${inputField('complainant_mobile', 'Complainant Mobile (10 digits)', 'तक्रारकर्त्याचा मोबाइल (10 अंक)', 'tel', { required: true, extra: 'maxlength="10" pattern="[0-9]{10}"', placeholder: '98XXXXXX21' })}
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:10px;padding:14px;">🔍 ${bilingual('Lookup', 'शोधा')}</button>
          <div style="text-align:center;margin-top:16px;"><a href="#/complaint/new" class="btn btn-secondary" style="margin-top:10px;">➕ ${bilingual('Register New Complaint', 'नवीन तक्रार नोंदवा')}</a></div>
        </form>
      `)}
    `);
    const frm = document.getElementById('complaintLookupForm');
    if (frm) frm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(frm);
      const cid = (fd.get('complaint_id') || '').toString().trim();
      const mob = (fd.get('complainant_mobile') || '').toString().trim();
      if (!cid || !/^[0-9]{10}$/.test(mob)) {
        GP.showToast('warning', bilingual('Valid Complaint ID and 10-digit mobile required.', 'वैध तक्रार क्रमांक आणि 10 अंकी मोबाइल आवश्यक.'));
        return;
      }
      try { sessionStorage.setItem('gp_cmp_mobile', mob); } catch (_) {}
      location.hash = `#/complaint/${cid}`;
    });
  });

  GP.registerRoute('complaint-new', null, (ctx) => {
    GP.setBreadcrumbs([
      { label: bilingual('Home', 'मुख्यपृष्ठ'), href: '#home' },
      { label: bilingual('Complaints', 'तक्रारी'), href: '#/complaints' },
      { label: bilingual('New Complaint', 'नवीन तक्रार') },
    ]);

    const citizen = GP.state.citizen || null;
    const opts = Object.keys(COMPLAINT_TYPES).map(k => ({ value: k, label: COMPLAINT_TYPES[k].en, label_mr: COMPLAINT_TYPES[k].mr }));

    const formHtml = `
      <form id="complaintForm">
        <div style="border-top:3px solid var(--primary);border-radius:8px;padding:20px;margin-bottom:20px;background:var(--bg-light);">
          <h3 style="font-size:1.1rem;margin-bottom:16px;color:var(--primary-dark);display:flex;align-items:center;gap:8px;"><span>⚠️</span>${bilingual('Complaint Details', 'तक्रार तपशील')}</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            ${inputField('complaint_type', 'Complaint Type', 'तक्रार प्रकार', 'select', { required: true, options: opts })}
            ${inputField('severity', 'Severity', 'गंभीरता', 'radio', {
              required: true, value: 'medium',
              options: [
                { value: 'low', label: 'Low', label_mr: 'कमी' },
                { value: 'medium', label: 'Medium', label_mr: 'मध्यम' },
                { value: 'high', label: 'High', label_mr: 'जास्त' },
              ],
            })}
          </div>
          <div style="display:grid;grid-template-columns:1fr 2fr;gap:16px;">
            ${inputField('location_ward', 'Ward No.', 'वॉर्ड क्र.', 'number', { required: true })}
            ${inputField('landmark', 'Landmark / Area', 'लँडमार्क / परिसर', 'text', { required: true })}
          </div>
          ${inputField('description_en', 'Description (English) * Min 15 characters', 'वर्णन (इंग्रजी) * किमान 15 अक्षरे', 'textarea', { required: true, style: 'min-height:110px;', extra: 'minlength="15"' })}
          ${inputField('description_mr', 'वर्णन (मराठी) * किमान 15 अक्षरे', 'Description (Marathi) * Min 15 chars', 'textarea', { required: true, style: 'min-height:110px;', extra: 'minlength="15"' })}
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
            ${inputField('photo_1', bilingual('Photo 1 (required)', 'फोटो 1 (आवश्यक)'), bilingual('फोटो 1 (आवश्यक)', 'Photo 1 (required)'), 'file', { required: true, accept: '.jpg,.jpeg,.png', hint: bilingual('JPG/PNG, max 5 MB', 'JPG/PNG, जास्तीत जास्त 5 MB') })}
            ${inputField('photo_2', bilingual('Photo 2 (optional)', 'फोटो 2 (पर्यायी)'), bilingual('फोटो 2 (पर्यायी)', 'Photo 2 (optional)'), 'file', { accept: '.jpg,.jpeg,.png', hint: bilingual('JPG/PNG, max 5 MB', 'JPG/PNG, जास्तीत जास्त 5 MB') })}
            ${inputField('photo_3', bilingual('Photo 3 (optional)', 'फोटो 3 (पर्यायी)'), bilingual('फोटो 3 (पर्यायी)', 'Photo 3 (optional)'), 'file', { accept: '.jpg,.jpeg,.png', hint: bilingual('JPG/PNG, max 5 MB', 'JPG/PNG, जास्तीत जास्त 5 MB') })}
          </div>
        </div>

        <div style="border-top:3px solid var(--secondary);border-radius:8px;padding:20px;margin-bottom:20px;background:var(--bg-light);">
          <h3 style="font-size:1.1rem;margin-bottom:16px;color:var(--primary-dark);display:flex;align-items:center;gap:8px;"><span>👤</span>${bilingual('Complainant Information', 'तक्रारकर्त्याची माहिती')}</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            ${inputField('complainant_name', 'Your Full Name', 'तुमचे पूर्ण नाव', 'text', { required: true, value: citizen ? (citizen.fullname_en || citizen.name || '') : '' })}
            ${inputField('complainant_mobile', 'Mobile (10 digits)', 'मोबाइल (10 अंक)', 'tel', { required: true, value: citizen ? (citizen.mobile || '') : '', extra: 'maxlength="10" pattern="[0-9]{10}"', placeholder: '98XXXXXX21' })}
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%;padding:14px;font-size:1.05rem;">📤 ${bilingual('Submit Complaint', 'तक्रार सादर करा')}</button>
      </form>
    `;

    app().innerHTML = appContainer(`
      ${h2('Register New Complaint', 'नवीन तक्रार नोंदवा')}
      <p style="color:var(--text-gray);margin-bottom:24px;">${bilingual('Report civic issues directly to the Panchayat Office.', 'पंचायत कार्यालयाला थेट नागरी समस्या कळवा.')}</p>
      ${card(formHtml)}
    `);

    const form = document.getElementById('complaintForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try { await GP.ensureCsrf(); } catch (_) {
        GP.showToast('error', bilingual('Security error. Refresh.', 'सुरक्षा त्रुटी. रिफ्रेश करा.'));
        return;
      }
      const fd = new FormData(form);
      const data = {};
      fd.forEach((v, k) => { if (v !== '' && !(v instanceof File)) data[k] = v; });

      if (!data.complaint_type || !data.severity || !data.location_ward || !data.landmark || !data.description_en || !data.description_mr || !data.complainant_name || !data.complainant_mobile) {
        GP.showToast('warning', bilingual('Please fill all required fields.', 'सर्व आवश्यक फील्ड भरा.'));
        return;
      }
      if (data.description_en.length < 15 || data.description_mr.length < 15) {
        GP.showToast('warning', bilingual('Description must be at least 15 characters.', 'वर्णन किमान 15 अक्षरांचे असणे आवश्यक आहे.'));
        return;
      }
      if (!/^[0-9]{10}$/.test(data.complainant_mobile)) {
        GP.showToast('warning', bilingual('Mobile must be 10 digits.', 'मोबाइल 10 अंकी असणे आवश्यक आहे.'));
        return;
      }

      const photos = [];
      const maxSize = 5 * 1024 * 1024;
      let hasAtLeastOne = false;
      for (const key of ['photo_1', 'photo_2', 'photo_3']) {
        const inp = form.querySelector(`input[name="${key}"]`);
        if (!inp || !inp.files || !inp.files.length) continue;
        const f = inp.files[0];
        if (f.size > maxSize) { GP.showToast('warning', bilingual(`Photo ${f.name} exceeds 5 MB.`, `फोटो ${f.name} 5 MB पेक्षा मोठी आहे.`)); return; }
        try {
          const d = await readAsDataURL(f);
          photos.push({ name: f.name, type: f.type, size: f.size, data: d });
          if (key === 'photo_1') hasAtLeastOne = true;
        } catch (_) { GP.showToast('error', bilingual(`Failed to read ${f.name}`, `${f.name} वाचण्यात अपयश`)); return; }
      }
      if (!hasAtLeastOne) {
        GP.showToast('warning', bilingual('At least Photo 1 is required.', 'किमान फोटो 1 आवश्यक आहे.'));
        return;
      }

      try {
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = bilingual('Submitting...', 'सादर करत आहे...');
        const payload = {
          complaint_type: data.complaint_type,
          location_ward: data.location_ward,
          landmark: data.landmark,
          description_en: data.description_en,
          description_mr: data.description_mr,
          severity: data.severity,
          complainant_name: data.complainant_name,
          complainant_mobile: data.complainant_mobile,
          photos,
        };
        const res = await GP.api('POST', '/api/complaints', payload);
        const cid = (res && (res.complaint_id || res.id)) || '-';
        try { sessionStorage.setItem('gp_cmp_mobile', data.complainant_mobile); } catch (_) {}
        GP.showToast('success', bilingual('Complaint registered! / तक्रार नोंदवली!', 'तक्रार नोंदवली! / Complaint registered!'));

        app().innerHTML = appContainer(card(`
          <div style="text-align:center;padding:30px;">
            <div style="font-size:4rem;margin-bottom:16px;">✅</div>
            <h3 style="font-size:1.4rem;margin-bottom:10px;color:var(--success);">${bilingual('Complaint Registered Successfully!', 'तक्रार यशस्वीरित्या नोंदवली गेली!')}</h3>
            <p style="color:var(--text-gray);margin-bottom:24px;">${bilingual('Thank you! The Panchayat will review your grievance shortly.', 'धन्यवाद! लवकरच पंचायत तुमच्या तक्रारीचे पुनरावलोकन करेल.')}</p>
            <div style="background:var(--gradient);color:#fff;padding:24px;border-radius:12px;margin-bottom:24px;">
              <div style="font-size:0.9rem;opacity:0.9;margin-bottom:6px;">${bilingual('Complaint ID / तक्रार क्रमांक', 'तक्रार क्रमांक / Complaint ID')}</div>
              <div style="font-size:2.4rem;font-weight:700;">${esc(cid)}</div>
            </div>
            <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
              <a href="#/complaint/${cid}" class="btn btn-primary">📑 ${bilingual('View Complaint', 'तक्रार पहा')} →</a>
              <a href="#/complaints" class="btn btn-secondary">${bilingual('← Back to Complaints', '← तक्रारींकडे परत जा')}</a>
            </div>
          </div>
        `));
      } catch (err) {
        GP.showToast('error', (err && err.message) || bilingual('Submission failed.', 'सादर करणे अयशस्वी.'));
        const btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = false; btn.textContent = bilingual('Submit Complaint', 'तक्रार सादर करा'); }
      }
    });
  });

  GP.registerRoute('complaint-detail', null, async (ctx) => {
    const id = (ctx.params && ctx.params[0]) || '';
    GP.setBreadcrumbs([
      { label: bilingual('Home', 'मुख्यपृष्ठ'), href: '#home' },
      { label: bilingual('Complaints', 'तक्रारी'), href: '#/complaints' },
      { label: `${bilingual('Complaint', 'तक्रार')}: ${id}` },
    ]);
    app().innerHTML = appContainer(card(`<div style="text-align:center;padding:30px;"><div style="font-size:2rem;">⏳</div><p>${bilingual('Loading complaint...', 'तक्रार लोड होत आहे...')}</p></div>`));

    try {
      let cmpl = null;
      try {
        cmpl = await GP.api('GET', `/api/complaints/${id}`);
      } catch (_) {
        let mob = '';
        try { mob = sessionStorage.getItem('gp_cmp_mobile') || ''; } catch (_) {}
        if (!mob) {
          // prompt for mobile
          app().innerHTML = appContainer(card(`
            <div style="max-width:500px;margin:0 auto;text-align:center;">
              <h3 style="margin-bottom:16px;">${bilingual('Enter complainant mobile to continue', 'सुरू ठेवण्यासाठी तक्रारकर्त्याचा मोबाइल टाका')}</h3>
              <form id="mobilePromptForm">
                ${inputField('complainant_mobile', 'Mobile (10 digits)', 'मोबाइल (10 अंक)', 'tel', { required: true, extra: 'maxlength="10" pattern="[0-9]{10}"' })}
                <button type="submit" class="btn btn-primary" style="margin-top:10px;">${bilingual('Continue', 'सुरू ठेवा')}</button>
              </form>
            </div>
          `));
          const pf = document.getElementById('mobilePromptForm');
          if (pf) pf.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(pf);
            const mob2 = (fd.get('complainant_mobile') || '').toString().trim();
            if (!/^[0-9]{10}$/.test(mob2)) {
              GP.showToast('warning', bilingual('Valid 10-digit mobile required.', 'वैध 10 अंकी मोबाइल आवश्यक.'));
              return;
            }
            try { sessionStorage.setItem('gp_cmp_mobile', mob2); } catch (_) {}
            try {
              await GP.ensureCsrf();
              const res = await GP.api('POST', '/api/complaints/track', { complaint_id: id, mobile: mob2 });
              cmpl = Array.isArray(res) ? res[0] : res;
              if (cmpl) renderComplaint(cmpl);
              else GP.showToast('warning', bilingual('Complaint not found.', 'तक्रार सापडली नाही.'));
            } catch (err) { GP.showToast('error', (err && err.message) || bilingual('Failed.', 'अयशस्वी.')); }
          });
          return;
        }
        try {
          await GP.ensureCsrf();
          const res = await GP.api('POST', '/api/complaints/track', { complaint_id: id, mobile: mob });
          cmpl = Array.isArray(res) ? res[0] : res;
        } catch (_) {}
      }
      if (!cmpl) {
        app().innerHTML = appContainer(card(`<div style="text-align:center;padding:40px;">🚫 ${bilingual('Complaint not found.', 'तक्रार सापडली नाही.')} <a href="#/complaints" class="btn btn-primary" style="margin-left:12px;">← ${bilingual('Back', 'मागे')}</a></div>`));
        return;
      }
      renderComplaint(cmpl);
    } catch (err) {
      GP.showToast('error', (err && err.message) || bilingual('Failed to load.', 'लोड करणे अयशस्वी.'));
    }

    function renderComplaint(c) {
      const ctype = COMPLAINT_TYPES[c.complaint_type] || { en: c.complaint_type, mr: c.complaint_type };
      const sevClass = c.severity === 'high' ? 'badge-rejected' : c.severity === 'medium' ? 'badge-under_review' : 'badge-pending';
      const history = Array.isArray(c.status_history) && c.status_history.length ? c.status_history : [
        { status: 'submitted', timestamp: c.created_at, note: bilingual('Complaint submitted by citizen.', 'तक्रार नागरिकाद्वारे सादर केली गेली.') },
      ];

      const steps = [
        { key: 'submitted', en: 'Submitted', mr: 'सादर केले' },
        { key: 'under_review', en: 'Under Review', mr: 'संशोधनाधीन' },
        { key: 'in_progress', en: 'In Progress', mr: 'कार्य सुरू' },
        { key: 'resolved', en: 'Resolved', mr: 'निराकरण' },
      ];
      const order = ['submitted', 'under_review', 'in_progress', 'resolved'];
      const latest = history.length ? (history[history.length - 1].status || 'submitted') : 'submitted';
      let curIdx = order.indexOf(latest);
      if (curIdx < 0) curIdx = 0;

      const stepHtml = steps.map((s, i) => {
        const isActive = i <= curIdx;
        return `<div class="timeline-step ${isActive ? 'active' : ''}">
          ${i < steps.length - 1 ? '<div class="timeline-line"></div>' : ''}
          <div class="timeline-label">${esc(bilingual(s.en, s.mr))}</div>
          ${i === curIdx ? `<div class="timeline-desc">${esc(formatDateTime(history[history.length - 1]?.timestamp || c.created_at))}</div>` : ''}
        </div>`;
      }).join('');

      const histHtml = history.map(h => `
        <div style="padding:12px 14px;background:var(--bg-light);border-radius:8px;margin-bottom:10px;border-left:3px solid var(--primary);">
          <div style="display:flex;justify-content:space-between;gap:10px;">
            <div style="font-weight:600;">${statusBadge(h.status || 'submitted')} <span style="margin-left:8px;">${esc((h.status || '').replace(/_/g, ' '))}</span></div>
            <div style="font-size:0.8rem;color:var(--text-light);">${esc(formatDateTime(h.timestamp || h.created_at || h.date))}</div>
          </div>
          ${h.note || h.comment ? `<div style="margin-top:6px;color:var(--text-gray);font-size:0.9rem;">${esc(h.note || h.comment)}</div>` : ''}
        </div>
      `).join('');

      const replies = Array.isArray(c.replies) ? c.replies : [];
      const repliesHtml = replies.length ? replies.map(r => {
        const name = r.sender_name || r.admin_name || bilingual('Panchayat Office', 'पंचायत कार्यालय');
        const avatar = r.sender_avatar || '🏛️';
        return `<div style="display:flex;gap:12px;margin-bottom:16px;">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.1rem;">${avatar}</div>
          <div style="flex:1;background:var(--bg-light);padding:14px;border-radius:12px;border-top-left-radius:2px;">
            <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px;">
              <div style="font-weight:600;">${esc(name)}</div>
              <div style="font-size:0.75rem;color:var(--text-light);">${esc(formatDateTime(r.timestamp || r.created_at))}</div>
            </div>
            <div style="color:var(--text-dark);font-size:0.95rem;line-height:1.6;">${esc(r.message || r.text || r.note || '')}</div>
            ${r.photo || r.image ? `<div style="margin-top:10px;"><img src="${esc(r.photo || r.image)}" style="max-width:240px;border-radius:8px;cursor:pointer;border:1px solid var(--border);" onclick="window.open('${esc(r.photo || r.image)}','_blank')"/></div>` : ''}
          </div>
        </div>`;
      }).join('') : `<div style="color:var(--text-gray);text-align:center;padding:20px;">${bilingual('No replies yet from the Panchayat.', 'पंचायतकडून अद्याप कोणतेही उत्तर नाही.')}</div>`;

      const resolutionImgs = (c.resolution_photos && c.resolution_photos.length) ? c.resolution_photos.map(p => `
        <img src="${esc(typeof p === 'string' ? p : p.data || p.url)}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;border:1px solid var(--border);cursor:pointer;" onclick="window.open('${esc(typeof p === 'string' ? p : p.data || p.url)}','_blank')"/>
      `).join('') : '';

      app().innerHTML = appContainer(`
        ${card(`
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap;margin-bottom:16px;">
            <div>
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                <h2 style="font-size:1.6rem;font-weight:700;margin:0;">${esc(c.complaint_id || c.id || id)} — ${esc(bilingual(ctype.en, ctype.mr))}</h2>
                <span class="${sevClass}">Severity: ${esc(c.severity || '-')}</span>
                ${statusBadge(c.status || 'submitted')}
              </div>
              <div style="color:var(--text-gray);margin-top:8px;">
                ${bilingual('Submitted', 'सादर केले')}: ${esc(formatDateTime(c.created_at))} • ${bilingual('Ward', 'वॉर्ड')} ${esc(c.location_ward || '-')} • ${bilingual('Landmark', 'लँडमार्क')}: ${esc(c.landmark || '-')}
                <br>${bilingual('Complainant', 'तक्रारकर्ता')}: <strong>${esc(c.complainant_name || '-')}</strong> (${esc(c.complainant_mobile || '-')})
              </div>
            </div>
            <div>
              <a href="#/complaint/new" class="btn btn-primary" style="margin-bottom:6px;">➕ ${bilingual('New', 'नवीन')}</a><br>
              <a href="#/complaints" class="btn btn-secondary">← ${bilingual('Back to list', 'यादीकडे परत')}</a>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:20px;">
            <div>
              <h4 style="font-size:1.05rem;margin-bottom:14px;color:var(--primary-dark);">📝 ${bilingual('Description / वर्णन', 'वर्णन / Description')}</h4>
              <div style="background:var(--bg-light);padding:16px;border-radius:10px;margin-bottom:14px;">
                <div style="font-weight:600;margin-bottom:6px;color:var(--primary-dark);">English</div>
                <p style="white-space:pre-wrap;color:var(--text-dark);line-height:1.7;">${esc(c.description_en || c.description || '-')}</p>
              </div>
              <div style="background:var(--bg-light);padding:16px;border-radius:10px;">
                <div style="font-weight:600;margin-bottom:6px;color:var(--primary-dark);">मराठी</div>
                <p style="white-space:pre-wrap;color:var(--text-dark);line-height:1.7;">${esc(c.description_mr || c.description || '-')}</p>
              </div>
              ${resolutionImgs ? `<div style="margin-top:20px;"><h4 style="font-size:1rem;margin-bottom:10px;">✅ ${bilingual('Resolution Photos', 'निराकरण फोटो')} (${bilingual('click to enlarge', 'मोठ्या आकारात पहा क्लिक करा')})</h4><div style="display:flex;gap:10px;flex-wrap:wrap;">${resolutionImgs}</div></div>` : ''}
            </div>
            <div>
              <h4 style="font-size:1.05rem;margin-bottom:14px;color:var(--primary-dark);">📊 ${bilingual('Progress Timeline', 'प्रगती टाइमलाइन')}</h4>
              <div class="timeline">${stepHtml}</div>
            </div>
          </div>

          <h4 style="font-size:1.05rem;margin:30px 0 14px;color:var(--primary-dark);">📜 ${bilingual('Status History', 'स्थिती इतिहास')}</h4>
          <div>${histHtml}</div>

          <h4 style="font-size:1.05rem;margin:30px 0 14px;color:var(--primary-dark);">💬 ${bilingual('Panchayat Replies / पंचायत उत्तरे', 'पंचायत उत्तरे / Panchayat Replies')}</h4>
          <div>${repliesHtml}</div>
        `)}
      `);
    }
  });

  // ========== NOTICES ==========

  GP.registerRoute('notices', null, async (ctx) => {
    GP.setBreadcrumbs([
      { label: bilingual('Home', 'मुख्यपृष्ठ'), href: '#home' },
      { label: bilingual('Notices', 'सूचना') },
    ]);

    app().innerHTML = appContainer(card(`<div style="text-align:center;padding:30px;"><div style="font-size:2rem;">⏳</div><p>${bilingual('Loading notices...', 'सूचना लोड होत आहेत...')}</p></div>`));

    try {
      let notices = [];
      try { notices = await GP.api('GET', '/api/notices') || []; } catch (_) { notices = []; }
      const allTypes = ['all', 'gram_sabha', 'tenders', 'schemes', 'water_supply', 'holidays', 'general'];
      const tabLabels = {
        all: { en: 'All', mr: 'सर्व' },
        gram_sabha: { en: 'Gram Sabha', mr: 'ग्रामसभा' },
        tenders: { en: 'Tenders', mr: 'निविदा' },
        schemes: { en: 'Schemes', mr: 'योजना' },
        water_supply: { en: 'Water Supply', mr: 'जलपुरवठा' },
        holidays: { en: 'Holidays', mr: 'सुट्ट्या' },
        general: { en: 'General', mr: 'सामान्य' },
      };

      function render(typeFilter, search) {
        let rows = notices.slice();
        if (typeFilter && typeFilter !== 'all') {
          rows = rows.filter(r => (r.notice_type || r.type || '').toLowerCase() === typeFilter.toLowerCase());
        }
        if (search) {
          const q = search.toLowerCase();
          rows = rows.filter(r => {
            const a = `${r.title_en || ''} ${r.title_mr || ''} ${r.description_en || ''} ${r.description_mr || ''} ${r.title || ''} ${r.description || ''}`.toLowerCase();
            return a.includes(q);
          });
        }

        const tabs = allTypes.map(t => {
          const active = (t === (typeFilter || 'all'));
          const lb = tabLabels[t] || { en: t, mr: t };
          return `<button onclick="window.__gpSwitchNotice('${t}')" style="padding:8px 18px;border-radius:999px;border:1px solid ${active ? 'var(--primary)' : 'var(--border)'};background:${active ? 'var(--gradient)' : 'var(--bg-white)'};color:${active ? '#fff' : 'var(--text-dark)'};cursor:pointer;font-weight:600;transition:all .2s;font-family:inherit;">${esc(bilingual(lb.en, lb.mr))}</button>`;
        }).join('');

        const cards = rows.map(n => {
          const d = n.date || n.published_at || n.created_at || '';
          let day = '', month = '';
          try {
            const dt = new Date(d);
            day = String(dt.getDate()).padStart(2, '0');
            const mi = dt.getMonth();
            const monthsEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const monthsMr = ['जाने','फेब्रु','मार्च','एप्रि','मे','जून','जुलै','ऑग','सेप्ट','ऑक्टो','नोव्हें','डिसें'];
            month = GP.state.currentLang === 'mr' ? (monthsMr[mi] || monthsEn[mi]) : monthsEn[mi];
          } catch (_) {}

          const title = t(n, 'title') || n.title_en || n.title || '';
          const desc = (t(n, 'description') || n.description_en || n.description || '').toString();
          const snippet = desc.length > 120 ? desc.slice(0, 120) + '...' : desc;
          const typeLb = (n.notice_type || n.type || 'general').replace(/_/g, ' ');
          const pdfHref = n.pdf_attachment ? `data:application/pdf;base64,${typeof n.pdf_attachment === 'string' && n.pdf_attachment.startsWith('data:') ? '' : ''}${n.pdf_attachment}` : null;
          const filename = n.download_filename || `notice-${n.id || 'item'}.pdf`;
          const pdfBtn = pdfHref ? `<a href="${pdfHref}" download="${esc(filename)}" class="btn-small" style="text-decoration:none;background:var(--success)!important;margin-left:8px;">📄 PDF</a>` : '';
          return `<div style="display:flex;gap:18px;padding:20px;background:var(--bg-white);border:1px solid var(--border);border-radius:12px;margin-bottom:16px;box-shadow:var(--shadow);">
            <div style="width:80px;min-width:80px;height:80px;background:var(--gradient);color:#fff;border-radius:10px;text-align:center;display:flex;flex-direction:column;justify-content:center;box-shadow:var(--shadow);">
              <div style="font-size:1.6rem;font-weight:700;line-height:1;">${esc(day || '—')}</div>
              <div style="font-size:0.85rem;font-weight:600;margin-top:3px;opacity:0.95;">${esc(month || '')}</div>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap;">
                <div>
                  <h3 style="font-size:1.1rem;font-weight:600;margin-bottom:4px;">${esc(title)}</h3>
                  <span class="notice-badge" style="margin-bottom:8px;display:inline-block;">${esc(typeLb)}</span>
                </div>
                <div>${pdfBtn}<a href="#/notices/${n.id || n.slug || n.notice_id || ''}" class="btn-small" style="text-decoration:none;">${bilingual('View Notice', 'सूचना पहा')} →</a></div>
              </div>
              <p style="color:var(--text-gray);font-size:0.9rem;line-height:1.6;margin-top:6px;">${esc(snippet)}</p>
            </div>
          </div>`;
        }).join('');

        app().innerHTML = appContainer(`
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:16px;flex-wrap:wrap;">
            <div>
              ${h2('Notices & Announcements', 'सूचना व जाहिराती', 'margin-bottom:4px;')}
              <p style="color:var(--text-gray);">${bilingual('Stay updated with official announcements from Dumbarwadi Gram Panchayat.', 'डुंबरवाडी ग्राम पंचायतच्या अधिकृत जाहिरातींसह अद्ययावत रहा.')}</p>
            </div>
            <div style="position:relative;">
              <input id="noticeSearch" type="text" placeholder="${bilingual('🔍 Search notices...', '🔍 सूचना शोधा...')}" style="padding:10px 16px;border:1px solid var(--border);border-radius:999px;width:280px;font-family:inherit;font-size:0.9rem;" value="${esc(search || '')}"/>
            </div>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;overflow-x:auto;padding-bottom:6px;">
            ${tabs}
          </div>

          ${cards ? cards : card(`<div style="text-align:center;padding:40px;"><div style="font-size:3rem;margin-bottom:12px;">📭</div><h3>${bilingual('No notices in this category.', 'या श्रेणीत कोणत्याही सूचना नाहीत.')}</h3></div>`)}
        `);

        window.__gpSwitchNotice = (t) => {
          const s = document.getElementById('noticeSearch');
          render(t, s ? s.value : '');
        };
        const sbox = document.getElementById('noticeSearch');
        if (sbox) sbox.addEventListener('input', (e) => {
          const cur = allTypes.map(t => {
            const b = document.querySelectorAll('button');
            return null;
          });
          let activeT = 'all';
          for (const t of allTypes) {
            const btns = document.querySelectorAll('button');
            for (const b of btns) {
              if (b.textContent && b.textContent.includes(bilingual(tabLabels[t].en, tabLabels[t].mr)) && b.style.background && b.style.background.includes('gradient')) {
                activeT = t;
                break;
              }
            }
          }
          render(activeT, e.target.value);
        });
      }

      render('all', '');
    } catch (err) {
      GP.showToast('error', (err && err.message) || bilingual('Failed to load.', 'लोड करणे अयशस्वी.'));
    }
  });

  GP.registerRoute('notice-detail', null, async (ctx) => {
    const id = (ctx.params && ctx.params[0]) || '';
    GP.setBreadcrumbs([
      { label: bilingual('Home', 'मुख्यपृष्ठ'), href: '#home' },
      { label: bilingual('Notices', 'सूचना'), href: '#/notices' },
      { label: bilingual('Notice Detail', 'सूचना तपशील') },
    ]);

    app().innerHTML = appContainer(card(`<div style="text-align:center;padding:30px;"><div style="font-size:2rem;">⏳</div><p>${bilingual('Loading notice...', 'सूचना लोड होत आहे...')}</p></div>`));

    try {
      let notice = null;
      try { notice = await GP.api('GET', `/api/notices/${id}`); } catch (_) {}
      if (!notice) {
        try {
          const list = await GP.api('GET', '/api/notices') || [];
          notice = list.find(n => String(n.id) === String(id) || String(n.slug || '') === String(id) || String(n.notice_id || '') === String(id)) || null;
        } catch (_) {}
      }
      if (!notice) {
        app().innerHTML = appContainer(card(`<div style="text-align:center;padding:40px;">🚫 ${bilingual('Notice not found.', 'सूचना सापडली नाही.')} <a href="#/notices" class="btn btn-primary" style="margin-left:12px;">← ${bilingual('Back to Notices', 'सूचनांकडे परत जा')}</a></div>`));
        return;
      }
      const d = notice.date || notice.published_at || notice.created_at || '';
      let dateStr = '';
      try { dateStr = new Date(d).toLocaleDateString(GP.state.currentLang === 'mr' ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (_) {}

      const title = t(notice, 'title') || notice.title_en || notice.title || '';
      const desc = t(notice, 'description') || notice.description_en || notice.description || notice.body || '';

      const pdfHref = notice.pdf_attachment ? (notice.pdf_attachment.startsWith('data:') ? notice.pdf_attachment : `data:application/pdf;base64,${notice.pdf_attachment}`) : null;
      const filename = notice.download_filename || `notice-${notice.id || 'item'}.pdf`;

      app().innerHTML = appContainer(card(`
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
          <div style="max-width:820px;">
            <a href="#/notices" style="color:var(--primary);font-weight:500;font-size:0.95rem;display:inline-block;margin-bottom:14px;">← ${bilingual('Back to All Notices', 'सर्व सूचनांकडे परत जा')}</a>
            <div style="font-size:0.9rem;color:var(--text-light);margin-bottom:10px;">📅 ${esc(dateStr)} ${notice.notice_type || notice.type ? `• <span class="notice-badge" style="margin-left:6px;">${esc((notice.notice_type || notice.type).replace(/_/g, ' '))}</span>` : ''}</div>
            <h1 style="font-size:2rem;font-weight:700;margin-bottom:20px;line-height:1.3;">${esc(title)}</h1>
            <div style="color:var(--text-dark);line-height:1.8;font-size:1rem;white-space:pre-wrap;">${esc(desc)}</div>
          </div>
          <div>
            ${pdfHref ? `<a href="${pdfHref}" download="${esc(filename)}" class="btn btn-primary" style="white-space:nowrap;">📄 ${bilingual('Download PDF', 'PDF डाउनलोड करा')}</a>` : ''}
          </div>
        </div>
      `));
    } catch (err) {
      GP.showToast('error', (err && err.message) || bilingual('Failed to load.', 'लोड करणे अयशस्वी.'));
    }
  });

  // ========== GRAM SABHA ==========

  GP.registerRoute('gramsabha', null, async (ctx) => {
    GP.setBreadcrumbs([
      { label: bilingual('Home', 'मुख्यपृष्ठ'), href: '#home' },
      { label: bilingual('Gram Sabha', 'ग्रामसभा') },
    ]);

    app().innerHTML = appContainer(card(`<div style="text-align:center;padding:30px;"><div style="font-size:2rem;">⏳</div><p>${bilingual('Loading Gram Sabha details...', 'ग्रामसभा तपशील लोड होत आहेत...')}</p></div>`));

    try {
      let upcoming = null, past = [];
      try { upcoming = await GP.api('GET', '/api/gram-sabha/upcoming'); } catch (_) {}
      try { past = await GP.api('GET', '/api/gram-sabha/past') || []; } catch (_) { past = []; }

      function formatLongDate(iso) {
        if (!iso) return '-';
        try { return new Date(iso).toLocaleDateString(GP.state.currentLang === 'mr' ? 'mr-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (_) { return iso; }
      }

      let upcomingHtml = '';
      if (upcoming) {
        const agItems = Array.isArray(upcoming.agenda) ? upcoming.agenda : [];
        const agendaTbl = agItems.length ? agItems.map((a, i) => {
          const at = t(a, 'title') || a.title_en || a.title || '';
          const ad = t(a, 'description') || a.description_en || a.description || '';
          return `<tr>
            <td style="padding:10px 12px;border-bottom:1px solid var(--border);text-align:center;vertical-align:top;font-weight:600;">${i + 1}</td>
            <td style="padding:10px 12px;border-bottom:1px solid var(--border);font-weight:600;vertical-align:top;">${esc(at)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid var(--border);color:var(--text-gray);vertical-align:top;">${esc(ad)}</td>
          </tr>`;
        }).join('') : `<tr><td colspan="3" style="padding:20px;text-align:center;color:var(--text-gray);">${bilingual('Agenda not published yet.', 'अजेंडा अद्याप प्रकाशित नाही.')}</td></tr>`;

        const dateStr = formatLongDate(upcoming.date || upcoming.meeting_date);
        const publishedStr = formatLongDate(upcoming.published_at || upcoming.created_at);
        const timeStr = upcoming.time || '10:00 AM';
        const venue = t(upcoming, 'venue') || upcoming.venue || bilingual('Panchayat Office Hall, Dumbarwadi', 'पंचायत कार्यालय हॉल, डुंबरवाडी');
        const chair = upcoming.chairperson || 'Sarpanch Shital Atul Gore';

        const icsBlob = encodeURIComponent(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTAMP:${new Date().toISOString().replace(/[-:TZ]/g,'').slice(0,14)}Z
SUMMARY:Gram Sabha - Dumbarwadi
DTSTART:${(upcoming.date||new Date()).toString().slice(0,10).replace(/-/g,'')}
DTEND:${(upcoming.date||new Date()).toString().slice(0,10).replace(/-/g,'')}
LOCATION:${venue}
DESCRIPTION:Gram Sabha Dumbarwadi
END:VEVENT
END:VCALENDAR`);

        upcomingHtml = card(`
          <div style="display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;">
            <div style="flex:1;min-width:300px;">
              <div style="display:inline-flex;align-items:center;gap:8px;background:var(--success);color:#fff;padding:4px 14px;border-radius:999px;font-weight:600;font-size:0.85rem;margin-bottom:14px;">📌 ${bilingual('Upcoming Meeting', 'आगामी सभा')}</div>
              <h2 style="font-size:1.8rem;margin-bottom:10px;">${esc(t(upcoming, 'title') || upcoming.title || bilingual('Gram Sabha (General Meeting)', 'ग्रामसभा (सामान्य सभा)'))}</h2>
              <div style="background:var(--gradient);color:#fff;padding:22px;border-radius:12px;margin-bottom:18px;">
                <div style="font-size:2.6rem;font-weight:700;line-height:1.1;">${esc(dateStr)}</div>
                <div style="font-size:1.2rem;font-weight:500;margin-top:6px;opacity:0.95;">⏰ ${esc(timeStr)}</div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:0.95rem;">
                <div><div style="color:var(--text-light);font-size:0.8rem;">${bilingual('Venue', 'ठिकाण')}</div><div style="font-weight:600;">${esc(venue)}</div></div>
                <div><div style="color:var(--text-light);font-size:0.8rem;">${bilingual('Chairperson', 'अध्यक्ष')}</div><div style="font-weight:600;">${esc(chair)}</div></div>
                <div><div style="color:var(--text-light);font-size:0.8rem;">${bilingual('Published On', 'प्रकाशित तारीख')}</div><div style="font-weight:600;">${esc(publishedStr)}</div></div>
                <div><div style="color:var(--text-light);font-size:0.8rem;">${bilingual('GP / Village', 'ग्राम पंचायत')}</div><div style="font-weight:600;">Dumbarwadi (LGD 185937)</div></div>
              </div>
              <div style="margin-top:18px;display:flex;gap:10px;flex-wrap:wrap;">
                <a href="data:text/calendar;charset=utf-8,${icsBlob}" download="gram-sabha.ics" class="btn btn-primary">📅 ${bilingual('Add to Calendar', 'कॅलेंडरमध्ये जोडा')}</a>
                <a href="#/notices" class="btn btn-secondary">📄 ${bilingual('View Full Notice', 'संपूर्ण सूचना पहा')}</a>
              </div>
            </div>
            <div style="flex:1;min-width:360px;">
              <h3 style="font-size:1.15rem;margin-bottom:14px;color:var(--primary-dark);display:flex;align-items:center;gap:8px;"><span>📋</span>${bilingual('Meeting Agenda', 'सभेचा अजेंडा')}</h3>
              <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;">
                <table style="width:100%;border-collapse:collapse;">
                  <thead><tr style="background:var(--bg-light);">
                    <th style="padding:12px;text-align:left;font-size:0.9rem;color:var(--text-gray);width:50px;">#</th>
                    <th style="padding:12px;text-align:left;font-size:0.9rem;color:var(--text-gray);">${bilingual('Agenda Item', 'अजेंडा आयटम')}</th>
                    <th style="padding:12px;text-align:left;font-size:0.9rem;color:var(--text-gray);">${bilingual('Description', 'सविस्तर')}</th>
                  </tr></thead>
                  <tbody>${agendaTbl}</tbody>
                </table>
              </div>
            </div>
          </div>
        `);
      } else {
        upcomingHtml = card(`
          <div style="display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;">
            <div style="flex:1;">
              <div style="display:inline-flex;align-items:center;gap:8px;background:var(--text-light);color:#fff;padding:4px 14px;border-radius:999px;font-weight:600;font-size:0.85rem;margin-bottom:14px;">📌 ${bilingual('Upcoming Meeting', 'आगामी सभा')}</div>
              <h2 style="font-size:1.8rem;margin-bottom:10px;">${bilingual('Next Gram Sabha Date TBD', 'पुढील ग्रामसभेची तारीख ठरवणे बाकी')}</h2>
              <p style="color:var(--text-gray);margin:16px 0;">${bilingual('The date for the next general body meeting will be announced soon. Please check notices page regularly.', 'पुढील सामान्य सभेची तारीख लवकरच जाहीर केली जाईल. कृपया सूचना पान नियमित तपासा.')}</p>
              <a href="#/notices" class="btn btn-primary">📄 ${bilingual('Check Notices', 'सूचना तपासा')}</a>
            </div>
            <div style="font-size:6rem;opacity:0.2;">🏛️</div>
          </div>
        `);
      }

      function decisionBadge(d) {
        const clr = d === 'approved' ? 'var(--success)' : d === 'postponed' ? 'var(--warning)' : d === 'discussed' ? 'var(--accent)' : 'var(--text-light)';
        const label = d ? String(d).replace(/_/g, ' ') : 'discussed';
        return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:0.75rem;font-weight:700;color:#fff;background:${clr};text-transform:capitalize;">${esc(label)}</span>`;
      }

      const pastHtml = past.length ? past.map((m, idx) => {
        const dateStr = formatLongDate(m.date || m.meeting_date);
        const venue = t(m, 'venue') || m.venue || '-';
        const chair = m.chairperson || '-';
        const attendance = m.attendance_count || '—';
        const minutes = t(m, 'minutes_text') || m.minutes_text || m.minutes || '';
        const ags = Array.isArray(m.agenda) ? m.agenda : [];
        const members = Array.isArray(m.attendance_list) ? m.attendance_list : Array.isArray(m.members) ? m.members : [];
        const isOpen = idx === 0;
        const accId = `gs-acc-${idx}`;
        const agendaRows = ags.length ? ags.map((a, i) => {
          const at = t(a, 'title') || a.title || '';
          const decision = decisionBadge(a.decision || a.status);
          const note = t(a, 'decision_note') || a.decision_note || t(a, 'description') || a.description || '';
          return `<div style="display:grid;grid-template-columns:50px 1fr 140px;gap:12px;padding:10px 0;border-bottom:1px dashed var(--border);">
            <div style="font-weight:600;text-align:center;">${i + 1}</div>
            <div><div style="font-weight:600;">${esc(at)}</div>${note ? `<div style="font-size:0.85rem;color:var(--text-gray);margin-top:3px;">${esc(note)}</div>` : ''}</div>
            <div>${decision}</div>
          </div>`;
        }).join('') : `<div style="padding:12px;color:var(--text-gray);text-align:center;font-size:0.9rem;">—</div>`;

        const memberRows = members.length ? members.map((mm, i) => `
          <tr>
            <td style="padding:6px 10px;border-bottom:1px solid var(--border);">${i + 1}</td>
            <td style="padding:6px 10px;border-bottom:1px solid var(--border);font-weight:500;">${esc(mm.name || mm.member_name || '-')}</td>
            <td style="padding:6px 10px;border-bottom:1px solid var(--border);">${esc(mm.role || '-')}</td>
            <td style="padding:6px 10px;border-bottom:1px solid var(--border);text-align:center;">${mm.present ? '<span style="color:var(--success);font-weight:700;">✓ Present</span>' : '<span style="color:var(--danger);font-weight:500;">✗ Absent</span>'}</td>
          </tr>
        `).join('') : `<tr><td colspan="4" style="padding:14px;text-align:center;color:var(--text-gray);">${bilingual('Attendance record not available.', 'उपस्थिती रेकॉर्ड उपलब्ध नाही.')}</td></tr>`;

        return `<div style="border:1px solid var(--border);border-radius:12px;margin-bottom:16px;overflow:hidden;box-shadow:var(--shadow);">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 22px;background:var(--bg-white);cursor:pointer;" onclick="(function(){const el=document.getElementById('${accId}');if(!el)return;if(el.style.display==='none'){el.style.display='block';}else{el.style.display='none';}})()">
            <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
              <div style="width:60px;height:60px;background:var(--gradient);color:#fff;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
                <div style="font-size:1.3rem;font-weight:700;line-height:1;">${(m.date || m.meeting_date || '').toString().slice(8,10) || '—'}</div>
                <div style="font-size:0.7rem;font-weight:600;opacity:0.95;">${(m.date || m.meeting_date || '').toString().slice(5,7) || ''}</div>
              </div>
              <div>
                <div style="font-weight:700;font-size:1.1rem;">${esc(dateStr)}</div>
                <div style="font-size:0.85rem;color:var(--text-gray);">📍 ${esc(venue)} • 👥 ${bilingual('Attendance', 'उपस्थिती')}: <strong>${esc(attendance)}</strong> • 🎤 ${esc(chair)}</div>
              </div>
            </div>
            <button class="btn btn-secondary" style="padding:8px 14px;">${isOpen ? '− ' + bilingual('Hide', 'लपवा') : '+ ' + bilingual('Show details', 'तपशील पहा')}</button>
          </div>
          <div id="${accId}" style="padding:0 22px 22px;${isOpen ? '' : 'display:none;'}">
            ${minutes ? `<div style="background:var(--bg-light);padding:14px 16px;border-radius:8px;margin-bottom:16px;border-left:4px solid var(--primary);"><div style="font-weight:600;margin-bottom:6px;">📝 ${bilingual('Minutes', 'नोंदणी')}</div><div style="line-height:1.7;">${esc(minutes)}</div></div>` : ''}
            <h4 style="font-size:1rem;margin:16px 0 8px;color:var(--primary-dark);">📋 ${bilingual('Agenda & Decisions', 'अजेंडा व निर्णय')}</h4>
            <div style="border:1px solid var(--border);border-radius:8px;padding:8px 14px;">${agendaRows}</div>
            <h4 style="font-size:1rem;margin:22px 0 8px;color:var(--primary-dark);">👥 ${bilingual('Members Attendance', 'सदस्य उपस्थिती')}</h4>
            <div style="overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;border:1px solid var(--border);border-radius:8px;">
                <thead><tr style="background:var(--bg-light);">
                  <th style="padding:10px;text-align:left;font-size:0.85rem;">#</th>
                  <th style="padding:10px;text-align:left;font-size:0.85rem;">${bilingual('Name', 'नाव')}</th>
                  <th style="padding:10px;text-align:left;font-size:0.85rem;">${bilingual('Role', 'भूमिका')}</th>
                  <th style="padding:10px;text-align:left;font-size:0.85rem;">${bilingual('Status', 'स्थिती')}</th>
                </tr></thead>
                <tbody>${memberRows}</tbody>
              </table>
            </div>
          </div>
        </div>`;
      }).join('') : card(`<div style="text-align:center;padding:30px;color:var(--text-gray);">📭 ${bilingual('No past meetings records available.', 'मागील सभांचे रेकॉर्ड उपलब्ध नाहीत.')}</div>`);

      app().innerHTML = appContainer(`
        <div class="section-header" style="text-align:center;margin-bottom:32px;">
          <h2 class="section-title">${bilingual('Gram Sabha / ग्रामसभा', 'ग्रामसभा / Gram Sabha')}</h2>
          <p class="section-subtitle">${bilingual('Official proceedings, agendas and minutes of the General Body of Dumbarwadi Gram Panchayat.', 'डुंबरवाडी ग्राम पंचायतच्या सामान्य सभेच्या अधिकृत कार्यवाही, अजेंडा व नोंदणी.')}</p>
        </div>
        <div style="margin-bottom:28px;">${upcomingHtml}</div>
        <div>
          <h3 style="font-size:1.4rem;margin-bottom:18px;color:var(--text-dark);display:flex;align-items:center;gap:10px;"><span>📜</span>${bilingual('Past Meetings / मागील सभा', 'मागील सभा / Past Meetings')}</h3>
          ${pastHtml}
        </div>
      `);
    } catch (err) {
      GP.showToast('error', (err && err.message) || bilingual('Failed to load.', 'लोड करणे अयशस्वी.'));
    }
  });

  // ========== PROJECTS ==========

  const CATEGORY_OPTS = [
    { value: 'all', en: 'All', mr: 'सर्व' },
    { value: 'roads', en: 'Roads', mr: 'रस्ते' },
    { value: 'drainage', en: 'Drainage', mr: 'गटार' },
    { value: 'street_lights', en: 'Street Lights', mr: 'स्ट्रीट लाइट्स' },
    { value: 'water', en: 'Water', mr: 'पाणी' },
    { value: 'solar', en: 'Solar', mr: 'सौर' },
    { value: 'other', en: 'Other', mr: 'इतर' },
  ];
  const STATUS_OPTS = [
    { value: 'all', en: 'All', mr: 'सर्व' },
    { value: 'planning', en: 'Planning', mr: 'नियोजन' },
    { value: 'in_progress', en: 'In Progress', mr: 'सुरू' },
    { value: 'completed', en: 'Completed', mr: 'पूर्ण' },
    { value: 'halted', en: 'Halted', mr: 'थांबलेले' },
  ];

  GP.registerRoute('projects', null, async (ctx) => {
    GP.setBreadcrumbs([
      { label: bilingual('Home', 'मुख्यपृष्ठ'), href: '#home' },
      { label: bilingual('Projects', 'प्रकल्प') },
    ]);
    app().innerHTML = appContainer(card(`<div style="text-align:center;padding:30px;"><div style="font-size:2rem;">⏳</div><p>${bilingual('Loading projects...', 'प्रकल्प लोड होत आहेत...')}</p></div>`));

    try {
      let projects = [];
      let summary = null;
      try { projects = await GP.api('GET', '/api/projects') || []; } catch (_) {}
      try { summary = await GP.api('GET', '/api/projects/summary') || null; } catch (_) {}

      if (!summary) {
        const total = projects.reduce((s, p) => s + (Number(p.cost_rs) || 0), 0);
        summary = {
          total_budget_rs: total,
          completed_count: projects.filter(p => (p.status || '') === 'completed').length,
          in_progress_count: projects.filter(p => (p.status || '') === 'in_progress').length,
          planning_count: projects.filter(p => ['planning', 'upcoming'].includes(p.status || '')).length,
        };
      }

      function render(cat, stat) {
        let rows = projects.slice();
        if (cat && cat !== 'all') rows = rows.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase());
        if (stat && stat !== 'all') rows = rows.filter(p => (p.status || '').toLowerCase() === stat.toLowerCase());

        const totalBudget = summary.total_budget_rs != null ? summary.total_budget_rs : projects.reduce((s, p) => s + (Number(p.cost_rs) || 0), 0);
        const stats = [
          { label_en: 'Total Budget', label_mr: 'एकूण बजेट', value: formatINR(totalBudget), icon: '💰', color: 'var(--gradient)' },
          { label_en: 'Completed', label_mr: 'पूर्ण झालेले', value: summary.completed_count || 0, icon: '✅', color: 'var(--success)' },
          { label_en: 'In Progress', label_mr: 'सुरू असलेले', value: summary.in_progress_count || 0, icon: '🏗️', color: 'var(--accent)' },
          { label_en: 'Planning / Upcoming', label_mr: 'नियोजन / आगामी', value: summary.planning_count || summary.upcoming_count || 0, icon: '📋', color: 'var(--warning)' },
        ];
        const statCards = stats.map(s => `
          <div style="background:var(--bg-white);border:1px solid var(--border);border-radius:12px;padding:22px;box-shadow:var(--shadow);border-top:4px solid ${s.color.startsWith('var') ? '' : ''}${s.color.startsWith('#') ? '' : ''}${s.color.includes('gradient') ? '' : s.color};position:relative;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <div style="font-size:0.85rem;color:var(--text-gray);font-weight:500;">${esc(bilingual(s.label_en, s.label_mr))}</div>
                <div style="font-size:2rem;font-weight:700;margin-top:6px;background:${s.color};-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${esc(typeof s.value === 'number' ? s.value.toString() : s.value)}</div>
              </div>
              <div style="font-size:2rem;opacity:0.35;">${s.icon}</div>
            </div>
          </div>
        `).join('');

        const catButtons = CATEGORY_OPTS.map(o => {
          const active = (cat || 'all') === o.value;
          return `<button onclick="window.__gpSetProjCat('${o.value}')" style="padding:8px 18px;border-radius:999px;border:1px solid ${active ? 'var(--primary)' : 'var(--border)'};background:${active ? 'var(--gradient)' : 'var(--bg-white)'};color:${active ? '#fff' : 'var(--text-dark)'};cursor:pointer;font-weight:600;font-family:inherit;white-space:nowrap;">${esc(bilingual(o.en, o.mr))}</button>`;
        }).join('');
        const statButtons = STATUS_OPTS.map(o => {
          const active = (stat || 'all') === o.value;
          return `<button onclick="window.__gpSetProjStatus('${o.value}')" style="padding:8px 18px;border-radius:999px;border:1px solid ${active ? 'var(--secondary)' : 'var(--border)'};background:${active ? 'var(--gradient-gold)' : 'var(--bg-white)'};color:${active ? 'var(--primary-dark)' : 'var(--text-dark)'};cursor:pointer;font-weight:600;font-family:inherit;white-space:nowrap;">${esc(bilingual(o.en, o.mr))}</button>`;
        }).join('');

        function statusBadgeProject(st) {
          const s = (st || 'planning').toLowerCase();
          const map = {
            planning: { c: 'var(--text-light)', en: 'Planning', mr: 'नियोजन' },
            in_progress: { c: 'var(--accent)', en: 'In Progress', mr: 'सुरू' },
            completed: { c: 'var(--success)', en: 'Completed', mr: 'पूर्ण' },
            halted: { c: 'var(--danger)', en: 'Halted', mr: 'थांबलेले' },
            upcoming: { c: 'var(--warning)', en: 'Upcoming', mr: 'आगामी' },
          };
          const m = map[s] || map.planning;
          return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;background:${m.c};color:#fff;font-size:0.8rem;font-weight:700;letter-spacing:0.2px;">${esc(bilingual(m.en, m.mr))}</span>`;
        }

        const projCards = rows.map(p => {
          const title = t(p, 'title') || p.title_en || p.title || '-';
          const progress = Math.min(100, Math.max(0, Number(p.progress_pct) || 0));
          const cost = Number(p.cost_rs) || 0;
          const catLb = (p.category || 'other').replace(/_/g, ' ');
          const photo = p.photo || (Array.isArray(p.photos) && p.photos[0] ? (typeof p.photos[0] === 'string' ? p.photos[0] : p.photos[0].data || p.photos[0].url) : null);
          const pid = p.id || p.project_id || '';
          const startD = formatDate(p.start_date);
          const endD = formatDate(p.end_date);
          return `<a href="#/projects/${pid}" style="display:block;background:var(--bg-white);border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:var(--shadow);transition:all .25s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='var(--shadow-lg)';" onmouseout="this.style.transform='';this.style.boxShadow='var(--shadow)';">
            <div style="height:180px;background:${photo ? 'transparent' : 'var(--bg-light)'};position:relative;overflow:hidden;">
              ${photo ? `<img src="${esc(photo)}" style="width:100%;height:100%;object-fit:cover;"/>` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem;opacity:0.25;">🏘️</div>`}
              <div style="position:absolute;top:10px;left:10px;">${statusBadgeProject(p.status)}</div>
              <div style="position:absolute;top:10px;right:10px;"><span style="background:rgba(0,40,104,0.9);color:#fff;padding:3px 10px;border-radius:999px;font-size:0.75rem;font-weight:600;text-transform:capitalize;">${esc(catLb)}</span></div>
            </div>
            <div style="padding:18px;">
              <h3 style="font-size:1.1rem;font-weight:600;margin-bottom:10px;line-height:1.4;min-height:48px;">${esc(title)}</h3>
              <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:4px;">
                  <span style="color:var(--text-gray);font-weight:500;">${bilingual('Progress', 'प्रगती')}</span>
                  <span style="font-weight:700;color:var(--primary-dark);">${progress}%</span>
                </div>
                <div class="progress-wrap"><div class="progress-bar" style="width:${progress}%;"></div></div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:0.85rem;margin-bottom:14px;">
                <div><div style="color:var(--text-light);">${bilingual('Budget', 'बजेट')}</div><div style="font-weight:700;color:var(--text-dark);">${esc(formatINR(cost))}</div></div>
                <div><div style="color:var(--text-light);">${bilingual('Ward', 'वॉर्ड')}</div><div style="font-weight:700;">${esc(p.ward_no || p.ward || '-')}</div></div>
                <div><div style="color:var(--text-light);">${bilingual('Start', 'सुरुवात')}</div><div style="font-weight:600;">${esc(startD)}</div></div>
                <div><div style="color:var(--text-light);">${bilingual('End', 'शेवट')}</div><div style="font-weight:600;">${esc(endD)}</div></div>
              </div>
              <div style="text-align:right;"><span class="btn-small" style="display:inline-block;text-decoration:none;">${bilingual('View Details', 'तपशील पहा')} →</span></div>
            </div>
          </a>`;
        }).join('');

        app().innerHTML = appContainer(`
          <div class="section-header" style="text-align:center;margin-bottom:32px;">
            <h2 class="section-title">${bilingual('Projects & Development', 'प्रकल्प व विकास')}</h2>
            <p class="section-subtitle">${bilingual('Development works, infrastructure projects and ongoing initiatives in Dumbarwadi.', 'डुंबरवाडीतील विकास कामे, पायाभूत सुविधा प्रकल्प व सुरू असलेल्या उपक्रम.')}</p>
          </div>

          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;">
            ${statCards}
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:14px;">
            <div style="font-weight:600;color:var(--primary-dark);font-size:0.95rem;">🏷️ ${bilingual('Filter by Category', 'श्रेणीनुसार फिल्टर')}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">${catButtons}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:26px;">
            <div style="font-weight:600;color:var(--primary-dark);font-size:0.95rem;">📊 ${bilingual('Filter by Status', 'स्थितीनुसार फिल्टर')}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">${statButtons}</div>
          </div>

          ${projCards ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;">${projCards}</div>` : card(`<div style="text-align:center;padding:40px;"><div style="font-size:3rem;margin-bottom:12px;">📭</div><h3>${bilingual('No projects match the current filters.', 'सध्याच्या फिल्टरशी जुळणारे कोणतेही प्रकल्प नाहीत.')}</h3></div>`)}
        `);

        window.__gpSetProjCat = (v) => render(v, stat);
        window.__gpSetProjStatus = (v) => render(cat, v);
      }

      render('all', 'all');
    } catch (err) {
      GP.showToast('error', (err && err.message) || bilingual('Failed to load.', 'लोड करणे अयशस्वी.'));
    }
  });

  GP.registerRoute('project-detail', null, async (ctx) => {
    const id = (ctx.params && ctx.params[0]) || '';
    GP.setBreadcrumbs([
      { label: bilingual('Home', 'मुख्यपृष्ठ'), href: '#home' },
      { label: bilingual('Projects', 'प्रकल्प'), href: '#/projects' },
      { label: bilingual('Project Detail', 'प्रकल्प तपशील') },
    ]);
    app().innerHTML = appContainer(card(`<div style="text-align:center;padding:30px;"><div style="font-size:2rem;">⏳</div><p>${bilingual('Loading project...', 'प्रकल्प लोड होत आहे...')}</p></div>`));
    try {
      let p = null;
      try { p = await GP.api('GET', `/api/projects/${id}`); } catch (_) {}
      if (!p) {
        try {
          const list = await GP.api('GET', '/api/projects') || [];
          p = list.find(x => String(x.id) === String(id) || String(x.project_id || '') === String(id)) || null;
        } catch (_) {}
      }
      if (!p) {
        app().innerHTML = appContainer(card(`<div style="text-align:center;padding:40px;">🚫 ${bilingual('Project not found.', 'प्रकल्प सापडला नाही.')} <a href="#/projects" class="btn btn-primary" style="margin-left:12px;">← ${bilingual('Back to Projects', 'प्रकल्पांकडे परत जा')}</a></div>`));
        return;
      }
      const title = t(p, 'title') || p.title_en || p.title || '-';
      const desc = t(p, 'description') || p.description_en || p.description || '-';
      const progress = Math.min(100, Math.max(0, Number(p.progress_pct) || 0));
      const catLb = (p.category || 'other').replace(/_/g, ' ');
      const statusClr = { planning: 'var(--text-light)', in_progress: 'var(--accent)', completed: 'var(--success)', halted: 'var(--danger)', upcoming: 'var(--warning)' }[(p.status || 'planning').toLowerCase()] || 'var(--text-light)';
      const photos = Array.isArray(p.photos) ? p.photos : [];
      const photoUrls = photos.map(ph => typeof ph === 'string' ? ph : ph.data || ph.url).filter(Boolean);

      const galleryHtml = photoUrls.length ? (photoUrls.length > 1
        ? `<div style="display:grid;grid-template-columns:repeat(${Math.min(3, photoUrls.length)},1fr);gap:10px;margin-bottom:24px;">
            ${photoUrls.map(u => `<div style="position:relative;aspect-ratio:4/3;border-radius:12px;overflow:hidden;border:1px solid var(--border);cursor:pointer;" onclick="window.open('${esc(u)}','_blank')"><img src="${esc(u)}" style="width:100%;height:100%;object-fit:cover;"/></div>`).join('')}
          </div>`
        : `<div style="margin-bottom:24px;border-radius:14px;overflow:hidden;box-shadow:var(--shadow);"><img src="${esc(photoUrls[0])}" style="width:100%;max-height:420px;object-fit:cover;"/></div>`)
        : `<div style="height:300px;background:var(--bg-light);border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;"><div style="font-size:8rem;opacity:0.2;">🏘️</div></div>`;

      const dets = [
        { en: 'Officer Incharge', mr: 'प्रभारी अधिकारी', v: p.officer_incharge || p.officer || '-' },
        { en: 'Contractor', mr: 'कंत्राटदार', v: p.contractor || '-' },
        { en: 'Start Date', mr: 'सुरुवात तारीख', v: formatDate(p.start_date) },
        { en: 'End Date', mr: 'शेवटची तारीख', v: formatDate(p.end_date) },
        { en: 'Budget', mr: 'बजेट', v: formatINR(p.cost_rs) },
        { en: 'Progress %', mr: 'प्रगती %', v: `${progress}%` },
        { en: 'Ward', mr: 'वॉर्ड', v: p.ward_no || p.ward || '-' },
        { en: 'Funding Source', mr: 'निधीचे स्रोत', v: p.funding_source || p.source || '- Government Grant' },
      ];

      const detsGrid = dets.map(d => `
        <div style="padding:14px;background:var(--bg-light);border-radius:10px;">
          <div style="font-size:0.78rem;color:var(--text-light);font-weight:500;margin-bottom:4px;">${esc(bilingual(d.en, d.mr))}</div>
          <div style="font-weight:700;color:var(--text-dark);">${esc(typeof d.v === 'string' || typeof d.v === 'number' ? d.v.toString() : d.v)}</div>
        </div>
      `).join('');

      const milestones = [
        { pct: 0, key: 'concept', en: 'Concept / Proposal', mr: 'संकल्पना / प्रस्ताव' },
        { pct: 25, key: 'planning', en: 'Planning Approved', mr: 'नियोजन मंजूर' },
        { pct: 60, key: 'construction', en: 'Construction / Work', mr: 'बांधकाम / काम' },
        { pct: 100, key: 'inauguration', en: 'Inauguration / Complete', mr: 'उद्घाटन / पूर्ण' },
      ];
      let curMilestone = 0;
      milestones.forEach((m, i) => { if (progress >= m.pct) curMilestone = i; });
      const msHtml = `<div class="timeline">${milestones.map((m, i) => {
        const active = i <= curMilestone;
        const current = i === curMilestone;
        return `<div class="timeline-step ${active ? 'active' : ''}">
          ${i < milestones.length - 1 ? '<div class="timeline-line"></div>' : ''}
          <div class="timeline-time">${m.pct}%</div>
          <div class="timeline-label" style="${current ? 'color:var(--primary-dark);' : ''}">${esc(bilingual(m.en, m.mr))}</div>
        </div>`;
      }).join('')}</div>`;

      app().innerHTML = appContainer(card(`
        <a href="#/projects" style="display:inline-block;color:var(--primary);font-weight:500;margin-bottom:16px;">← ${bilingual('Back to All Projects', 'सर्व प्रकल्पांकडे परत जा')}</a>
        ${galleryHtml}

        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:18px;">
          <div style="flex:1;min-width:300px;">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
              <span style="background:rgba(0,40,104,0.1);color:var(--primary-dark);padding:4px 12px;border-radius:999px;font-size:0.8rem;font-weight:700;text-transform:capitalize;">🏷️ ${esc(catLb)}</span>
              <span style="background:${statusClr};color:#fff;padding:4px 12px;border-radius:999px;font-size:0.8rem;font-weight:700;text-transform:capitalize;">⚡ ${esc((p.status || 'planning').replace(/_/g, ' '))}</span>
            </div>
            <h1 style="font-size:2rem;font-weight:700;line-height:1.3;">${esc(title)}</h1>
          </div>
        </div>

        <div style="background:var(--bg-light);border-radius:10px;padding:14px 16px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-weight:600;color:var(--primary-dark);">📊 ${bilingual('Overall Progress', 'एकूण प्रगती')}</div>
            <div style="font-size:1.4rem;font-weight:700;color:var(--primary-dark);">${progress}%</div>
          </div>
          <div class="progress-wrap"><div class="progress-bar" style="width:${progress}%;"></div></div>
        </div>

        <div style="margin-bottom:28px;">
          <h3 style="font-size:1.1rem;margin-bottom:12px;color:var(--primary-dark);">📝 ${bilingual('Description', 'सविस्तर माहिती')}</h3>
          <div style="color:var(--text-dark);line-height:1.8;background:var(--bg-white);padding:18px;border-radius:10px;border:1px solid var(--border);">${esc(desc)}</div>
        </div>

        <h3 style="font-size:1.1rem;margin-bottom:14px;color:var(--primary-dark);">📋 ${bilingual('Project Details', 'प्रकल्प तपशील')}</h3>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;">${detsGrid}</div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;">
          <div>
            <h3 style="font-size:1.1rem;margin-bottom:14px;color:var(--primary-dark);">🎯 ${bilingual('Milestones', 'मैलदुर्गा')}</h3>
            ${msHtml}
          </div>
          <div style="background:var(--bg-light);border-radius:12px;padding:22px;border:1px solid var(--border);">
            <h3 style="font-size:1.1rem;margin-bottom:14px;color:var(--primary-dark);">🏛️ ${bilingual('Panchayat Info', 'पंचायत माहिती')}</h3>
            <div style="font-size:0.95rem;line-height:1.8;">
              <div>🏛️ <strong>Dumbarwadi Gram Panchayat</strong> (LGD 185937)</div>
              <div>👩‍💼 Sarpanch: <strong>Shital Atul Gore</strong></div>
              <div>👨‍💼 Secretary / Sachiv: <strong>Ashish Prakash Kolhe</strong></div>
              <div style="margin-top:12px;color:var(--text-gray);font-size:0.9rem;">${bilingual('For queries about this project, contact Panchayat Office during 10 AM - 5 PM (Mon-Sat).', 'या प्रकल्पाबद्दलच्या प्रश्नांसाठी सकाळी 10 ते संध्याकाळी 5 (सोम-शनि) या वेळेत पंचायत कार्यालयाशी संपर्क साधा.')}</div>
              <div style="margin-top:14px;"><a href="#/contacts" class="btn btn-secondary">📞 ${bilingual('Contact Office', 'कार्यालयाशी संपर्क')}</a></div>
            </div>
          </div>
        </div>
      `));
    } catch (err) {
      GP.showToast('error', (err && err.message) || bilingual('Failed to load.', 'लोड करणे अयशस्वी.'));
    }
  });
});
