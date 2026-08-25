/**
 * Main Application Controller & UI Logic
 */
document.addEventListener('DOMContentLoaded', async () => {
  let currentDate = Jalali.formatJalaliDate(new Date());
  let entryTrafficType = 'VEHICLE';

  // المان‌های DOM
  const displayDateEl = document.getElementById('display-jalali-date');
  const recordsTbody = document.getElementById('records-tbody');
  const tableEmptyState = document.getElementById('table-empty-state');
  const tableLoading = document.getElementById('table-loading');
  const statActiveCount = document.getElementById('stat-active-count');
  const statTotalCount = document.getElementById('stat-total-count');
  const statStaffCount = document.getElementById('stat-staff-count');
  const statExitedCount = document.getElementById('stat-exited-count');

  const dbStatusIndicator = document.getElementById('db-status-indicator');
  const dbStatusText = document.getElementById('db-status-text');

  const selectActiveGuard = document.getElementById('select-active-guard');
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

  // مودال‌ها
  const modalEntry = document.getElementById('modal-entry');
  const modalExit = document.getElementById('modal-exit');
  const modalEdit = document.getElementById('modal-edit');
  const modalDeleteConfirm = document.getElementById('modal-delete-confirm');
  const modalSettings = document.getElementById('modal-settings');

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

  // اعلان‌های شناور (Toast)
  function showToast(type, text) {
    const container = document.getElementById('toast-container');
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
      dbStatusText.textContent = 'دیتابیس ابری (Turso Cloud)';
    } else {
      dbStatusIndicator.className = 'db-status-badge is-local';
      dbStatusText.textContent = 'دیتابیس محلی (LocalStorage)';
    }
  }

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

  function renderPlateBadge(p1, ltr, p2, city) {
    const themeClass = getPlateThemeClass(ltr);
    const ltrDisplay = ltr === 'معلولین' ? '♿' : ltr;
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
          <span>${Jalali.toPersianDigits(p1)}</span>
          <span class="plate-letter-tag">${ltrDisplay}</span>
          <span>${Jalali.toPersianDigits(p2)}</span>
        </div>
        <div class="plate-city-box">
          <span class="plate-iran-tag">ایران</span>
          <span>${Jalali.toPersianDigits(city)}</span>
        </div>
      </div>
    `;
  }

  function renderPersonCategoryBadge(category) {
    switch (category) {
      case 'STAFF': return '<span class="badge-person badge-person-staff">پرسنل دانشگاه</span>';
      case 'FACULTY': return '<span class="badge-person badge-person-faculty">هیئت علمی / استاد</span>';
      case 'STUDENT': return '<span class="badge-person badge-person-student">دانشجو</span>';
      case 'CONTRACTOR': return '<span class="badge-person badge-person-contractor">پیمانکار / خدمات</span>';
      default: return '<span class="badge-person badge-person-guest">ارباب‌رجوع / مهمان</span>';
    }
  }

  // --- سیستم Auto-Fill مراجعین و پلاک‌ها ---
  function updateKnownNamesDatalist() {
    const datalist = document.getElementById('known-names-list');
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

  // ورودی‌های پلاک
  function setupPlateInputAutoConvert(inputEl, maxLen, nextEl, autoFillCallback) {
    inputEl.addEventListener('input', (e) => {
      e.target.value = Jalali.cleanToPersianDigits(e.target.value, maxLen);
      if (e.target.value.length === maxLen && nextEl) {
        nextEl.focus();
      }
      if (autoFillCallback) autoFillCallback();
    });
  }

  const p1 = document.getElementById('plate-p1');
  const ltr = document.getElementById('plate-ltr');
  const p2 = document.getElementById('plate-p2');
  const city = document.getElementById('plate-city');

  setupPlateInputAutoConvert(p1, 2, ltr, triggerPlateAutoFill);
  ltr.addEventListener('change', (e) => {
    updatePlateTheme(modalPlateContainer, e.target.value);
    p2.focus();
    triggerPlateAutoFill();
  });
  setupPlateInputAutoConvert(p2, 3, city, triggerPlateAutoFill);
  setupPlateInputAutoConvert(city, 2, null, triggerPlateAutoFill);

  document.getElementById('input-person-name').addEventListener('input', (e) => {
    if (entryTrafficType === 'PEDESTRIAN') {
      triggerPedestrianAutoFill(e.target.value);
    }
  });

  // پلاک جستجو
  setupPlateInputAutoConvert(searchPlateP1, 2, searchPlateLtr, () => loadData());
  searchPlateLtr.addEventListener('change', (e) => { 
    updatePlateTheme(searchPlateContainer, e.target.value === 'ALL' ? 'ب' : e.target.value);
    searchPlateP2.focus();
    loadData();
  });
  setupPlateInputAutoConvert(searchPlateP2, 3, searchPlateCity, () => loadData());
  setupPlateInputAutoConvert(searchPlateCity, 2, null, () => loadData());

  // پلاک ویرایش
  const editP1 = document.getElementById('edit-plate-p1');
  const editLtr = document.getElementById('edit-plate-ltr');
  const editP2 = document.getElementById('edit-plate-p2');
  const editCity = document.getElementById('edit-plate-city');
  setupPlateInputAutoConvert(editP1, 2, editLtr);
  editLtr.addEventListener('change', (e) => { updatePlateTheme(editPlateContainer, e.target.value); editP2.focus(); });
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
  btnToggleVehicle.addEventListener('click', () => setEntryTrafficType('VEHICLE'));
  btnTogglePedestrian.addEventListener('click', () => setEntryTrafficType('PEDESTRIAN'));

  // --- دریافت و فیلتر اطلاعات جدول ---
  async function loadData() {
    displayDateEl.textContent = `${Jalali.getHumanReadable(currentDate)} (${Jalali.toPersianDigits(currentDate)})`;
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

    // ۱. فیلتر تاریخ
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

    // ۲. فیلتر ساعت و شیفت
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

    // ۳. فیلتر نوع مراجع
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

    // ۴. فیلتر دسته بندی خودرو
    const vehCatVal = selectFilterVehCategory.value;
    if (vehCatVal !== 'ALL') {
      filtered = filtered.filter(r => r.traffic_type !== 'PEDESTRIAN' && (r.vehicle_category === vehCatVal));
    }

    // ۵. فیلتر مامور
    const guardFilter = selectFilterGuard.value;
    if (guardFilter !== 'ALL') {
      filtered = filtered.filter(r => (r.guard_name || '').includes(guardFilter));
    }

    // ۶. فیلتر وضعیت
    const status = selectStatus.value;
    if (status !== 'ALL') filtered = filtered.filter(r => r.status === status);

    // ۷. جستجوی متنی
    const query = Jalali.toLatinDigits(inputSearch.value.trim().toLowerCase());
    if (query) {
      filtered = filtered.filter(r => {
        const haystack = Jalali.toLatinDigits(`
          ${r.person_name || ''} 
          ${r.plate_full || ''} 
          ${r.vehicle_category || ''}
          ${r.vehicle_model || ''} 
          ${r.notes || ''}
          ${r.guard_name || ''}
        `).toLowerCase();
        return haystack.includes(query);
      });
    }

    // ۸. تفکیک پلاک
    const sP1 = Jalali.toLatinDigits(searchPlateP1.value.trim());
    const sLtr = searchPlateLtr.value;
    const sP2 = Jalali.toLatinDigits(searchPlateP2.value.trim());
    const sCity = Jalali.toLatinDigits(searchPlateCity.value.trim());

    if (sP1) filtered = filtered.filter(r => Jalali.toLatinDigits(r.plate_part1 || '').includes(sP1));
    if (sLtr && sLtr !== 'ALL') filtered = filtered.filter(r => r.plate_letter === sLtr);
    if (sP2) filtered = filtered.filter(r => Jalali.toLatinDigits(r.plate_part2 || '').includes(sP2));
    if (sCity) filtered = filtered.filter(r => Jalali.toLatinDigits(r.plate_city || '').includes(sCity));

    // بروزرسانی آمار
    statActiveCount.textContent = Jalali.toPersianDigits(allRecords.filter(r => r.status === 'ACTIVE').length);
    statTotalCount.textContent = Jalali.toPersianDigits(filtered.length);
    statStaffCount.textContent = Jalali.toPersianDigits(filtered.filter(r => r.person_category === 'STAFF' || r.person_category === 'FACULTY').length);
    statExitedCount.textContent = Jalali.toPersianDigits(filtered.filter(r => r.status === 'EXITED').length);

    // رندر جدول
    recordsTbody.innerHTML = '';
    if (filtered.length === 0) {
      tableEmptyState.classList.remove('hidden');
      return;
    }
    tableEmptyState.classList.add('hidden');

    filtered.forEach((r, idx) => {
      const tr = document.createElement('tr');
      const isActive = r.status === 'ACTIVE';
      const isPedestrian = r.traffic_type === 'PEDESTRIAN';

      const plateOrPedestrianHtml = isPedestrian 
        ? '<span class="badge-pedestrian"><svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="4" r="2"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 6-2"/><path d="M12 10v4"/></svg> عابر پیاده</span>'
        : renderPlateBadge(r.plate_part1, r.plate_letter, r.plate_part2, r.plate_city);

      const vehicleInfoHtml = isPedestrian
        ? '<span style="color:var(--text-muted); font-size:0.72rem;">بدون وسیله نقلیه</span>'
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
        <td style="color:var(--text-muted); font-size:0.74rem; max-width:180px;">${r.notes || '—'}</td>
        <td>
          <div style="display:flex; flex-direction:column; font-size:0.72rem;">
            <span style="font-weight:700;">${r.guard_name || 'مامور کشیک'}</span>
            <span style="font-size:0.65rem; color:var(--text-muted);">${r.guard_shift || ''}</span>
          </div>
        </td>
        <td>${isActive ? '<span class="badge-status badge-active">حاضر در پردیس</span>' : '<span class="badge-status badge-exited">خارج شده</span>'}</td>
        <td class="text-center">
          <div class="action-group">
            ${isActive ? `
              <button class="btn-action-icon exit-btn" data-action="exit" data-id="${r.id}" title="ثبت خروج">
                <svg class="svg-icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            ` : ''}
            <button class="btn-action-icon edit-btn" data-action="edit" data-id="${r.id}" title="ویرایش">
              <svg class="svg-icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-action-icon delete-btn" data-action="delete" data-id="${r.id}" title="حذف">
              <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      `;
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

  // تعاملات فیلترها
  selectDatePreset.addEventListener('change', (e) => {
    const val = e.target.value;
    dayStepperGroup.classList.toggle('hidden', val !== 'TODAY');
    customDateContainer.classList.toggle('hidden', val !== 'CUSTOM_DATE');
    if (val === 'TODAY') currentDate = Jalali.formatJalaliDate(new Date());
    loadData();
  });

  btnPrevDay.addEventListener('click', () => { currentDate = Jalali.shiftJalaliDate(currentDate, -1); loadData(); });
  btnNextDay.addEventListener('click', () => { currentDate = Jalali.shiftJalaliDate(currentDate, 1); loadData(); });
  inputCustomDate.addEventListener('input', () => loadData());

  selectTimeFilter.addEventListener('change', (e) => {
    customTimeRange.classList.toggle('hidden', e.target.value !== 'CUSTOM');
    loadData();
  });
  timeFrom.addEventListener('input', () => loadData());
  timeTo.addEventListener('input', () => loadData());

  inputSearch.addEventListener('input', () => loadData());
  selectFilterType.addEventListener('change', () => loadData());
  selectFilterVehCategory.addEventListener('change', () => loadData());
  selectFilterGuard.addEventListener('change', () => loadData());
  selectStatus.addEventListener('change', () => loadData());

  btnResetFilters.addEventListener('click', () => {
    selectDatePreset.value = 'TODAY';
    dayStepperGroup.classList.remove('hidden');
    customDateContainer.classList.add('hidden');
    currentDate = Jalali.formatJalaliDate(new Date());
    
    selectTimeFilter.value = 'ALL';
    customTimeRange.classList.add('hidden');
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

  // بستن مودال‌ها
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.getAttribute('data-close')).classList.add('hidden');
    });
  });

  // --- ثبت تردد جدید ---
  document.getElementById('btn-open-entry').addEventListener('click', () => {
    const now = new Date();
    document.getElementById('entry-error-msg').classList.add('hidden');
    autofillIndicator.classList.add('hidden');
    formNewEntry.reset();
    setEntryTrafficType('VEHICLE');
    ltr.value = 'ب';
    updatePlateTheme(modalPlateContainer, 'ب');
    document.getElementById('input-entry-date').value = Jalali.formatJalaliDate(now);
    document.getElementById('input-entry-time').value = Jalali.formatTime(now);
    modalEntry.classList.remove('hidden');
    setTimeout(() => p1.focus(), 100);
  });

  document.getElementById('btn-entry-date-today').addEventListener('click', () => {
    document.getElementById('input-entry-date').value = Jalali.formatJalaliDate(new Date());
  });
  document.getElementById('btn-entry-time-now').addEventListener('click', () => {
    document.getElementById('input-entry-time').value = Jalali.formatTime(new Date());
  });

  formNewEntry.addEventListener('submit', async (e) => {
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
        err.textContent = 'لطفاً ارقام پلاک خودرو را به‌طور کامل وارد فرمایید (۲ رقم، حرف، ۳ رقم، ۲ رقم شهر).';
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
      showToast('success', `ورود (${person}) با موفقیت ثبت شد و در حافظه تردد ذخیره گردید.`);
      await loadData();
    } catch (ex) {
      err.textContent = ex.message;
      err.classList.remove('hidden');
    }
  });

  // --- ثبت خروج ---
  async function openExitModal(id) {
    const records = await DB.getRecords();
    const record = records.find(r => r.id === id);
    if (!record) return;

    const now = new Date();
    document.getElementById('exit-record-id').value = record.id;
    document.getElementById('exit-driver-name').textContent = record.person_name;
    
    if (record.traffic_type === 'PEDESTRIAN') {
      document.getElementById('exit-plate-badge').innerHTML = '<span class="badge-pedestrian">عابر پیاده</span>';
    } else {
      document.getElementById('exit-plate-badge').innerHTML = renderPlateBadge(record.plate_part1, record.plate_letter, record.plate_part2, record.plate_city);
    }

    document.getElementById('exit-entry-time-info').textContent = `${Jalali.toPersianDigits(record.entry_jalali_date)} - ساعت ${Jalali.toPersianDigits(record.entry_time_display)}`;
    document.getElementById('input-exit-date').value = Jalali.formatJalaliDate(now);
    document.getElementById('input-exit-time').value = Jalali.formatTime(now);

    modalExit.classList.remove('hidden');
  }

  document.getElementById('btn-exit-date-today').addEventListener('click', () => {
    document.getElementById('input-exit-date').value = Jalali.formatJalaliDate(new Date());
  });
  document.getElementById('btn-exit-time-now').addEventListener('click', () => {
    document.getElementById('input-exit-time').value = Jalali.formatTime(new Date());
  });

  formRecordExit.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = Number(document.getElementById('exit-record-id').value);
    const exitDate = Jalali.toLatinDigits(document.getElementById('input-exit-date').value.trim());
    const exitTime = Jalali.toLatinDigits(document.getElementById('input-exit-time').value.trim());

    try {
      await DB.updateRecord(id, {
        status: 'EXITED',
        exit_jalali_date: exitDate,
        exit_time_display: exitTime,
        exit_time: new Date().toISOString()
      });

      modalExit.classList.add('hidden');
      showToast('success', 'خروج با موفقیت ثبت شد.');
      await loadData();
    } catch (ex) {
      showToast('error', ex.message);
    }
  });

  // --- ویرایش تردد ---
  const editStatusSelect = document.getElementById('edit-status');
  const editExitFields = document.getElementById('edit-exit-fields');
  const editTrafficType = document.getElementById('edit-traffic-type');
  const editPlateSection = document.getElementById('edit-plate-section');
  const editVehCatGroup = document.getElementById('edit-veh-cat-group');
  const editVehModelGroup = document.getElementById('edit-veh-model-group');

  editTrafficType.addEventListener('change', (e) => {
    const isPed = e.target.value === 'PEDESTRIAN';
    editPlateSection.classList.toggle('hidden', isPed);
    editVehCatGroup.classList.toggle('hidden', isPed);
    editVehModelGroup.classList.toggle('hidden', isPed);
  });

  editStatusSelect.addEventListener('change', (e) => {
    editExitFields.classList.toggle('hidden', e.target.value !== 'EXITED');
  });

  async function openEditModal(id) {
    const records = await DB.getRecords();
    const record = records.find(r => r.id === id);
    if (!record) return;

    document.getElementById('edit-record-id').value = record.id;
    document.getElementById('edit-error-msg').classList.add('hidden');
    
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

  formEditRecord.addEventListener('submit', async (e) => {
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
      showToast('success', 'تغییرات ذخیره شد.');
      await loadData();
    } catch (ex) {
      err.textContent = ex.message;
      err.classList.remove('hidden');
    }
  });

  // --- حذف تردد ---
  function openDeleteModal(id) {
    document.getElementById('delete-target-id').value = id;
    modalDeleteConfirm.classList.remove('hidden');
  }

  document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
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

  // --- مدیریت ماموران و تب‌های تنظیمات ---
  async function populateGuardsDropdowns() {
    const guards = await DB.getGuards();
    const activeId = DB.getActiveGuardId();

    selectActiveGuard.innerHTML = guards.map(g => 
      `<option value="${g.id}" ${g.id === activeId ? 'selected' : ''}>${g.name} (${g.shiftName})</option>`
    ).join('');

    selectFilterGuard.innerHTML = '<option value="ALL">همه ماموران</option>' + guards.map(g => 
      `<option value="${g.name}">${g.name}</option>`
    ).join('');

    const listContainer = document.getElementById('guards-list-container');
    listContainer.innerHTML = guards.map(g => `
      <div class="guard-item-row">
        <div>
          <strong>${g.name}</strong>
          <span style="color:var(--primary); font-size:0.72rem; margin:0 0.3rem;">[${g.shiftName}]</span>
          <span style="color:var(--text-muted); font-size:0.7rem;">(${g.shiftHours})</span>
        </div>
        <button type="button" class="btn-action-icon delete-btn" data-delete-guard="${g.id}">
          <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `).join('');

    listContainer.querySelectorAll('[data-delete-guard]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const gid = Number(e.currentTarget.getAttribute('data-delete-guard'));
        const currentList = await DB.getGuards();
        if (currentList.length <= 1) {
          showToast('error', 'حداقل یک مامور باید فعال باشد.');
          return;
        }
        await DB.deleteGuard(gid);
        await populateGuardsDropdowns();
      });
    });
  }

  function renderProfilesTab() {
    const profiles = DB.getLocalProfiles();
    const list = Object.values(profiles);
    document.getElementById('profiles-summary-info').textContent = `تعداد مراجعین ذخیره‌شده در حافظه: ${Jalali.toPersianDigits(list.length)} مورد`;

    const container = document.getElementById('profiles-list-container');
    if (list.length === 0) {
      container.innerHTML = '<div style="font-size:0.75rem; color:var(--text-muted); padding:0.5rem;">حافظه خالی است. با ثبت اولین تردد، مشخصات ذخیره می‌شود.</div>';
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

  document.getElementById('btn-clear-profiles').addEventListener('click', () => {
    DB.saveLocalProfiles({});
    renderProfilesTab();
    updateKnownNamesDatalist();
    showToast('info', 'حافظه مراجعین پاکسازی شد.');
  });

  document.getElementById('btn-open-settings').addEventListener('click', async () => {
    await populateGuardsDropdowns();
    renderProfilesTab();
    const cfg = DB.getTursoConfig();
    if (cfg) {
      document.getElementById('input-db-url').value = cfg.databaseUrl || '';
      document.getElementById('input-auth-token').value = cfg.authToken || '';
    }
    document.getElementById('db-connection-result').classList.add('hidden');
    modalSettings.classList.remove('hidden');
  });

  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const targetId = e.currentTarget.getAttribute('data-tab');
      document.getElementById('tab-guards').classList.toggle('hidden', targetId !== 'tab-guards');
      document.getElementById('tab-profiles').classList.toggle('hidden', targetId !== 'tab-profiles');
      document.getElementById('tab-cloud-db').classList.toggle('hidden', targetId !== 'tab-cloud-db');
    });
  });

  document.getElementById('btn-add-guard').addEventListener('click', async () => {
    const name = document.getElementById('new-guard-name').value.trim();
    const shift = document.getElementById('new-guard-shift').value.trim();
    const hours = document.getElementById('new-guard-hours').value.trim();

    if (!name || !shift) {
      showToast('error', 'لطفاً نام مامور و عنوان شیفت را وارد فرمایید.');
      return;
    }

    await DB.addGuard(name, shift, hours);
    document.getElementById('new-guard-name').value = '';
    document.getElementById('new-guard-shift').value = '';
    document.getElementById('new-guard-hours').value = '';
    await populateGuardsDropdowns();
    showToast('success', `مامور جدید اضافه شد.`);
  });

  // اتصال به دیتابیس ابری
  formCloudDb.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('input-db-url').value.trim();
    const token = document.getElementById('input-auth-token').value.trim();
    const resultBox = document.getElementById('db-connection-result');

    if (!url || !token) {
      resultBox.textContent = 'لطفاً آدرس دیتابیس و توکن را وارد کنید.';
      resultBox.classList.remove('hidden');
      return;
    }

    resultBox.textContent = 'در حال تست ارتباط و همگام‌سازی...';
    resultBox.className = 'form-error';
    resultBox.style.color = 'var(--primary)';
    resultBox.style.borderColor = 'var(--primary)';
    resultBox.classList.remove('hidden');

    DB.saveTursoConfig({ databaseUrl: url, authToken: token });

    try {
      await DB.initCloudTables();
      await DB.syncProfiles();
      resultBox.textContent = '✓ اتصال با موفقیت برقرار شد و جداول همگام‌سازی گردیدند.';
      resultBox.style.color = 'var(--emerald)';
      resultBox.style.borderColor = 'var(--emerald)';
      updateDbIndicator();
      showToast('success', 'اتصال به دیتابیس ابری ذخیره شد.');
      await populateGuardsDropdowns();
      await loadData();
    } catch (ex) {
      DB.clearTursoConfig();
      updateDbIndicator();
      resultBox.textContent = 'خطا در ارتباط: ' + ex.message;
      resultBox.style.color = 'var(--red)';
      resultBox.style.borderColor = 'var(--red)';
    }
  });

  document.getElementById('btn-disconnect-db').addEventListener('click', () => {
    DB.clearTursoConfig();
    document.getElementById('input-db-url').value = '';
    document.getElementById('input-auth-token').value = '';
    document.getElementById('db-connection-result').classList.add('hidden');
    updateDbIndicator();
    showToast('info', 'اتصال ابری قطع شد و داده‌ها به صورت محلی ذخیره خواهند شد.');
    loadData();
  });

  // پشتیبان‌گیری
  document.getElementById('btn-export-backup').addEventListener('click', async () => {
    const records = await DB.getRecords();
    const guards = await DB.getGuards();
    const profiles = DB.getLocalProfiles();
    const backupData = { records, guards, profiles, export_date: currentDate, timestamp: new Date().toISOString() };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `campus_guard_backup_${currentDate.replace(/\//g, '-')}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('success', 'فایل پشتیبان کامل دانلود شد.');
  });

  // راه‌اندازی اولیه
  updateDbIndicator();
  if (DB.isCloudConfigured()) {
    try {
      await DB.initCloudTables();
      await DB.syncProfiles();
    } catch (e) {
      console.warn('عدم دسترسی اولیه به سرور ابری:', e);
    }
  }
  await populateGuardsDropdowns();
  await loadData();
});