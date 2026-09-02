/**
 * export-utils.js
 * ماژول تخصصی استخراج داده‌ها و ایجاد فایل‌های گزارش CSV سازگار با اکسل (فارسی UTF-8 BOM)
 */

(function () {
  const ExportUtils = {
    /**
     * محاسبه مدت زمان حضور بر اساس زمان و تاریخ ورود و خروج
     */
    calculateDuration(entryDate, entryTime, exitDate, exitTime) {
      if (!exitTime || !exitDate) return 'در حال حضور';
      
      const eTime = Jalali.toLatinDigits(entryTime || '').trim();
      const xTime = Jalali.toLatinDigits(exitTime || '').trim();
      const eDate = Jalali.toLatinDigits(entryDate || '').trim();
      const xDate = Jalali.toLatinDigits(exitDate || '').trim();

      const [eH, eM] = eTime.split(':').map(Number);
      const [xH, xM] = xTime.split(':').map(Number);

      if (isNaN(eH) || isNaN(eM) || isNaN(xH) || isNaN(xM)) return 'نامشخص';

      const entryMinutes = eH * 60 + eM;
      const exitMinutes = xH * 60 + xM;

      if (eDate === xDate) {
        let diff = exitMinutes - entryMinutes;
        if (diff < 0) diff += 24 * 60; // تردد بعد از نیمه‌شب
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        if (hours === 0) return `${Jalali.toPersianDigits(mins)} دقیقه`;
        return `${Jalali.toPersianDigits(hours)} ساعت و ${Jalali.toPersianDigits(mins)} دقیقه`;
      }

      return 'بیش از یک روز';
    },

    /**
     * ایمن‌سازی سلول‌های CSV در برابر کاما، کوتیشن و خطوط جدید
     */
    escapeCsvCell(value) {
      if (value === null || value === undefined) return '""';
      let str = String(value).trim();
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    },

    /**
     * تولید و دانلود فایل گزارش CSV ترددها بر اساس فیلترهای جاری
     */
    exportRecordsToCsv(records, appliedFilterSummary = '') {
      if (!records || records.length === 0) {
        throw new Error('هیچ رکوردی برای استخراج خروجی وجود ندارد.');
      }

      const headers = [
        'ردیف',
        'نحوه تردد',
        'نوع مراجع',
        'نام و نام خانوادگی',
        'شماره پلاک / شناسه',
        'دسته خودرو',
        'مدل و مشخصه خودرو',
        'تاریخ ورود',
        'ساعت ورود',
        'تاریخ خروج',
        'ساعت خروج',
        'مدت حضور در پردیس',
        'وضعیت حضور',
        'مامور ثبت ورود',
        'شیفت ورود',
        'مامور ثبت خروج',
        'شیفت خروج',
        'علت مراجعه / هماهنگ‌کننده / مقصد'
      ];

      const csvRows = [];

      // سطر هدر ستون‌ها
      csvRows.push(headers.map(this.escapeCsvCell).join(','));

      // سطرهای داده
      records.forEach((r, index) => {
        const isPedestrian = r.traffic_type === 'PEDESTRIAN';
        const personCatLabel = window.PlateUtils 
          ? PlateUtils.getPersonCategoryLabel(r.person_category) 
          : (r.person_category || 'ارباب‌رجوع');

        let plateStr = 'عابر پیاده';
        if (!isPedestrian) {
          plateStr = r.plate_full || (r.plate_part1 ? `${r.plate_part1} ${r.plate_letter} ${r.plate_part2} ایران ${r.plate_city}` : 'فاقد پلاک');
        }

        const duration = this.calculateDuration(
          r.entry_jalali_date,
          r.entry_time_display,
          r.exit_jalali_date,
          r.exit_time_display
        );

        const statusLabel = r.status === 'ACTIVE' ? 'حاضر در دانشگاه' : 'خارج شده';

        const row = [
          index + 1,
          isPedestrian ? 'عابر پیاده' : 'با خودرو',
          personCatLabel,
          r.person_name || '—',
          plateStr,
          isPedestrian ? 'بدون خودرو' : (r.vehicle_category || 'سواری'),
          isPedestrian ? '—' : (r.vehicle_model || '—'),
          r.entry_jalali_date || '—',
          r.entry_time_display || '—',
          r.exit_jalali_date || '—',
          r.exit_time_display || '—',
          duration,
          statusLabel,
          r.entry_guard_name || r.guard_name || 'مامور کشیک',
          r.entry_guard_shift || r.guard_shift || '—',
          r.exit_guard_name || '—',
          r.exit_guard_shift || '—',
          r.notes || '—'
        ];

        csvRows.push(row.map(this.escapeCsvCell).join(','));
      });

      // اضافه کردن کاراکتر BOM برای نمایش بدون نقص حروف فارسی در اکسل
      const csvContent = '\uFEFF' + csvRows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const now = new Date();
      const dateStr = window.Jalali ? Jalali.formatJalaliDate(now).replace(/\//g, '-') : 'report';
      const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
      const fileName = `traffic_report_${dateStr}_${timeStr}.csv`;

      // ایجاد لینک دانلود در مرورگر
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return {
        count: records.length,
        fileName: fileName
      };
    }
  };

  window.ExportUtils = ExportUtils;
})();
