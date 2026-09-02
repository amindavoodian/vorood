/**
 * app.js
 * کنترلر اصلی و منطق کاربری سامانه ثبت و کنترل تردد
 * مجهز به سیستم ستاپ اولیه، نشست‌های کاربری پایدار، تفکیک مامورین ورود/خروج و کنترل دسترسی (RBAC)
 */

document.addEventListener('DOMContentLoaded', async () => {
  let currentDate = Jalali.formatJalaliDate(new Date());
  let entryTrafficType = 'VEHICLE';

  // --- المان‌های هدر و احراز هویت ---
  const headerUserName = document.getElementById('header-user-name');
  const headerUserRole = document.getElementById('header-user-role');
  const btnOpenUserProfile = document.getElementById('btn-open-user-profile');
  const btnLogoutUser = document.getElementById('btn-logout-user');
  
  // مودال ثبت‌نام اولیه مدیر
  const modalSetupAdmin = document.getElementById('modal-setup-admin');
  const formSetupAdmin = document.getElementById('form-setup-admin');
  const setupAdminName = document.getElementById('setup-admin-name');
  const setupAdminUsername = document.getElementById('setup-admin-username');
  const setupAdminPin = document.getElementById('setup-admin-pin');
  const setupAdminPinConfirm = document.getElementById('setup-admin-pin-confirm');
  const setupErrorMsg = document.getElementById('setup-error-msg');

  // مودال ورود کاربر
  const modalLogin = document.getElementById('modal-login');
  const formLoginUser = document.getElementById('form-login-user');
  const loginSelectUser = document.getElementById('login-select-user');
  const loginInputPin = document.getElementById('login-input-pin');
  const loginErrorMsg = document.getElementById('login-error-msg');
  const btnCancelLogin = document.getElementById('btn-cancel-login');
  const btnCloseLogin = document.getElementById('btn-close-login');
  const noReadPermissionBanner = document.getElementById('no-read-permission-banner');

  // --- المان‌های وضعیت دیتابیس و آمار ---
  const dbStatusIndicator = document.getElementById('db-status-indicator');
  const dbStatusText = document.getElementById('db-status-text');
  const statActiveCount = document.getElementById('stat-active-count');
  const statTotalCount = document.getElementById('stat-total-count');
  const statStaffCount = document.getElementById('stat-staff-count');
  const statExitedCount = document.getElementById('stat-exited-count');
  const statsContainer = document.getElementById('stats-container');

  // --- المان‌های فیلترها و جدول ---
  const displayDateEl = document.getElementById('display-jalali-date');
  const recordsTbody = document.getElementById('records-tbody');
  const tableEmptyState = document.getElementById('table-empty-state');
  const tableLoading = document.getElementById('table-loading');

  const selectFilterGuard = document.getElementById('select-filter-guard');
  const selectDatePreset = document.getElementById('select-date-preset');
  const dayStepperGroup = document.getElementById('day-stepper-group');
  const customDateContainer = document.getElementById('custom-date-container');
  const inputCustomDate = document.getElementById('input-custom-date');
  const btnPrevDay = document.getElementById('btn-prev-day');
  const btnNextDay = document.getElementById('btn-next-day');

  const selectTimeFilter = document.getElementById('select-time-filter');
  const customTimeRange = document.getElementById('custom-time-range');
  const timeFrom = document.getElementById('time-from');
  const timeTo = document.getElementById('time-to');

  const inputSearch = document.getElementById('input-search');
  const searchPlateContainer = document.getElementById('search-plate-container');
  const searchPlateP1 = document.getElementById('search-plate-p1');
  const searchPlateLtr = document.getElementById('search-plate-ltr');
  const searchPlateP2 = document.getElementById('search-plate-p2');
  const searchPlateCity = document.getElementById('search-plate-city');
  const selectFilterType = document.getElementById('select-filter-type');
  const selectFilterVehCategory = document.getElementById('select-filter-veh-category');
  const selectStatus = document.getElementById('select-status');
  const btnResetFilters = document.getElementById('btn-reset-filters');

  // فیلتر موبایل
  const btnToggleFiltersMobile = document.getElementById('btn-toggle-filters-mobile');
  const mainFilterPanel = document.getElementById('main-filter-panel');
  const filterToggleArrow = document.getElementById('filter-toggle-arrow');

  // مودال‌ها و دکمه‌ها
  const modalEntry = document.getElementById('modal-entry');
  const modalExit = document.getElementById('modal-exit');
  const modalEdit = document.getElementById('modal-edit');
  const modalDeleteConfirm = document.getElementById('modal-delete-confirm');
  const modalSettings = document.getElementById('modal-settings');

  const btnOpenEntry = document.getElementById('btn-open-entry');
  const btnMobileFabEntry = document.getElementById('btn-mobile-fab-entry');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnExportBackup = document.getElementById('btn-export-backup');

  // فرم‌ها
  const formNewEntry = document.getElementById('form-new-entry');
  const formRecordExit = document.getElementById('form-record-exit');
  const formEditRecord = document.getElementById('form-edit-record');
  const formCloudDb = document.getElementById('tab-cloud-db');

  const btnToggleVehicle = document.getElementById('btn-toggle-vehicle');
  const btnTogglePedestrian = document.getElementById('btn-toggle-pedestrian');
  const entryPlateSection = document.getElementById('entry-plate-section');
  const entryVehicleCategoryGroup = document.getElementById('entry-vehicle-category-group');
  const entryVehicleModelGroup = document.getElementById('entry-vehicle-model-group');
  const modalPlateContainer = document.getElementById('modal-plate-container');
  const editPlateContainer = document.getElementById('edit-plate-container');
  const autofillIndicator = document.getElementById('autofill-indicator');

  // پلاک ثبت ورود
  const p1 = document.getElementById('plate-p1');
  const ltr = document.getElementById('plate-ltr');
  const p2 = document.getElementById('plate-p2');
  const city = document.getElementById('plate-city');

  // پلاک ویرایش
  const editP1 = document.getElementById('edit-plate-p1');
  const editLtr = document.getElementById('edit-plate-ltr');
  const editP2 = document.getElementById('edit-plate-p2');
  const editCity = document.getElementById('edit-plate-city');

  // تب مدیریت کاربران در تنظیمات
  const userFormId = document.getElementById('user-form-id');
  const userFormName = document.getElementById('user-form-name');
  const userFormUsername = document.getElementById('user-form-username');
  const userFormPin = document.getElementById('user-form-pin');
  const userFormRole = document.getElementById('user-form-role');
  const userFormShift = document.getElementById('user-form-shift');
  const userFormHours = document.getElementById('user-form-hours');
  const permRead = document.getElementById('perm-read');
  const permCreate = document.getElementById('perm-create');
  const permUpdate = document.getElementById('perm-update');
  const permDelete = document.getElementById('perm-delete');
  const btnSaveUser = document.getElementById('btn-save-user');
  const btnCancelEditUser = document.getElementById('btn-cancel-edit-user');
  const usersListContainer = document.getElementById('users-list-container');
  const userFormTitle = document.getElementById('user-form-title');

  // جمع شدن فیلترها در موبایل
  if (window.innerWidth <= 820 && mainFilterPanel) {
    mainFilterPanel.classList.add('is-collapsed');
  }

  btnToggleFiltersMobile?.addEventListener('click', () => {
    const isCurrentlyCollapsed = mainFilterPanel.classList.contains('is-collapsed');
    mainFilterPanel.classList.toggle('is-collapsed');
    filterToggleArrow?.classList.toggle('is-open', isCurrentlyCollapsed);
  });

  // اعلان‌های شناور (Toast)
  function showToast(type, text) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : (type === 'info' ? 'toast-info' : 'toast-error')}`;
    toast.innerHTML = type === 'success' 
      ? `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> <span>${text}</span>`
      : `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> <span>${text}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  function updateDbIndicator() {
    if (DB.isCloudConfigured()) {
      dbStatusIndicator.className = 'db-status-badge is-online';
      dbStatusText.textContent = 'دیتابیس ابری';
    } else {
      dbStatusIndicator.className = 'db-status-badge is-local';
      dbStatusText.textContent = 'دیتابیس محلی';
    }
  }

  // ==========================================
  // مدیریت هویت، نشست و اعمال دسترسی‌ها (RBAC)
  // ==========================================
  function updateUserHeader() {
    const user = DB.getCurrentUser();
    
    if (!user) {
      headerUserName.textContent = 'وارد نشده';
      headerUserRole.textContent = 'مهمان';
      headerUserRole.className = 'header-role-badge';
      btnOpenSettings.classList.add('hidden');
      btnOpenEntry.classList.add('hidden');
      btnMobileFabEntry.classList.add('hidden');
      btnLogoutUser.classList.add('hidden');
      noReadPermissionBanner.classList.remove('hidden');
      statsContainer.classList.add('hidden');
      mainFilterPanel.classList.add('hidden');
      return;
    }

    btnLogoutUser.classList.remove('hidden');
    headerUserName.textContent = user.name;
    if (user.role === 'ADMIN') {
      headerUserRole.textContent = 'مدیر ارشد';
      headerUserRole.className = 'header-role-badge badge-role-admin';
      btnOpenSettings.classList.remove('hidden');
    } else {
      headerUserRole.textContent = user.shiftName || 'نگهبان';
      headerUserRole.className = 'header-role-badge badge-role-guard';
      btnOpenSettings.classList.add('hidden');
    }

    // اعمال مجوز ثبت تردد (Create)
    const canCreate = DB.hasPermission('create');
    btnOpenEntry.classList.toggle('hidden', !canCreate);
    btnMobileFabEntry.classList.toggle('hidden', !canCreate);

    // اعمال مجوز مشاهده (Read)
    const canRead = DB.hasPermission('read');
    noReadPermissionBanner.classList.toggle('hidden', canRead);
    statsContainer.classList.toggle('hidden', !canRead);
    mainFilterPanel.classList.toggle('hidden', !canRead);
  }

  // نمایش مودال ورود
  async function openLoginModal(allowCancel = true) {
    loginErrorMsg.classList.add('hidden');
    loginInputPin.value = '';
    const users = await DB.getUsers();
    const current = DB.getCurrentUser();

    if (users.length === 0) {
      modalLogin.classList.add('hidden');
      openSetupAdminModal();
      return;
    }

    loginSelectUser.innerHTML = users.map(u => 
      `<option value="${u.id}" ${current && u.id === current.id ? 'selected' : ''}>${u.name} (${u.role === 'ADMIN' ? 'مدیر ارشد' : u.shiftName}) - @${u.username}</option>`
    ).join('');

    btnCancelLogin?.classList.toggle('hidden', !allowCancel);
    btnCloseLogin?.classList.toggle('hidden', !allowCancel);

    modalLogin.classList.remove('hidden');
    setTimeout(() => loginInputPin.focus(), 150);
  }

  // نمایش مودال ثبت‌نام اولیه مدیر ارشد
  function openSetupAdminModal() {
    setupErrorMsg.classList.add('hidden');
    formSetupAdmin.reset();
    modalSetupAdmin.classList.remove('hidden');
    setTimeout(() => setupAdminName.focus(), 150);
  }

  // سابمیت ثبت‌نام اولیه مدیر
  formSetupAdmin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setupErrorMsg.classList.add('hidden');

    const name = setupAdminName.value.trim();
    const username = setupAdminUsername.value.trim();
    const pin = setupAdminPin.value.trim();
    const pinConfirm = setupAdminPinConfirm.value.trim();

    if (pin !== pinConfirm) {
      setupErrorMsg.textContent = 'رمز عبور و تکرار آن با یکدیگر مطابقت ندارند.';
      setupErrorMsg.classList.remove('hidden');
      return;
    }

    if (pin.length < 4) {
      setupErrorMsg.textContent = 'رمز عبور باید حداقل ۴ رقم باشد.';
      setupErrorMsg.classList.remove('hidden');
      return;
    }

    try {
      const admin = await DB.setupInitialAdmin({
        name,
        username,
        pin,
        shiftName: 'مدیریت ارشد سیستم'
      });

      modalSetupAdmin.classList.add('hidden');
      updateUserHeader();
      await populateGuardsFilterDropdown();
      await loadData();
      showToast('success', `حساب مدیر ارشد (${admin.name}) با موفقیت ایجاد شد و وارد شدید.`);
    } catch (err) {
      setupErrorMsg.textContent = err.message;
      setupErrorMsg.classList.remove('hidden');
    }
  });

  btnOpenUserProfile?.addEventListener('click', () => openLoginModal(true));

  // فرم ورود به حساب
  formLoginUser?.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginErrorMsg.classList.add('hidden');
    const selectedUserId = loginSelectUser.value;
    const pin = loginInputPin.value.trim();

    try {
      const user = await DB.authenticate(selectedUserId, pin);
      modalLogin.classList.add('hidden');
      updateUserHeader();
      await populateGuardsFilterDropdown();
      await loadData();
      showToast('success', `خوش آمدید، ${user.name} (${user.role === 'ADMIN' ? 'مدیر ارشد' : user.shiftName})`);
    } catch (err) {
      loginErrorMsg.textContent = err.message;
      loginErrorMsg.classList.remove('hidden');
    }
  });

  // خروج از حساب کاربری
  btnLogoutUser?.addEventListener('click', () => {
    if (confirm('آیا از خروج از حساب کاربری اطمینان دارید؟')) {
      DB.logout();
      updateUserHeader();
      recordsTbody.innerHTML = '';
      statActiveCount.textContent = '۰';
      statTotalCount.textContent = '۰';
      statStaffCount.textContent = '۰';
      statExitedCount.textContent = '۰';
      showToast('info', 'از حساب کاربری خارج شدید.');
      openLoginModal(false);
    }
  });

  // ==========================================
  // تم‌ها و استایل پلاک خودرو
  // ==========================================
  function getPlateThemeClass(letter) {
    switch (letter) {
      case 'ت': case 'ع': case 'ک': return 'plate-theme-yellow';
      case 'پ': case 'ث': case 'ز': case 'ف': return 'plate-theme-green';
      case 'الف': case 'تشریفات': return 'plate-theme-red';
      case 'ش': return 'plate-theme-navy';
      case 'D': case 'S': return 'plate-theme-lightblue';
      default: return 'plate-theme-white';
    }
  }

  function updatePlateTheme(containerEl, letter) {
    if (!containerEl) return;
    containerEl.className = 'iran-plate-input ' + (containerEl.classList.contains('is-search') ? 'is-search ' : '') + getPlateThemeClass(letter);
  }

  function renderPlateBadge(p1Val, ltrVal, p2Val, cityVal) {
    const themeClass = getPlateThemeClass(ltrVal);
    const ltrDisplay = ltrVal === 'معلولین' ? '♿' : ltrVal;
    return `
      <div class="iran-plate-badge ${themeClass}">
        <div class="plate-blue-strip">
          <div class="iran-flag-icon">
            <span class="flag-green"></span>
            <span class="flag-white"></span>
            <span class="flag-red"></span>
          </div>
          <span class="plate-country-code">I.R.</span>
        </div>
        <div class="plate-nums-box">
          <span>${Jalali.toPersianDigits(p1Val)}</span>
          <span class="plate-letter-tag">${ltrDisplay}</span>
          <span>${Jalali.toPersianDigits(p2Val)}</span>
        </div>
        <div class="plate-city-box">
          <span class="plate-iran-tag">ایران</span>
          <span>${Jalali.toPersianDigits(cityVal)}</span>
        </div>
      </div>
    `;
  }

  function renderPersonCategoryBadge(category) {
    switch (category) {
      case 'STAFF': return '<span class="badge-person badge-person-staff">پرسنل</span>';
      case 'FACULTY': return '<span class="badge-person badge-person-faculty">هیئت علمی</span>';
      case 'STUDENT': return '<span class="badge-person badge-person-student">دانشجو</span>';
      case 'CONTRACTOR': return '<span class="badge-person badge-person-contractor">پیمانکار</span>';
      default: return '<span class="badge-person badge-person-guest">ارباب‌رجوع</span>';
    }
  }

  // تکمیل خودکار (Auto-fill)
  function updateKnownNamesDatalist() {
    const datalist = document.getElementById('known-names-list');
    if (!datalist) return;
    const profiles = DB.getLocalProfiles();
    const names = new Set(Object.values(profiles).map(p => p.personName).filter(Boolean));
    datalist.innerHTML = Array.from(names).map(n => `<option value="${n}">`).join('');
  }

  function triggerPlateAutoFill() {
    const p1Val = Jalali.toPersianDigits(p1.value.trim());
    const ltrVal = ltr.value;
    const p2Val = Jalali.toPersianDigits(p2.value.trim());
    const cityVal = Jalali.toPersianDigits(city.value.trim());

    if (p1Val.length === 2 && p2Val.length === 3 && cityVal.length === 2) {
      const match = DB.findProfileByPlate(p1Val, ltrVal, p2Val, cityVal);
      if (match) {
        document.getElementById('input-person-name').value = match.personName || '';
        document.getElementById('input-person-category').value = match.personCategory || 'GUEST';
        document.getElementById('input-vehicle-category').value = match.vehicleCategory || 'سواری';
        document.getElementById('input-vehicle-model').value = match.vehicleModel || '';
        if (match.defaultNotes && !document.getElementById('input-notes').value) {
          document.getElementById('input-notes').value = match.defaultNotes;
        }
        autofillIndicator.classList.remove('hidden');
      } else {
        autofillIndicator.classList.add('hidden');
      }
    }
  }

  function triggerPedestrianAutoFill(name) {
    if (!name || name.trim().length < 3) return;
    const match = DB.findProfileByName(name.trim());
    if (match) {
      document.getElementById('input-person-category').value = match.personCategory || 'GUEST';
      if (match.defaultNotes && !document.getElementById('input-notes').value) {
        document.getElementById('input-notes').value = match.defaultNotes;
      }
      autofillIndicator.classList.remove('hidden');
    }
  }

  function setupPlateInputAutoConvert(inputEl, maxLen, nextEl, autoFillCallback) {
    if (!inputEl) return;
    inputEl.addEventListener('input', (e) => {
      e.target.value = Jalali.cleanToPersianDigits(e.target.value, maxLen);
      if (e.target.value.length === maxLen && nextEl) {
        nextEl.focus();
      }
      if (autoFillCallback) autoFillCallback();
    });
  }

  setupPlateInputAutoConvert(p1, 2, ltr, triggerPlateAutoFill);
  ltr?.addEventListener('change', (e) => {
    updatePlateTheme(modalPlateContainer, e.target.value);
    p2.focus();
    triggerPlateAutoFill();
  });
  setupPlateInputAutoConvert(p2, 3, city, triggerPlateAutoFill);
  setupPlateInputAutoConvert(city, 2, null, triggerPlateAutoFill);

  document.getElementById('input-person-name')?.addEventListener('input', (e) => {
    if (entryTrafficType === 'PEDESTRIAN') {
      triggerPedestrianAutoFill(e.target.value);
    }
  });

  setupPlateInputAutoConvert(searchPlateP1, 2, searchPlateLtr, () => loadData());
  searchPlateLtr?.addEventListener('change', (e) => { 
    updatePlateTheme(searchPlateContainer, e.target.value === 'ALL' ? 'ب' : e.target.value);
    searchPlateP2.focus();
    loadData();
  });
  setupPlateInputAutoConvert(searchPlateP2, 3, searchPlateCity, () => loadData());
  setupPlateInputAutoConvert(searchPlateCity, 2, null, () => loadData());

  setupPlateInputAutoConvert(editP1, 2, editLtr);
  editLtr?.addEventListener('change', (e) => { updatePlateTheme(editPlateContainer, e.target.value); editP2.focus(); });
  setupPlateInputAutoConvert(editP2, 3, editCity);
  setupPlateInputAutoConvert(editCity, 2, null);

  function setEntryTrafficType(type) {
    entryTrafficType = type;
    autofillIndicator.classList.add('hidden');
    if (type === 'PEDESTRIAN') {
      btnTogglePedestrian.classList.add('active');
      btnToggleVehicle.classList.remove('active');
      entryPlateSection.classList.add('hidden');
      entryVehicleCategoryGroup.classList.add('hidden');
      entryVehicleModelGroup.classList.add('hidden');
    } else {
      btnToggleVehicle.classList.add('active');
      btnTogglePedestrian.classList.remove('active');
      entryPlateSection.classList.remove('hidden');
      entryVehicleCategoryGroup.classList.remove('hidden');
      entryVehicleModelGroup.classList.remove('hidden');
    }
  }
  btnToggleVehicle?.addEventListener('click', () => setEntryTrafficType('VEHICLE'));
  btnTogglePedestrian?.addEventListener('click', () => setEntryTrafficType('PEDESTRIAN'));

  // ==========================================
  // دریافت و رندر داده‌ها در جدول با تفکیک مامورین
  // ==========================================
  async function populateGuardsFilterDropdown() {
    const users = await DB.getUsers();
    selectFilterGuard.innerHTML = '<option value="ALL">همه ماموران (ورود یا خروج)</option>' + 
      users.map(u => `<option value="${u.name}">${u.name} (${u.role === 'ADMIN' ? 'مدیر' : u.shiftName})</option>`).join('');
  }

  async function loadData() {
    displayDateEl.textContent = `${Jalali.getHumanReadable(currentDate)} (${Jalali.toPersianDigits(currentDate)})`;

    if (!DB.hasPermission('read')) {
      recordsTbody.innerHTML = '';
      tableEmptyState.classList.add('hidden');
      return;
    }

    tableLoading.classList.remove('hidden');

    let allRecords = [];
    try {
      allRecords = await DB.getRecords();
    } catch {
      allRecords = DB.getLocalRecords();
    } finally {
      tableLoading.classList.add('hidden');
    }

    let filtered = [...allRecords];

    const datePreset = selectDatePreset.value;
    const todayStr = Jalali.formatJalaliDate(new Date());

    if (datePreset === 'TODAY') {
      filtered = filtered.filter(r => Jalali.toLatinDigits(r.entry_jalali_date) === Jalali.toLatinDigits(currentDate));
    } else if (datePreset === 'YESTERDAY') {
      const yesterdayStr = Jalali.shiftJalaliDate(todayStr, -1);
      filtered = filtered.filter(r => Jalali.toLatinDigits(r.entry_jalali_date) === Jalali.toLatinDigits(yesterdayStr));
    } else if (datePreset === 'LAST_7_DAYS') {
      filtered = filtered.filter(r => Jalali.isWithinLastDays(r.entry_jalali_date, 7));
    } else if (datePreset === 'THIS_MONTH') {
      const currentMonthPrefix = todayStr.substring(0, 7);
      filtered = filtered.filter(r => Jalali.toLatinDigits(r.entry_jalali_date || '').startsWith(currentMonthPrefix));
    } else if (datePreset === 'CUSTOM_DATE') {
      const customVal = Jalali.toLatinDigits(inputCustomDate.value.trim());
      if (customVal) {
        filtered = filtered.filter(r => Jalali.toLatinDigits(r.entry_jalali_date) === customVal);
      }
    }

    const timeFilter = selectTimeFilter.value;
    if (timeFilter === 'MORNING') {
      filtered = filtered.filter(r => { const t = Jalali.toLatinDigits(r.entry_time_display || ''); return t >= '06:00' && t < '14:00'; });
    } else if (timeFilter === 'EVENING') {
      filtered = filtered.filter(r => { const t = Jalali.toLatinDigits(r.entry_time_display || ''); return t >= '14:00' && t < '22:00'; });
    } else if (timeFilter === 'NIGHT') {
      filtered = filtered.filter(r => { const t = Jalali.toLatinDigits(r.entry_time_display || ''); return t >= '22:00' || t < '06:00'; });
    } else if (timeFilter === 'CUSTOM') {
      const from = Jalali.toLatinDigits(timeFrom.value.trim());
      const to = Jalali.toLatinDigits(timeTo.value.trim());
      if (from) filtered = filtered.filter(r => Jalali.toLatinDigits(r.entry_time_display || '') >= from);
      if (to) filtered = filtered.filter(r => Jalali.toLatinDigits(r.entry_time_display || '') <= to);
    }

    const filterTypeVal = selectFilterType.value;
    if (filterTypeVal === 'ONLY_VEHICLE') {
      filtered = filtered.filter(r => r.traffic_type !== 'PEDESTRIAN');
    } else if (filterTypeVal === 'ONLY_PEDESTRIAN') {
      filtered = filtered.filter(r => r.traffic_type === 'PEDESTRIAN');
    } else if (filterTypeVal === 'CAT_STAFF') {
      filtered = filtered.filter(r => r.person_category === 'STAFF' || r.person_category === 'FACULTY');
    } else if (filterTypeVal === 'CAT_GUEST') {
      filtered = filtered.filter(r => r.person_category === 'GUEST' || r.person_category === 'CONTRACTOR');
    }

    const vehCatVal = selectFilterVehCategory.value;
    if (vehCatVal !== 'ALL') {
      filtered = filtered.filter(r => r.traffic_type !== 'PEDESTRIAN' && (r.vehicle_category === vehCatVal));
    }

    const guardFilter = selectFilterGuard.value;
    if (guardFilter !== 'ALL') {
      filtered = filtered.filter(r => 
        (r.entry_guard_name || '').includes(guardFilter) || 
        (r.exit_guard_name || '').includes(guardFilter) ||
        (r.guard_name || '').includes(guardFilter)
      );
    }

    const status = selectStatus.value;
    if (status !== 'ALL') filtered = filtered.filter(r => r.status === status);

    const query = Jalali.toLatinDigits(inputSearch.value.trim().toLowerCase());
    if (query) {
      filtered = filtered.filter(r => {
        const haystack = Jalali.toLatinDigits(`
          ${r.person_name || ''} 
          ${r.plate_full || ''} 
          ${r.vehicle_category || ''}
          ${r.vehicle_model || ''} 
          ${r.notes || ''}
          ${r.entry_guard_name || r.guard_name || ''}
          ${r.exit_guard_name || ''}
        `).toLowerCase();
        return haystack.includes(query);
      });
    }

    const sP1 = Jalali.toLatinDigits(searchPlateP1.value.trim());
    const sLtr = searchPlateLtr.value;
    const sP2 = Jalali.toLatinDigits(searchPlateP2.value.trim());
    const sCity = Jalali.toLatinDigits(searchPlateCity.value.trim());

    if (sP1) filtered = filtered.filter(r => Jalali.toLatinDigits(r.plate_part1 || '').includes(sP1));
    if (sLtr && sLtr !== 'ALL') filtered = filtered.filter(r => r.plate_letter === sLtr);
    if (sP2) filtered = filtered.filter(r => Jalali.toLatinDigits(r.plate_part2 || '').includes(sP2));
    if (sCity) filtered = filtered.filter(r => Jalali.toLatinDigits(r.plate_city || '').includes(sCity));

    statActiveCount.textContent = Jalali.toPersianDigits(allRecords.filter(r => r.status === 'ACTIVE').length);
    statTotalCount.textContent = Jalali.toPersianDigits(filtered.length);
    statStaffCount.textContent = Jalali.toPersianDigits(filtered.filter(r => r.person_category === 'STAFF' || r.person_category === 'FACULTY').length);
    statExitedCount.textContent = Jalali.toPersianDigits(filtered.filter(r => r.status === 'EXITED').length);

    recordsTbody.innerHTML = '';
    if (filtered.length === 0) {
      tableEmptyState.classList.remove('hidden');
      return;
    }
    tableEmptyState.classList.add('hidden');

    const isMobile = window.innerWidth <= 820;
    const canUpdate = DB.hasPermission('update');
    const canDelete = DB.hasPermission('delete');

    filtered.forEach((r, idx) => {
      const tr = document.createElement('tr');
      const isActive = r.status === 'ACTIVE';
      const isPedestrian = r.traffic_type === 'PEDESTRIAN';

      const entryOfficerName = r.entry_guard_name || r.guard_name || 'مامور کشیک';
      const entryOfficerShift = r.entry_guard_shift || r.guard_shift || '';
      const exitOfficerName = r.exit_guard_name || null;
      const exitOfficerShift = r.exit_guard_shift || '';

      const plateOrPedestrianHtml = isPedestrian 
        ? '<span class="badge-pedestrian"><svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="4" r="2"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 6-2"/><path d="M12 10v4"/></svg> عابر پیاده</span>'
        : renderPlateBadge(r.plate_part1, r.plate_letter, r.plate_part2, r.plate_city);

      const statusBadgeHtml = isActive 
        ? '<span class="badge-status badge-active">حاضر در پردیس</span>' 
        : '<span class="badge-status badge-exited">خارج شده</span>';

      const actionsHtml = `
        <div class="action-group">
          ${(isActive && canUpdate) ? `
            <button class="btn-action-icon exit-btn" data-action="exit" data-id="${r.id}" title="ثبت خروج">
              <svg class="svg-icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          ` : ''}
          ${canUpdate ? `
            <button class="btn-action-icon edit-btn" data-action="edit" data-id="${r.id}" title="ویرایش">
              <svg class="svg-icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          ` : ''}
          ${canDelete ? `
            <button class="btn-action-icon delete-btn" data-action="delete" data-id="${r.id}" title="حذف">
              <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          ` : ''}
        </div>
      `;

      if (isMobile) {
        tr.innerHTML = `
          <td>
            <div class="mobile-card-header">
              <div style="display:flex; align-items:center; gap:0.35rem;">
                <span style="font-weight:800; font-size:0.75rem; color:var(--text-muted);">#${Jalali.toPersianDigits(idx + 1)}</span>
                ${renderPersonCategoryBadge(r.person_category)}
              </div>
              <div>${statusBadgeHtml}</div>
            </div>

            <div class="mobile-card-row">
              <span style="font-weight:800; font-size:0.95rem;">${r.person_name}</span>
              <div>${plateOrPedestrianHtml}</div>
            </div>

            ${!isPedestrian ? `
              <div class="mobile-card-row">
                <span class="badge-veh-cat">${r.vehicle_category || 'سواری'}</span>
                <span class="badge-veh-model">${r.vehicle_model || ''}</span>
              </div>
            ` : ''}

            <div class="mobile-card-meta-grid">
              <div class="mobile-meta-item">
                <span class="mobile-meta-label">ورود:</span>
                <span class="mobile-meta-value">${Jalali.toPersianDigits(r.entry_time_display)} <small style="font-weight:normal; color:var(--text-muted);">(${Jalali.toPersianDigits(r.entry_jalali_date)})</small></span>
              </div>
              <div class="mobile-meta-item">
                <span class="mobile-meta-label">خروج:</span>
                <span class="mobile-meta-value">${r.exit_time_display ? `${Jalali.toPersianDigits(r.exit_time_display)} <small style="font-weight:normal; color:var(--text-muted);">(${Jalali.toPersianDigits(r.exit_jalali_date)})</small>` : '-- : --'}</span>
              </div>
            </div>

            <div class="mobile-officers-grid">
              <div>
                <span style="color:var(--text-muted); font-size:0.65rem;">مامور ثبت ورود:</span>
                <div style="font-weight:700; color:var(--primary);">${entryOfficerName}</div>
              </div>
              <div>
                <span style="color:var(--text-muted); font-size:0.65rem;">مامور ثبت خروج:</span>
                <div style="font-weight:700; color:var(--emerald);">${exitOfficerName || '—'}</div>
              </div>
            </div>

            ${r.notes ? `
              <div style="font-size:0.72rem; color:var(--text-muted); margin:0.35rem 0; line-height:1.4;">
                <strong>علت / مقصد:</strong> ${r.notes}
              </div>
            ` : ''}

            <div class="mobile-card-footer">
              <div style="font-size:0.7rem; color:var(--text-muted);">
                ${entryOfficerShift ? `<small>${entryOfficerShift}</small>` : ''}
              </div>
              ${actionsHtml}
            </div>
          </td>
        `;
      } else {
        const vehicleInfoHtml = isPedestrian
          ? '<span style="color:var(--text-muted); font-size:0.72rem;">بدون وسیله</span>'
          : `
            <div>
              <span class="badge-veh-cat">${r.vehicle_category || 'سواری'}</span>
              ${r.vehicle_model ? `<div class="badge-veh-model">${r.vehicle_model}</div>` : ''}
            </div>
          `;

        tr.innerHTML = `
          <td class="text-center" style="color:var(--text-muted); font-size:0.75rem;">${Jalali.toPersianDigits(idx + 1)}</td>
          <td>${renderPersonCategoryBadge(r.person_category)}</td>
          <td>${plateOrPedestrianHtml}</td>
          <td style="font-weight:700;">${r.person_name}</td>
          <td>${vehicleInfoHtml}</td>
          <td>
            <div style="font-weight:600;">${Jalali.toPersianDigits(r.entry_time_display)}</div>
            <div style="font-size:0.7rem; color:var(--text-muted);">${Jalali.toPersianDigits(r.entry_jalali_date)}</div>
          </td>
          <td>
            ${r.exit_time_display ? `
              <div style="font-weight:600;">${Jalali.toPersianDigits(r.exit_time_display)}</div>
              <div style="font-size:0.7rem; color:var(--text-muted);">${Jalali.toPersianDigits(r.exit_jalali_date)}</div>
            ` : '<span style="color:var(--text-muted); font-size:0.75rem;">-- : --</span>'}
          </td>
          <td style="color:var(--text-muted); font-size:0.74rem; max-width:160px;">${r.notes || '—'}</td>
          <td>
            <div class="officer-badge-entry">
              <span class="officer-name">${entryOfficerName}</span>
              <span class="officer-shift">${entryOfficerShift}</span>
            </div>
          </td>
          <td>
            ${exitOfficerName ? `
              <div class="officer-badge-exit">
                <span class="officer-name">${exitOfficerName}</span>
                <span class="officer-shift">${exitOfficerShift}</span>
              </div>
            ` : '<span style="color:var(--text-muted); font-size:0.72rem;">—</span>'}
          </td>
          <td>${statusBadgeHtml}</td>
          <td class="text-center">${actionsHtml}</td>
        `;
      }
      recordsTbody.appendChild(tr);
    });

    document.querySelectorAll('[data-action="exit"]').forEach(btn => {
      btn.addEventListener('click', (e) => openExitModal(Number(e.currentTarget.getAttribute('data-id'))));
    });
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => openEditModal(Number(e.currentTarget.getAttribute('data-id'))));
    });
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => openDeleteModal(Number(e.currentTarget.getAttribute('data-id'))));
    });

    updateKnownNamesDatalist();
  }

  // تنظیم سوئیچ خودکار جدول / کارت در ریستایز
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      loadData();
    }, 200);
  });

  // فیلترها
  selectDatePreset?.addEventListener('change', (e) => {
    const val = e.target.value;
    dayStepperGroup?.classList.toggle('hidden', val !== 'TODAY');
    customDateContainer?.classList.toggle('hidden', val !== 'CUSTOM_DATE');
    if (val === 'TODAY') currentDate = Jalali.formatJalaliDate(new Date());
    loadData();
  });

  btnPrevDay?.addEventListener('click', () => { currentDate = Jalali.shiftJalaliDate(currentDate, -1); loadData(); });
  btnNextDay?.addEventListener('click', () => { currentDate = Jalali.shiftJalaliDate(currentDate, 1); loadData(); });
  inputCustomDate?.addEventListener('input', () => loadData());

  selectTimeFilter?.addEventListener('change', (e) => {
    customTimeRange?.classList.toggle('hidden', e.target.value !== 'CUSTOM');
    loadData();
  });
  timeFrom?.addEventListener('input', () => loadData());
  timeTo?.addEventListener('input', () => loadData());

  inputSearch?.addEventListener('input', () => loadData());
  selectFilterType?.addEventListener('change', () => loadData());
  selectFilterVehCategory?.addEventListener('change', () => loadData());
  selectFilterGuard?.addEventListener('change', () => loadData());
  selectStatus?.addEventListener('change', () => loadData());

  btnResetFilters?.addEventListener('click', () => {
    selectDatePreset.value = 'TODAY';
    dayStepperGroup?.classList.remove('hidden');
    customDateContainer?.classList.add('hidden');
    currentDate = Jalali.formatJalaliDate(new Date());
    
    selectTimeFilter.value = 'ALL';
    customTimeRange?.classList.add('hidden');
    timeFrom.value = '';
    timeTo.value = '';

    inputSearch.value = '';
    searchPlateP1.value = '';
    searchPlateLtr.value = 'ALL';
    searchPlateP2.value = '';
    searchPlateCity.value = '';
    selectFilterType.value = 'ALL';
    selectFilterVehCategory.value = 'ALL';
    selectFilterGuard.value = 'ALL';
    selectStatus.value = 'ALL';
    updatePlateTheme(searchPlateContainer, 'ب');

    loadData();
    showToast('info', 'فیلترهای جستجو ریست شدند.');
  });

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.getAttribute('data-close'))?.classList.add('hidden');
    });
  });

  // ==========================================
  // ثبت تردد جدید (ورود)
  // ==========================================
  function openNewEntryModal() {
    if (!DB.hasPermission('create')) {
      showToast('error', 'شما مجوز ثبت تردد جدید را ندارید.');
      return;
    }

    const now = new Date();
    document.getElementById('entry-error-msg')?.classList.add('hidden');
    autofillIndicator?.classList.add('hidden');
    formNewEntry.reset();
    setEntryTrafficType('VEHICLE');
    ltr.value = 'ب';
    updatePlateTheme(modalPlateContainer, 'ب');
    document.getElementById('input-entry-date').value = Jalali.formatJalaliDate(now);
    document.getElementById('input-entry-time').value = Jalali.formatTime(now);
    modalEntry.classList.remove('hidden');
    setTimeout(() => p1.focus(), 150);
  }

  btnOpenEntry?.addEventListener('click', openNewEntryModal);
  btnMobileFabEntry?.addEventListener('click', openNewEntryModal);

  document.getElementById('btn-entry-date-today')?.addEventListener('click', () => {
    document.getElementById('input-entry-date').value = Jalali.formatJalaliDate(new Date());
  });
  document.getElementById('btn-entry-time-now')?.addEventListener('click', () => {
    document.getElementById('input-entry-time').value = Jalali.formatTime(new Date());
  });

  formNewEntry?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('entry-error-msg');
    err.classList.add('hidden');

    const p1Val = Jalali.toPersianDigits(p1.value.trim());
    const ltrVal = ltr.value;
    const p2Val = Jalali.toPersianDigits(p2.value.trim());
    const cityVal = Jalali.toPersianDigits(city.value.trim());
    const person = document.getElementById('input-person-name').value.trim();
    const category = document.getElementById('input-person-category').value;
    const vehicleCat = document.getElementById('input-vehicle-category').value;
    const vehicleModel = document.getElementById('input-vehicle-model').value.trim();
    const entryDate = Jalali.toLatinDigits(document.getElementById('input-entry-date').value.trim());
    const entryTime = Jalali.toLatinDigits(document.getElementById('input-entry-time').value.trim());
    const notes = document.getElementById('input-notes').value.trim();

    if (entryTrafficType === 'VEHICLE') {
      if (p1Val.length !== 2 || p2Val.length !== 3 || cityVal.length !== 2) {
        err.textContent = 'لطفاً ارقام پلاک خودرو را به‌طور کامل وارد فرمایید.';
        err.classList.remove('hidden');
        return;
      }
    }

    const plateFull = entryTrafficType === 'VEHICLE' ? `${p1Val} ${ltrVal} ${p2Val} ایران ${cityVal}` : 'عابر پیاده';

    try {
      await DB.insertEntry({
        traffic_type: entryTrafficType,
        person_category: category,
        person_name: person,
        plate_part1: entryTrafficType === 'VEHICLE' ? p1Val : null,
        plate_letter: entryTrafficType === 'VEHICLE' ? ltrVal : null,
        plate_part2: entryTrafficType === 'VEHICLE' ? p2Val : null,
        plate_city: entryTrafficType === 'VEHICLE' ? cityVal : null,
        plate_full: plateFull,
        vehicle_category: entryTrafficType === 'VEHICLE' ? vehicleCat : 'عابر پیاده',
        vehicle_model: entryTrafficType === 'VEHICLE' ? vehicleModel : '',
        status: 'ACTIVE',
        entry_jalali_date: entryDate,
        entry_time_display: entryTime,
        exit_time: null,
        exit_jalali_date: null,
        exit_time_display: null,
        notes: notes
      });

      modalEntry.classList.add('hidden');
      showToast('success', `ورود (${person}) با مامور ثبت (${DB.getCurrentUser()?.name}) ذخیره شد.`);
      await loadData();
    } catch (ex) {
      err.textContent = ex.message;
      err.classList.remove('hidden');
    }
  });

  // ==========================================
  // ثبت خروج با ثبت مامور شیفت فعال
  // ==========================================
  async function openExitModal(id) {
    if (!DB.hasPermission('update')) {
      showToast('error', 'شما دسترسی لازم جهت ثبت خروج را ندارید.');
      return;
    }

    const records = await DB.getRecords();
    const record = records.find(r => r.id === id);
    if (!record) return;

    const now = new Date();
    const currentUser = DB.getCurrentUser();

    document.getElementById('exit-record-id').value = record.id;
    document.getElementById('exit-driver-name').textContent = record.person_name;
    
    if (record.traffic_type === 'PEDESTRIAN') {
      document.getElementById('exit-plate-badge').innerHTML = '<span class="badge-pedestrian">عابر پیاده</span>';
    } else {
      document.getElementById('exit-plate-badge').innerHTML = renderPlateBadge(record.plate_part1, record.plate_letter, record.plate_part2, record.plate_city);
    }

    document.getElementById('exit-entry-time-info').textContent = `${Jalali.toPersianDigits(record.entry_jalali_date)} - ساعت ${Jalali.toPersianDigits(record.entry_time_display)}`;
    document.getElementById('exit-entry-guard-info').textContent = `${record.entry_guard_name || record.guard_name || 'مامور کشیک'}`;
    document.getElementById('exit-active-guard-info').textContent = `${currentUser?.name} (${currentUser?.shiftName || 'مامور جاری'})`;

    document.getElementById('input-exit-date').value = Jalali.formatJalaliDate(now);
    document.getElementById('input-exit-time').value = Jalali.formatTime(now);

    modalExit.classList.remove('hidden');
  }

  document.getElementById('btn-exit-date-today')?.addEventListener('click', () => {
    document.getElementById('input-exit-date').value = Jalali.formatJalaliDate(new Date());
  });
  document.getElementById('btn-exit-time-now')?.addEventListener('click', () => {
    document.getElementById('input-exit-time').value = Jalali.formatTime(new Date());
  });

  formRecordExit?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = Number(document.getElementById('exit-record-id').value);
    const exitDate = Jalali.toLatinDigits(document.getElementById('input-exit-date').value.trim());
    const exitTime = Jalali.toLatinDigits(document.getElementById('input-exit-time').value.trim());

    try {
      await DB.recordExit(id, {
        exit_jalali_date: exitDate,
        exit_time_display: exitTime
      });

      modalExit.classList.add('hidden');
      showToast('success', `خروج توسط مامور (${DB.getCurrentUser()?.name}) با موفقیت ثبت شد.`);
      await loadData();
    } catch (ex) {
      showToast('error', ex.message);
    }
  });

  // ==========================================
  // ویرایش مشخصات تردد
  // ==========================================
  const editStatusSelect = document.getElementById('edit-status');
  const editExitFields = document.getElementById('edit-exit-fields');
  const editTrafficType = document.getElementById('edit-traffic-type');
  const editPlateSection = document.getElementById('edit-plate-section');
  const editVehCatGroup = document.getElementById('edit-veh-cat-group');
  const editVehModelGroup = document.getElementById('edit-veh-model-group');

  editTrafficType?.addEventListener('change', (e) => {
    const isPed = e.target.value === 'PEDESTRIAN';
    editPlateSection.classList.toggle('hidden', isPed);
    editVehCatGroup.classList.toggle('hidden', isPed);
    editVehModelGroup.classList.toggle('hidden', isPed);
  });

  editStatusSelect?.addEventListener('change', (e) => {
    editExitFields.classList.toggle('hidden', e.target.value !== 'EXITED');
  });

  async function openEditModal(id) {
    if (!DB.hasPermission('update')) {
      showToast('error', 'شما مجوز ویرایش اطلاعات را ندارید.');
      return;
    }

    const records = await DB.getRecords();
    const record = records.find(r => r.id === id);
    if (!record) return;

    document.getElementById('edit-record-id').value = record.id;
    document.getElementById('edit-error-msg')?.classList.add('hidden');
    
    const isPed = record.traffic_type === 'PEDESTRIAN';
    editTrafficType.value = isPed ? 'PEDESTRIAN' : 'VEHICLE';
    editPlateSection.classList.toggle('hidden', isPed);
    editVehCatGroup.classList.toggle('hidden', isPed);
    editVehModelGroup.classList.toggle('hidden', isPed);

    document.getElementById('edit-person-category').value = record.person_category || 'GUEST';

    if (!isPed) {
      editP1.value = Jalali.toPersianDigits(record.plate_part1 || '');
      editLtr.value = record.plate_letter || 'ب';
      editP2.value = Jalali.toPersianDigits(record.plate_part2 || '');
      editCity.value = Jalali.toPersianDigits(record.plate_city || '');
      updatePlateTheme(editPlateContainer, record.plate_letter || 'ب');
    }

    document.getElementById('edit-person-name').value = record.person_name || '';
    document.getElementById('edit-vehicle-category').value = record.vehicle_category || 'سواری';
    document.getElementById('edit-vehicle-model').value = record.vehicle_model || '';
    document.getElementById('edit-entry-date').value = record.entry_jalali_date || '';
    document.getElementById('edit-entry-time').value = record.entry_time_display || '';
    
    editStatusSelect.value = record.status || 'ACTIVE';
    editExitFields.classList.toggle('hidden', record.status !== 'EXITED');
    document.getElementById('edit-exit-date').value = record.exit_jalali_date || Jalali.formatJalaliDate(new Date());
    document.getElementById('edit-exit-time').value = record.exit_time_display || Jalali.formatTime(new Date());
    document.getElementById('edit-notes').value = record.notes || '';

    modalEdit.classList.remove('hidden');
  }

  formEditRecord?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = Number(document.getElementById('edit-record-id').value);
    const err = document.getElementById('edit-error-msg');
    err.classList.add('hidden');

    const isPed = editTrafficType.value === 'PEDESTRIAN';
    const p1Val = Jalali.toPersianDigits(editP1.value.trim());
    const ltrVal = editLtr.value;
    const p2Val = Jalali.toPersianDigits(editP2.value.trim());
    const cityVal = Jalali.toPersianDigits(editCity.value.trim());
    const statusVal = editStatusSelect.value;

    if (!isPed && (p1Val.length !== 2 || p2Val.length !== 3 || cityVal.length !== 2)) {
      err.textContent = 'لطفاً تمامی ارقام پلاک را تکمیل فرمایید.';
      err.classList.remove('hidden');
      return;
    }

    const isExited = statusVal === 'EXITED';
    const plateFull = isPed ? 'عابر پیاده' : `${p1Val} ${ltrVal} ${p2Val} ایران ${cityVal}`;

    try {
      await DB.updateRecord(id, {
        traffic_type: isPed ? 'PEDESTRIAN' : 'VEHICLE',
        person_category: document.getElementById('edit-person-category').value,
        plate_part1: isPed ? null : p1Val,
        plate_letter: isPed ? null : ltrVal,
        plate_part2: isPed ? null : p2Val,
        plate_city: isPed ? null : cityVal,
        plate_full: plateFull,
        person_name: document.getElementById('edit-person-name').value.trim(),
        vehicle_category: isPed ? 'عابر پیاده' : document.getElementById('edit-vehicle-category').value,
        vehicle_model: isPed ? '' : document.getElementById('edit-vehicle-model').value.trim(),
        entry_jalali_date: Jalali.toLatinDigits(document.getElementById('edit-entry-date').value.trim()),
        entry_time_display: Jalali.toLatinDigits(document.getElementById('edit-entry-time').value.trim()),
        status: statusVal,
        exit_jalali_date: isExited ? Jalali.toLatinDigits(document.getElementById('edit-exit-date').value.trim()) : null,
        exit_time_display: isExited ? Jalali.toLatinDigits(document.getElementById('edit-exit-time').value.trim()) : null,
        notes: document.getElementById('edit-notes').value.trim()
      });

      modalEdit.classList.add('hidden');
      showToast('success', 'تغییرات با موفقیت ذخیره شد.');
      await loadData();
    } catch (ex) {
      err.textContent = ex.message;
      err.classList.remove('hidden');
    }
  });

  // ==========================================
  // حذف تردد
  // ==========================================
  function openDeleteModal(id) {
    if (!DB.hasPermission('delete')) {
      showToast('error', 'شما مجوز حذف رکورد را ندارید.');
      return;
    }
    document.getElementById('delete-target-id').value = id;
    modalDeleteConfirm.classList.remove('hidden');
  }

  document.getElementById('btn-confirm-delete')?.addEventListener('click', async () => {
    const id = Number(document.getElementById('delete-target-id').value);
    try {
      await DB.deleteRecord(id);
      modalDeleteConfirm.classList.add('hidden');
      showToast('success', 'تردد با موفقیت حذف گردید.');
      await loadData();
    } catch (ex) {
      showToast('error', ex.message);
    }
  });

  // ==========================================
  // مدیریت کاربران و نگهبانان (ویژه مدیر ارشد)
  // ==========================================
  function resetUserForm() {
    userFormId.value = '';
    userFormName.value = '';
    userFormUsername.value = '';
    userFormPin.value = '';
    userFormRole.value = 'GUARD';
    userFormShift.value = '';
    userFormHours.value = '';
    permRead.checked = true;
    permCreate.checked = true;
    permUpdate.checked = true;
    permDelete.checked = false;
    userFormTitle.textContent = 'تعریف کاربر / نگهبان جدید:';
    btnCancelEditUser.classList.add('hidden');
  }

  async function populateUsersList() {
    const users = await DB.getUsers();
    usersListContainer.innerHTML = users.map(u => {
      const p = u.permissions || {};
      return `
        <div class="user-item-row">
          <div class="user-item-info">
            <div>
              <strong>${u.name}</strong>
              <span style="color:var(--text-muted); font-size:0.75rem;">(@${u.username})</span>
              <span class="header-role-badge ${u.role === 'ADMIN' ? 'badge-role-admin' : 'badge-role-guard'}">${u.role === 'ADMIN' ? 'مدیر ارشد' : u.shiftName}</span>
            </div>
            <div class="user-perms-badges">
              <span class="perm-tag ${p.read ? 'perm-tag-on' : 'perm-tag-off'}">خواندن</span>
              <span class="perm-tag ${p.create ? 'perm-tag-on' : 'perm-tag-off'}">ثبت ورود</span>
              <span class="perm-tag ${p.update ? 'perm-tag-on' : 'perm-tag-off'}">ثبت خروج/ویرایش</span>
              <span class="perm-tag ${p.delete ? 'perm-tag-on' : 'perm-tag-off'}">حذف</span>
            </div>
          </div>
          <div class="action-group">
            <button type="button" class="btn-action-icon edit-btn" data-edit-user="${u.id}" title="ویرایش کاربر و دسترسی‌ها">
              <svg class="svg-icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            ${u.id !== DB.getCurrentUser()?.id ? `
              <button type="button" class="btn-action-icon delete-btn" data-delete-user="${u.id}" title="حذف کاربر">
                <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // اکشن‌های ویرایش کاربر
    usersListContainer.querySelectorAll('[data-edit-user]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const uid = e.currentTarget.getAttribute('data-edit-user');
        const user = (await DB.getUsers()).find(u => u.id === uid);
        if (!user) return;

        userFormId.value = user.id;
        userFormName.value = user.name;
        userFormUsername.value = user.username;
        userFormPin.value = user.pin;
        userFormRole.value = user.role;
        userFormShift.value = user.shiftName || '';
        userFormHours.value = user.shiftHours || '';
        
        permRead.checked = !!user.permissions?.read;
        permCreate.checked = !!user.permissions?.create;
        permUpdate.checked = !!user.permissions?.update;
        permDelete.checked = !!user.permissions?.delete;

        userFormTitle.textContent = `ویرایش مشخصات (${user.name}):`;
        btnCancelEditUser.classList.remove('hidden');
        userFormName.focus();
      });
    });

    // اکشن‌های حذف کاربر
    usersListContainer.querySelectorAll('[data-delete-user]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const uid = e.currentTarget.getAttribute('data-delete-user');
        if (confirm('آیا از حذف این کاربر/نگهبان اطمینان دارید؟')) {
          try {
            await DB.deleteUser(uid);
            await populateUsersList();
            await populateGuardsFilterDropdown();
            showToast('success', 'کاربر حذف شد.');
          } catch (err) {
            showToast('error', err.message);
          }
        }
      });
    });
  }

  btnCancelEditUser?.addEventListener('click', resetUserForm);

  btnSaveUser?.addEventListener('click', async () => {
    const name = userFormName.value.trim();
    const username = userFormUsername.value.trim();
    const pin = userFormPin.value.trim();
    const role = userFormRole.value;
    const shiftName = userFormShift.value.trim();
    const shiftHours = userFormHours.value.trim();

    if (!name || !username || !pin) {
      showToast('error', 'لطفاً نام، نام کاربری و پین‌کد را تکمیل فرمایید.');
      return;
    }

    try {
      await DB.saveUser({
        id: userFormId.value || undefined,
        name,
        username,
        pin,
        role,
        shiftName: shiftName || (role === 'ADMIN' ? 'مدیریت و نظارت' : 'شیفت عمومی'),
        shiftHours: shiftHours || '۰۸:۰۰ الی ۱۶:۰۰',
        permissions: {
          read: role === 'ADMIN' ? true : permRead.checked,
          create: role === 'ADMIN' ? true : permCreate.checked,
          update: role === 'ADMIN' ? true : permUpdate.checked,
          delete: role === 'ADMIN' ? true : permDelete.checked
        }
      });

      resetUserForm();
      await populateUsersList();
      await populateGuardsFilterDropdown();
      updateUserHeader();
      showToast('success', 'مشخصات کاربر و دسترسی‌ها ذخیره شد.');
    } catch (err) {
      showToast('error', err.message);
    }
  });

  userFormRole?.addEventListener('change', (e) => {
    const isAdmin = e.target.value === 'ADMIN';
    if (isAdmin) {
      permRead.checked = true;
      permCreate.checked = true;
      permUpdate.checked = true;
      permDelete.checked = true;
    }
  });

  // ==========================================
  // مراجعین دائمی و تنظیمات ابری
  // ==========================================
  function renderProfilesTab() {
    const profiles = DB.getLocalProfiles();
    const list = Object.values(profiles);
    document.getElementById('profiles-summary-info').textContent = `تعداد مراجعین ذخیره‌شده: ${Jalali.toPersianDigits(list.length)} مورد`;

    const container = document.getElementById('profiles-list-container');
    if (list.length === 0) {
      container.innerHTML = '<div style="font-size:0.75rem; color:var(--text-muted); padding:0.5rem;">حافظه خالی است.</div>';
      return;
    }

    container.innerHTML = list.map(p => `
      <div class="profile-item-row">
        <div>
          <strong>${p.personName}</strong>
          <span style="color:var(--text-muted); font-size:0.72rem; margin:0 0.4rem;">(${p.trafficType === 'PEDESTRIAN' ? 'عابر پیاده' : `${p.plateFull} - ${p.vehicleCategory}`})</span>
        </div>
        <span style="font-size:0.7rem; color:var(--primary); font-weight:700;">${p.personCategory || 'GUEST'}</span>
      </div>
    `).join('');
  }

  document.getElementById('btn-clear-profiles')?.addEventListener('click', () => {
    DB.saveLocalProfiles({});
    renderProfilesTab();
    updateKnownNamesDatalist();
    showToast('info', 'حافظه مراجعین پاکسازی شد.');
  });

  btnOpenSettings?.addEventListener('click', async () => {
    const currentUser = DB.getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      showToast('error', 'تنها مدیر ارشد سامانه به این بخش دسترسی دارد.');
      return;
    }

    resetUserForm();
    await populateUsersList();
    renderProfilesTab();
    
    const cfg = DB.getTursoConfig();
    if (cfg) {
      document.getElementById('input-db-url').value = cfg.databaseUrl || '';
      document.getElementById('input-auth-token').value = cfg.authToken || '';
    }
    document.getElementById('db-connection-result')?.classList.add('hidden');
    modalSettings.classList.remove('hidden');
  });

  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const targetId = e.currentTarget.getAttribute('data-tab');
      document.getElementById('tab-users')?.classList.toggle('hidden', targetId !== 'tab-users');
      document.getElementById('tab-profiles')?.classList.toggle('hidden', targetId !== 'tab-profiles');
      document.getElementById('tab-cloud-db')?.classList.toggle('hidden', targetId !== 'tab-cloud-db');
    });
  });

  // اتصال به دیتابیس ابری
  formCloudDb?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('input-db-url').value.trim();
    const token = document.getElementById('input-auth-token').value.trim();
    const resultBox = document.getElementById('db-connection-result');

    if (!url || !token) {
      resultBox.textContent = 'لطفاً آدرس دیتابیس و توکن را وارد کنید.';
      resultBox.classList.remove('hidden');
      return;
    }

    resultBox.textContent = 'در حال تست ارتباط و ایجاد جداول ابری...';
    resultBox.className = 'form-error';
    resultBox.style.color = 'var(--primary)';
    resultBox.style.borderColor = 'var(--primary)';
    resultBox.classList.remove('hidden');

    DB.saveTursoConfig({ databaseUrl: url, authToken: token });

    try {
      await DB.initCloudTables();
      await DB.syncProfiles();
      resultBox.textContent = '✓ اتصال با موفقیت برقرار شد و جداول همگام شدند.';
      resultBox.style.color = 'var(--emerald)';
      resultBox.style.borderColor = 'var(--emerald)';
      updateDbIndicator();
      showToast('success', 'اتصال به دیتابیس ابری فعال گردید.');
      await populateUsersList();
      await populateGuardsFilterDropdown();
      await loadData();
    } catch (ex) {
      DB.clearTursoConfig();
      updateDbIndicator();
      resultBox.textContent = 'خطا در برقراری ارتباط: ' + ex.message;
      resultBox.style.color = 'var(--red)';
      resultBox.style.borderColor = 'var(--red)';
    }
  });

  document.getElementById('btn-disconnect-db')?.addEventListener('click', () => {
    DB.clearTursoConfig();
    document.getElementById('input-db-url').value = '';
    document.getElementById('input-auth-token').value = '';
    document.getElementById('db-connection-result')?.classList.add('hidden');
    updateDbIndicator();
    showToast('info', 'اتصال ابری قطع گردید و اطلاعات به صورت محلی ذخیره می‌شوند.');
    loadData();
  });

  // دریافت نسخه پشتیبان
  btnExportBackup?.addEventListener('click', async () => {
    const records = await DB.getRecords();
    const users = await DB.getUsers();
    const profiles = DB.getLocalProfiles();
    const backupData = { records, users, profiles, export_date: currentDate, timestamp: new Date().toISOString() };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `campus_guard_backup_${currentDate.replace(/\//g, '-')}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('success', 'فایل پشتیبان با موفقیت دانلود شد.');
  });

  // ==========================================
  // راه‌اندازی اولیه سامانه
  // ==========================================
  updateDbIndicator();

  if (DB.isCloudConfigured()) {
    try {
      await DB.initCloudTables();
      await DB.syncProfiles();
    } catch (e) {
      console.warn('عدم دسترسی به سرور ابری در شروع اولیه:', e);
    }
  }

  // بررسی وضعیت ستاپ اولیه و نشست کاربری
  const isSetupRequired = await DB.isSetupRequired();
  if (isSetupRequired) {
    updateUserHeader();
    openSetupAdminModal();
  } else {
    const activeUser = DB.getCurrentUser();
    if (!activeUser) {
      updateUserHeader();
      await openLoginModal(false);
    } else {
      updateUserHeader();
      await populateGuardsFilterDropdown();
      await loadData();
    }
  }
});
