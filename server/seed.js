// server/seed.js - schema creation + Dumbarwadi Meri Panchayat data seed
const db = require('./db');
const bcrypt = require('bcryptjs');
const config = require('./config');

const force = process.argv.includes('--force');

const TABLES = [
  'admins', 'scheme_applications', 'contacts', 'services', 'notices', 'schemes', 'profile_stats', 'village',
  'citizens', 'service_applications', 'complaints', 'gram_sabha_meetings', 'gram_sabha_agenda',
  'gram_sabha_attendance', 'projects', 'panchayat_members', 'contact_messages',
];

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS village (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name_en TEXT NOT NULL,
      name_mr TEXT NOT NULL,
      lgd_gp TEXT NOT NULL,
      lgd_village TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      area_sqkm REAL NOT NULL,
      total_population INTEGER NOT NULL,
      total_hhs INTEGER NOT NULL,
      address_en TEXT NOT NULL,
      address_mr TEXT NOT NULL,
      office_timings_en TEXT NOT NULL,
      office_timings_mr TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profile_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_key TEXT UNIQUE NOT NULL,
      icon TEXT NOT NULL,
      heading_en TEXT NOT NULL,
      heading_mr TEXT NOT NULL,
      male INTEGER,
      female INTEGER,
      total INTEGER,
      stat1_label_en TEXT NOT NULL,
      stat1_label_mr TEXT NOT NULL,
      stat1_value TEXT NOT NULL,
      stat2_label_en TEXT,
      stat2_label_mr TEXT,
      stat2_value TEXT,
      stat3_label_en TEXT,
      stat3_label_mr TEXT,
      stat3_value TEXT,
      full_width INTEGER NOT NULL DEFAULT 0,
      display_order INTEGER NOT NULL DEFAULT 0,
      special TEXT
    );

    CREATE TABLE IF NOT EXISTS schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT NOT NULL,
      title_mr TEXT NOT NULL,
      desc_en TEXT NOT NULL,
      desc_mr TEXT NOT NULL,
      tags_en TEXT NOT NULL DEFAULT '',
      tags_mr TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT '📜',
      accent TEXT NOT NULL DEFAULT '#004c8c',
      eligibility_en TEXT DEFAULT '',
      eligibility_mr TEXT DEFAULT '',
      application_process_en TEXT DEFAULT '',
      application_process_mr TEXT DEFAULT '',
      benefits_en TEXT DEFAULT '',
      benefits_mr TEXT DEFAULT '',
      documents_required_en TEXT DEFAULT '',
      documents_required_mr TEXT DEFAULT '',
      scheme_code TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date_iso TEXT NOT NULL,
      month_en TEXT NOT NULL,
      month_mr TEXT NOT NULL,
      day TEXT NOT NULL,
      title_en TEXT NOT NULL,
      title_mr TEXT NOT NULL,
      desc_en TEXT NOT NULL,
      desc_mr TEXT NOT NULL,
      badge_en TEXT NOT NULL,
      badge_mr TEXT NOT NULL,
      badge_color TEXT NOT NULL DEFAULT '#138808',
      notice_type TEXT DEFAULT 'general',
      pdf_attachment TEXT DEFAULT '',
      download_filename TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT NOT NULL,
      title_mr TEXT NOT NULL,
      desc_en TEXT NOT NULL,
      desc_mr TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '🏢',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_name TEXT NOT NULL,
      role_en TEXT NOT NULL,
      role_mr TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT,
      extra_label_en TEXT,
      extra_label_mr TEXT,
      extra_value TEXT,
      accent TEXT NOT NULL DEFAULT '#004c8c',
      is_emergency INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scheme_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheme_id INTEGER,
      applicant_name_en TEXT NOT NULL,
      applicant_name_mr TEXT,
      mobile TEXT NOT NULL,
      household_no TEXT,
      address_en TEXT,
      address_mr TEXT,
      notes_en TEXT,
      notes_mr TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS citizens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mobile TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      fullname_en TEXT NOT NULL,
      fullname_mr TEXT DEFAULT '',
      ward_no INTEGER DEFAULT 1,
      household_no TEXT DEFAULT '',
      gender TEXT DEFAULT '',
      dob TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address_en TEXT DEFAULT '',
      address_mr TEXT DEFAULT '',
      aadhaar_last4 TEXT DEFAULT '',
      father_husband_name TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS service_applications (
      id TEXT PRIMARY KEY,
      service_type TEXT NOT NULL,
      applicant_fullname_en TEXT NOT NULL,
      applicant_fullname_mr TEXT DEFAULT '',
      mobile TEXT NOT NULL,
      father_husband_name TEXT DEFAULT '',
      gender TEXT DEFAULT '',
      dob TEXT DEFAULT '',
      address_en TEXT DEFAULT '',
      address_mr TEXT DEFAULT '',
      ward_no INTEGER DEFAULT 0,
      household_no TEXT DEFAULT '',
      aadhaar_last4 TEXT DEFAULT '',
      email TEXT DEFAULT '',
      service_specific TEXT DEFAULT '{}',
      documents TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'submitted',
      status_history TEXT NOT NULL,
      admin_note TEXT DEFAULT '',
      citizen_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      complaint_type TEXT NOT NULL,
      location_ward TEXT DEFAULT '',
      landmark TEXT DEFAULT '',
      description_en TEXT NOT NULL,
      description_mr TEXT DEFAULT '',
      severity TEXT DEFAULT 'low',
      photos TEXT DEFAULT '[]',
      complainant_name TEXT NOT NULL,
      complainant_mobile TEXT NOT NULL,
      citizen_id INTEGER,
      status TEXT NOT NULL DEFAULT 'submitted',
      status_history TEXT NOT NULL,
      replies TEXT DEFAULT '[]',
      responsible_officer TEXT DEFAULT '',
      admin_note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gram_sabha_meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_date TEXT NOT NULL,
      meeting_time TEXT NOT NULL,
      venue_en TEXT NOT NULL,
      venue_mr TEXT DEFAULT '',
      chairperson_en TEXT NOT NULL,
      chairperson_mr TEXT DEFAULT '',
      agenda_pdf TEXT DEFAULT '',
      minutes_en TEXT DEFAULT '',
      minutes_mr TEXT DEFAULT '',
      minutes_pdf TEXT DEFAULT '',
      attendance_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'upcoming',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gram_sabha_agenda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL,
      item_no INTEGER NOT NULL DEFAULT 1,
      title_en TEXT NOT NULL,
      title_mr TEXT DEFAULT '',
      description_en TEXT DEFAULT '',
      description_mr TEXT DEFAULT '',
      decision_en TEXT DEFAULT '',
      decision_mr TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (meeting_id) REFERENCES gram_sabha_meetings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gram_sabha_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id INTEGER NOT NULL,
      citizen_name_en TEXT NOT NULL,
      citizen_name_mr TEXT DEFAULT '',
      ward_no INTEGER DEFAULT 0,
      mobile TEXT DEFAULT '',
      signed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (meeting_id) REFERENCES gram_sabha_meetings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT NOT NULL,
      title_mr TEXT NOT NULL,
      category_en TEXT DEFAULT 'Infrastructure',
      category_mr TEXT DEFAULT 'पायाभूत सुविधा',
      status TEXT DEFAULT 'planning',
      progress_percent INTEGER DEFAULT 0,
      cost_total REAL DEFAULT 0,
      cost_spent REAL DEFAULT 0,
      start_date TEXT DEFAULT '',
      end_date TEXT DEFAULT '',
      contractor_name TEXT DEFAULT '',
      funding_source_en TEXT DEFAULT '',
      funding_source_mr TEXT DEFAULT '',
      description_en TEXT DEFAULT '',
      description_mr TEXT DEFAULT '',
      photos TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS panchayat_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_mr TEXT NOT NULL,
      role_en TEXT NOT NULL,
      role_mr TEXT NOT NULL,
      ward_no INTEGER DEFAULT 0,
      mobile TEXT NOT NULL,
      email TEXT DEFAULT '',
      photo TEXT DEFAULT '',
      term_start TEXT DEFAULT '',
      term_end TEXT DEFAULT '',
      party_name TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      subject TEXT DEFAULT '',
      message_en TEXT NOT NULL,
      message_mr TEXT DEFAULT '',
      status TEXT DEFAULT 'new',
      admin_reply TEXT DEFAULT '',
      replied_at TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function columnExists(table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some(c => c.name === column);
}

function alterExistingTables() {
  if (!columnExists('notices', 'notice_type')) {
    db.exec(`ALTER TABLE notices ADD COLUMN notice_type TEXT DEFAULT 'general'`);
  }
  if (!columnExists('notices', 'pdf_attachment')) {
    db.exec(`ALTER TABLE notices ADD COLUMN pdf_attachment TEXT DEFAULT ''`);
  }
  if (!columnExists('notices', 'download_filename')) {
    db.exec(`ALTER TABLE notices ADD COLUMN download_filename TEXT DEFAULT ''`);
  }
  if (!columnExists('schemes', 'eligibility_en')) {
    db.exec(`ALTER TABLE schemes ADD COLUMN eligibility_en TEXT DEFAULT ''`);
  }
  if (!columnExists('schemes', 'eligibility_mr')) {
    db.exec(`ALTER TABLE schemes ADD COLUMN eligibility_mr TEXT DEFAULT ''`);
  }
  if (!columnExists('schemes', 'application_process_en')) {
    db.exec(`ALTER TABLE schemes ADD COLUMN application_process_en TEXT DEFAULT ''`);
  }
  if (!columnExists('schemes', 'application_process_mr')) {
    db.exec(`ALTER TABLE schemes ADD COLUMN application_process_mr TEXT DEFAULT ''`);
  }
  if (!columnExists('schemes', 'benefits_en')) {
    db.exec(`ALTER TABLE schemes ADD COLUMN benefits_en TEXT DEFAULT ''`);
  }
  if (!columnExists('schemes', 'benefits_mr')) {
    db.exec(`ALTER TABLE schemes ADD COLUMN benefits_mr TEXT DEFAULT ''`);
  }
  if (!columnExists('schemes', 'documents_required_en')) {
    db.exec(`ALTER TABLE schemes ADD COLUMN documents_required_en TEXT DEFAULT ''`);
  }
  if (!columnExists('schemes', 'documents_required_mr')) {
    db.exec(`ALTER TABLE schemes ADD COLUMN documents_required_mr TEXT DEFAULT ''`);
  }
  if (!columnExists('schemes', 'scheme_code')) {
    db.exec(`ALTER TABLE schemes ADD COLUMN scheme_code TEXT DEFAULT ''`);
  }
}

function dropTables() {
  for (const t of [...TABLES].reverse()) {
    db.exec(`DROP TABLE IF EXISTS ${t}`);
  }
}

function seedVillage() {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO village (
      id, name_en, name_mr, lgd_gp, lgd_village, lat, lon, area_sqkm,
      total_population, total_hhs, address_en, address_mr,
      office_timings_en, office_timings_mr, updated_at
    ) VALUES (1,
      'Dumbarwadi Gram Panchayat',
      'डुंबरवाडी ग्राम पंचायत',
      '185937',
      '555263',
      19.25, 74.01, 36.11,
      1430, 321,
      'Dumbarwadi Gram Panchayat Office, At. Post Dumbarwadi, Tal. & Dist. (as per Meri Panchayat), Maharashtra, India | GP LGD 185937 | Village LGD 555263 | Lat 19.25° N, Long 74.01° E',
      'डुंबरवाडी ग्राम पंचायत कार्यालय, अ. पो. डुंबरवाडी, ता. व जि. महाराष्ट्र, भारत | GP LGD 185937 | गाव LGD 555263 | अक्षांश 19.25° N, रेखांश 74.01° E',
      'Office Hours: 10:00 AM - 5:00 PM (Mon-Sat)',
      'कार्यालय वेळ: सकाळी 10:00 - संध्याकाळी 5:00 (सोमवार ते शनिवार)',
      datetime('now')
    )
  `);
  insert.run();
}

function seedProfileStats() {
  const rows = [
    {
      category_key: 'population', icon: '👥',
      heading_en: 'Population Breakdown',
      heading_mr: 'जनसंख्या विभाजन',
      male: 717, female: 713, total: 1430,
      stat1_label_en: 'Male', stat1_label_mr: 'पुरुष', stat1_value: '717',
      stat2_label_en: 'Female', stat2_label_mr: 'महिला', stat2_value: '713',
      stat3_label_en: 'Total', stat3_label_mr: 'एकूण', stat3_value: '1430',
      display_order: 1,
    },
    {
      category_key: 'category', icon: '🏷️',
      heading_en: 'Category-wise Population',
      heading_mr: 'वर्गवारी जनसंख्या',
      stat1_label_en: 'ST (Adivasi)', stat1_label_mr: 'आदिवासी', stat1_value: '63',
      stat2_label_en: 'SC (Buddhist)', stat2_label_mr: 'बौद्ध', stat2_value: '43',
      stat3_label_en: 'Other / OBC', stat3_label_mr: 'इतर / OBC', stat3_value: '0',
      display_order: 2,
    },
    {
      category_key: 'age', icon: '👶',
      heading_en: 'Age Groups',
      heading_mr: 'वय गट',
      stat1_label_en: 'Children (0-6 yrs)', stat1_label_mr: 'मुले (0-6 वर्षे)', stat1_value: '148',
      stat2_label_en: 'Children (6-18 yrs)', stat2_label_mr: 'मुले (6-18 वर्षे)*', stat2_value: '0',
      stat3_label_en: 'Total Households', stat3_label_mr: 'एकूण घरे', stat3_value: '321',
      display_order: 3,
    },
    {
      category_key: 'health', icon: '🏥',
      heading_en: 'Health Centres',
      heading_mr: 'आरोग्य केंद्रे',
      stat1_label_en: 'Primary Health Centre', stat1_label_mr: 'प्राथमिक आरोग्य केंद्र', stat1_value: '1',
      stat2_label_en: 'Health Sub Centre', stat2_label_mr: 'आरोग्य उपकेंद्र', stat2_value: '1',
      stat3_label_en: 'Well Being Centre', stat3_label_mr: 'वेलबेइंग केंद्र', stat3_value: '0',
      display_order: 4,
    },
    {
      category_key: 'education', icon: '🏫',
      heading_en: 'Schools & Education',
      heading_mr: 'शाळा व शिक्षण',
      stat1_label_en: 'Pre Primary', stat1_label_mr: 'पूर्व प्राथमिक', stat1_value: '0',
      stat2_label_en: 'Anganwadi Centres', stat2_label_mr: 'अंगणवाडी केंद्रे', stat2_value: '2',
      stat3_label_en: 'Primary Schools', stat3_label_mr: 'प्राथमिक शाळा', stat3_value: '2',
      display_order: 5,
    },
    {
      category_key: 'infrastructure', icon: '🛤️',
      heading_en: 'Infrastructure & Utilities',
      heading_mr: 'पायाभूत सुविधा',
      stat1_label_en: 'Drinking Water Sources', stat1_label_mr: 'पिण्याच्या पाण्याचे स्रोत', stat1_value: '3',
      stat2_label_en: 'Children Park / Playground', stat2_label_mr: 'बालवाडी उद्यान', stat2_value: '1',
      stat3_label_en: 'Seed / Fertiliser Centre', stat3_label_mr: 'बियाणे केंद्र', stat3_value: '0',
      display_order: 6,
    },
    {
      category_key: 'sports', icon: '🏐',
      heading_en: 'Sports Facilities',
      heading_mr: 'क्रीडा सुविधा',
      stat1_label_en: 'Football Ground', stat1_label_mr: 'फुटबॉल मैदान', stat1_value: '0',
      stat2_label_en: 'Volleyball Court', stat2_label_mr: 'व्हॉलीबॉल कोर्ट', stat2_value: '0',
      stat3_label_en: 'Badminton Court', stat3_label_mr: 'बॅडमिंटन कोर्ट', stat3_value: '0',
      display_order: 7,
    },
    {
      category_key: 'committees', icon: '👥',
      heading_en: 'Committees & SHGs',
      heading_mr: 'समित्या व स्वयंसहाय्य गट',
      stat1_label_en: 'Standing Committee', stat1_label_mr: 'स्थायी समिती', stat1_value: '1',
      stat2_label_en: 'SHGs Represented', stat2_label_mr: 'स्वयंसहाय्य गट प्रतिनिधित्व', stat2_value: '12',
      stat3_label_en: 'Old Age / Destitute Home', stat3_label_mr: 'वृद्धाश्रम', stat3_value: '0',
      display_order: 8,
    },
    {
      category_key: 'jjm', icon: '💧',
      heading_en: 'Jal Jeevan Mission — Tap Water Connections',
      heading_mr: 'जल जीवन मिशन — नळ पाणी कनेक्शन',
      stat1_label_en: 'Households Connected to Tap Water', stat1_label_mr: 'नळ पाणी जोडलेली घरे', stat1_value: '321',
      stat2_label_en: 'Drinking Water Sources Active', stat2_label_mr: 'पिण्याच्या पाण्याचे सक्रिय स्रोत', stat2_value: '3',
      stat3_label_en: 'Coverage (% of 321 HHs)', stat3_label_mr: 'कव्हरेज (321 घरांपैकी %)', stat3_value: '100%',
      full_width: 1, display_order: 9, special: 'jjm',
    },
  ];
  const ins = db.prepare(`
    INSERT OR REPLACE INTO profile_stats (
      id, category_key, icon, heading_en, heading_mr, male, female, total,
      stat1_label_en, stat1_label_mr, stat1_value,
      stat2_label_en, stat2_label_mr, stat2_value,
      stat3_label_en, stat3_label_mr, stat3_value,
      full_width, display_order, special
    ) VALUES (
      (SELECT id FROM profile_stats WHERE category_key = @category_key),
      @category_key, @icon, @heading_en, @heading_mr, @male,
      @female,
      @total,
      @stat1_label_en, @stat1_label_mr, @stat1_value,
      @stat2_label_en,
      @stat2_label_mr,
      @stat2_value,
      @stat3_label_en,
      @stat3_label_mr,
      @stat3_value,
      @full_width,
      @display_order,
      @special
    )
  `);
  const defaults = {
    male: 0, female: 0, total: 0,
    stat2_label_en: '', stat2_label_mr: '', stat2_value: '',
    stat3_label_en: '', stat3_label_mr: '', stat3_value: '',
    full_width: 0, display_order: 0, special: '',
  };
  const tx = db.transaction((arr) => arr.forEach(r => ins.run({ ...defaults, ...r })));
  tx(rows);
}

function seedSchemes() {
  const rows = [
    {
      title_en: 'Pradhan Mantri Awas Yojana (PMAY-Gramin)',
      title_mr: 'पीएम आवास योजना (ग्रामीण)',
      desc_en: 'Financial assistance to build permanent pucca houses for eligible rural households of Dumbarwadi. Priority to SC/ST (63+43 families), women-headed households, and destitute.',
      desc_mr: 'डुंबरवाडीतील पात्र ग्रामीण घरांसाठी पक्की घरे बांधण्यासाठी आर्थिक मदत. SC/ST (63+43 कुटुंबे), महिला-प्रमुख घरे आणि असहाय्यांना प्राधान्य.',
      tags_en: 'Housing,Grant,Pucca House',
      tags_mr: 'गृहनिर्माण,अनुदान,पक्की घर',
      icon: '🏠', accent: '#004c8c',
      scheme_code: 'PMAY-G',
      eligibility_en: 'Rural household, BPL/EWS category, SC/ST or women-headed, no permanent house.',
      eligibility_mr: 'ग्रामीण घर, BPL/EWS वर्ग, SC/ST किंवा महिला प्रमुख, कोणतेही पक्के घर नसेल.',
      application_process_en: 'Submit application at Panchayat Office with income proof, Aadhaar, land documents. Verification by Sachiv and Panchayat Samiti. Grant released via DBT.',
      application_process_mr: 'उत्पन्न पुरावा, आधार, जमीन कागदपत्रांसह पंचायत कार्यालयात अर्ज सादर करा. सचिव आणि पंचायत समिती द्वारे पडताळणी. DBT द्वारे अनुदान जारी.',
      benefits_en: '₹1.2 lakh for plain areas, ₹1.3 lakh for hilly areas. Additional ₹12,000 for toilet under SBM. 90/95 days wage under MGNREGA for construction labour.',
      benefits_mr: 'सामान्य भागासाठी ₹1.2 लाख, डोंगराळ भागासाठी ₹1.3 लाख. SBM अंतर्गत शौचालयासाठी अतिरिक्त ₹12,000. बांधकाम मजुरीसाठी MGNREGA अंतर्गत 90/95 दिवस वेतन.',
      documents_required_en: 'Aadhaar card, BPL/ration card, land ownership 7/12 extract, bank passbook, caste certificate if applicable, income certificate.',
      documents_required_mr: 'आधार कार्ड, BPL/रेशन कार्ड, जमिनीचे 7/12 उतारे, बँक पासबुक, जात प्रमाणपत्र (लागत असल्यास), उत्पन्न प्रमाणपत्र.',
    },
    {
      title_en: 'PM-KISAN Samman Nidhi',
      title_mr: 'पीएम किसान सन्मान निधी',
      desc_en: 'Annual income support of ₹6,000 per farming family in 3 equal instalments. Dumbarwadi: 717 male + 713 female residents — eligible farm families must link Aadhaar + bank account with Sachiv Ashish Kolhe.',
      desc_mr: 'प्रति शेतकरी कुटुंबाला दरवर्षी ₹6,000 उत्पन्न सहाय्य 3 समिश्र हप्त्यांमध्ये. डुंबरवाडी: 717 पुरुष + 713 महिला — आधार + बँक अँक लिंक सचिव आशिष कोल्हे यांच्याकडे.',
      tags_en: 'Farmer,Direct Benefit,₹6000',
      tags_mr: 'शेतकरी,थेट लाभ,₹6000',
      icon: '🌾', accent: '#138808',
      scheme_code: 'PM-KISAN',
      eligibility_en: 'All landholder farmer families with cultivable land as per revenue records. Farmer must be head of family.',
      eligibility_mr: 'महसूल नोंदीनुसार शेती करण्यायोग्य जमीन असलेली सर्व जमीनधारक शेतकरी कुटुंबे. शेतकरी कुटुंबाचा मुख्य सदस्य.',
      application_process_en: 'Self-register on pmkisan.gov.in or visit Panchayat Office with 7/12 extract and Aadhaar. E-KYC mandatory. Instalments released in Apr-Aug-Dec.',
      application_process_mr: 'pmkisan.gov.in वर स्वतः नोंदणी करा किंवा 7/12 उतारा आणि आधार घेऊन पंचायत कार्यालयाला भेट द्या. E-KYC अनिवार्य. एप्रिल-ऑगस्ट-डिसेंबरमध्ये हप्ते जारी.',
      benefits_en: '₹6,000 per year in 3 equal instalments of ₹2,000 each. Direct transfer to linked bank account.',
      benefits_mr: 'दरवर्षी ₹6,000 प्रत्येकी ₹2,000 च्या 3 समान हप्त्यांमध्ये. लिंक केलेल्या बँक खात्यात थेट हस्तांतरण.',
      documents_required_en: '7/12 extract of land, Aadhaar card of all family members, bank passbook, mobile number linked to Aadhaar.',
      documents_required_mr: 'जमिनीचे 7/12 उतारे, सर्व कुटुंब सदस्यांचे आधार कार्ड, बँक पासबुक, आधारशी जोडलेला मोबाइल नंबर.',
    },
    {
      title_en: 'Jal Jeevan Mission (Har Ghar Nal se Jal)',
      title_mr: 'जल जीवन मिशन (हर घर नळ से जल)',
      desc_en: 'Functional household tap connection to every rural home. Dumbarwadi: 321 out of 321 HHs connected; 3 drinking water sources active; complaints routed through Panchayat Office or Water Works Dept.',
      desc_mr: 'प्रत्येक ग्रामीण घराला कार्यक्षम नळ पाणी कनेक्शन. डुंबरवाडी: 321 पैकी 321 घरे जोडली; 3 पाण्याचे स्रोत सक्रिय; तक्रारी पंचायत कार्यालयात.',
      tags_en: 'Drinking Water,Tap Connection,JJM',
      tags_mr: 'पिण्याचे पाणी,नळ कनेक्शन,JJM',
      icon: '💧', accent: '#0284c7',
      scheme_code: 'JJM',
      eligibility_en: 'All rural households not having functional tap connection. Priority to SC/ST, OBC, BPL families.',
      eligibility_mr: 'कार्यक्षम नळ कनेक्शन नसलेली सर्व ग्रामीण घरे. SC/ST, OBC, BPL कुटुंबांना प्राधान्य.',
      application_process_en: 'Contact Gram Sevak or Panchayat Office. Survey by water dept team. Pipeline work by contractor. House tap connection and water quality testing.',
      application_process_mr: 'ग्राम सेवक किंवा पंचायत कार्यालयाशी संपर्क करा. पाणी विभागाच्या टीमद्वारे सर्वे. कंत्राटदाराद्वारे पाइपलाइन काम. घरी नळ कनेक्शन आणि पाण्याच्या गुणवत्तेची चाचणी.',
      benefits_en: '55 litres per capita per day of potable water at household level. Functional tap with adequate pressure. Free connection charges for BPL.',
      benefits_mr: 'दरघरी दररोज 55 लीटर प्रति व्यक्ती पिण्यायोग्य पाणी. पुरेशा दबावासह कार्यक्षम नळ. BPL साठी कनेक्शन शुल्क मोफत.',
      documents_required_en: 'Aadhaar card, BPL/ration card, address proof, application form at Panchayat.',
      documents_required_mr: 'आधार कार्ड, BPL/रेशन कार्ड, निवास पुरावा, पंचायतीवर अर्ज स्वरूप.',
    },
    {
      title_en: 'Mahatma Gandhi NREGA',
      title_mr: 'महात्मा गांधी मनरेगा',
      desc_en: 'Guaranteed 100 days of wage employment per rural household. Job cards issued at Panchayat Office. Contact Sachiv Ashish Prakash Kolhe for registration, work allocation, muster rolls.',
      desc_mr: 'प्रति ग्रामीण घराला 100 दिवस हमी वेतन रोजगार. जॉब कार्ड्स पंचायत कार्यालयात. नोंदणी, काम वाटप, मस्टर रोल साठी सचिव आशिष प्रकाश कोल्हे यांच्याशी संपर्क.',
      tags_en: 'Employment,100 Days,Job Card',
      tags_mr: 'रोजगार,100 दिवस,जॉब कार्ड',
      icon: '🛠️', accent: '#7c3aed',
      scheme_code: 'MGNREGA',
      eligibility_en: 'Any adult member of rural household willing to do unskilled manual work at minimum wage. BPL not required.',
      eligibility_mr: 'किमान वेतनावर अकुशल मॅन्युअल काम करायला तयार असलेल्या ग्रामीण कुटुंबाचा कोणताही प्रौढ सदस्य. BPL आवश्यक नाही.',
      application_process_en: 'Apply for job card at Panchayat with Aadhaar and photo. Job card issued within 15 days. Demand work in writing. Mustering done at worksite. Wages within 15 days via DBT.',
      application_process_mr: 'आधार आणि फोटोसह पंचायतीवर जॉब कार्डसाठी अर्ज करा. 15 दिवसांत जॉब कार्ड जारी. लेखी स्वरूपात कामाची मागणी करा. कामाच्या ठिकाणी मस्टरिंग. 15 दिवसांत DBT द्वारे वेतन.',
      benefits_en: '100 days guaranteed employment. Current wage rate ~₹291/day (2026-27). On-site creche for children. Medical insurance for workers. 14 days unemployment allowance if work not provided.',
      benefits_mr: '100 दिवस हमी रोजगार. सध्याचे वेतन दर ~₹291/दिवस (2026-27). मुलांसाठी कामाच्या ठिकाणी शिशुसंग्रहालय. कामगारांसाठी वैद्यकीय विमा. काम न दिल्यास 14 दिवसे बेरोजगारी भत्ता.',
      documents_required_en: 'Aadhaar card, passport size photo, bank passbook, voter ID optional.',
      documents_required_mr: 'आधार कार्ड, पासपोर्ट आकाराचे फोटो, बँक पासबूक, मतदार ओळखपत्र (पर्यायी).',
    },
    {
      title_en: 'Ayushman Bharat (PM-JAY)',
      title_mr: 'आयुष्मान भारत (पीएम-जय)',
      desc_en: 'Free health cover of ₹5 lakh per family per year for secondary + tertiary care. Dumbarwadi PHC (1) + Health Sub-Centre (1) available for OPD & referrals.',
      desc_mr: 'प्रति कुटुंब दरवर्षी ₹5 लाख मोफत आरोग्य कव्हर — दुय्यम + तृतीयक उपचारांसाठी. डुंबरवाडी पीएचसी (1) + उपकेंद्र (1) OPD आणि रेफरल साठी उपलब्ध.',
      tags_en: 'Health Insurance,₹5 Lakh,Free',
      tags_mr: 'आरोग्य विमा,₹5 लाख,मोफत',
      icon: '🩺', accent: '#dc2626',
      scheme_code: 'PM-JAY',
      eligibility_en: 'SECC 2011 database families. Rural: deprivation criteria D1-D7 automatically covered. Ayushman golden card required.',
      eligibility_mr: 'SECC 2011 डेटाबेसमधील कुटुंबे. ग्रामीण: वंचना निकष D1-D7 आपोआप कव्हर. आयुष्मान गोल्डन कार्ड आवश्यक.',
      application_process_en: 'Check name on pmjay.gov.in or BIS app. Visit PHC or nearest Ayushman Mitra with Aadhaar + ration card. Golden card printed free of cost. Use at empanelled hospitals.',
      application_process_mr: 'pmjay.gov.in किंवा BIS अॅपवर नाव तपासा. आधार + रेशन कार्ड घेऊन PHC किंवा जवळच्या आयुष्मान मित्राकडे जा. गोल्डन कार्ड विनामूल्य छापले जाते. नामांकित रुग्णालयांमध्ये वापरा.',
      benefits_en: '₹5 lakh/family/year. Cashless treatment at 24,000+ empanelled hospitals. All pre-existing conditions covered. 3 days pre and 15 days post-hospitalization. Free transport.',
      benefits_mr: '₹5 लाख/कुटुंब/वर्ष. 24,000+ नामांकित रुग्णालयांमध्ये कॅशलेस उपचार. सर्व पूर्व-अस्तित्वातील परिस्थिती कव्हर. 3 दिवस आधी आणि 15 दिवस रुग्णालयानंतर. मोफत वाहतूक.',
      documents_required_en: 'Aadhaar card, ration card/BPL card, mobile number, Ayushman card (if issued).',
      documents_required_mr: 'आधार कार्ड, रेशन कार्ड/BPL कार्ड, मोबाइल नंबर, आयुष्मान कार्ड (जर जारी केले असेल).',
    },
    {
      title_en: 'Mid-Day Meal Scheme (Mukhya Mantri / PM Poshan)',
      title_mr: 'मध्याह्न भोजन योजना (पीएम पोषण)',
      desc_en: 'Nutritious hot cooked meals served every school day to children at Dumbarwadi Anganwadi Centres (2) and Primary Schools (2). Covers 148 children age 0-6 yrs + school-going children.',
      desc_mr: 'डुंबरवाडीतील 2 अंगणवाडी केंद्रे आणि 2 प्राथमिक शाळांमध्ये दररोज पौष्टिक जेवण. 148 मुले (वय 0-6) आणि शाळकरी मुले.',
      tags_en: 'Nutrition,School Meal,Poshan',
      tags_mr: 'पौष्टिकता,शाळेचे जेवण,पोषण',
      icon: '🍲', accent: '#f59e0b',
      scheme_code: 'PM-POSHAN',
      eligibility_en: 'All children studying in Govt/Govt-aided Primary/Upper Primary schools. Anganwadi children 0-6 years & pregnant/lactating mothers.',
      eligibility_mr: 'शासकीय/शासकीय-अनुदानित प्राथमिक/उच्च प्राथमिक शाळांमध्ये शिकणारी सर्व मुले. अंगणवाडी मुले 0-6 वर्षे आणि गरोदर/स्तनपान करणाऱ्या माता.',
      application_process_en: 'Automatic on school/anganwadi admission. No separate form needed. Parents may verify with school headmaster or Anganwadi Sevika.',
      application_process_mr: 'शाळा/अंगणवाडीमध्ये प्रवेशावर आपोआप. वेगळे अर्ज आवश्यक नाही. पालक शाळेच्या मुख्याध्यापक किंवा अंगणवाडी सेविकेशी पडताळणी करू शकतात.',
      benefits_en: 'Nutritional norms: 450 cal + 12g protein (Primary), 700 cal + 20g protein (Upper Primary) per day. Free rice, dal, vegetables, oil, iodized salt. MDM-Tithi for community participation.',
      benefits_mr: 'पौष्टिक मानदंड: दररोज 450 कॅल + 12g प्रथिने (प्राथमिक), 700 कॅल + 20g प्रथिने (उच्च प्राथमिक). मोफत तांदूळ, डाळ, भाज्या, तेल, आयोडीनयुक्त मीठ. समुदाय भागीदारीसाठी MDM-तिथी.',
      documents_required_en: 'School admission record. Aadhaar of child for DBT cooking cost to schools (cooks honorarium).',
      documents_required_mr: 'शाळेत प्रवेश नोंद. शाळांना DBT स्वयंपाक खर्चासाठी (स्वयंपाक गृहिणींचे मानदेय) मुलाचे आधार.',
    },
    {
      title_en: 'Swachh Bharat Mission (SBM-Grameen)',
      title_mr: 'स्वच्छ भारत अभियान (ग्रामीण)',
      desc_en: 'Achieve ODF plus status through solid and liquid waste management, community cleanliness drives, and individual household toilets maintenance in Dumbarwadi.',
      desc_mr: 'घन आणि द्रव कचरा व्यवस्थापन, समुदाय स्वच्छता मोहिमा आणि डुंबरवाडीतील वैयक्तिक घरगुती शौचालयांच्या देखभालीद्वारे OFD प्लस स्थिती प्राप्त करा.',
      tags_en: 'Sanitation,Swachhata,Toilet',
      tags_mr: 'स्वच्छता,स्वच्छता,शौचालय',
      icon: '🚽', accent: '#0ea5e9',
      scheme_code: 'SBM-G',
      eligibility_en: 'All Gram Panchayats and rural households. Incentives for waste management infrastructure, compost pits, soak pits, community toilets.',
      eligibility_mr: 'सर्व ग्राम पंचायत आणि ग्रामीण घरे. कचरा व्यवस्थापन पायाभूत सुविधा, कंपोस्ट खड्डे, शोष खड्डे, सामुदायिक शौचालयांसाठी प्रोत्साहन.',
      application_process_en: 'Contact Panchayat Office or GP Sachiv. SWM plan approved by Gram Sabha. Funds released by Zilla Parishad upon completion milestones.',
      application_process_mr: 'पंचायत कार्यालय किंवा GP सचिवाशी संपर्क करा. SWM योजना ग्रामसभेद्वारे मंजूर. पूर्णतेच्या टप्प्यावर जिल्हा परिषदेद्वारे निधी जारी.',
      benefits_en: 'Financial incentives for individual toilets ₹12,000. ODF Plus village incentive ₹5-10 lakh. Solid waste management grant. Community toilet grants.',
      benefits_mr: 'वैयक्तिक शौचालयांसाठी आर्थिक प्रोत्साहन ₹12,000. ODF प्लस गावासाठी ₹5-10 लाख. घन कचरा व्यवस्थापन अनुदान. सामुदायिक शौचालय अनुदान.',
      documents_required_en: 'Gram Sabha resolution, work estimates, Aadhaar of beneficiary, land ownership or permission letter.',
      documents_required_mr: 'ग्रामसभेचा ठराव, कामाचे अंदाज, लाभार्थ्याचे आधार, जमीन मालकी किंवा परवानगी पत्र.',
    },
    {
      title_en: 'Sukanya Samriddhi Yojana (SSY)',
      title_mr: 'सुकन्या समृद्धी योजना',
      desc_en: 'Small savings scheme for girl child encouraging long-term savings for education and marriage. Parents can open account for girls up to 10 years of age.',
      desc_mr: 'मुलीसाठी शिक्षण आणि लग्नासाठी दीर्घकालीन बचत प्रोत्साहन देणारी लहान बचत योजना. पालक 10 वर्षे पर्यंतच्या मुलीसाठी खाते उघडू शकतात.',
      tags_en: 'Girl Child,Savings,Education',
      tags_mr: 'मुलगी,बचत,शिक्षण',
      icon: '👧', accent: '#ec4899',
      scheme_code: 'SSY',
      eligibility_en: 'Parents/legal guardians of girl child aged 0-10 years. Maximum 2 daughters per family. Resident Indian.',
      eligibility_mr: '0-10 वर्षे वयोगटातील मुलीचे पालक/कायदेशीर पालक. प्रति कुटुंब जास्तीत जास्त 2 मुलगी. भारताचा निवासी.',
      application_process_en: 'Open account at Post Office or authorised bank branches (SBI, BoM, etc.). Submit Aadhaar of girl + parent, birth certificate, KYC docs. Account matures 21 years or on marriage after 18.',
      application_process_mr: 'पोस्ट ऑफिस किंवा अधिकृत बँक शाखांमध्ये (SBI, BoM इ.) खाते उघडा. मुलीचे + पालकांचे आधार, जन्म प्रमाणपत्र, KYC कागदपत्रे सादर करा. खाते 21 वर्षे किंवा 18 नंतर लग्नावर परिपक्व होते.',
      benefits_en: 'Current interest rate 8.2% (2026-27) compounded annually. Tax-free under Sec 80C up to ₹1.5 lakh/year. Partial withdrawal for education after 18. Principal + interest tax exempt on maturity.',
      benefits_mr: 'सध्याचे व्याज दर 8.2% (2026-27) वार्षिक चक्रवाढ. कलम 80C अंतर्गत ₹1.5 लाख/पर्यंत करमुक्त. 18 नंतर शिक्षणासाठी आंशिक पैसे काढणे. परिपक्वतेवर मुद्दल + व्याज करमुक्त.',
      documents_required_en: 'Girl birth certificate, Aadhaar of girl and parent/guardian, address proof, passport photos, initial deposit ₹250.',
      documents_required_mr: 'मुलीचे जन्म प्रमाणपत्र, मुली आणि पालक/पालकाचे आधार, निवास पुरावा, पासपोर्ट फोटो, प्रारंभिक ठेव ₹250.',
    },
  ];
  const ins = db.prepare(`
    INSERT OR REPLACE INTO schemes (
      id, title_en, title_mr, desc_en, desc_mr, tags_en, tags_mr, icon, accent,
      eligibility_en, eligibility_mr, application_process_en, application_process_mr,
      benefits_en, benefits_mr, documents_required_en, documents_required_mr, scheme_code,
      created_at, updated_at
    ) VALUES (
      (SELECT id FROM schemes WHERE title_en = @title_en),
      @title_en, @title_mr, @desc_en, @desc_mr, @tags_en, @tags_mr, @icon, @accent,
      IFNULL(@eligibility_en, ''), IFNULL(@eligibility_mr, ''),
      IFNULL(@application_process_en, ''), IFNULL(@application_process_mr, ''),
      IFNULL(@benefits_en, ''), IFNULL(@benefits_mr, ''),
      IFNULL(@documents_required_en, ''), IFNULL(@documents_required_mr, ''),
      IFNULL(@scheme_code, ''),
      COALESCE((SELECT created_at FROM schemes WHERE title_en = @title_en), datetime('now')),
      datetime('now')
    )
  `);
  db.transaction((arr) => arr.forEach(r => ins.run(r)))(rows);
}

function seedNotices() {
  const rows = [
    {
      date_iso: '2026-09-28', month_en: 'SEP', month_mr: 'सेप्ट', day: '28',
      title_en: 'Gram Sabha (General Body Meeting)',
      title_mr: 'ग्राम पंचायत सामान्य सभा (ग्रामसभा)',
      desc_en: 'All 1430 villagers invited to attend and discuss development works, SHG reports (12 SHGs), standing committee minutes, and annual budget allocation. Venue: Panchayat Office Hall, Dumbarwadi. Presiding: Sarpanch Shital Atul Gore.',
      desc_mr: 'सर्व 1430 ग्रामस्थांना विकास प्रकल्प, स्वयंसहाय्य गट अहवाल (12 SHGs), स्थायी समिती वारंवारता व वार्षिक बजेटवर चर्चा करण्यासाठी आमंत्रण. ठिकाण: पंचायत कार्यालय हॉल, डुंबरवाडी. अध्यक्षता: सरपंच शितल अतुल गोरे.',
      badge_en: 'Meeting', badge_mr: 'सभा', badge_color: '#004c8c',
      notice_type: 'gram_sabha', pdf_attachment: '', download_filename: '',
    },
    {
      date_iso: '2026-10-02', month_en: 'OCT', month_mr: 'ऑक्टो', day: '02',
      title_en: 'Free Health Check-up Camp at PHC',
      title_mr: 'मोफत आरोग्य तपासणी शिबीर — प्राथमिक आरोग्य केंद्र',
      desc_en: 'Joint camp by Primary Health Centre #1 + Health Sub Centre. Services: BP, Sugar, Eye check-up and free generic medicines. Special attention to 63 ST + 43 SC residents, elderly & children 0-6 (148).',
      desc_mr: 'प्राथमिक आरोग्य केंद्र (1) + आरोग्य उपकेंद्र संयुक्त शिबीर. सेवा: बीपी, सुगर, डोळ्यांची तपासणी व मोफत औषधे. 63 आदिवासी + 43 बौद्ध, वृद्ध व 148 मुले (0-6) ला विशेष लक्ष.',
      badge_en: 'Health', badge_mr: 'आरोग्य', badge_color: '#138808',
      notice_type: 'health', pdf_attachment: '', download_filename: '',
    },
    {
      date_iso: '2026-10-15', month_en: 'OCT', month_mr: 'ऑक्टो', day: '15',
      title_en: 'Last Date — PMAY / JJM Applications',
      title_mr: 'शेवटची तारीख — पीएम आवास योजना / जल जीवन अर्ज',
      desc_en: 'Submit pending house-construction and remaining tap-water applications by 15 Oct 2026. 321 HHs already on tap water. Contact Sachiv Ashish Kolhe (aashish.kolhe@gmail.com) or Ward Office with documents.',
      desc_mr: 'उर्वरित घरमालकी व उर्वरित नळ पाणी अर्ज 15 ऑक्टोबर 2026 पर्यंत सादर करा. 321 घरे आधीच नळ पाणी जोडलेली. कागदपत्रांसह सचिव आशिष कोल्हे (aashish.kolhe@gmail.com) किंवा वॉर्ड कार्यालयाशी संपर्क.',
      badge_en: 'Deadline', badge_mr: 'शेवटची तारीख', badge_color: '#dc2626',
      notice_type: 'general', pdf_attachment: '', download_filename: '',
    },
    {
      date_iso: '2026-10-20', month_en: 'OCT', month_mr: 'ऑक्टो', day: '20',
      title_en: 'Swachhata Drive & Children Park Maintenance',
      title_mr: 'गाव साफसफाई मोहीम व बालवाडी उद्यान देखभाल',
      desc_en: 'Swachh Bharat Mission cleanliness drive + Children Park (1 park) repair and cleaning. Students from 2 Primary Schools, 2 Anganwadi staff & 148 children 0-6 invited.',
      desc_mr: 'स्वच्छ भारत अभियान साफसफाई + बालवाडी उद्यानाची (1) दुरुस्ती व साफसफाई. 2 प्राथमिक शाळांचे विद्यार्थी, 2 अंगणवाडी कर्मचारी व 148 मुले (0-6) आमंत्रित.',
      badge_en: 'Event', badge_mr: 'कार्यक्रम', badge_color: '#7c3aed',
      notice_type: 'event', pdf_attachment: '', download_filename: '',
    },
    {
      date_iso: '2026-09-30', month_en: 'SEP', month_mr: 'सेप्ट', day: '30',
      title_en: 'Tender Notice — Road Repair and Construction Works',
      title_mr: 'निविदा सूचना — रस्ता दुरुस्ती व बांधकाम कामे',
      desc_en: 'Sealed tenders are invited for Road Repair (Ward 1 & Ward 2), estimated cost ₹15,00,000. Eligible Class-I registered contractors may submit bids by 15 Oct 2026 3:00 PM at Panchayat Office. Tender document fee ₹500.',
      desc_mr: 'रस्ता दुरुस्ती (वॉर्ड 1 व वॉर्ड 2), अंदाजित खर्च ₹15,00,000 साठी सीलबंद निविदा आमंत्रित. पात्र वर्ग-I नोंदणीकृत कंत्राटदार 15 ऑक्टोबर 2026 संध्याकाळी 3:00 पर्यंत पंचायत कार्यालयात बिड सादर करू शकतात. निविदा दस्तऐवज शुल्क ₹500.',
      badge_en: 'Tender', badge_mr: 'निविदा', badge_color: '#ea580c',
      notice_type: 'tender', pdf_attachment: '', download_filename: 'Road_Repair_Tender_2026.pdf',
    },
    {
      date_iso: '2026-10-22', month_en: 'OCT', month_mr: 'ऑक्टो', day: '22',
      title_en: 'Public Holiday — Vijayadashami (Dasara)',
      title_mr: 'सार्वजनिक सुट्टी — विजयादशमी (दसरा)',
      desc_en: 'Panchayat Office and all Gram Panchayat establishments will remain closed on Wednesday, 22 October 2026 on account of Vijayadashami (Dasara). Office will re-open on 23 October 2026 during regular hours 10:00 AM to 5:00 PM.',
      desc_mr: 'विजयादशमी (दसरा) या कारणाने बुधवार, 22 ऑक्टोबर 2026 रोजी पंचायत कार्यालय आणि सर्व ग्राम पंचायत संस्था बंद राहतील. कार्यालय 23 ऑक्टोबर 2026 रोजी नियमित वेळेत सकाळी 10:00 ते संध्याकाळी 5:00 पर्यंत पुन्हा उघडेल.',
      badge_en: 'Holiday', badge_mr: 'सुट्टी', badge_color: '#64748b',
      notice_type: 'holiday', pdf_attachment: '', download_filename: '',
    },
    {
      date_iso: '2026-09-26', month_en: 'SEP', month_mr: 'सेप्ट', day: '26',
      title_en: 'Water Supply Maintenance — Temporary Shutdown',
      title_mr: 'जलपुरवठा देखभाल — तात्पुरती बंद',
      desc_en: 'Scheduled water supply maintenance on Source #3 pipeline on 26 Sep 2026 from 9:00 AM to 2:00 PM. Supply to Ward 1 and Ward 2 houses may be affected. Citizens are advised to store adequate water. Complaints: Water Works Dept.',
      desc_mr: 'स्रोत #3 पाइपलाइनवर 26 सप्टेंबर 2026 रोजी सकाळी 9:00 ते दुपारी 2:00 पर्यंत नियोजित जलपुरवठा देखभाल. वॉर्ड 1 आणि वॉर्ड 2 घरांना पुरवठा प्रभावित होऊ शकतो. नागरिकांना पुरेसे पाणी साठवण्याचा सल्ला दिला जातो. तक्रारी: जल विभाग.',
      badge_en: 'Maintenance', badge_mr: 'देखभाल', badge_color: '#ca8a04',
      notice_type: 'maintenance', pdf_attachment: '', download_filename: '',
    },
  ];
  const ins = db.prepare(`
    INSERT OR REPLACE INTO notices (
      id, date_iso, month_en, month_mr, day, title_en, title_mr, desc_en, desc_mr,
      badge_en, badge_mr, badge_color, notice_type, pdf_attachment, download_filename, created_at
    ) VALUES (
      (SELECT id FROM notices WHERE date_iso = @date_iso AND title_en = @title_en),
      @date_iso, @month_en, @month_mr, @day, @title_en, @title_mr, @desc_en, @desc_mr,
      @badge_en, @badge_mr, @badge_color,
      IFNULL(@notice_type, 'general'),
      IFNULL(@pdf_attachment, ''),
      IFNULL(@download_filename, ''),
      COALESCE((SELECT created_at FROM notices WHERE date_iso = @date_iso AND title_en = @title_en), datetime('now'))
    )
  `);
  db.transaction((arr) => arr.forEach(r => ins.run(r)))(rows);
}

function seedServices() {
  const rows = [
    {
      title_en: 'Water Supply', title_mr: 'जलपुरवठा',
      desc_en: 'Timing: 7 AM - 9 AM & 5 PM - 7 PM daily | 3 Sources • 321 Tap-water HHs | Complaints: Panchayat / Water Dept.',
      desc_mr: 'वेळ: सकाळी 7 - 9 वाजता आणि संध्याकाळी 5 - 7 वाजता दररोज | 3 स्रोत • 321 नळ पाणी घरे | तक्रार: पाणी विभाग / पंचायत',
      icon: '💧',
    },
    {
      title_en: 'Electricity Supply', title_mr: 'वीज पुरवठा',
      desc_en: 'Village supply: 6 AM - 11 PM daily | Street Lights: 6:30 PM - 6 AM | Complaints: 1912 (Mahavitaran)',
      desc_mr: 'गाव पुरवठा: सकाळी 6 - रात्री 11 वाजता | स्ट्रीट लाइट्स: संध्याकाळी 6:30 - सकाळी 6 वाजता | तक्रार: 1912',
      icon: '💡',
    },
    {
      title_en: 'Health Services', title_mr: 'आरोग्य सेवा',
      desc_en: '1 Primary Health Centre | 1 Health Sub Centre | 2 Anganwadi Centres (Immunization, ANC, Growth Monitoring)',
      desc_mr: '1 प्राथमिक आरोग्य केंद्र | 1 आरोग्य उपकेंद्र | 2 अंगणवाडी केंद्रे (लसीकरण, ANC, वाढ मॉनिटरिंग)',
      icon: '🏥',
    },
    {
      title_en: 'Education & Nutrition', title_mr: 'शिक्षण व पौष्टिकता',
      desc_en: '2 Primary Schools | 2 Anganwadi Centres (148 children 0-6 yrs) | 0 Pre Primary | Mid-day Meal scheme active',
      desc_mr: '2 प्राथमिक शाळा | 2 अंगणवाडी केंद्रे (148 मुले 0-6 वर्षे) | 0 पूर्व प्राथमिक | मध्याह्न भोजन सक्रिय',
      icon: '🏫',
    },
    {
      title_en: 'Certificates & Licences', title_mr: 'दाखले व परवाने',
      desc_en: 'Birth / Death / Income / Caste / Residence certificates. SC/ST/OBC population: ST 63 / SC 43 / OBC 0. Apply at Panchayat Office.',
      desc_mr: 'जन्म / मृत्यू / उत्पन्न / जात / निवास दाखले. ST 63 / SC 43 / OBC 0. अर्ज: पंचायत कार्यालयात.',
      icon: '📄',
    },
    {
      title_en: 'Infrastructure Maintenance', title_mr: 'बांधकाम देखभाल',
      desc_en: '1 Children Park | 3 Drinking Water Sources | 0 Seed Co-op. RCC Road & Drain repairs reported to Panchayat Samiti.',
      desc_mr: '1 बालवाडी उद्यान | 3 पिण्याचे पाण्याचे स्रोत | 0 बियाणे सहकारी. RCC रस्ता व गटार दुरुस्ती: पंचायत समितीला कळवा.',
      icon: '🏗️',
    },
    {
      title_en: 'Application Status Tracking', title_mr: 'अर्ज स्थिती मागोवा',
      desc_en: 'Track status of all certificate and service applications online using application ID and registered mobile number. Email/SMS alerts on status change.',
      desc_mr: 'अर्ज आयडी आणि नोंदणीकृत मोबाइल नंबर वापरून सर्व दाखला आणि सेवा अर्जांची स्थिती ऑनलाइन मागोवा. स्थितीत बदल झाल्यास ईमेल/एसएमएस सूचना.',
      icon: '📊',
    },
    {
      title_en: 'Online Complaint Registration', title_mr: 'ऑनलाइन तक्रार नोंदणी',
      desc_en: 'Register grievances related to water, electricity, roads, sanitation, health, education, public works. Track grievance status with complaint ID and mobile. Photo upload supported.',
      desc_mr: 'पाणी, वीज, रस्ते, स्वच्छता, आरोग्य, शिक्षण, सार्वजनिक बांधकामाशी संबंधित तक्रारी नोंदवा. तक्रार आयडी आणि मोबाइलने तक्रारीची स्थिती मागो. फोटो अपलोड समर्थित.',
      icon: '📝',
    },
  ];
  const ins = db.prepare(`
    INSERT OR REPLACE INTO services (
      id, title_en, title_mr, desc_en, desc_mr, icon, created_at
    ) VALUES (
      (SELECT id FROM services WHERE title_en = @title_en),
      @title_en, @title_mr, @desc_en, @desc_mr, @icon,
      COALESCE((SELECT created_at FROM services WHERE title_en = @title_en), datetime('now'))
    )
  `);
  db.transaction((arr) => arr.forEach(r => ins.run(r)))(rows);
}

function seedPanchayatMembers() {
  const rows = [
    {
      name_en: 'Shital Atul Gore', name_mr: 'शितल अतुल गोरे',
      role_en: 'Sarpanch', role_mr: 'सरपंच',
      ward_no: 0, mobile: '******2857', email: 'shitalgore2468@gmail.com',
      photo: '', term_start: '2022-01-15', term_end: '2027-01-14',
      party_name: 'Independent',
    },
    {
      name_en: 'Rajesh Patil', name_mr: 'राजेश पाटील',
      role_en: 'Deputy Sarpanch', role_mr: 'उपसरपंच',
      ward_no: 1, mobile: '******9876', email: 'rajesh.patil@gmail.com',
      photo: '', term_start: '2022-01-15', term_end: '2027-01-14',
      party_name: 'NCP',
    },
    {
      name_en: 'Ashish Prakash Kolhe', name_mr: 'आशिष प्रकाश कोल्हे',
      role_en: 'Gram Sevak (Secretary)', role_mr: 'ग्राम सेवक (सचिव)',
      ward_no: 0, mobile: '******6401', email: 'aashish.kolhe@gmail.com',
      photo: '', term_start: '2023-06-01', term_end: '',
      party_name: 'Administration',
    },
    {
      name_en: 'Sangita Vijay Deshmukh', name_mr: 'संगीता विजय देशमुख',
      role_en: 'Ward Member (Ward 1)', role_mr: 'वॉर्ड सदस्य (वॉर्ड 1)',
      ward_no: 1, mobile: '******2345', email: 'sangita.deshmukh@gmail.com',
      photo: '', term_start: '2022-01-15', term_end: '2027-01-14',
      party_name: 'INC',
    },
    {
      name_en: 'Ganesh Balu Gaikwad', name_mr: 'गणेश बाळू गायकवाड',
      role_en: 'Ward Member (Ward 2)', role_mr: 'वॉर्ड सदस्य (वॉर्ड 2)',
      ward_no: 2, mobile: '******7890', email: 'ganesh.gaikwad@gmail.com',
      photo: '', term_start: '2022-01-15', term_end: '2027-01-14',
      party_name: 'BJP',
    },
  ];
  const ins = db.prepare(`
    INSERT OR REPLACE INTO panchayat_members (
      id, name_en, name_mr, role_en, role_mr, ward_no, mobile, email, photo,
      term_start, term_end, party_name, created_at, updated_at
    ) VALUES (
      (SELECT id FROM panchayat_members WHERE name_en = @name_en AND role_en = @role_en),
      @name_en, @name_mr, @role_en, @role_mr,
      IFNULL(@ward_no, 0), @mobile, IFNULL(@email, ''), IFNULL(@photo, ''),
      IFNULL(@term_start, ''), IFNULL(@term_end, ''), IFNULL(@party_name, ''),
      COALESCE((SELECT created_at FROM panchayat_members WHERE name_en = @name_en AND role_en = @role_en), datetime('now')),
      datetime('now')
    )
  `);
  db.transaction((arr) => arr.forEach(r => ins.run(r)))(rows);
}

function seedProjects() {
  const rows = [
    {
      title_en: 'Main Road Repair & Resurfacing (Ward 1-2)',
      title_mr: 'मुख्य रस्ता दुरुस्ती व रिसर्फेसिंग (वॉर्ड 1-2)',
      category_en: 'Roads & Transport', category_mr: 'रस्ते आणि वाहतूक',
      status: 'in_progress', progress_percent: 60,
      cost_total: 1500000, cost_spent: 900000,
      start_date: '2026-07-01', end_date: '2026-11-30',
      contractor_name: 'Rajasthan Construction Co.',
      funding_source_en: '14th Finance Commission Grant',
      funding_source_mr: '14 व्या वित्त आयोग अनुदान',
      description_en: 'Repair and asphalt overlay of 1.2 km main village road. Includes pothole filling, shoulder maintenance and cross-drainage work.',
      description_mr: '1.2 किमी मुख्य ग्रामीण रस्त्याची दुरुस्ती आणि डांबर ओव्हरले. पोठाळी भरणे, खांदा देखभाल आणि क्रॉस ड्रेनेज कामांचा समावेश.',
      photos: '[]',
    },
    {
      title_en: 'Drainage & Storm Water Lines Construction',
      title_mr: 'गटार व पावसाळा पाणी वाहिनी बांधकाम',
      category_en: 'Sanitation & Drainage', category_mr: 'स्वच्छता आणि गटार',
      status: 'planning', progress_percent: 0,
      cost_total: 800000, cost_spent: 0,
      start_date: '2026-10-15', end_date: '2027-01-31',
      contractor_name: 'TBD - Post Tender',
      funding_source_en: 'SBM-G + State Matching Grant',
      funding_source_mr: 'SBM-G + राज्य सेटिंग अनुदान',
      description_en: 'Construction of RCC box drains along main roads, 800 metres length. Includes 3 soak pits and 2 inspection chambers.',
      description_mr: 'मुख्य रस्त्यांवर RCC बॉक्स गटार, 800 मीटर लांबी. 3 शोष खड्डे आणि 2 तपासणी कक्षांचा समावेश.',
      photos: '[]',
    },
    {
      title_en: 'LED Street Lights Installation (Phase II)',
      title_mr: 'एलईडी स्ट्रीट लाइट्स बसवणे (टप्पा II)',
      category_en: 'Energy & Lighting', category_mr: 'ऊर्जा आणि प्रकाश',
      status: 'completed', progress_percent: 100,
      cost_total: 300000, cost_spent: 300000,
      start_date: '2026-03-01', end_date: '2026-05-31',
      contractor_name: 'Bright LED Systems Pvt Ltd',
      funding_source_en: 'State Energy Department (SED)',
      funding_source_mr: 'राज्य ऊर्जा विभाग (SED)',
      description_en: 'Installation of 45 LED street lights (70W) across Ward 1 & 2. Includes automatic timer switches and earthing. Commissioned May 2026.',
      description_mr: 'वॉर्ड 1 आणि 2 मध्ये 45 एलईडी स्ट्रीट लाइट्स (70W) बसवणे. स्वयंचलित टायमर स्विचेस आणि अर्थिंगचा समावेश. मे 2026 मध्ये सुरू.',
      photos: '[]',
    },
    {
      title_en: 'Water Tank Repair & Pipeline Extension',
      title_mr: 'पाणी टाकी दुरुस्ती आणि पाइपलाइन विस्तार',
      category_en: 'Water Supply', category_mr: 'जलपुरवठा',
      status: 'in_progress', progress_percent: 80,
      cost_total: 500000, cost_spent: 400000,
      start_date: '2026-06-01', end_date: '2026-09-30',
      contractor_name: 'Aqua Engineers',
      funding_source_en: 'Jal Jeevan Mission (JJM)',
      funding_source_mr: 'जल जीवन मिशन (JJM)',
      description_en: 'Repair of 50,000 L overhead water tank including waterproofing and coating. 450 m distribution pipeline extension to Ward 2.',
      description_mr: '50,000 लिटरच्या ओव्हरहेड पाण्याच्या टाकीची जलरोधकता आणि कोटिंगसह दुरुस्ती. वॉर्ड 2 पर्यंत 450 मी वितरण पाइपलाइन विस्तार.',
      photos: '[]',
    },
    {
      title_en: 'Solar Panel Installation — Panchayat Office',
      title_mr: 'सौर पॅनेल बसवणे — पंचायत कार्यालय',
      category_en: 'Renewable Energy', category_mr: 'नवीकरणीय ऊर्जा',
      status: 'halted', progress_percent: 30,
      cost_total: 250000, cost_spent: 75000,
      start_date: '2026-04-15', end_date: '2026-08-15',
      contractor_name: 'SunPower Renewables (Temporarily Stopped)',
      funding_source_en: 'Rural Development Dept (RDD)',
      funding_source_mr: 'ग्रामीण विकास विभाग (RDD)',
      description_en: '5 kW grid-tied solar rooftop system for Panchayat Office. Work halted due to pending MSEDCL net-metering approval. Expected restart after Oct 2026.',
      description_mr: 'पंचायत कार्यालयासाठी 5 kW ग्रिड-टाइड सोलर रूफटॉप सिस्टम. MSEDCL नेट-मीटरिंग मंजुरी पending असल्यामुळे काम ठेवले. ऑक्टोबर 2026 नंतर पुन्हा सुरू होण्याची अपेक्षा.',
      photos: '[]',
    },
    {
      title_en: 'Community Hall cum Library Construction',
      title_mr: 'समुदाय सभागृह व वाचनालय बांधकाम',
      category_en: 'Community Infrastructure', category_mr: 'समुदाय पायाभूत सुविधा',
      status: 'planning', progress_percent: 0,
      cost_total: 2000000, cost_spent: 0,
      start_date: '2026-11-01', end_date: '2027-06-30',
      contractor_name: 'TBD — Gram Sabha Approved',
      funding_source_en: 'MLA Fund + MP LAD + GP Own Fund',
      funding_source_mr: 'MLA निधी + MP LAD + GP स्वतःचा निधी',
      description_en: 'Ground + 1 RCC community hall of 2500 sq ft. Includes library section, stage, toilets, veranda and drinking water facility. Beneficiary 1430 villagers.',
      description_mr: '2500 चौरस फुटाचे ग्राउंड + 1 मजले RCC सभागृह. वाचनालय विभाग, मंच, शौचालय, बरामदा आणि पिण्याचे पाणी सुविधेचा समावेश. 1430 ग्रामस्थांना लाभ.',
      photos: '[]',
    },
  ];
  const ins = db.prepare(`
    INSERT OR REPLACE INTO projects (
      id, title_en, title_mr, category_en, category_mr, status, progress_percent,
      cost_total, cost_spent, start_date, end_date, contractor_name,
      funding_source_en, funding_source_mr, description_en, description_mr, photos,
      created_at, updated_at
    ) VALUES (
      (SELECT id FROM projects WHERE title_en = @title_en),
      @title_en, @title_mr, @category_en, @category_mr, @status,
      IFNULL(@progress_percent, 0), IFNULL(@cost_total, 0), IFNULL(@cost_spent, 0),
      IFNULL(@start_date, ''), IFNULL(@end_date, ''), IFNULL(@contractor_name, ''),
      IFNULL(@funding_source_en, ''), IFNULL(@funding_source_mr, ''),
      IFNULL(@description_en, ''), IFNULL(@description_mr, ''),
      IFNULL(@photos, '[]'),
      COALESCE((SELECT created_at FROM projects WHERE title_en = @title_en), datetime('now')),
      datetime('now')
    )
  `);
  db.transaction((arr) => arr.forEach(r => ins.run(r)))(rows);
}

function seedGramSabha() {
  const now = new Date().toISOString();
  const meetings = [
    {
      meeting_date: '2026-09-28', meeting_time: '11:00 AM',
      venue_en: 'Gram Panchayat Office Hall, Dumbarwadi',
      venue_mr: 'ग्राम पंचायत कार्यालय हॉल, डुंबरवाडी',
      chairperson_en: 'Smt. Shital Atul Gore (Sarpanch)',
      chairperson_mr: 'सौ. शितल अतुल गोरे (सरपंच)',
      agenda_pdf: '', minutes_en: '', minutes_mr: '', minutes_pdf: '',
      attendance_count: 0, status: 'upcoming',
    },
    {
      meeting_date: '2026-08-25', meeting_time: '10:30 AM',
      venue_en: 'Gram Panchayat Office Hall, Dumbarwadi',
      venue_mr: 'ग्राम पंचायत कार्यालय हॉल, डुंबरवाडी',
      chairperson_en: 'Smt. Shital Atul Gore (Sarpanch)',
      chairperson_mr: 'सौ. शितल अतुल गोरे (सरपंच)',
      agenda_pdf: '',
      minutes_en: 'Meeting held on 25 Aug 2026. Attendance: 182 villagers. Discussed: Road repair progress (60% complete), JJM water quality testing, SHG bank linkage for 2 new groups, PMAY housing list revision. Resolutions passed unanimously. Next meeting scheduled 28 Sep 2026.',
      minutes_mr: '25 ऑगस्ट 2026 रोजी सभा झाली. उपस्थिती: 182 ग्रामस्थ. चर्चिलेले विषय: रस्ता दुरुस्ती प्रगती (60% पूर्ण), JJM पाणी गुणवत्ता चाचणी, 2 नवीन गटांसाठी SHG बँक लिंकेज, PMAY गृह योजना सुधारित यादी. ठराव एकमताने पास. पुढील सभा 28 सेप्टेंबर 2026 ला नियोजित.',
      minutes_pdf: '', attendance_count: 5, status: 'past',
    },
  ];
  const meetingIns = db.prepare(`
    INSERT OR REPLACE INTO gram_sabha_meetings (
      id, meeting_date, meeting_time, venue_en, venue_mr, chairperson_en, chairperson_mr,
      agenda_pdf, minutes_en, minutes_mr, minutes_pdf, attendance_count, status, created_at, updated_at
    ) VALUES (
      (SELECT id FROM gram_sabha_meetings WHERE meeting_date = @meeting_date),
      @meeting_date, @meeting_time, @venue_en, @venue_mr, @chairperson_en, @chairperson_mr,
      IFNULL(@agenda_pdf, ''), IFNULL(@minutes_en, ''), IFNULL(@minutes_mr, ''),
      IFNULL(@minutes_pdf, ''), IFNULL(@attendance_count, 0), @status,
      COALESCE((SELECT created_at FROM gram_sabha_meetings WHERE meeting_date = @meeting_date), datetime('now')),
      datetime('now')
    )
  `);
  db.transaction((arr) => arr.forEach(m => meetingIns.run(m)))(meetings);

  const upcomingId = db.prepare(`SELECT id FROM gram_sabha_meetings WHERE meeting_date = ?`).get('2026-09-28').id;
  const pastId = db.prepare(`SELECT id FROM gram_sabha_meetings WHERE meeting_date = ?`).get('2026-08-25').id;

  const agendaItems = [
    { meeting_id: upcomingId, item_no: 1, title_en: 'Confirmation of previous meeting minutes', title_mr: 'मागील सभेच्या वारंवारतेची पुष्टी', description_en: 'Review and confirm minutes of Gram Sabha held on 25 Aug 2026.', description_mr: '25 ऑगस्ट 2026 रोजी झालेल्या ग्रामसभेच्या वारंवारतेचे पुनरावलोकन व पुष्टी.', decision_en: '', decision_mr: '' },
    { meeting_id: upcomingId, item_no: 2, title_en: 'Annual Budget Presentation & Approval', title_mr: 'वार्षिक बजेट सादरीकरण व मंजूरी', description_en: 'Sarpanch to present GP annual budget 2026-27 (Total estimate ₹85 lakh) for approval. Break-up: Revenue ₹30L, Central/State grants ₹55L.', description_mr: 'सरपंच GP वार्षिक बजेट 2026-27 (एकूण अंदाज ₹85 लाख) मंजूरीसाठी सादर करेल. विभाजन: महसूल ₹30L, केंद्र/राज्य अनुदान ₹55L.', decision_en: '', decision_mr: '' },
    { meeting_id: upcomingId, item_no: 3, title_en: 'Road Repair Project Progress Review', title_mr: 'रस्ता दुरुस्ती प्रकल्प प्रगती आढावा', description_en: 'Contractor to present progress report for Main Road Repair (60% complete, ₹9L spent). Discussion on remaining works, quality checks and timeline.', description_mr: 'कंत्राटदार मुख्य रस्ता दुरुस्तीचा प्रगती अहवाल सादर करेल (60% पूर्ण, ₹9L खर्च). उर्वरित कामे, गुणवत्ता तपासणी आणि टाइमलाइनवर चर्चा.', decision_en: '', decision_mr: '' },
    { meeting_id: upcomingId, item_no: 4, title_en: 'Jal Jeevan Mission (JJM) Status Report', title_mr: 'जल जीवन मिशन (JJM) स्थिती अहवाल', description_en: 'Gram Sevak to report on: 321/321 tap connections active, 3 water sources, water quality test results, pending repairs to Tank (80% complete).', description_mr: 'ग्राम सेवक अहवाल देतील: 321/321 नळ कनेक्शन सक्रिय, 3 पाणी स्रोत, पाणी गुणवत्ता चाचणी निकाल, टाकीच्या दुरुस्त्या पेंडिंग (80% पूर्ण).', decision_en: '', decision_mr: '' },
    { meeting_id: upcomingId, item_no: 5, title_en: 'Self Help Groups (SHG) Updates', title_mr: 'स्वयंसहाय्य गट (SHG) अद्ययावती', description_en: 'SHG representatives to present: 12 active SHGs, bank linkage status, savings amount, livelihood activities undertaken, proposals for new SHG grant.', description_mr: 'SHG प्रतिनिधी सादर करतील: 12 सक्रिय SHGs, बँक लिंकेज स्थिती, बचत रक्कम, उपक्रमांच्या उद्योगातील क्रियाकलाप, नवीन SHG अनुदानासाठी प्रस्ताव.', decision_en: '', decision_mr: '' },
    { meeting_id: upcomingId, item_no: 6, title_en: 'Any Other with Permission of Chair', title_mr: 'अध्यक्षांच्या परवानगीने इतर विषय', description_en: 'Any other matter with the permission of the chairperson.', description_mr: 'अध्यक्षांच्या परवानगीने इतर कोणत्याही विषयांची चर्चा.', decision_en: '', decision_mr: '' },
    { meeting_id: pastId, item_no: 1, title_en: 'Confirmation of Previous Minutes', title_mr: 'मागील वारंवारतेची पुष्टी', description_en: 'Minutes of 27 Jul 2026 meeting confirmed.', description_mr: '27 जुलै 2026 सभेच्या वारंवारतेची पुष्टी.', decision_en: 'Confirmed unanimously', decision_mr: 'एकमताने पुष्टी' },
    { meeting_id: pastId, item_no: 2, title_en: 'Street Lights Phase-II Commissioning', title_mr: 'स्ट्रीट लाइट्स टप्पा-II सुरू', description_en: '45 LED street lights handed over. Completed before monsoon.', description_mr: '45 एलईडी स्ट्रीट लाइट्स हस्तांतरित. पावसाळ्यापूर्वी पूर्ण.', decision_en: 'Accepted with thanks to contractor', decision_mr: 'कंत्राटदाराचे आभार मानून स्वीकारले' },
    { meeting_id: pastId, item_no: 3, title_en: 'PMAY Revised List', title_mr: 'PMAY सुधारित यादी', description_en: '3 beneficiaries added, 1 removed due to non-response.', description_mr: '3 लाभार्थी जोडले, 1 प्रतिसाद न मिळाल्यामुळे काढून टाकले.', decision_en: 'Approved list submitted to BDO', decision_mr: 'स्वीकृत यादी BDO कडे सादर' },
    { meeting_id: pastId, item_no: 4, title_en: 'Water Tank Repair Tender', title_mr: 'पाणी टाकी दुरुस्ती निविदा', description_en: 'Tender of ₹5 lakh approved for Aqua Engineers.', description_mr: 'Aqua Engineers साठी ₹5 लाखाची निविदा मंजूर.', decision_en: 'Work order issued 1 Jun 2026', decision_mr: '1 जून 2026 ला कामाचा आदेश जारी' },
    { meeting_id: pastId, item_no: 5, title_en: 'Any Other', title_mr: 'इतर विषय', description_en: 'Community Hall fund raising discussed.', description_mr: 'समुदाय सभागृह निधी उभारण्यावर चर्चा.', decision_en: 'MLA fund of ₹10 lakh confirmed', decision_mr: 'MLA निधी ₹10 लाख पुष्टी' },
  ];
  const agendaIns = db.prepare(`
    INSERT OR REPLACE INTO gram_sabha_agenda (
      id, meeting_id, item_no, title_en, title_mr, description_en, description_mr,
      decision_en, decision_mr, created_at
    ) VALUES (
      (SELECT id FROM gram_sabha_agenda WHERE meeting_id = @meeting_id AND item_no = @item_no),
      @meeting_id, @item_no, @title_en, @title_mr,
      IFNULL(@description_en, ''), IFNULL(@description_mr, ''),
      IFNULL(@decision_en, ''), IFNULL(@decision_mr, ''),
      COALESCE((SELECT created_at FROM gram_sabha_agenda WHERE meeting_id = @meeting_id AND item_no = @item_no), datetime('now'))
    )
  `);
  db.transaction((arr) => arr.forEach(a => agendaIns.run(a)))(agendaItems);

  const attendance = [
    { meeting_id: pastId, citizen_name_en: 'Shital Atul Gore', citizen_name_mr: 'शितल अतुल गोरे', ward_no: 0, mobile: '******2857' },
    { meeting_id: pastId, citizen_name_en: 'Rajesh Patil', citizen_name_mr: 'राजेश पाटील', ward_no: 1, mobile: '******9876' },
    { meeting_id: pastId, citizen_name_en: 'Ashish Prakash Kolhe', citizen_name_mr: 'आशिष प्रकाश कोल्हे', ward_no: 0, mobile: '******6401' },
    { meeting_id: pastId, citizen_name_en: 'Sangita Vijay Deshmukh', citizen_name_mr: 'संगीता विजय देशमुख', ward_no: 1, mobile: '******2345' },
    { meeting_id: pastId, citizen_name_en: 'Ganesh Balu Gaikwad', citizen_name_mr: 'गणेश बाळू गायकवाड', ward_no: 2, mobile: '******7890' },
  ];
  const attIns = db.prepare(`
    INSERT OR REPLACE INTO gram_sabha_attendance (
      id, meeting_id, citizen_name_en, citizen_name_mr, ward_no, mobile, signed_at
    ) VALUES (
      (SELECT id FROM gram_sabha_attendance WHERE meeting_id = @meeting_id AND mobile = @mobile),
      @meeting_id, @citizen_name_en, IFNULL(@citizen_name_mr, ''),
      IFNULL(@ward_no, 0), IFNULL(@mobile, ''),
      COALESCE((SELECT signed_at FROM gram_sabha_attendance WHERE meeting_id = @meeting_id AND mobile = @mobile), datetime('now'))
    )
  `);
  db.transaction((arr) => arr.forEach(a => attIns.run(a)))(attendance);
}

function seedCitizens() {
  const hash = bcrypt.hashSync('Demo@123', 10);
  const rows = [
    {
      mobile: '9876543210', password_hash: hash,
      fullname_en: 'Demo Citizen One', fullname_mr: 'डेमो नागरिक एक',
      ward_no: 1, household_no: 'HH-001', gender: 'male', dob: '1990-05-15',
      email: 'demo.citizen1@gmail.com',
      address_en: 'House No. 15, Ward 1, At Post Dumbarwadi',
      address_mr: 'घर क्र. 15, वॉर्ड 1, अ. पो. डुंबरवाडी',
      aadhaar_last4: '1234', father_husband_name: 'Ramesh Citizen',
    },
    {
      mobile: '9876543211', password_hash: hash,
      fullname_en: 'Demo Citizen Two', fullname_mr: 'डेमो नागरिक दोन',
      ward_no: 2, household_no: 'HH-210', gender: 'female', dob: '1992-08-22',
      email: 'demo.citizen2@gmail.com',
      address_en: 'House No. 210, Ward 2, At Post Dumbarwadi',
      address_mr: 'घर क्र. 210, वॉर्ड 2, अ. पो. डुंबरवाडी',
      aadhaar_last4: '5678', father_husband_name: 'Suresh Citizen',
    },
  ];
  const ins = db.prepare(`
    INSERT OR REPLACE INTO citizens (
      id, mobile, password_hash, fullname_en, fullname_mr, ward_no, household_no,
      gender, dob, email, address_en, address_mr, aadhaar_last4, father_husband_name,
      created_at, updated_at
    ) VALUES (
      (SELECT id FROM citizens WHERE mobile = @mobile),
      @mobile, @password_hash, @fullname_en, IFNULL(@fullname_mr, ''),
      IFNULL(@ward_no, 1), IFNULL(@household_no, ''), IFNULL(@gender, ''),
      IFNULL(@dob, ''), IFNULL(@email, ''), IFNULL(@address_en, ''),
      IFNULL(@address_mr, ''), IFNULL(@aadhaar_last4, ''),
      IFNULL(@father_husband_name, ''),
      COALESCE((SELECT created_at FROM citizens WHERE mobile = @mobile), datetime('now')),
      datetime('now')
    )
  `);
  db.transaction((arr) => arr.forEach(r => ins.run(r)))(rows);
}

function seedContacts() {
  const rows = [
    {
      person_name: 'Shital Atul Gore', role_en: 'Sarpanch', role_mr: 'सरपंच',
      mobile: '******2857', email: 'shitalgore2468@gmail.com',
      extra_label_en: 'Office', extra_label_mr: 'कार्यालय', extra_value: 'Dumbarwadi',
      accent: '#004c8c', is_emergency: 0,
    },
    {
      person_name: 'Ashish Prakash Kolhe', role_en: 'Sachiv (Secretary)', role_mr: 'सचिव',
      mobile: '******6401', email: 'aashish.kolhe@gmail.com',
      extra_label_en: 'Panchayat Office', extra_label_mr: 'पंचायत कार्यालय', extra_value: 'At Post Dumbarwadi',
      accent: '#138808', is_emergency: 0,
    },
    {
      person_name: 'SHG Representatives', role_en: 'SHG Representative (12 SHGs)', role_mr: 'स्वयंसहाय्य गट प्रतिनिधी (12 गट)',
      mobile: 'Contact Sachiv', email: null,
      extra_label_en: 'Standing Committee Member', extra_label_mr: 'स्थायी समिती सदस्य', extra_value: '1 Seats',
      accent: '#7c3aed', is_emergency: 0,
    },
    {
      person_name: 'Panchayat Office', role_en: 'Panchayat Office HQ', role_mr: 'पंचायत कार्यालय',
      mobile: 'Visit Office', email: null,
      extra_label_en: 'Office hours', extra_label_mr: 'कार्यालय वेळ', extra_value: '10 AM - 5 PM (Mon-Sat)',
      accent: '#0284c7', is_emergency: 0,
    },
    {
      person_name: 'Police Control', role_en: '🚨 Police Emergency', role_mr: '🚨 पोलीस आपत्कालीन',
      mobile: '100', email: null, accent: '#dc2626', is_emergency: 1,
    },
    {
      person_name: 'Ambulance (108)', role_en: '🚑 Ambulance Service', role_mr: '🚑 रुग्णवाहिका सेवा',
      mobile: '108', email: null, accent: '#dc2626', is_emergency: 1,
    },
    {
      person_name: 'Fire Brigade', role_en: '🧯 Fire Emergency', role_mr: '🧯 अग्निशमन आपत्कालीन',
      mobile: '101', email: null, accent: '#dc2626', is_emergency: 1,
    },
    {
      person_name: 'Primary Health Centre', role_en: '🏥 PHC Dumbarwadi', role_mr: '🏥 प्राथमिक आरोग्य केंद्र',
      mobile: 'Near Panchayat Office', email: null, accent: '#f59e0b', is_emergency: 1,
    },
    {
      person_name: 'Electricity Dept (MSEDCL)', role_en: '⚡ Power Complaint', role_mr: '⚡ वीज तक्रार',
      mobile: '1912', email: null, accent: '#f59e0b', is_emergency: 1,
    },
    {
      person_name: 'Water Works Dept', role_en: '💧 Water Complaint', role_mr: '💧 पाणी तक्रार',
      mobile: '3 Sources • 321 HHs', email: null, accent: '#f59e0b', is_emergency: 1,
    },
  ];
  const ins = db.prepare(`
    INSERT OR REPLACE INTO contacts (
      id, person_name, role_en, role_mr, mobile, email,
      extra_label_en, extra_label_mr, extra_value, accent, is_emergency, created_at
    ) VALUES (
      (SELECT id FROM contacts WHERE person_name = @person_name AND role_en = @role_en),
      @person_name, @role_en, @role_mr, @mobile, @email,
      @extra_label_en, @extra_label_mr, @extra_value, @accent, @is_emergency,
      COALESCE((SELECT created_at FROM contacts WHERE person_name = @person_name AND role_en = @role_en), datetime('now'))
    )
  `);
  const defaults = { email: '', extra_label_en: '', extra_label_mr: '', extra_value: '' };
  db.transaction((arr) => arr.forEach(r => ins.run({ ...defaults, ...r })))(rows);
}

function seedAdmin() {
  const hash = config.DEMO_ADMIN_PASSWORD_HASH.startsWith('$2')
    ? config.DEMO_ADMIN_PASSWORD_HASH
    : bcrypt.hashSync(config.DEMO_ADMIN_PASSWORD, 10);
  db.prepare(`
    INSERT OR REPLACE INTO admins (id, username, password_hash, role, created_at)
    VALUES (
      (SELECT id FROM admins WHERE username = @username),
      @username, @password_hash, 'admin',
      COALESCE((SELECT created_at FROM admins WHERE username = @username), datetime('now'))
    )
  `).run({ username: config.DEMO_ADMIN_USERNAME, password_hash: hash });
  if (force) {
    db.prepare('DELETE FROM scheme_applications').run();
  }
}

function seedAll(printCounts = true) {
  if (force) dropTables();
  createTables();
  alterExistingTables();
  seedVillage();
  seedProfileStats();
  seedSchemes();
  seedNotices();
  seedServices();
  seedContacts();
  seedPanchayatMembers();
  seedProjects();
  seedGramSabha();
  seedCitizens();
  seedAdmin();
  if (printCounts) {
    const c = (t) => db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c;
    console.log(`✓ Seeded: village=${c('village')}, profile_stats=${c('profile_stats')}, schemes=${c('schemes')}, notices=${c('notices')}, services=${c('services')}, contacts=${c('contacts')}, panchayat_members=${c('panchayat_members')}, projects=${c('projects')}, gram_sabha_meetings=${c('gram_sabha_meetings')}, gram_sabha_agenda=${c('gram_sabha_agenda')}, gram_sabha_attendance=${c('gram_sabha_attendance')}, citizens=${c('citizens')}, admins=${c('admins')}, scheme_applications=${c('scheme_applications')}`);
  }
}

if (require.main === module) {
  db.init()
    .then(async () => {
      seedAll();
      await db.flushNow();
      console.log('DB seed complete (MongoDB Atlas updated).');
      process.exit(0);
    })
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = { seedAll, TABLES, tablesEmpty: () => db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('village','schemes','citizens','panchayat_members','projects','gram_sabha_meetings')").all().length < 6 };
