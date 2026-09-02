/**
 * plate-utils.js
 * ماژول کمکی مدیریت، اعتبارسنجی، تم‌های رنگی و بج‌های پلاک ملی و دسته‌بندی مراجعین
 */

(function () {
  const PlateUtils = {
    /**
     * تعیین کلاس تم رنگی پلاک بر اساس حرف
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
     * به‌روزرسانی آنی کلاس تم روی کانتینر ورودی پلاک
     */
    updatePlateTheme(containerEl, letter) {
      if (!containerEl) return;
      const themeClass = this.getPlateThemeClass(letter);
      const isSearch = containerEl.classList.contains('is-search');
      containerEl.className = `iran-plate-input ${isSearch ? 'is-search ' : ''}${themeClass}`;
    },

    /**
     * رندر HTML بج پلاک ملی با پس‌زمینه هماهنگ و استاندارد
     */
    renderPlateBadge(p1Val, ltrVal, p2Val, cityVal) {
      if (!p1Val && !p2Val) {
        return '<span style="color:var(--text-muted); font-size:0.75rem;">—</span>';
      }

      const letter = ltrVal || 'ب';
      const themeClass = this.getPlateThemeClass(letter);
      const ltrDisplay = letter === 'معلولین' ? '♿' : letter;
      const part1 = Jalali ? Jalali.toPersianDigits(p1Val || '') : (p1Val || '');
      const part2 = Jalali ? Jalali.toPersianDigits(p2Val || '') : (p2Val || '');
      const city = Jalali ? Jalali.toPersianDigits(cityVal || '') : (cityVal || '');

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
     * تولید رشته متن تمیز و کامل پلاک جهت ذخیره‌سازی یا خروجی گزارش
     */
    formatPlateFull(p1, ltr, p2, city) {
      if (!p1 || !p2 || !city) return '';
      return `${p1} ${ltr} ${p2} ایران ${city}`;
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
     * تنظیم خودکار تبدیل ارقام به فارسی و پرش به فیلد بعدی پلاک
     */
    setupPlateInputAutoConvert(inputEl, maxLen, nextEl, autoFillCallback) {
      if (!inputEl) return;
      inputEl.addEventListener('input', (e) => {
        if (window.Jalali && Jalali.cleanToPersianDigits) {
          e.target.value = Jalali.cleanToPersianDigits(e.target.value, maxLen);
        } else {
          e.target.value = e.target.value.replace(/[^\d]/g, '').slice(0, maxLen);
        }
        if (e.target.value.length === maxLen && nextEl) {
          nextEl.focus();
        }
        if (typeof autoFillCallback === 'function') {
          autoFillCallback();
        }
      });
    }
  };

  window.PlateUtils = PlateUtils;
})();
