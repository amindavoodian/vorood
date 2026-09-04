/**
 * plate-utils.js
 * ماژول تخصصی مدیریت، اعتبارسنجی، تم‌های رنگی و بج‌های پلاک ملی خودرو و موتورسیکلت
 */

(function () {
  const toPersian = (v) => (window.Jalali && typeof Jalali.toPersianDigits === 'function') ? Jalali.toPersianDigits(String(v ?? '')) : String(v ?? '');
  const toLatin = (v) => (window.Jalali && typeof Jalali.toLatinDigits === 'function') ? Jalali.toLatinDigits(String(v ?? '')) : String(v ?? '');

  const PlateUtils = {
    /**
     * تعیین کلاس تم رنگی پلاک بر اساس حرف (برای خودرو)
     */
    getPlateThemeClass(letter) {
      switch (letter) {
        case 'ت':
        case 'ع':
        case 'ک':
          return 'plate-theme-yellow'; // زرد: تاکسی، عمومی و کشاورزی
        case 'پ':
        case 'ث':
        case 'ز':
        case 'ف':
          return 'plate-theme-green';  // سبز: پلیس، سپاه، وزارت دفاع و ستاد کل
        case 'الف':
        case 'تشریفات':
          return 'plate-theme-red';    // قرمز: دولتی و تشریفات
        case 'ش':
          return 'plate-theme-navy';   // سورمه‌ای: ارتش
        case 'D':
        case 'S':
          return 'plate-theme-lightblue'; // آبی روشن: دیپلماتیک و سفارت
        default:
          return 'plate-theme-white';  // سفید: شخصی و سایر
      }
    },

    /**
     * به‌روزرسانی آنی کلاس تم روی کانتینر ورودی پلاک خودرو
     */
    updatePlateTheme(containerEl, letter) {
      if (!containerEl) return;
      const themeClass = this.getPlateThemeClass(letter);
      const isSearch = containerEl.classList.contains('is-search');
      containerEl.className = `iran-plate-input ${isSearch ? 'is-search ' : ''}${themeClass}`;
    },

    /**
     * رندر HTML بج پلاک ملی خودرو
     */
    renderPlateBadge(p1Val, ltrVal, p2Val, cityVal) {
      if (!p1Val && !p2Val) {
        return '<span style="color:var(--text-faint); font-size:0.75rem;">—</span>';
      }

      const letter = ltrVal || 'ب';
      const themeClass = this.getPlateThemeClass(letter);
      const ltrDisplay = letter === 'معلولین' ? '♿' : letter;
      const part1 = toPersian(p1Val || '');
      const part2 = toPersian(p2Val || '');
      const city = toPersian(cityVal || '');

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
            <span>${part1}</span>
            <span class="plate-letter-tag">${ltrDisplay}</span>
            <span>${part2}</span>
          </div>
          <div class="plate-city-box">
            <span class="plate-iran-tag">ایران</span>
            <span>${city}</span>
          </div>
        </div>
      `;
    },

    /**
     * رندر HTML پلاک ملی موتورسیکلت (۲ ردیفه استاندارد بر اساس تصویر ارسال‌شده)
     * ردیف بالا: ۳ رقم کد منطقه + نوار آبی و پرچم
     * ردیف پایین: ۵ رقم شماره انتظامی
     */
    renderMotorcyclePlateBadge(topDigits, bottomDigits) {
      if (!topDigits && !bottomDigits) {
        return '<span style="color:var(--text-faint); font-size:0.75rem;">—</span>';
      }

      const topStr = toPersian(topDigits || '');
      const bottomStr = toPersian(bottomDigits || '');

      return `
        <div class="iran-motor-badge" title="پلاک موتورسیکلت: ${topStr} - ${bottomStr}">
          <div class="motor-badge-top-row">
            <div class="motor-badge-blue-strip">
              <div class="motor-badge-flag">
                <span class="flag-green"></span>
                <span class="flag-white"></span>
                <span class="flag-red"></span>
              </div>
            </div>
            <span class="motor-badge-top-digits">${topStr}</span>
          </div>
          <div class="motor-badge-bottom-row">
            <span class="motor-badge-bottom-digits">${bottomStr}</span>
          </div>
        </div>
      `;
    },

    /**
     * رندر یکپارچه مشخصه تردد (خودرو، موتورسیکلت یا عابر پیاده)
     */
    renderTrafficBadge(record) {
      if (!record) return '<span style="color:var(--text-faint); font-size:0.75rem;">—</span>';

      const type = record.traffic_type || (record.trafficType);
      if (type === 'PEDESTRIAN') {
        return '<span class="badge-pedestrian"><img src="walking.svg" class="svg-icon-img" alt="عابر" /> عابر پیاده</span>';
      }

      if (type === 'MOTORCYCLE' || record.vehicle_category === 'موتورسیکلت' || record.vehicleCategory === 'موتورسیکلت') {
        const p1 = record.plate_part1 ?? record.platePart1;
        const p2 = record.plate_part2 ?? record.platePart2;
        return this.renderMotorcyclePlateBadge(p1, p2);
      }

      const p1 = record.plate_part1 ?? record.platePart1;
      const ltr = record.plate_letter ?? record.plateLetter;
      const p2 = record.plate_part2 ?? record.platePart2;
      const city = record.plate_city ?? record.plateCity;
      return this.renderPlateBadge(p1, ltr, p2, city);
    },

    /**
     * تولید متن تمیز پلاک خودرو جهت دیتابیس یا اکسل
     */
    formatPlateFull(p1, ltr, p2, city) {
      if (!p1 || !p2 || !city) return '';
      return `${p1} ${ltr} ${p2} ایران ${city}`;
    },

    /**
     * تولید متن تمیز پلاک موتورسیکلت جهت دیتابیس یا اکسل
     */
    formatMotorPlateFull(top3, bottom5) {
      if (!top3 || !bottom5) return '';
      return `موتور ${top3} - ${bottom5}`;
    },

    /**
     * رندر بج دسته‌بندی مراجعین
     */
    renderPersonCategoryBadge(category) {
      switch (category) {
        case 'STAFF':
          return '<span class="badge-person badge-person-staff">پرسنل</span>';
        case 'FACULTY':
          return '<span class="badge-person badge-person-faculty">هیئت علمی</span>';
        case 'STUDENT':
          return '<span class="badge-person badge-person-student">دانشجو</span>';
        case 'CONTRACTOR':
          return '<span class="badge-person badge-person-contractor">پیمانکار</span>';
        case 'GUEST':
        default:
          return '<span class="badge-person badge-person-guest">ارباب‌رجوع</span>';
      }
    },

    /**
     * برگرداندن نام فارسی دسته مراجع
     */
    getPersonCategoryLabel(category) {
      switch (category) {
        case 'STAFF': return 'کارمند / پرسنل';
        case 'FACULTY': return 'استاد / هیئت علمی';
        case 'STUDENT': return 'دانشجو';
        case 'CONTRACTOR': return 'پیمانکار / خدمات';
        case 'GUEST': default: return 'ارباب‌رجوع / مهمان';
      }
    },

    /**
     * تنظیم خودکار تبدیل ارقام به فارسی و پرش به فیلد بعدی (برای پلاک خودرو)
     */
    setupPlateInputAutoConvert(inputEl, maxLen, nextEl, autoFillCallback) {
      if (!inputEl) return;
      inputEl.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^\d۰-۹]/g, '');
        if (window.Jalali && typeof Jalali.cleanToPersianDigits === 'function') {
          val = Jalali.cleanToPersianDigits(val, maxLen);
        } else {
          val = toPersian(val.slice(0, maxLen));
        }
        e.target.value = val;

        if (val.length === maxLen && nextEl) {
          nextEl.focus();
        }
        if (typeof autoFillCallback === 'function') {
          autoFillCallback();
        }
      });
    },

    /**
     * تنظیم خودکار ورودی‌های ۲ ردیفه پلاک موتورسیکلت (۳ رقم بالا و ۵ رقم پایین)
     */
    setupMotorInputAutoConvert(topInputEl, bottomInputEl, autoFillCallback) {
      if (!topInputEl || !bottomInputEl) return;

      topInputEl.addEventListener('input', (e) => {
        let val = toPersian(e.target.value.replace(/[^\d۰-۹]/g, '').slice(0, 3));
        e.target.value = val;
        if (val.length === 3) {
          bottomInputEl.focus();
        }
        if (typeof autoFillCallback === 'function') autoFillCallback();
      });

      bottomInputEl.addEventListener('input', (e) => {
        let val = toPersian(e.target.value.replace(/[^\d۰-۹]/g, '').slice(0, 5));
        e.target.value = val;
        if (typeof autoFillCallback === 'function') autoFillCallback();
      });
    }
  };

  window.PlateUtils = PlateUtils;
})();
