/**
 * app.js
 * کنترلر اصلی سامانه جامع ثبت و کنترل تردد پردیس
 * مجهز به پشتیبانی کامل از خودرو، موتورسیکلت، عابر پیاده،
 * رندر چندسطری بدون اسکرول افقی، کارت‌های بهینه‌شده موبایل و نشانگر پردازش ابری
 */

document.addEventListener('DOMContentLoaded', async () => {
  const toPersian = (val) => (window.Jalali && typeof Jalali.toPersianDigits === 'function') ? Jalali.toPersianDigits(String(val ?? '')) : String(val ?? '');
  const toLatin = (val) => (window.Jalali && typeof Jalali.toLatinDigits === 'function') ? Jalali.toLatinDigits(String(val ?? '')) : String(val ?? '');

  const PlateUtils = window.PlateUtils;
  const DB = window.DB;
  const SmartSuggest = window.SmartSuggest;

  let currentDate = (window.Jalali && Jalali.formatJalaliDate) ? Jalali.formatJalaliDate(new Date()) : '1405/01/01';
  let entryTrafficType = 'VEHICLE'; // 'VEHICLE' | 'MOTORCYCLE' | 'PEDESTRIAN'
  
  let currentFilteredRecords = [];
  let currentPage = 1;
  let pageSize = 25;

  // المان‌های نشانگر وضعیت و هدر
  const appLoadingBar = document.getElementById('app-loading-bar');
  const headerUserName = document.getElementById('header-user-name');
  const headerUserRole = document.getElementById('header-user-role');
  const btnOpenUserProfile = document.getElementById('btn-open-user-profile');
  const btnLogoutUser = document.getElementById('btn-logout-user');
  const dbStatusIndicator = document.getElementById('db-status-indicator');
  const dbStatusText = document.getElementById('db-status-text');
  const noReadPermissionBanner = document.getElementById('no-read-permission-banner');

  // کارت‌های آمار
  const statActiveCount = document.getElementById('stat-active-count');
  const statTotalCount = document.getElementById('stat-total-count');
  const statStaffCount = document.getElementById('stat-staff-count');
  const statExitedCount = document.getElementById('stat-exited-count');
  const statsContainer = document.getElementById('stats-container');

  // جدول و صفحه‌بندی
  const displayDateEl = document.getElementById('display-jalali-date');
  const recordsTbody = document.getElementById('records-tbody');
  const tableEmptyState = document.getElementById('table-empty-state');
  const tableLoading = document.getElementById('table-loading');

  const paginationContainer = document.getElementById('pagination-container');
  const pgRangeEl = document.getElementById('pg-range');
  const pgTotalEl = document.getElementById('pg-total');
  const pgButtonsContainer = document.getElementById('pg-buttons-container');
  const pgSizeSelect = document.getElementById('pg-size-select');

  // فیلترها
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
  const btnExportCsv = document.getElementById('btn-export-csv');

  const btnToggleFiltersMobile = document.getElementById('btn-toggle-filters-mobile');
  const mainFilterPanel = document.getElementById('main-filter-panel');
  const filterToggleArrow = document.getElementById('filter-toggle-arrow');

  // مودال‌ها
  const modalSetupAdmin = document.getElementById('modal-setup-admin');
  const formSetupAdmin = document.getElementById('form-setup-admin');
  const setupAdminName = document.getElementById('setup-admin-name');
  const setupAdminUsername = document.getElementById('setup-admin-username');
  const setupAdminPin = document.getElementById('setup-admin-pin');
  const setupAdminPinConfirm = document.getElementById('setup-admin-pin-confirm');
  const setupErrorMsg = document.getElementById('setup-error-msg');

  const modalLogin = document.getElementById('modal-login');
  const formLoginUser = document.getElementById('form-login-user');
  const loginSelectUser = document.getElementById('login-select-user');
  const loginInputPin = document.getElementById('login-input-pin');
  const loginErrorMsg = document.getElementById('login-error-msg');
  const btnCancelLogin = document.getElementById('btn-cancel-login');
  const btnCloseLogin = document.getElementById('btn-close-login');

  const modalEntry = document.getElementById('modal-entry');
  const modalExit = document.getElementById('modal-exit');
  const modalEdit = document.getElementById('modal-edit');
  const modalDeleteConfirm = document.getElementById('modal-delete-confirm');
  const modalSettings = document.getElementById('modal-settings');

  const btnOpenEntry = document.getElementById('btn-open-entry');
  const btnMobileFabEntry = document.getElementById('btn-mobile-fab-entry');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnExportBackup = document.getElementById('btn-export-backup');

  const formNewEntry = document.getElementById('form-new-entry');
  const formRecordExit = document.getElementById('form-record-exit');
  const formEditRecord = document.getElementById('form-edit-record');
  const formCloudDb = document.getElementById('tab-cloud-db');

  // کنترل سوییچر و ورودی‌های پلاک در مودال ورود جدید
  const btnToggleVehicle = document.getElementById('btn-toggle-vehicle');
  const btnToggleMotorcycle = document.getElementById('btn-toggle-motorcycle');
  const btnTogglePedestrian = document.getElementById('btn-toggle-pedestrian');
  const entryPlateSection = document.getElementById('entry-plate-section');
  const entryMotorPlateSection = document.getElementById('entry-motor-plate-section');
  const entryVehicleCategoryGroup = document.getElementById('entry-vehicle-category-group');
  const entryVehicleModelGroup = document.getElementById('entry-vehicle-model-group');
  const modalPlateContainer = document.getElementById('modal-plate-container');
  const modalMotorPlateContainer = document.getElementById('modal-motor-plate-container');

  const autofillIndicator = document.getElementById('autofill-indicator');
  const btnUndoAutofill = document.getElementById('btn-undo-autofill');
  const autofillInfoLabel = document.getElementById('autofill-info-label');

  const p1 = document.getElementById('plate-p1');
  const ltr = document.getElementById('plate-ltr');
  const p2 = document.getElementById('plate-p2');
  const city = document.getElementById('plate-city');
  const motorPlateTop = document.getElementById('motor-plate-top');
  const motorPlateBottom = document.getElementById('motor-plate-bottom');
  const inputPersonName = document.getElementById('input-person-name');

  // کنترل‌های ویرایش
  const editTrafficType = document.getElementById('edit-traffic-type');
  const editPlateSection = document.getElementById('edit-plate-section');
  const editMotorPlateSection = document.getElementById('edit-motor-plate-section');
  const editPlateContainer = document.getElementById('edit-plate-container');
  const editP1 = document.getElementById('edit-plate-p1');
  const editLtr = document.getElementById('edit-plate-ltr');
  const editP2 = document.getElementById('edit-plate-p2');
  const editCity = document.getElementById('edit-plate-city');
  const editMotorPlateTop = document.getElementById('edit-motor-plate-top');
  const editMotorPlateBottom = document.getElementById('edit-motor-plate-bottom');
  const editVehCatGroup = document.getElementById('edit-veh-cat-group');
  const editVehModelGroup = document.getElementById('edit-veh-model-group');
  const editStatusSelect = document.getElementById('edit-status');
  const editExitFields = document.getElementById('edit-exit-fields');

  // تنظیمات کاربران
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

  // =========================================================================
  // تابع نشانگر مینیمال پردازش دیتابیس (Loading Bar & Sync Dot)
  // =========================================================================
  function setDbLoading(isLoading) {
    if (appLoadingBar) appLoadingBar.classList.toggle('is-active', isLoading);
    if (dbStatusIndicator) {
      if (isLoading) {
        dbStatusIndicator.classList.add('is-syncing');
      } else {
        dbStatusIndicator.classList.remove('is-syncing');
      }
    }
  }

  // اتصال همگانی فیلدهای تاریخ و ساعت به پیکر چرخشی (Scroll Picker)
  if (window.ScrollPicker) {
    ScrollPicker.attach(inputCustomDate, 'DATE');
    ScrollPicker.attach(timeFrom, 'TIME');
    ScrollPicker.attach(timeTo, 'TIME');

    ScrollPicker.attach(document.getElementById('input-entry-date'), 'DATE');
    ScrollPicker.attach(document.getElementById('input-entry-time'), 'TIME');

    ScrollPicker.attach(document.getElementById('input-exit-date'), 'DATE');
    ScrollPicker.attach(document.getElementById('input-exit-time'), 'TIME');

    ScrollPicker.attach(document.getElementById('edit-entry-date'), 'DATE');
    ScrollPicker.attach(document.getElementById('edit-entry-time'), 'TIME');
    ScrollPicker.attach(document.getElementById('edit-exit-date'), 'DATE');
    ScrollPicker.attach(document.getElementById('edit-exit-time'), 'TIME');
  }

  if (window.innerWidth <= 820 && mainFilterPanel) {
    mainFilterPanel.classList.add('is-collapsed');
  }

  btnToggleFiltersMobile?.addEventListener('click', () => {
    const isCollapsed = mainFilterPanel.classList.contains('is-collapsed');
    mainFilterPanel.classList.toggle('is-collapsed');
    filterToggleArrow?.classList.toggle('is-open', isCollapsed);
  });

  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        if (backdrop === modalLogin && btnCancelLogin?.classList.contains('hidden')) return;
        if (backdrop === modalSetupAdmin) return;
        backdrop.classList.add('hidden');
        SmartSuggest?.hideSuggestionBox();
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (SmartSuggest && SmartSuggest.activePopupEl) {
        SmartSuggest.hideSuggestionBox();
        return;
      }
      document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach((m) => {
        if (m === modalSetupAdmin) return;
        if (m === modalLogin && btnCancelLogin?.classList.contains('hidden')) return;
        m.classList.add('hidden');
      });
    } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      inputSearch?.focus();
    }
  });

  function showToast(type, text) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : (type === 'info' ? 'toast-info' : 'toast-error')}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    } else if (type === 'info') {
      iconSvg = '<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    } else {
      iconSvg = '<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${text}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  function updateDbIndicator() {
    if (DB && DB.isCloudConfigured && DB.isCloudConfigured()) {
      dbStatusIndicator.className = 'db-status-badge is-online';
      dbStatusText.textContent = 'دیتابیس ابری';
    } else {
      dbStatusIndicator.className = 'db-status-badge is-local';
      dbStatusText.textContent = 'دیتابیس محلی';
    }
  }

  function updateUserHeader() {
    const user = DB ? DB.getCurrentUser() : null;

    if (!user) {
      headerUserName.textContent = 'وارد نشده';
      headerUserRole.textContent = 'مهمان';
      headerUserRole.className = 'header-role-badge';
      btnOpenSettings?.classList.add('hidden');
      btnOpenEntry?.classList.add('hidden');
      btnMobileFabEntry?.classList.add('hidden');
      btnLogoutUser?.classList.add('hidden');
      noReadPermissionBanner?.classList.remove('hidden');
      statsContainer?.classList.add('hidden');
      mainFilterPanel?.classList.add('hidden');
      return;
    }

    btnLogoutUser?.classList.remove('hidden');
    headerUserName.textContent = user.name;
    if (user.role === 'ADMIN') {
      headerUserRole.textContent = 'مدیر ارشد';
      headerUserRole.className = 'header-role-badge badge-role-admin';
      btnOpenSettings?.classList.remove('hidden');
    } else {
      headerUserRole.textContent = user.shiftName || 'نگهبان';
      headerUserRole.className = 'header-role-badge badge-role-guard';
      btnOpenSettings?.classList.add('hidden');
    }

    const canCreate = DB ? DB.hasPermission('create') : true;
    btnOpenEntry?.classList.toggle('hidden', !canCreate);
    btnMobileFabEntry?.classList.toggle('hidden', !canCreate);

    const canRead = DB ? DB.hasPermission('read') : true;
    noReadPermissionBanner?.classList.toggle('hidden', canRead);
    statsContainer?.classList.toggle('hidden', !canRead);
    mainFilterPanel?.classList.toggle('hidden', !canRead);
  }

  async function openLoginModal(allowCancel = true) {
    loginErrorMsg.classList.add('hidden');
    loginInputPin.value = '';
    const users = DB ? (await DB.getUsers()) : [];
    const current = DB ? DB.getCurrentUser() : null;

    if (users.length === 0) {
      modalLogin.classList.add('hidden');
      openSetupAdminModal();
      return;
    }

    loginSelectUser.innerHTML = users.map((u) => {
      const isSel = current && u.id === current.id ? 'selected' : '';
      const roleText = u.role === 'ADMIN' ? 'مدیر ارشد' : (u.shiftName || 'مامور');
      return `<option value="${u.id}" ${isSel}>${u.name} (${roleText}) - @${u.username}</option>`;
    }).join('');

    btnCancelLogin?.classList.toggle('hidden', !allowCancel);
    btnCloseLogin?.classList.toggle('hidden', !allowCancel);

    modalLogin.classList.remove('hidden');
    setTimeout(() => loginInputPin.focus(), 150);
  }

  function openSetupAdminModal() {
    setupErrorMsg.classList.add('hidden');
    formSetupAdmin?.reset();
    modalSetupAdmin.classList.remove('hidden');
    setTimeout(() => setupAdminName.focus(), 150);
  }

  formSetupAdmin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setupErrorMsg.classList.add('hidden');

    const name = setupAdminName.value.trim();
    const username = setupAdminUsername.value.trim();
    const pin = setupAdminPin.value.trim();
    const pinConfirm = setupAdminPinConfirm.value.trim();

    if (pin !== pinConfirm) {
      setupErrorMsg.textContent = 'رمز عبور و تکرار آن یکسان نیستند.';
      setupErrorMsg.classList.remove('hidden');
      return;
    }

    if (pin.length < 4) {
      setupErrorMsg.textContent = 'رمز عبور باید حداقل ۴ رقم باشد.';
      setupErrorMsg.classList.remove('hidden');
      return;
    }

    try {
      setDbLoading(true);
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
      showToast('success', `حساب مدیر ارشد (${admin.name}) با موفقیت ساخته شد.`);
    } catch (err) {
      setupErrorMsg.textContent = err.message;
      setupErrorMsg.classList.remove('hidden');
    } finally {
      setDbLoading(false);
    }
  });

  btnOpenUserProfile?.addEventListener('click', () => openLoginModal(true));

  formLoginUser?.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginErrorMsg.classList.add('hidden');
    const selectedUserId = loginSelectUser.value;
    const pin = loginInputPin.value.trim();

    try {
      setDbLoading(true);
      const user = await DB.authenticate(selectedUserId, pin);
      modalLogin.classList.add('hidden');
      updateUserHeader();
      await populateGuardsFilterDropdown();
      await loadData();
      showToast('success', `خوش آمدید، ${user.name}`);
    } catch (err) {
      loginErrorMsg.textContent = err.message;
      loginErrorMsg.classList.remove('hidden');
    } finally {
      setDbLoading(false);
    }
  });

  btnLogoutUser?.addEventListener('click', () => {
    if (confirm('آیا از خروج از حساب کاربری اطمینان دارید؟')) {
      if (DB) DB.logout();
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

  // سوییچ بین نوع تردد در مودال ورود جدید
  function setEntryTrafficType(type) {
    entryTrafficType = type;
    btnToggleVehicle?.classList.toggle('active', type === 'VEHICLE');
    btnToggleMotorcycle?.classList.toggle('active', type === 'MOTORCYCLE');
    btnTogglePedestrian?.classList.toggle('active', type === 'PEDESTRIAN');

    entryPlateSection?.classList.toggle('hidden', type !== 'VEHICLE');
    entryMotorPlateSection?.classList.toggle('hidden', type !== 'MOTORCYCLE');
    entryVehicleCategoryGroup?.classList.toggle('hidden', type === 'PEDESTRIAN');
    entryVehicleModelGroup?.classList.toggle('hidden', type === 'PEDESTRIAN');

    const vehCatSelect = document.getElementById('input-vehicle-category');
    if (type === 'MOTORCYCLE') {
      if (vehCatSelect) vehCatSelect.value = 'موتورسیکلت';
    } else if (type === 'VEHICLE') {
      if (vehCatSelect && vehCatSelect.value === 'موتورسیکلت') vehCatSelect.value = 'سواری';
    }
  }

  btnToggleVehicle?.addEventListener('click', () => setEntryTrafficType('VEHICLE'));
  btnToggleMotorcycle?.addEventListener('click', () => setEntryTrafficType('MOTORCYCLE'));
  btnTogglePedestrian?.addEventListener('click', () => setEntryTrafficType('PEDESTRIAN'));

  document.getElementById('input-vehicle-category')?.addEventListener('change', (e) => {
    if (e.target.value === 'موتورسیکلت' && entryTrafficType !== 'MOTORCYCLE') {
      setEntryTrafficType('MOTORCYCLE');
    } else if (e.target.value !== 'موتورسیکلت' && entryTrafficType === 'MOTORCYCLE') {
      setEntryTrafficType('VEHICLE');
    }
  });

  function applyCandidateToForm(candidate) {
    SmartSuggest.lastAppliedBackup = {
      trafficType: entryTrafficType,
      p1: p1.value,
      ltr: ltr.value,
      p2: p2.value,
      city: city.value,
      motorTop: motorPlateTop.value,
      motorBottom: motorPlateBottom.value,
      name: inputPersonName.value,
      cat: document.getElementById('input-person-category').value,
      vehCat: document.getElementById('input-vehicle-category').value,
      vehModel: document.getElementById('input-vehicle-model').value,
      notes: document.getElementById('input-notes').value
    };

    const targetType = candidate.trafficType || (candidate.vehicleCategory === 'موتورسیکلت' ? 'MOTORCYCLE' : 'VEHICLE');
    setEntryTrafficType(targetType);

    if (targetType === 'VEHICLE') {
      p1.value = toPersian(candidate.platePart1 || '');
      ltr.value = candidate.plateLetter || 'ب';
      p2.value = toPersian(candidate.platePart2 || '');
      city.value = toPersian(candidate.plateCity || '');
      PlateUtils.updatePlateTheme(modalPlateContainer, candidate.plateLetter || 'ب');
      [p1, ltr, p2, city].forEach(el => {
        el.classList.add('autofilled-field');
        setTimeout(() => el.classList.remove('autofilled-field'), 1600);
      });
    } else if (targetType === 'MOTORCYCLE') {
      motorPlateTop.value = toPersian(candidate.platePart1 || '');
      motorPlateBottom.value = toPersian(candidate.platePart2 || '');
      [motorPlateTop, motorPlateBottom].forEach(el => {
        el.classList.add('autofilled-field');
        setTimeout(() => el.classList.remove('autofilled-field'), 1600);
      });
    }

    inputPersonName.value = candidate.personName || '';
    document.getElementById('input-person-category').value = candidate.personCategory || 'GUEST';
    document.getElementById('input-vehicle-category').value = candidate.vehicleCategory || (targetType === 'MOTORCYCLE' ? 'موتورسیکلت' : 'سواری');
    document.getElementById('input-vehicle-model').value = candidate.vehicleModel || '';

    if (candidate.notes && !document.getElementById('input-notes').value) {
      document.getElementById('input-notes').value = candidate.notes;
    }

    [inputPersonName, document.getElementById('input-person-category')].forEach(el => {
      el.classList.add('autofilled-field');
      setTimeout(() => el.classList.remove('autofilled-field'), 1600);
    });

    if (autofillInfoLabel) {
      autofillInfoLabel.textContent = `مشخصات «${candidate.personName}» بارگذاری شد.`;
    }
    autofillIndicator?.classList.remove('hidden');
    SmartSuggest.hideSuggestionBox();
  }

  btnUndoAutofill?.addEventListener('click', () => {
    if (!SmartSuggest.lastAppliedBackup) return;
    const b = SmartSuggest.lastAppliedBackup;
    setEntryTrafficType(b.trafficType);
    p1.value = b.p1;
    ltr.value = b.ltr;
    p2.value = b.p2;
    city.value = b.city;
    motorPlateTop.value = b.motorTop || '';
    motorPlateBottom.value = b.motorBottom || '';

    PlateUtils.updatePlateTheme(modalPlateContainer, b.ltr || 'ب');
    inputPersonName.value = b.name;
    document.getElementById('input-person-category').value = b.cat;
    document.getElementById('input-vehicle-category').value = b.vehCat;
    document.getElementById('input-vehicle-model').value = b.vehModel;
    document.getElementById('input-notes').value = b.notes;

    autofillIndicator?.classList.add('hidden');
    SmartSuggest.lastAppliedBackup = null;
    showToast('info', 'اطلاعات فرم بازگردانی شد.');
  });

  async function triggerSmartPlateSearch() {
    if (!SmartSuggest) return;
    const p1Val = p1.value.trim();
    const ltrVal = ltr.value;
    const p2Val = p2.value.trim();
    const cityVal = city.value.trim();

    if (!p1Val && !p2Val && !cityVal) {
      SmartSuggest.hideSuggestionBox();
      return;
    }

    const matches = await SmartSuggest.searchCandidates({
      type: 'PLATE',
      p1: p1Val,
      ltr: ltrVal,
      p2: p2Val,
      city: cityVal
    });

    if (matches.length > 0) {
      SmartSuggest.showSuggestionBox(matches, modalPlateContainer, (cand) => applyCandidateToForm(cand));
    } else {
      SmartSuggest.hideSuggestionBox();
    }
  }

  async function triggerSmartMotorSearch() {
    if (!SmartSuggest) return;
    const topVal = motorPlateTop.value.trim();
    const bottomVal = motorPlateBottom.value.trim();

    if (!topVal && !bottomVal) {
      SmartSuggest.hideSuggestionBox();
      return;
    }

    const matches = await SmartSuggest.searchCandidates({
      type: 'MOTORCYCLE',
      p1: topVal,
      p2: bottomVal
    });

    if (matches.length > 0) {
      SmartSuggest.showSuggestionBox(matches, modalMotorPlateContainer, (cand) => applyCandidateToForm(cand));
    } else {
      SmartSuggest.hideSuggestionBox();
    }
  }

  // تنظیم ورودی‌های پلاک خودرو
  PlateUtils.setupPlateInputAutoConvert(p1, 2, ltr, triggerSmartPlateSearch);
  ltr?.addEventListener('change', (e) => {
    PlateUtils.updatePlateTheme(modalPlateContainer, e.target.value);
    p2?.focus();
    triggerSmartPlateSearch();
  });
  PlateUtils.setupPlateInputAutoConvert(p2, 3, city, triggerSmartPlateSearch);
  PlateUtils.setupPlateInputAutoConvert(city, 2, null, triggerSmartPlateSearch);

  // تنظیم ورودی‌های پلاک موتورسیکلت (۳ رقم بالا و ۵ رقم پایین)
  PlateUtils.setupMotorInputAutoConvert(motorPlateTop, motorPlateBottom, triggerSmartMotorSearch);

  inputPersonName?.addEventListener('input', async (e) => {
    const val = e.target.value;
    if (!val || val.trim().length < 2) {
      SmartSuggest?.hideSuggestionBox();
      return;
    }

    const matches = await SmartSuggest.searchCandidates({
      type: 'NAME',
      nameQuery: val
    });

    if (matches.length > 0) {
      SmartSuggest.showSuggestionBox(matches, inputPersonName, (cand) => applyCandidateToForm(cand));
    } else {
      SmartSuggest?.hideSuggestionBox();
    }
  });

  inputPersonName?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && SmartSuggest?.activePopupEl && SmartSuggest.currentMatches.length > 0) {
      e.preventDefault();
      applyCandidateToForm(SmartSuggest.currentMatches[0]);
    }
  });

  // فیلتر جستجوی پلاک در پنل بالا
  PlateUtils.setupPlateInputAutoConvert(searchPlateP1, 2, searchPlateLtr, () => { currentPage = 1; loadData(); });
  searchPlateLtr?.addEventListener('change', (e) => {
    PlateUtils.updatePlateTheme(searchPlateContainer, e.target.value === 'ALL' ? 'ب' : e.target.value);
    searchPlateP2?.focus();
    currentPage = 1;
    loadData();
  });
  PlateUtils.setupPlateInputAutoConvert(searchPlateP2, 3, searchPlateCity, () => { currentPage = 1; loadData(); });
  PlateUtils.setupPlateInputAutoConvert(searchPlateCity, 2, null, () => { currentPage = 1; loadData(); });

  // فیلدهای پلاک خودرو و موتور در مودال ویرایش
  PlateUtils.setupPlateInputAutoConvert(editP1, 2, editLtr);
  editLtr?.addEventListener('change', (e) => {
    PlateUtils.updatePlateTheme(editPlateContainer, e.target.value);
    editP2?.focus();
  });
  PlateUtils.setupPlateInputAutoConvert(editP2, 3, editCity);
  PlateUtils.setupPlateInputAutoConvert(editCity, 2, null);
  PlateUtils.setupMotorInputAutoConvert(editMotorPlateTop, editMotorPlateBottom);

  async function populateGuardsFilterDropdown() {
    if (!selectFilterGuard || !DB) return;
    const users = await DB.getUsers();
    selectFilterGuard.innerHTML = '<option value="ALL">همه مأموران (ورود یا خروج)</option>' +
      users.map((u) => `<option value="${u.name}">${u.name} (${u.role === 'ADMIN' ? 'مدیر' : u.shiftName})</option>`).join('');
  }

  pgSizeSelect?.addEventListener('change', (e) => {
    pageSize = Number(e.target.value) || 25;
    currentPage = 1;
    renderRecords();
  });

  async function loadData() {
    if (displayDateEl) {
      const human = (window.Jalali && Jalali.getHumanReadable) ? Jalali.getHumanReadable(currentDate) : currentDate;
      displayDateEl.textContent = `${human} (${toPersian(currentDate)})`;
    }

    if (DB && !DB.hasPermission('read')) {
      recordsTbody.innerHTML = '';
      tableEmptyState?.classList.remove('hidden');
      paginationContainer?.classList.add('hidden');
      return;
    }

    tableLoading?.classList.remove('hidden');
    setDbLoading(true);

    let allRecords = [];
    try {
      allRecords = DB ? (await DB.getRecords()) : [];
    } catch {
      allRecords = DB ? DB.getLocalRecords() : [];
    } finally {
      tableLoading?.classList.add('hidden');
      setDbLoading(false);
    }

    let filtered = [...allRecords];
    const datePreset = selectDatePreset?.value || 'ALL';
    const todayStr = (window.Jalali && Jalali.formatJalaliDate) ? Jalali.formatJalaliDate(new Date()) : '';

    if (datePreset === 'TODAY') {
      filtered = filtered.filter((r) => toLatin(r.entry_jalali_date) === toLatin(currentDate));
    } else if (datePreset === 'YESTERDAY') {
      const yesterdayStr = (window.Jalali && Jalali.shiftJalaliDate) ? Jalali.shiftJalaliDate(todayStr, -1) : '';
      filtered = filtered.filter((r) => toLatin(r.entry_jalali_date) === toLatin(yesterdayStr));
    } else if (datePreset === 'LAST_7_DAYS') {
      filtered = filtered.filter((r) => (window.Jalali && Jalali.isWithinLastDays) ? Jalali.isWithinLastDays(r.entry_jalali_date, 7) : true);
    } else if (datePreset === 'THIS_MONTH') {
      const prefix = toLatin(todayStr).substring(0, 7);
      filtered = filtered.filter((r) => toLatin(r.entry_jalali_date || '').startsWith(prefix));
    } else if (datePreset === 'CUSTOM_DATE') {
      const customVal = toLatin(inputCustomDate?.value.trim());
      if (customVal) {
        filtered = filtered.filter((r) => toLatin(r.entry_jalali_date) === customVal);
      }
    }

    const timeFilter = selectTimeFilter?.value || 'ALL';
    if (timeFilter === 'MORNING') {
      filtered = filtered.filter((r) => { const t = toLatin(r.entry_time_display || ''); return t >= '06:00' && t < '14:00'; });
    } else if (timeFilter === 'EVENING') {
      filtered = filtered.filter((r) => { const t = toLatin(r.entry_time_display || ''); return t >= '14:00' && t < '22:00'; });
    } else if (timeFilter === 'NIGHT') {
      filtered = filtered.filter((r) => { const t = toLatin(r.entry_time_display || ''); return t >= '22:00' || t < '06:00'; });
    } else if (timeFilter === 'CUSTOM') {
      const from = toLatin(timeFrom?.value.trim());
      const to = toLatin(timeTo?.value.trim());
      if (from) filtered = filtered.filter((r) => toLatin(r.entry_time_display || '') >= from);
      if (to) filtered = filtered.filter((r) => toLatin(r.entry_time_display || '') <= to);
    }

    const filterTypeVal = selectFilterType?.value || 'ALL';
    if (filterTypeVal === 'ONLY_VEHICLE') {
      filtered = filtered.filter((r) => r.traffic_type === 'VEHICLE' || (!r.traffic_type && r.vehicle_category !== 'موتورسیکلت' && r.traffic_type !== 'PEDESTRIAN'));
    } else if (filterTypeVal === 'ONLY_MOTORCYCLE') {
      filtered = filtered.filter((r) => r.traffic_type === 'MOTORCYCLE' || r.vehicle_category === 'موتورسیکلت');
    } else if (filterTypeVal === 'ONLY_PEDESTRIAN') {
      filtered = filtered.filter((r) => r.traffic_type === 'PEDESTRIAN');
    } else if (filterTypeVal === 'CAT_STAFF') {
      filtered = filtered.filter((r) => r.person_category === 'STAFF' || r.person_category === 'FACULTY');
    } else if (filterTypeVal === 'CAT_GUEST') {
      filtered = filtered.filter((r) => r.person_category === 'GUEST' || r.person_category === 'CONTRACTOR');
    }

    const vehCatVal = selectFilterVehCategory?.value || 'ALL';
    if (vehCatVal !== 'ALL') {
      filtered = filtered.filter((r) => r.traffic_type !== 'PEDESTRIAN' && r.vehicle_category === vehCatVal);
    }

    const guardFilter = selectFilterGuard?.value || 'ALL';
    if (guardFilter !== 'ALL') {
      filtered = filtered.filter((r) =>
        (r.entry_guard_name || '').includes(guardFilter) ||
        (r.exit_guard_name || '').includes(guardFilter) ||
        (r.guard_name || '').includes(guardFilter)
      );
    }

    const status = selectStatus?.value || 'ALL';
    if (status !== 'ALL') filtered = filtered.filter((r) => r.status === status);

    const query = toLatin(inputSearch?.value.trim().toLowerCase());
    if (query) {
      filtered = filtered.filter((r) => {
        const text = toLatin(`
          ${r.person_name || ''} 
          ${r.plate_full || ''} 
          ${r.vehicle_category || ''}
          ${r.vehicle_model || ''} 
          ${r.notes || ''}
          ${r.entry_guard_name || r.guard_name || ''}
          ${r.exit_guard_name || ''}
        `).toLowerCase();
        return text.includes(query);
      });
    }

    const sP1 = toLatin(searchPlateP1?.value.trim());
    const sLtr = searchPlateLtr?.value;
    const sP2 = toLatin(searchPlateP2?.value.trim());
    const sCity = toLatin(searchPlateCity?.value.trim());

    if (sP1) filtered = filtered.filter((r) => toLatin(r.plate_part1 || '').includes(sP1));
    if (sLtr && sLtr !== 'ALL') filtered = filtered.filter((r) => r.plate_letter === sLtr);
    if (sP2) filtered = filtered.filter((r) => toLatin(r.plate_part2 || '').includes(sP2));
    if (sCity) filtered = filtered.filter((r) => toLatin(r.plate_city || '').includes(sCity));

    currentFilteredRecords = filtered;

    if (statActiveCount) statActiveCount.textContent = toPersian(allRecords.filter((r) => r.status === 'ACTIVE').length);
    if (statTotalCount) statTotalCount.textContent = toPersian(filtered.length);
    if (statStaffCount) statStaffCount.textContent = toPersian(filtered.filter((r) => r.person_category === 'STAFF' || r.person_category === 'FACULTY').length);
    if (statExitedCount) statExitedCount.textContent = toPersian(filtered.filter((r) => r.status === 'EXITED').length);

    renderRecords();
  }

  // رندر هوشمند داده‌ها (جدول لایه‌ای دسکتاپ بدون اسکرول افقی + کارت‌های بدون باگ موبایل)
  function renderRecords() {
    recordsTbody.innerHTML = '';
    const totalItems = currentFilteredRecords.length;

    if (totalItems === 0) {
      tableEmptyState?.classList.remove('hidden');
      paginationContainer?.classList.add('hidden');
      return;
    }
    tableEmptyState?.classList.add('hidden');

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const pageRecords = currentFilteredRecords.slice(startIndex, endIndex);

    const isMobile = window.innerWidth <= 820;
    const canUpdate = DB ? DB.hasPermission('update') : true;
    const canDelete = DB ? DB.hasPermission('delete') : true;

    pageRecords.forEach((r, idx) => {
      const globalIndex = startIndex + idx + 1;
      const tr = document.createElement('tr');
      const isActive = r.status === 'ACTIVE';
      const isPedestrian = r.traffic_type === 'PEDESTRIAN';

      const entryOfficerName = r.entry_guard_name || r.guard_name || 'مأمور کشیک';
      const entryOfficerShift = r.entry_guard_shift || r.guard_shift || '';
      const exitOfficerName = r.exit_guard_name || null;
      const exitOfficerShift = r.exit_guard_shift || '';

      const plateOrPedestrianHtml = PlateUtils.renderTrafficBadge(r);

      const statusBadgeHtml = isActive
        ? '<span class="badge-status badge-active"><svg class="svg-icon" style="width:10px; height:10px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/></svg> حاضر در پردیس</span>'
        : '<span class="badge-status badge-exited"><svg class="svg-icon" style="width:10px; height:10px;" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> خارج شده</span>';

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
            <button class="btn-action-icon delete-btn" data-action="delete" data-id="${r.id}" title="حذف رکورد">
              <svg class="svg-icon" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          ` : ''}
        </div>
      `;

      if (isMobile) {
        // قالب کارت کاملاً عریض، خوانا و تفکیک‌شده موبایل
        tr.innerHTML = `
          <td>
            <div class="mc-card">
              <div class="mc-header">
                <div class="mc-header-right">
                  <span class="mc-index">#${toPersian(globalIndex)}</span>
                  ${PlateUtils.renderPersonCategoryBadge(r.person_category)}
                </div>
                <div>${statusBadgeHtml}</div>
              </div>

              <div class="mc-body">
                <div class="mc-person">
                  <span class="mc-name">${r.person_name}</span>
                  ${!isPedestrian ? `
                    <div class="mc-vehicle-tags">
                      <span class="badge-veh-cat">${r.vehicle_category || (r.traffic_type === 'MOTORCYCLE' ? 'موتورسیکلت' : 'سواری')}</span>
                      ${r.vehicle_model ? `<span class="badge-veh-model">${r.vehicle_model}</span>` : ''}
                    </div>
                  ` : ''}
                </div>
                <div class="mc-plate-container">${plateOrPedestrianHtml}</div>
              </div>

              <div class="mc-info-grid">
                <div class="mc-info-item">
                  <span class="mc-info-label">زمان ورود:</span>
                  <span class="mc-info-val">${toPersian(r.entry_time_display)} <small style="color:var(--text-faint);">(${toPersian(r.entry_jalali_date)})</small></span>
                </div>
                <div class="mc-info-item">
                  <span class="mc-info-label">زمان خروج:</span>
                  <span class="mc-info-val">${r.exit_time_display ? `${toPersian(r.exit_time_display)} <small style="color:var(--text-faint);">(${toPersian(r.exit_jalali_date)})</small>` : '<span style="color:var(--amber); font-weight:700;">در حال حضور</span>'}</span>
                </div>
              </div>

              <div class="mc-officers-grid">
                <div>
                  <span class="mc-officer-title">ثبت ورود:</span>
                  <div class="mc-officer-name-in">${entryOfficerName}</div>
                </div>
                <div>
                  <span class="mc-officer-title">ثبت خروج:</span>
                  <div class="mc-officer-name-out">${exitOfficerName || '—'}</div>
                </div>
              </div>

              ${r.notes ? `
                <div class="mc-notes">
                  <strong>علت / مقصد:</strong> ${r.notes}
                </div>
              ` : ''}

              <div class="mc-footer">
                <span class="mc-shift-tag">${entryOfficerShift || ''}</span>
                ${actionsHtml}
              </div>
            </div>
          </td>
        `;
      } else {
        // چیدمان چندسطری و فشرده دسکتاپ (بدون اسکرول افقی)
        const vehicleSubtitle = !isPedestrian && (r.vehicle_category || r.vehicle_model)
          ? `<div class="cell-sub-text">${r.vehicle_category || ''} ${r.vehicle_model ? `(${r.vehicle_model})` : ''}</div>`
          : '';

        tr.innerHTML = `
          <td class="text-center" style="color:var(--text-faint); font-weight:700; font-size:0.75rem;">${toPersian(globalIndex)}</td>
          <td>
            <div class="cell-stack">
              <span class="cell-main-text">${r.person_name}</span>
              <div>${PlateUtils.renderPersonCategoryBadge(r.person_category)}</div>
            </div>
          </td>
          <td>
            <div class="cell-stack">
              <div>${plateOrPedestrianHtml}</div>
              ${vehicleSubtitle}
            </div>
          </td>
          <td>
            <div class="cell-stack">
              <div>
                <span style="font-weight:800; color:var(--text-main); font-size:0.8rem;">${toPersian(r.entry_time_display)}</span>
                <span class="cell-sub-text">(${toPersian(r.entry_jalali_date)})</span>
              </div>
              <div>
                ${r.exit_time_display ? `
                  <span style="font-weight:800; color:var(--emerald); font-size:0.8rem;">${toPersian(r.exit_time_display)}</span>
                  <span class="cell-sub-text">(${toPersian(r.exit_jalali_date)})</span>
                ` : '<span style="color:var(--amber); font-weight:700; font-size:0.7rem;">حاضر در پردیس</span>'}
              </div>
            </div>
          </td>
          <td style="max-width:180px;">
            <div class="cell-sub-text" style="line-height:1.4; white-space:normal; word-break:break-word;" title="${r.notes || ''}">
              ${r.notes || '—'}
            </div>
          </td>
          <td>
            <div class="cell-stack">
              <div class="cell-officer-line">
                <span class="officer-lbl">ورود:</span>
                <span class="officer-val officer-in-val">${entryOfficerName}</span>
              </div>
              <div class="cell-officer-line">
                <span class="officer-lbl">خروج:</span>
                ${exitOfficerName ? `<span class="officer-val officer-out-val">${exitOfficerName}</span>` : '<span style="color:var(--text-faint);">—</span>'}
              </div>
            </div>
          </td>
          <td>${statusBadgeHtml}</td>
          <td class="text-center">${actionsHtml}</td>
        `;
      }
      recordsTbody.appendChild(tr);
    });

    document.querySelectorAll('[data-action="exit"]').forEach((btn) => {
      btn.addEventListener('click', (e) => openExitModal(Number(e.currentTarget.getAttribute('data-id'))));
    });
    document.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', (e) => openEditModal(Number(e.currentTarget.getAttribute('data-id'))));
    });
    document.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', (e) => openDeleteModal(Number(e.currentTarget.getAttribute('data-id'))));
    });

    renderPaginationUI(totalItems, totalPages, startIndex, endIndex);
  }

  function renderPaginationUI(totalItems, totalPages, startIndex, endIndex) {
    if (!paginationContainer) return;
    paginationContainer.classList.remove('hidden');

    if (pgRangeEl) pgRangeEl.textContent = `${toPersian(startIndex + 1)} تا ${toPersian(endIndex)}`;
    if (pgTotalEl) pgTotalEl.textContent = toPersian(totalItems);

    if (!pgButtonsContainer) return;
    pgButtonsContainer.innerHTML = '';

    const prevBtn = document.createElement('button');
    prevBtn.className = `btn-pg-nav ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '<svg class="svg-icon" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>';
    prevBtn.title = 'صفحه قبل';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderRecords();
      }
    });
    pgButtonsContainer.appendChild(prevBtn);

    const pagesToShow = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pagesToShow.push(i);
    } else {
      pagesToShow.push(1);
      if (currentPage > 3) pagesToShow.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pagesToShow.includes(i)) pagesToShow.push(i);
      }
      if (currentPage < totalPages - 2) pagesToShow.push('...');
      if (!pagesToShow.includes(totalPages)) pagesToShow.push(totalPages);
    }

    pagesToShow.forEach(p => {
      if (p === '...') {
        const span = document.createElement('span');
        span.className = 'pg-ellipsis';
        span.textContent = '...';
        pgButtonsContainer.appendChild(span);
      } else {
        const pageBtn = document.createElement('button');
        pageBtn.className = `btn-pg-num ${p === currentPage ? 'active' : ''}`;
        pageBtn.textContent = toPersian(p);
        pageBtn.addEventListener('click', () => {
          currentPage = p;
          renderRecords();
        });
        pgButtonsContainer.appendChild(pageBtn);
      }
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = `btn-pg-nav ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = '<svg class="svg-icon" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>';
    nextBtn.title = 'صفحه بعد';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderRecords();
      }
    });
    pgButtonsContainer.appendChild(nextBtn);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderRecords(), 200);
  });

  selectDatePreset?.addEventListener('change', (e) => {
    const val = e.target.value;
    dayStepperGroup?.classList.toggle('hidden', val !== 'TODAY');
    customDateContainer?.classList.toggle('hidden', val !== 'CUSTOM_DATE');
    if (val === 'TODAY' && window.Jalali) currentDate = Jalali.formatJalaliDate(new Date());
    currentPage = 1;
    loadData();
  });

  btnPrevDay?.addEventListener('click', () => { if (window.Jalali) currentDate = Jalali.shiftJalaliDate(currentDate, -1); currentPage = 1; loadData(); });
  btnNextDay?.addEventListener('click', () => { if (window.Jalali) currentDate = Jalali.shiftJalaliDate(currentDate, 1); currentPage = 1; loadData(); });
  inputCustomDate?.addEventListener('input', () => { currentPage = 1; loadData(); });
  inputCustomDate?.addEventListener('change', () => { currentPage = 1; loadData(); });

  selectTimeFilter?.addEventListener('change', (e) => {
    customTimeRange?.classList.toggle('hidden', e.target.value !== 'CUSTOM');
    currentPage = 1;
    loadData();
  });
  timeFrom?.addEventListener('input', () => { currentPage = 1; loadData(); });
  timeFrom?.addEventListener('change', () => { currentPage = 1; loadData(); });
  timeTo?.addEventListener('input', () => { currentPage = 1; loadData(); });
  timeTo?.addEventListener('change', () => { currentPage = 1; loadData(); });

  inputSearch?.addEventListener('input', () => { currentPage = 1; loadData(); });
  selectFilterType?.addEventListener('change', () => { currentPage = 1; loadData(); });
  selectFilterVehCategory?.addEventListener('change', () => { currentPage = 1; loadData(); });
  selectFilterGuard?.addEventListener('change', () => { currentPage = 1; loadData(); });
  selectStatus?.addEventListener('change', () => { currentPage = 1; loadData(); });

  btnResetFilters?.addEventListener('click', () => {
    selectDatePreset.value = 'ALL';
    dayStepperGroup?.classList.add('hidden');
    customDateContainer?.classList.add('hidden');
    if (window.Jalali) currentDate = Jalali.formatJalaliDate(new Date());

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
    PlateUtils.updatePlateTheme(searchPlateContainer, 'ب');

    currentPage = 1;
    loadData();
    showToast('info', 'فیلترها ریست شدند.');
  });

  btnExportCsv?.addEventListener('click', () => {
    if (DB && !DB.hasPermission('read')) {
      showToast('error', 'شما مجوز مشاهده و دریافت خروجی را ندارید.');
      return;
    }

    try {
      if (window.ExportUtils) {
        const result = ExportUtils.exportRecordsToCsv(currentFilteredRecords);
        showToast('success', `فایل اکسل با موفقیت شامل تمامی (${toPersian(result.count)}) رکورد منطبق دانلود شد.`);
      }
    } catch (err) {
      showToast('error', err.message);
    }
  });

  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.getAttribute('data-close'))?.classList.add('hidden');
      SmartSuggest?.hideSuggestionBox();
    });
  });

  function openNewEntryModal() {
    if (DB && !DB.hasPermission('create')) {
      showToast('error', 'شما مجوز ثبت تردد جدید را ندارید.');
      return;
    }

    const now = new Date();
    document.getElementById('entry-error-msg')?.classList.add('hidden');
    autofillIndicator?.classList.add('hidden');
    formNewEntry?.reset();
    setEntryTrafficType('VEHICLE');
    ltr.value = 'ب';
    PlateUtils.updatePlateTheme(modalPlateContainer, 'ب');
    SmartSuggest?.hideSuggestionBox();
    SmartSuggest.lastAppliedBackup = null;

    if (window.Jalali) {
      document.getElementById('input-entry-date').value = Jalali.formatJalaliDate(now);
      document.getElementById('input-entry-time').value = Jalali.formatTime(now);
    }
    modalEntry?.classList.remove('hidden');
    setTimeout(() => p1?.focus(), 150);
  }

  btnOpenEntry?.addEventListener('click', openNewEntryModal);
  btnMobileFabEntry?.addEventListener('click', openNewEntryModal);

  document.getElementById('btn-entry-date-today')?.addEventListener('click', () => {
    if (window.Jalali) document.getElementById('input-entry-date').value = Jalali.formatJalaliDate(new Date());
  });
  document.getElementById('btn-entry-time-now')?.addEventListener('click', () => {
    if (window.Jalali) document.getElementById('input-entry-time').value = Jalali.formatTime(new Date());
  });

  // ثبت نهایی تردد جدید (پشتیبانی کامل از خودرو، موتورسیکلت و عابر)
  formNewEntry?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('entry-error-msg');
    err?.classList.add('hidden');

    const person = inputPersonName.value.trim();
    const category = document.getElementById('input-person-category').value;
    const vehicleCat = document.getElementById('input-vehicle-category').value;
    const vehicleModel = document.getElementById('input-vehicle-model').value.trim();
    const entryDate = toLatin(document.getElementById('input-entry-date').value.trim());
    const entryTime = toLatin(document.getElementById('input-entry-time').value.trim());
    const notes = document.getElementById('input-notes').value.trim();

    let p1Val = null, ltrVal = null, p2Val = null, cityVal = null, plateFull = '';

    if (entryTrafficType === 'VEHICLE') {
      p1Val = toPersian(p1.value.trim());
      ltrVal = ltr.value;
      p2Val = toPersian(p2.value.trim());
      cityVal = toPersian(city.value.trim());

      if (p1Val.length !== 2 || p2Val.length !== 3 || cityVal.length !== 2) {
        err.textContent = 'لطفاً تمامی ارقام پلاک خودرو را به درستی وارد فرمایید.';
        err.classList.remove('hidden');
        return;
      }
      plateFull = PlateUtils.formatPlateFull(p1Val, ltrVal, p2Val, cityVal);
    } else if (entryTrafficType === 'MOTORCYCLE') {
      const topDigits = toPersian(motorPlateTop.value.trim());
      const bottomDigits = toPersian(motorPlateBottom.value.trim());

      if (topDigits.length !== 3 || bottomDigits.length !== 5) {
        err.textContent = 'پلاک موتورسیکلت باید شامل ۳ رقم بالا و ۵ رقم پایین باشد.';
        err.classList.remove('hidden');
        return;
      }
      p1Val = topDigits;
      p2Val = bottomDigits;
      plateFull = PlateUtils.formatMotorPlateFull(topDigits, bottomDigits);
    } else {
      plateFull = 'عابر پیاده';
    }

    try {
      setDbLoading(true);
      await DB.insertEntry({
        traffic_type: entryTrafficType,
        person_category: category,
        person_name: person,
        plate_part1: p1Val,
        plate_letter: ltrVal,
        plate_part2: p2Val,
        plate_city: cityVal,
        plate_full: plateFull,
        vehicle_category: entryTrafficType === 'PEDESTRIAN' ? 'عابر پیاده' : (entryTrafficType === 'MOTORCYCLE' ? 'موتورسیکلت' : vehicleCat),
        vehicle_model: entryTrafficType === 'PEDESTRIAN' ? '' : vehicleModel,
        status: 'ACTIVE',
        entry_jalali_date: entryDate,
        entry_time_display: entryTime,
        exit_time: null,
        exit_jalali_date: null,
        exit_time_display: null,
        notes: notes
      });

      SmartSuggest?.hideSuggestionBox();
      modalEntry.classList.add('hidden');
      showToast('success', `ورود (${person}) با موفقیت ثبت شد.`);
      currentPage = 1;
      await loadData();
    } catch (ex) {
      err.textContent = ex.message;
      err.classList.remove('hidden');
    } finally {
      setDbLoading(false);
    }
  });

  async function openExitModal(id) {
    if (DB && !DB.hasPermission('update')) {
      showToast('error', 'شما مجوز ثبت خروج را ندارید.');
      return;
    }

    const records = await DB.getRecords();
    const record = records.find((r) => r.id === id);
    if (!record) return;

    const now = new Date();
    const currentUser = DB.getCurrentUser();

    document.getElementById('exit-record-id').value = record.id;
    document.getElementById('exit-driver-name').textContent = record.person_name;
    document.getElementById('exit-plate-badge').innerHTML = PlateUtils.renderTrafficBadge(record);

    document.getElementById('exit-entry-time-info').textContent = `${toPersian(record.entry_jalali_date)} - ساعت ${toPersian(record.entry_time_display)}`;
    document.getElementById('exit-entry-guard-info').textContent = `${record.entry_guard_name || record.guard_name || 'مأمور کشیک'}`;
    document.getElementById('exit-active-guard-info').textContent = `${currentUser?.name} (${currentUser?.shiftName || 'مأمور جاری'})`;

    if (window.Jalali) {
      document.getElementById('input-exit-date').value = Jalali.formatJalaliDate(now);
      document.getElementById('input-exit-time').value = Jalali.formatTime(now);
    }

    modalExit.classList.remove('hidden');
  }

  document.getElementById('btn-exit-date-today')?.addEventListener('click', () => {
    if (window.Jalali) document.getElementById('input-exit-date').value = Jalali.formatJalaliDate(new Date());
  });
  document.getElementById('btn-exit-time-now')?.addEventListener('click', () => {
    if (window.Jalali) document.getElementById('input-exit-time').value = Jalali.formatTime(new Date());
  });

  formRecordExit?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = Number(document.getElementById('exit-record-id').value);
    const exitDate = toLatin(document.getElementById('input-exit-date').value.trim());
    const exitTime = toLatin(document.getElementById('input-exit-time').value.trim());

    try {
      setDbLoading(true);
      await DB.recordExit(id, {
        exit_jalali_date: exitDate,
        exit_time_display: exitTime
      });

      modalExit.classList.add('hidden');
      showToast('success', 'خروج با موفقیت ثبت شد.');
      await loadData();
    } catch (ex) {
      showToast('error', ex.message);
    } finally {
      setDbLoading(false);
    }
  });

  // تغییر نوع تردد در مودال ویرایش
  editTrafficType?.addEventListener('change', (e) => {
    const val = e.target.value;
    const isPed = val === 'PEDESTRIAN';
    const isMotor = val === 'MOTORCYCLE';

    editPlateSection?.classList.toggle('hidden', isPed || isMotor);
    editMotorPlateSection?.classList.toggle('hidden', !isMotor);
    editVehCatGroup?.classList.toggle('hidden', isPed);
    editVehModelGroup?.classList.toggle('hidden', isPed);

    const editVehCatSelect = document.getElementById('edit-vehicle-category');
    if (isMotor && editVehCatSelect) {
      editVehCatSelect.value = 'موتورسیکلت';
    }
  });

  editStatusSelect?.addEventListener('change', (e) => {
    editExitFields?.classList.toggle('hidden', e.target.value !== 'EXITED');
  });

  async function openEditModal(id) {
    if (DB && !DB.hasPermission('update')) {
      showToast('error', 'شما دسترسی لازم جهت ویرایش اطلاعات را ندارید.');
      return;
    }

    const records = await DB.getRecords();
    const record = records.find((r) => r.id === id);
    if (!record) return;

    document.getElementById('edit-record-id').value = record.id;
    document.getElementById('edit-error-msg')?.classList.add('hidden');

    const type = record.traffic_type || (record.vehicle_category === 'موتورسیکلت' ? 'MOTORCYCLE' : 'VEHICLE');
    editTrafficType.value = type;

    const isPed = type === 'PEDESTRIAN';
    const isMotor = type === 'MOTORCYCLE';

    editPlateSection?.classList.toggle('hidden', isPed || isMotor);
    editMotorPlateSection?.classList.toggle('hidden', !isMotor);
    editVehCatGroup?.classList.toggle('hidden', isPed);
    editVehModelGroup?.classList.toggle('hidden', isPed);

    document.getElementById('edit-person-category').value = record.person_category || 'GUEST';

    if (type === 'VEHICLE') {
      editP1.value = toPersian(record.plate_part1 || '');
      editLtr.value = record.plate_letter || 'ب';
      editP2.value = toPersian(record.plate_part2 || '');
      editCity.value = toPersian(record.plate_city || '');
      PlateUtils.updatePlateTheme(editPlateContainer, record.plate_letter || 'ب');
    } else if (type === 'MOTORCYCLE') {
      editMotorPlateTop.value = toPersian(record.plate_part1 || '');
      editMotorPlateBottom.value = toPersian(record.plate_part2 || '');
    }

    document.getElementById('edit-person-name').value = record.person_name || '';
    document.getElementById('edit-vehicle-category').value = record.vehicle_category || (isMotor ? 'موتورسیکلت' : 'سواری');
    document.getElementById('edit-vehicle-model').value = record.vehicle_model || '';
    document.getElementById('edit-entry-date').value = record.entry_jalali_date || '';
    document.getElementById('edit-entry-time').value = record.entry_time_display || '';

    editStatusSelect.value = record.status || 'ACTIVE';
    editExitFields?.classList.toggle('hidden', record.status !== 'EXITED');
    document.getElementById('edit-exit-date').value = record.exit_jalali_date || ((window.Jalali) ? Jalali.formatJalaliDate(new Date()) : '');
    document.getElementById('edit-exit-time').value = record.exit_time_display || ((window.Jalali) ? Jalali.formatTime(new Date()) : '');
    document.getElementById('edit-notes').value = record.notes || '';

    modalEdit.classList.remove('hidden');
  }

  formEditRecord?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = Number(document.getElementById('edit-record-id').value);
    const err = document.getElementById('edit-error-msg');
    err?.classList.add('hidden');

    const type = editTrafficType.value;
    const statusVal = editStatusSelect.value;
    const isExited = statusVal === 'EXITED';

    let p1Val = null, ltrVal = null, p2Val = null, cityVal = null, plateFull = '';

    if (type === 'VEHICLE') {
      p1Val = toPersian(editP1.value.trim());
      ltrVal = editLtr.value;
      p2Val = toPersian(editP2.value.trim());
      cityVal = toPersian(editCity.value.trim());

      if (p1Val.length !== 2 || p2Val.length !== 3 || cityVal.length !== 2) {
        err.textContent = 'لطفاً تمامی ارقام پلاک خودرو را تکمیل فرمایید.';
        err.classList.remove('hidden');
        return;
      }
      plateFull = PlateUtils.formatPlateFull(p1Val, ltrVal, p2Val, cityVal);
    } else if (type === 'MOTORCYCLE') {
      p1Val = toPersian(editMotorPlateTop.value.trim());
      p2Val = toPersian(editMotorPlateBottom.value.trim());

      if (p1Val.length !== 3 || p2Val.length !== 5) {
        err.textContent = 'پلاک موتور باید ۳ رقم بالا و ۵ رقم پایین باشد.';
        err.classList.remove('hidden');
        return;
      }
      plateFull = PlateUtils.formatMotorPlateFull(p1Val, p2Val);
    } else {
      plateFull = 'عابر پیاده';
    }

    try {
      setDbLoading(true);
      await DB.updateRecord(id, {
        traffic_type: type,
        person_category: document.getElementById('edit-person-category').value,
        plate_part1: p1Val,
        plate_letter: ltrVal,
        plate_part2: p2Val,
        plate_city: cityVal,
        plate_full: plateFull,
        person_name: document.getElementById('edit-person-name').value.trim(),
        vehicle_category: type === 'PEDESTRIAN' ? 'عابر پیاده' : (type === 'MOTORCYCLE' ? 'موتورسیکلت' : document.getElementById('edit-vehicle-category').value),
        vehicle_model: type === 'PEDESTRIAN' ? '' : document.getElementById('edit-vehicle-model').value.trim(),
        entry_jalali_date: toLatin(document.getElementById('edit-entry-date').value.trim()),
        entry_time_display: toLatin(document.getElementById('edit-entry-time').value.trim()),
        status: statusVal,
        exit_jalali_date: isExited ? toLatin(document.getElementById('edit-exit-date').value.trim()) : null,
        exit_time_display: isExited ? toLatin(document.getElementById('edit-exit-time').value.trim()) : null,
        notes: document.getElementById('edit-notes').value.trim()
      });

      modalEdit.classList.add('hidden');
      showToast('success', 'تغییرات با موفقیت ذخیره شد.');
      await loadData();
    } catch (ex) {
      err.textContent = ex.message;
      err.classList.remove('hidden');
    } finally {
      setDbLoading(false);
    }
  });

  function openDeleteModal(id) {
    if (DB && !DB.hasPermission('delete')) {
      showToast('error', 'شما مجوز حذف رکورد را ندارید.');
      return;
    }
    document.getElementById('delete-target-id').value = id;
    modalDeleteConfirm.classList.remove('hidden');
  }

  document.getElementById('btn-confirm-delete')?.addEventListener('click', async () => {
    const id = Number(document.getElementById('delete-target-id').value);
    try {
      setDbLoading(true);
      await DB.deleteRecord(id);
      modalDeleteConfirm.classList.add('hidden');
      showToast('success', 'تردد با موفقیت حذف گردید.');
      await loadData();
    } catch (ex) {
      showToast('error', ex.message);
    } finally {
      setDbLoading(false);
    }
  });

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
    btnCancelEditUser?.classList.add('hidden');
  }

  async function populateUsersList() {
    if (!usersListContainer || !DB) return;
    const users = await DB.getUsers();
    usersListContainer.innerHTML = users.map((u) => {
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
              <span class="perm-tag ${p.update ? 'perm-tag-on' : 'perm-tag-off'}">خروج/ویرایش</span>
              <span class="perm-tag ${p.delete ? 'perm-tag-on' : 'perm-tag-off'}">حذف</span>
            </div>
          </div>
          <div class="action-group">
            <button type="button" class="btn-action-icon edit-btn" data-edit-user="${u.id}" title="ویرایش کاربر">
              <svg class="svg-icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            ${u.id !== DB.getCurrentUser()?.id ? `
              <button type="button" class="btn-action-icon delete-btn" data-delete-user="${u.id}" title="حذف کاربر">
                <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    usersListContainer.querySelectorAll('[data-edit-user]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const uid = e.currentTarget.getAttribute('data-edit-user');
        const user = (await DB.getUsers()).find((u) => u.id === uid);
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
        btnCancelEditUser?.classList.remove('hidden');
        userFormName?.focus();
      });
    });

    usersListContainer.querySelectorAll('[data-delete-user]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const uid = e.currentTarget.getAttribute('data-delete-user');
        if (confirm('آیا از حذف این کاربر اطمینان دارید؟')) {
          try {
            setDbLoading(true);
            await DB.deleteUser(uid);
            await populateUsersList();
            await populateGuardsFilterDropdown();
            showToast('success', 'کاربر با موفقیت حذف شد.');
          } catch (err) {
            showToast('error', err.message);
          } finally {
            setDbLoading(false);
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
      setDbLoading(true);
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
      showToast('success', 'مشخصات کاربر ذخیره شد.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setDbLoading(false);
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

  function renderProfilesTab() {
    if (!DB) return;
    const profiles = DB.getLocalProfiles();
    const list = Object.values(profiles);
    const summaryEl = document.getElementById('profiles-summary-info');
    if (summaryEl) summaryEl.textContent = `تعداد مراجعین ذخیره‌شده: ${toPersian(list.length)} مورد`;

    const container = document.getElementById('profiles-list-container');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = '<div style="font-size:0.75rem; color:var(--text-muted); padding:0.8rem; text-align:center;">بانک مراجعین خالی است.</div>';
      return;
    }

    container.innerHTML = list.map((p) => {
      const isPed = p.trafficType === 'PEDESTRIAN';
      const detailInfo = isPed ? '<img src="walking.svg" class="svg-icon-img" alt="عابر" /> عابر پیاده' : `${p.plateFull || ''} - ${p.vehicleCategory || ''}`;
      return `
        <div class="profile-item-row">
          <div>
            <strong>${p.personName}</strong>
            <span style="color:var(--text-muted); font-size:0.72rem; margin:0 0.4rem;">(${detailInfo})</span>
          </div>
          <span style="font-size:0.7rem; color:var(--primary); font-weight:700;">${p.personCategory || 'GUEST'}</span>
        </div>
      `;
    }).join('');
  }

  document.getElementById('btn-clear-profiles')?.addEventListener('click', () => {
    if (confirm('آیا از پاکسازی کل حافظه مراجعین اطمینان دارید؟')) {
      if (DB) DB.saveLocalProfiles({});
      renderProfilesTab();
      showToast('info', 'حافظه مراجعین پاکسازی شد.');
    }
  });

  btnOpenSettings?.addEventListener('click', async () => {
    const currentUser = DB ? DB.getCurrentUser() : null;
    if (!currentUser || currentUser.role !== 'ADMIN') {
      showToast('error', 'تنها مدیر ارشد سامانه به بخش تنظیمات دسترسی دارد.');
      return;
    }

    resetUserForm();
    await populateUsersList();
    renderProfilesTab();

    const cfg = DB.getTursoConfig ? DB.getTursoConfig() : null;
    if (cfg) {
      document.getElementById('input-db-url').value = cfg.databaseUrl || '';
      document.getElementById('input-auth-token').value = cfg.authToken || '';
    }
    document.getElementById('db-connection-result')?.classList.add('hidden');
    modalSettings.classList.remove('hidden');
  });

  document.querySelectorAll('.settings-tab-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.settings-tab-btn').forEach((b) => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const targetId = e.currentTarget.getAttribute('data-tab');
      document.getElementById('tab-users')?.classList.toggle('hidden', targetId !== 'tab-users');
      document.getElementById('tab-profiles')?.classList.toggle('hidden', targetId !== 'tab-profiles');
      document.getElementById('tab-cloud-db')?.classList.toggle('hidden', targetId !== 'tab-cloud-db');
    });
  });

  formCloudDb?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('input-db-url').value.trim();
    const token = document.getElementById('input-auth-token').value.trim();
    const resultBox = document.getElementById('db-connection-result');

    if (!url || !token) {
      resultBox.textContent = 'لطفاً آدرس دیتابیس و توکن را وارد فرمایید.';
      resultBox.classList.remove('hidden');
      return;
    }

    resultBox.textContent = 'در حال تست ارتباط و همگام‌سازی...';
    resultBox.className = 'form-error';
    resultBox.style.color = 'var(--primary)';
    resultBox.style.borderColor = 'var(--primary)';
    resultBox.classList.remove('hidden');
    setDbLoading(true);

    try {
      if (DB.initCloudTables) await DB.initCloudTables();
      if (DB.syncProfiles) await DB.syncProfiles();
      resultBox.textContent = '✓ ارتباط با پایگاه داده ابری با موفقیت تأیید شد.';
      resultBox.style.color = 'var(--emerald)';
      resultBox.style.borderColor = 'var(--emerald)';
      updateDbIndicator();
      showToast('success', 'اتصال به پایگاه داده ابری برقرار است.');
      await populateUsersList();
      await populateGuardsFilterDropdown();
      await loadData();
    } catch (ex) {
      updateDbIndicator();
      resultBox.textContent = 'خطا در ارتباط با سرور ابری: ' + ex.message;
      resultBox.style.color = 'var(--rose)';
      resultBox.style.borderColor = 'var(--rose)';
    } finally {
      setDbLoading(false);
    }
  });

  document.getElementById('btn-disconnect-db')?.addEventListener('click', () => {
    document.getElementById('input-db-url').value = '';
    document.getElementById('input-auth-token').value = '';
    document.getElementById('db-connection-result')?.classList.add('hidden');
    updateDbIndicator();
    showToast('info', 'وضعیت به دیتابیس محلی تغییر یافت.');
    loadData();
  });

  btnExportBackup?.addEventListener('click', async () => {
    if (!DB) return;
    setDbLoading(true);
    const records = await DB.getRecords();
    const users = await DB.getUsers();
    const profiles = DB.getLocalProfiles();
    const notes = DB.getLocalNotes ? DB.getLocalNotes() : [];
    const backupData = { records, users, profiles, notes, export_date: currentDate, timestamp: new Date().toISOString() };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `campus_guard_backup_${currentDate.replace(/\//g, '-')}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setDbLoading(false);
    showToast('success', 'پشتیبان سیستم دانلود شد.');
  });

  updateDbIndicator();

  if (DB && DB.isCloudConfigured && DB.isCloudConfigured()) {
    try {
      setDbLoading(true);
      if (DB.initCloudTables) await DB.initCloudTables();
      if (DB.syncProfiles) await DB.syncProfiles();
    } catch (e) {
      console.warn('عدم دسترسی به سرور ابری در شروع اولیه:', e);
    } finally {
      setDbLoading(false);
    }
  }

  const isSetupRequired = DB ? (await DB.isSetupRequired()) : false;
  if (isSetupRequired) {
    updateUserHeader();
    openSetupAdminModal();
  } else {
    const activeUser = DB ? DB.getCurrentUser() : null;
    if (!activeUser) {
      updateUserHeader();
      await openLoginModal(false);
    } else {
      updateUserHeader();
      await populateGuardsFilterDropdown();
      await loadData();
    }
  }

  if (window.StickyNotes) {
    window.StickyNotes.init();
  }
});
