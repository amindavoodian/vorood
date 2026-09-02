/**
this is db.js

 * Hybrid Turso Cloud + LocalStorage Database & Auto-Fill Sync Layer
 */
const DB = {
  STORAGE_KEY: 'campus_guard_db_v6',
  GUARDS_KEY: 'campus_guard_officers_v6',
  PROFILES_KEY: 'campus_guard_profiles_v6',
  ACTIVE_GUARD_KEY: 'campus_guard_active_id_v6',
  TURSO_KEY: 'campus_guard_turso_cfg_v6',

  defaultGuards: [
    { id: 1, name: 'علیرضا حسینی', shiftName: 'شیفت صبح', shiftHours: '۰۶:۰۰ الی ۱۴:۰۰' },
    { id: 2, name: 'محمد کریمی', shiftName: 'شیفت عصر', shiftHours: '۱۴:۰۰ الی ۲۲:۰۰' },
    { id: 3, name: 'مهدی مرادی', shiftName: 'شیفت شب', shiftHours: '۲۲:۰۰ الی ۰۶:۰۰' }
  ],

  getTursoConfig() {
    try { return JSON.parse(localStorage.getItem(this.TURSO_KEY) || 'null'); } catch { return null; }
  },
  saveTursoConfig(cfg) {
    localStorage.setItem(this.TURSO_KEY, JSON.stringify(cfg));
  },
  clearTursoConfig() {
    localStorage.removeItem(this.TURSO_KEY);
  },
  isCloudConfigured() {
    const cfg = this.getTursoConfig();
    return !!(cfg && cfg.databaseUrl && cfg.authToken);
  },

  async executeTurso(sql, args = []) {
    const cfg = this.getTursoConfig();
    if (!cfg || !cfg.databaseUrl || !cfg.authToken) {
      throw new Error('تنظیمات دیتابیس ابری ثبت نشده است.');
    }

    let baseUrl = cfg.databaseUrl.trim();
    if (baseUrl.startsWith('libsql://')) {
      baseUrl = baseUrl.replace('libsql://', 'https://');
    } else if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'https://' + baseUrl;
    }
    baseUrl = baseUrl.replace(/\/+$/, '');
    const endpoint = `${baseUrl}/v2/pipeline`;

    const formattedArgs = args.map(arg => {
      if (arg === null || arg === undefined) return { type: 'null' };
      if (typeof arg === 'number') return { type: 'integer', value: String(arg) };
      return { type: 'text', value: String(arg) };
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.authToken.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql, args: formattedArgs } },
          { type: 'close' }
        ]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`خطای سرور دیتابیس (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const firstResult = data.results?.[0];
    if (firstResult?.type === 'error') {
      throw new Error(firstResult.error?.message || 'خطای اجرای کوئری SQL');
    }
    return firstResult?.response?.result;
  },

  async initCloudTables() {
    if (!this.isCloudConfigured()) return;

    // جدول ترددها
    const createRecordsTable = `
      CREATE TABLE IF NOT EXISTS campus_records (
        id INTEGER PRIMARY KEY,
        traffic_type TEXT,
        person_category TEXT,
        person_name TEXT,
        plate_part1 TEXT,
        plate_letter TEXT,
        plate_part2 TEXT,
        plate_city TEXT,
        plate_full TEXT,
        vehicle_category TEXT,
        vehicle_model TEXT,
        status TEXT,
        entry_jalali_date TEXT,
        entry_time_display TEXT,
        exit_time TEXT,
        exit_jalali_date TEXT,
        exit_time_display TEXT,
        guard_name TEXT,
        guard_shift TEXT,
        notes TEXT,
        created_at TEXT
      );
    `;

    // جدول ماموران
    const createGuardsTable = `
      CREATE TABLE IF NOT EXISTS campus_guards (
        id INTEGER PRIMARY KEY,
        name TEXT,
        shift_name TEXT,
        shift_hours TEXT
      );
    `;

    // جدول پروفایل‌ها و حافظه خودکار
    const createProfilesTable = `
      CREATE TABLE IF NOT EXISTS campus_profiles (
        profile_key TEXT PRIMARY KEY,
        traffic_type TEXT,
        person_name TEXT,
        person_category TEXT,
        plate_part1 TEXT,
        plate_letter TEXT,
        plate_part2 TEXT,
        plate_city TEXT,
        plate_full TEXT,
        vehicle_category TEXT,
        vehicle_model TEXT,
        default_notes TEXT,
        updated_at TEXT
      );
    `;

    await this.executeTurso(createRecordsTable);
    await this.executeTurso(createGuardsTable);
    await this.executeTurso(createProfilesTable);
  },

  parseRows(result) {
    if (!result || !result.rows || !result.cols) return [];
    const cols = result.cols.map(c => c.name);
    return result.rows.map(row => {
      const obj = {};
      row.forEach((cell, i) => {
        if (cell.type === 'null') {
          obj[cols[i]] = null;
        } else if (cell.type === 'integer') {
          obj[cols[i]] = Number(cell.value);
        } else {
          obj[cols[i]] = cell.value;
        }
      });
      return obj;
    });
  },

  // --- مدیریت حافظه محلی مراجعین (Profiles for Auto-fill) ---
  getLocalProfiles() {
    try {
      const raw = localStorage.getItem(this.PROFILES_KEY) || '{}';
      return JSON.parse(raw);
    } catch { return {}; }
  },
  saveLocalProfiles(profilesMap) {
    localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profilesMap));
  },

  generateProfileKey(trafficType, p1, ltr, p2, city, personName) {
    if (trafficType === 'PEDESTRIAN') {
      return `PED_${Jalali.toLatinDigits(personName || '').trim().toLowerCase()}`;
    }
    const cP1 = Jalali.toLatinDigits(p1 || '').trim();
    const cLtr = (ltr || '').trim();
    const cP2 = Jalali.toLatinDigits(p2 || '').trim();
    const cCity = Jalali.toLatinDigits(city || '').trim();
    return `VEH_${cP1}_${cLtr}_${cP2}_${cCity}`;
  },

  async syncProfiles() {
    if (this.isCloudConfigured()) {
      try {
        const res = await this.executeTurso('SELECT * FROM campus_profiles');
        const rows = this.parseRows(res);
        const localMap = this.getLocalProfiles();

        if (rows.length > 0) {
          rows.forEach(r => {
            localMap[r.profile_key] = {
              profileKey: r.profile_key,
              trafficType: r.traffic_type,
              personName: r.person_name,
              personCategory: r.person_category,
              platePart1: r.plate_part1,
              plateLetter: r.plate_letter,
              platePart2: r.plate_part2,
              plateCity: r.plate_city,
              plateFull: r.plate_full,
              vehicleCategory: r.vehicle_category,
              vehicleModel: r.vehicle_model,
              defaultNotes: r.default_notes,
              updatedAt: r.updated_at
            };
          });
          this.saveLocalProfiles(localMap);
        }
      } catch (err) {
        console.warn('همگام‌سازی پروفایل‌های ابری با خطا مواجه شد، استفاده از کش محلی:', err);
      }
    }
  },

  async saveOrUpdateProfile(profileData) {
    const key = this.generateProfileKey(
      profileData.trafficType,
      profileData.platePart1,
      profileData.plateLetter,
      profileData.platePart2,
      profileData.plateCity,
      profileData.personName
    );

    const fullProfile = {
      ...profileData,
      profileKey: key,
      updatedAt: new Date().toISOString()
    };

    // ذخیره در LocalStorage برای سرعت لحظه‌ای Auto-fill
    const localMap = this.getLocalProfiles();
    localMap[key] = fullProfile;
    this.saveLocalProfiles(localMap);

    // ذخیره همزمان در دیتابیس ابری
    if (this.isCloudConfigured()) {
      try {
        await this.executeTurso(`
          INSERT INTO campus_profiles (
            profile_key, traffic_type, person_name, person_category,
            plate_part1, plate_letter, plate_part2, plate_city, plate_full,
            vehicle_category, vehicle_model, default_notes, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(profile_key) DO UPDATE SET
            person_name=excluded.person_name,
            person_category=excluded.person_category,
            vehicle_category=excluded.vehicle_category,
            vehicle_model=excluded.vehicle_model,
            default_notes=excluded.default_notes,
            updated_at=excluded.updated_at;
        `, [
          fullProfile.profileKey, fullProfile.trafficType, fullProfile.personName,
          fullProfile.personCategory, fullProfile.platePart1, fullProfile.plateLetter,
          fullProfile.platePart2, fullProfile.plateCity, fullProfile.plateFull,
          fullProfile.vehicleCategory, fullProfile.vehicleModel, fullProfile.defaultNotes,
          fullProfile.updatedAt
        ]);
      } catch (e) {
        console.error('خطا در همگام‌سازی پروفایل مراجع با سرور ابری:', e);
      }
    }
  },

  findProfileByPlate(p1, ltr, p2, city) {
    const key = this.generateProfileKey('VEHICLE', p1, ltr, p2, city);
    const profiles = this.getLocalProfiles();
    return profiles[key] || null;
  },

  findProfileByName(name) {
    const key = this.generateProfileKey('PEDESTRIAN', null, null, null, null, name);
    const profiles = this.getLocalProfiles();
    return profiles[key] || null;
  },

  // --- مدیریت رکوردها و ماموران ---
  getLocalRecords() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY) || '[]';
      return JSON.parse(raw);
    } catch { return []; }
  },
  saveLocalRecords(list) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
  },

  getLocalGuards() {
    try {
      const raw = localStorage.getItem(this.GUARDS_KEY);
      if (!raw) {
        this.saveLocalGuards(this.defaultGuards);
        return this.defaultGuards;
      }
      return JSON.parse(raw);
    } catch { return this.defaultGuards; }
  },
  saveLocalGuards(list) {
    localStorage.setItem(this.GUARDS_KEY, JSON.stringify(list));
  },

  getActiveGuardId() {
    return Number(localStorage.getItem(this.ACTIVE_GUARD_KEY)) || (this.getLocalGuards()[0]?.id || 1);
  },
  setActiveGuardId(id) {
    localStorage.setItem(this.ACTIVE_GUARD_KEY, String(id));
  },
  async getActiveGuard() {
    const guards = await this.getGuards();
    const id = this.getActiveGuardId();
    return guards.find(g => g.id === id) || guards[0] || { name: 'نامشخص', shiftName: 'عمومی', shiftHours: '--' };
  },

  async getGuards() {
    if (this.isCloudConfigured()) {
      try {
        const res = await this.executeTurso('SELECT * FROM campus_guards ORDER BY id ASC');
        const rows = this.parseRows(res);
        if (rows.length > 0) {
          const mapped = rows.map(r => ({
            id: r.id,
            name: r.name,
            shiftName: r.shift_name,
            shiftHours: r.shift_hours
          }));
          this.saveLocalGuards(mapped);
          return mapped;
        }
      } catch (e) {
        console.warn('خواندن لیست ماموران از کش محلی به دلیل عدم دسترسی به سرور:', e);
      }
    }
    return this.getLocalGuards();
  },

  async addGuard(name, shiftName, shiftHours) {
    const newGuard = { id: Date.now(), name, shiftName, shiftHours: shiftHours || 'تمام‌وقت' };
    if (this.isCloudConfigured()) {
      try {
        await this.executeTurso(
          'INSERT INTO campus_guards (id, name, shift_name, shift_hours) VALUES (?, ?, ?, ?)',
          [newGuard.id, newGuard.name, newGuard.shiftName, newGuard.shiftHours]
        );
      } catch (e) {
        console.error('خطا در ذخیره مامور در ابری:', e);
      }
    }
    const list = this.getLocalGuards();
    list.push(newGuard);
    this.saveLocalGuards(list);
    return newGuard;
  },

  async deleteGuard(id) {
    if (this.isCloudConfigured()) {
      try {
        await this.executeTurso('DELETE FROM campus_guards WHERE id = ?', [id]);
      } catch (e) {
        console.error('خطا در حذف مامور از ابری:', e);
      }
    }
    let list = this.getLocalGuards();
    list = list.filter(g => g.id !== id);
    this.saveLocalGuards(list);
  },

  async getRecords() {
    if (this.isCloudConfigured()) {
      try {
        const res = await this.executeTurso('SELECT * FROM campus_records ORDER BY id DESC');
        const rows = this.parseRows(res);
        this.saveLocalRecords(rows);
        return rows;
      } catch (e) {
        console.warn('خواندن ترددها از کش محلی:', e);
      }
    }
    return this.getLocalRecords();
  },

  async insertEntry(entry) {
    const activeGuard = await this.getActiveGuard();
    const newRecord = {
      ...entry,
      guard_name: activeGuard.name,
      guard_shift: `${activeGuard.shiftName} (${activeGuard.shiftHours})`,
      id: Date.now(),
      created_at: new Date().toISOString()
    };

    if (this.isCloudConfigured()) {
      try {
        await this.executeTurso(`
          INSERT INTO campus_records (
            id, traffic_type, person_category, person_name, plate_part1, plate_letter,
            plate_part2, plate_city, plate_full, vehicle_category, vehicle_model, status,
            entry_jalali_date, entry_time_display, exit_time, exit_jalali_date, exit_time_display,
            guard_name, guard_shift, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          newRecord.id, newRecord.traffic_type, newRecord.person_category, newRecord.person_name,
          newRecord.plate_part1, newRecord.plate_letter, newRecord.plate_part2, newRecord.plate_city,
          newRecord.plate_full, newRecord.vehicle_category, newRecord.vehicle_model, newRecord.status,
          newRecord.entry_jalali_date, newRecord.entry_time_display, newRecord.exit_time,
          newRecord.exit_jalali_date, newRecord.exit_time_display, newRecord.guard_name,
          newRecord.guard_shift, newRecord.notes, newRecord.created_at
        ]);
      } catch (e) {
        console.error('خطای ثبت در سرور ابری:', e);
        throw new Error('ثبت در دیتابیس ابری با خطا مواجه شد: ' + e.message);
      }
    }

    const localList = this.getLocalRecords();
    localList.unshift(newRecord);
    this.saveLocalRecords(localList);

    // ذخیره یا بروزرسانی پروفایل در حافظه هوشمند
    await this.saveOrUpdateProfile({
      trafficType: newRecord.traffic_type,
      personName: newRecord.person_name,
      personCategory: newRecord.person_category,
      platePart1: newRecord.plate_part1,
      plateLetter: newRecord.plate_letter,
      platePart2: newRecord.plate_part2,
      plateCity: newRecord.plate_city,
      plateFull: newRecord.plate_full,
      vehicleCategory: newRecord.vehicle_category,
      vehicleModel: newRecord.vehicle_model,
      defaultNotes: newRecord.notes
    });

    return newRecord;
  },

  async updateRecord(id, updatedFields) {
    if (this.isCloudConfigured()) {
      try {
        const keys = Object.keys(updatedFields);
        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => updatedFields[k]);
        values.push(id);
        await this.executeTurso(`UPDATE campus_records SET ${setClause} WHERE id = ?`, values);
      } catch (e) {
        console.error('خطای ویرایش در سرور ابری:', e);
        throw new Error('ویرایش در دیتابیس ابری ناموفق بود: ' + e.message);
      }
    }

    const localList = this.getLocalRecords();
    const idx = localList.findIndex(r => r.id === id);
    if (idx !== -1) {
      localList[idx] = { ...localList[idx], ...updatedFields };
      this.saveLocalRecords(localList);

      const r = localList[idx];
      await this.saveOrUpdateProfile({
        trafficType: r.traffic_type,
        personName: r.person_name,
        personCategory: r.person_category,
        platePart1: r.plate_part1,
        plateLetter: r.plate_letter,
        platePart2: r.plate_part2,
        plateCity: r.plate_city,
        plateFull: r.plate_full,
        vehicleCategory: r.vehicle_category,
        vehicleModel: r.vehicle_model,
        defaultNotes: r.notes
      });

      return localList[idx];
    }
    return null;
  },

  async deleteRecord(id) {
    if (this.isCloudConfigured()) {
      try {
        await this.executeTurso('DELETE FROM campus_records WHERE id = ?', [id]);
      } catch (e) {
        console.error('خطای حذف در سرور ابری:', e);
        throw new Error('حذف از دیتابیس ابری ناموفق بود: ' + e.message);
      }
    }
    let localList = this.getLocalRecords();
    localList = localList.filter(r => r.id !== id);
    this.saveLocalRecords(localList);
  }
};

window.DB = DB;
