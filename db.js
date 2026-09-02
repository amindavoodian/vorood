/**
 * db.js
 * لایه جامع پایگاه داده (Turso Cloud + LocalStorage)
 * مجهز به سیستم ستاپ اولیه مدیر ارشد، احراز هویت پایدار، نشست‌های مستقل و مدیریت سطوح دسترسی (RBAC)
 */

const DB = {
  STORAGE_KEY: 'campus_guard_records_v8',
  USERS_KEY: 'campus_guard_users_v8',
  ACTIVE_USER_KEY: 'campus_guard_active_user_v8',
  PROFILES_KEY: 'campus_guard_profiles_v8',
  TURSO_KEY: 'campus_guard_turso_cfg_v8',

  // --- تنظیمات دیتابیس ابری Turso (LibSQL) ---
  getTursoConfig() {
    try {
      return JSON.parse(localStorage.getItem(this.TURSO_KEY) || 'null');
    } catch {
      return null;
    }
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
      throw new Error('تنظیمات اتصال به دیتابیس ابری ثبت نشده است.');
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
      throw new Error(`خطای سرور ابری (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const firstResult = data.results?.[0];
    if (firstResult?.type === 'error') {
      throw new Error(firstResult.error?.message || 'خطای اجرای کوئری در دیتابیس ابری');
    }
    return firstResult?.response?.result;
  },

  async initCloudTables() {
    if (!this.isCloudConfigured()) return;

    // جدول رکوردهای تردد با تفکیک مامور ورود و مامور خروج
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
        entry_guard_name TEXT,
        entry_guard_shift TEXT,
        exit_guard_name TEXT,
        exit_guard_shift TEXT,
        notes TEXT,
        created_at TEXT
      );
    `;

    // جدول کاربران و نگهبانان با مجوزهای تفکیکی
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS campus_users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        name TEXT,
        role TEXT,
        pin TEXT,
        permissions TEXT,
        shift_name TEXT,
        shift_hours TEXT,
        created_at TEXT
      );
    `;

    // جدول مراجعین پرتکرار برای تکمیل خودکار (Auto-fill)
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
    await this.executeTurso(createUsersTable);
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

  // ==========================================
  // مدیریت کاربران و بررسی وضعیت راه‌اندازی (Setup)
  // ==========================================
  getLocalUsers() {
    try {
      const raw = localStorage.getItem(this.USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveLocalUsers(usersList) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(usersList));
  },

  async getUsers() {
    if (this.isCloudConfigured()) {
      try {
        const res = await this.executeTurso('SELECT * FROM campus_users ORDER BY role DESC, name ASC');
        const rows = this.parseRows(res);
        if (rows.length > 0) {
          const mapped = rows.map(r => ({
            id: r.id,
            username: r.username,
            name: r.name,
            role: r.role,
            pin: r.pin,
            permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : (r.permissions || {}),
            shiftName: r.shift_name,
            shiftHours: r.shift_hours
          }));
          this.saveLocalUsers(mapped);
          return mapped;
        }
      } catch (e) {
        console.warn('خواندن کاربران از حافظه محلی به دلیل عدم دسترسی به سرور ابری:', e);
      }
    }
    return this.getLocalUsers();
  },

  // بررسی اینکه آیا سیستم برای بار اول باز شده و نیاز به ثبت‌نام مدیر اصلی دارد
  async isSetupRequired() {
    const users = await this.getUsers();
    return users.length === 0;
  },

  // ثبت‌نام اولین مدیر ارشد سیستم (Super Admin Setup)
  async setupInitialAdmin(adminData) {
    const cleanPin = Jalali.toLatinDigits(adminData.pin || '').trim();
    if (!adminData.name || !adminData.username || !cleanPin) {
      throw new Error('لطفاً تمامی فیلدهای نام، نام کاربری و رمز عبور را تکمیل فرمایید.');
    }

    const adminUser = {
      id: 'usr_admin_root',
      username: adminData.username.trim().toLowerCase(),
      name: adminData.name.trim(),
      role: 'ADMIN',
      pin: cleanPin,
      permissions: {
        read: true,
        create: true,
        update: true,
        delete: true
      },
      shiftName: adminData.shiftName || 'مدیریت کل سیستم',
      shiftHours: '۲۴ ساعته',
      createdAt: new Date().toISOString()
    };

    if (this.isCloudConfigured()) {
      try {
        await this.executeTurso(`
          INSERT INTO campus_users (id, username, name, role, pin, permissions, shift_name, shift_hours, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          adminUser.id,
          adminUser.username,
          adminUser.name,
          adminUser.role,
          adminUser.pin,
          JSON.stringify(adminUser.permissions),
          adminUser.shiftName,
          adminUser.shiftHours,
          adminUser.createdAt
        ]);
      } catch (e) {
        console.error('خطای ایجاد مدیر در دیتابیس ابری:', e);
      }
    }

    this.saveLocalUsers([adminUser]);
    this.setCurrentUser(adminUser);
    return adminUser;
  },

  // ==========================================
  // مدیریت نشست (Session) و احراز هویت
  // ==========================================
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(this.ACTIVE_USER_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  },

  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(this.ACTIVE_USER_KEY);
    } else {
      localStorage.setItem(this.ACTIVE_USER_KEY, JSON.stringify(user));
    }
  },

  logout() {
    localStorage.removeItem(this.ACTIVE_USER_KEY);
  },

  async authenticate(usernameOrId, pin) {
    const users = await this.getUsers();
    const cleanPin = Jalali.toLatinDigits(pin || '').trim();
    const cleanQuery = String(usernameOrId || '').trim().toLowerCase();

    const user = users.find(u => 
      (u.id === usernameOrId || u.username.toLowerCase() === cleanQuery) && 
      String(u.pin).trim() === cleanPin
    );

    if (!user) {
      throw new Error('نام کاربری یا رمز عبور (پین‌کد) واردشده نادرست است.');
    }

    this.setCurrentUser(user);
    return user;
  },

  hasPermission(action) {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (action === 'admin') return false;

    const perms = user.permissions || {};
    return !!perms[action];
  },

  async saveUser(userData) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('تنها مدیر ارشد سامانه مجاز به افزودن یا ویرایش کاربران و تعیین سطوح دسترسی است.');
    }

    const users = await this.getUsers();
    const isEdit = !!userData.id;
    const userId = isEdit ? userData.id : 'usr_' + Date.now();
    const targetUsername = userData.username.trim().toLowerCase();

    // بررسی یکتایی نام کاربری
    const existing = users.find(u => u.username.toLowerCase() === targetUsername && u.id !== userId);
    if (existing) {
      throw new Error('این نام کاربری قبلاً در سامانه ثبت شده است. لطفاً نام دیگری انتخاب نمایید.');
    }

    const newUserObj = {
      id: userId,
      username: targetUsername,
      name: userData.name.trim(),
      role: userData.role || 'GUARD',
      pin: Jalali.toLatinDigits(userData.pin || '1234').trim(),
      permissions: {
        read: userData.role === 'ADMIN' ? true : !!userData.permissions?.read,
        create: userData.role === 'ADMIN' ? true : !!userData.permissions?.create,
        update: userData.role === 'ADMIN' ? true : !!userData.permissions?.update,
        delete: userData.role === 'ADMIN' ? true : !!userData.permissions?.delete
      },
      shiftName: userData.shiftName || (userData.role === 'ADMIN' ? 'مدیریت و نظارت' : 'شیفت عمومی'),
      shiftHours: userData.shiftHours || '۰۸:۰۰ الی ۱۶:۰۰'
    };

    if (this.isCloudConfigured()) {
      try {
        await this.executeTurso(`
          INSERT INTO campus_users (id, username, name, role, pin, permissions, shift_name, shift_hours, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            username=excluded.username,
            name=excluded.name,
            role=excluded.role,
            pin=excluded.pin,
            permissions=excluded.permissions,
            shift_name=excluded.shift_name,
            shift_hours=excluded.shift_hours;
        `, [
          newUserObj.id,
          newUserObj.username,
          newUserObj.name,
          newUserObj.role,
          newUserObj.pin,
          JSON.stringify(newUserObj.permissions),
          newUserObj.shiftName,
          newUserObj.shiftHours,
          new Date().toISOString()
        ]);
      } catch (e) {
        console.error('خطای ذخیره کاربر در سرور ابری:', e);
      }
    }

    let localList = this.getLocalUsers();
    const idx = localList.findIndex(u => u.id === userId);
    if (idx !== -1) {
      localList[idx] = newUserObj;
    } else {
      localList.push(newUserObj);
    }
    this.saveLocalUsers(localList);

    // به‌روزرسانی نشست جاری در صورت ویرایش کاربر فعال
    if (currentUser.id === userId) {
      this.setCurrentUser(newUserObj);
    }

    return newUserObj;
  },

  async deleteUser(userId) {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new Error('فقط مدیر ارشد مجاز به حذف نگهبانان است.');
    }

    if (currentUser.id === userId) {
      throw new Error('شما نمی‌توانید حساب کاربری جاری خود را حذف فرمایید.');
    }

    const users = await this.getUsers();
    if (users.length <= 1) {
      throw new Error('حداقل یک حساب کاربری مدیر باید در سامانه فعال باقی بماند.');
    }

    if (this.isCloudConfigured()) {
      try {
        await this.executeTurso('DELETE FROM campus_users WHERE id = ?', [userId]);
      } catch (e) {
        console.error('خطای حذف کاربر از سرور ابری:', e);
      }
    }

    let localList = this.getLocalUsers().filter(u => u.id !== userId);
    this.saveLocalUsers(localList);
  },

  // ==========================================
  // مدیریت رکوردهای تردد
  // ==========================================
  getLocalRecords() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY) || '[]';
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveLocalRecords(list) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
  },

  async getRecords() {
    if (!this.hasPermission('read')) {
      return [];
    }

    if (this.isCloudConfigured()) {
      try {
        const res = await this.executeTurso('SELECT * FROM campus_records ORDER BY id DESC');
        const rows = this.parseRows(res);
        this.saveLocalRecords(rows);
        return rows;
      } catch (e) {
        console.warn('خواندن رکوردها از کش محلی:', e);
      }
    }
    return this.getLocalRecords();
  },

  async insertEntry(entry) {
    if (!this.hasPermission('create')) {
      throw new Error('شما دسترسی لازم جهت ثبت تردد جدید را ندارید.');
    }

    const currentGuard = this.getCurrentUser();
    const newRecord = {
      ...entry,
      entry_guard_name: currentGuard.name,
      entry_guard_shift: `${currentGuard.shiftName} (${currentGuard.shiftHours})`,
      exit_guard_name: null,
      exit_guard_shift: null,
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
            entry_guard_name, entry_guard_shift, exit_guard_name, exit_guard_shift, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          newRecord.id, newRecord.traffic_type, newRecord.person_category, newRecord.person_name,
          newRecord.plate_part1, newRecord.plate_letter, newRecord.plate_part2, newRecord.plate_city,
          newRecord.plate_full, newRecord.vehicle_category, newRecord.vehicle_model, newRecord.status,
          newRecord.entry_jalali_date, newRecord.entry_time_display, newRecord.exit_time,
          newRecord.exit_jalali_date, newRecord.exit_time_display,
          newRecord.entry_guard_name, newRecord.entry_guard_shift,
          newRecord.exit_guard_name, newRecord.exit_guard_shift,
          newRecord.notes, newRecord.created_at
        ]);
      } catch (e) {
        console.error('خطای ثبت تردد در ابری:', e);
        throw new Error('ثبت در دیتابیس ابری با خطا مواجه شد: ' + e.message);
      }
    }

    const localList = this.getLocalRecords();
    localList.unshift(newRecord);
    this.saveLocalRecords(localList);

    // ذخیره در بانک مراجعین جهت تکمیل خودکار
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

  async recordExit(id, exitData) {
    if (!this.hasPermission('update')) {
      throw new Error('شما دسترسی لازم جهت ثبت خروج را ندارید.');
    }

    const currentGuard = this.getCurrentUser();
    const updatePayload = {
      status: 'EXITED',
      exit_jalali_date: exitData.exit_jalali_date,
      exit_time_display: exitData.exit_time_display,
      exit_time: new Date().toISOString(),
      exit_guard_name: currentGuard.name,
      exit_guard_shift: `${currentGuard.shiftName} (${currentGuard.shiftHours})`
    };

    return await this.updateRecord(id, updatePayload);
  },

  async updateRecord(id, updatedFields) {
    if (!this.hasPermission('update')) {
      throw new Error('شما دسترسی لازم جهت ویرایش رکوردها را ندارید.');
    }

    if (this.isCloudConfigured()) {
      try {
        const keys = Object.keys(updatedFields);
        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => updatedFields[k]);
        values.push(id);
        await this.executeTurso(`UPDATE campus_records SET ${setClause} WHERE id = ?`, values);
      } catch (e) {
        console.error('خطای ویرایش در ابری:', e);
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
    if (!this.hasPermission('delete')) {
      throw new Error('شما دسترسی لازم جهت حذف رکوردها را ندارید.');
    }

    if (this.isCloudConfigured()) {
      try {
        await this.executeTurso('DELETE FROM campus_records WHERE id = ?', [id]);
      } catch (e) {
        console.error('خطای حذف در ابری:', e);
        throw new Error('حذف از دیتابیس ابری ناموفق بود: ' + e.message);
      }
    }

    let localList = this.getLocalRecords().filter(r => r.id !== id);
    this.saveLocalRecords(localList);
  },

  // ==========================================
  // بانک مراجعین و تکمیل خودکار (Profiles)
  // ==========================================
  getLocalProfiles() {
    try {
      const raw = localStorage.getItem(this.PROFILES_KEY) || '{}';
      return JSON.parse(raw);
    } catch {
      return {};
    }
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
        console.warn('عدم امکان همگام‌سازی پروفایل‌ها با سرور ابری:', err);
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

    const localMap = this.getLocalProfiles();
    localMap[key] = fullProfile;
    this.saveLocalProfiles(localMap);

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
        console.error('خطای ذخیره پروفایل در ابری:', e);
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
  }
};

window.DB = DB;
