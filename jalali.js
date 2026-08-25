/**
 * Jalali Calendar & Persian Digit Utilities
 */
const Jalali = {
  digits: ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'],
  months: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],

  toPersianDigits(n) {
    if (n === null || n === undefined) return '';
    return String(n).replace(/\d/g, (d) => this.digits[parseInt(d, 10)]);
  },

  toLatinDigits(str) {
    if (!str) return '';
    const map = {
      '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
      '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'
    };
    return String(str).replace(/[۰-۹٠-٩]/g, (c) => map[c] || c);
  },

  cleanToPersianDigits(str, maxLen) {
    if (!str) return '';
    let latin = this.toLatinDigits(str).replace(/\D/g, '');
    if (maxLen) latin = latin.slice(0, maxLen);
    return this.toPersianDigits(latin);
  },

  gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = (gy <= 1600) ? 0 : 979;
    gy -= (gy <= 1600) ? 621 : 1600;
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    jy += Math.floor((days - 1) / 365);
    if (days > 0) days = (days - 1) % 365;
    let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    let jd = (days < 186) ? 1 + (days % 31) : 1 + ((days - 186) % 30);
    return [jy, jm, jd];
  },

  jalaliToGregorian(jy, jm, jd) {
    let gy = (jy <= 979) ? 621 : 1600;
    jy -= (jy <= 979) ? 0 : 979;
    let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    gy += 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) { gy += 100 * Math.floor(--days / 36524); days %= 36524; if (days >= 365) days++; }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    gy += Math.floor((days - 1) / 365);
    if (days > 0) days = (days - 1) % 365;
    const g_d_m = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) g_d_m[2] = 29;
    let gm = 0;
    while (gm < 12 && days >= g_d_m[gm + 1]) { days -= g_d_m[gm + 1]; gm++; }
    return [gy, gm + 1, days + 1];
  },

  formatJalaliDate(date = new Date()) {
    const [jy, jm, jd] = this.gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${jy}/${pad(jm)}/${pad(jd)}`;
  },

  formatTime(date = new Date()) {
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },

  shiftJalaliDate(str, days) {
    const norm = this.toLatinDigits(str);
    const p = norm.split('/').map(Number);
    if (p.length < 3 || isNaN(p[0])) return this.formatJalaliDate();
    const [gy, gm, gd] = this.jalaliToGregorian(p[0], p[1], p[2]);
    const d = new Date(gy, gm - 1, gd);
    d.setDate(d.getDate() + days);
    return this.formatJalaliDate(d);
  },

  getHumanReadable(str) {
    const norm = this.toLatinDigits(str);
    const p = norm.split('/').map(Number);
    if (p.length < 3 || isNaN(p[0])) return str;
    return `${this.toPersianDigits(p[2])} ${this.months[p[1] - 1] || ''} ${this.toPersianDigits(p[0])}`;
  },

  isWithinLastDays(jalaliDateStr, daysCount) {
    const norm = this.toLatinDigits(jalaliDateStr);
    const p = norm.split('/').map(Number);
    if (p.length < 3) return false;
    const [gy, gm, gd] = this.jalaliToGregorian(p[0], p[1], p[2]);
    const entryTime = new Date(gy, gm - 1, gd).getTime();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = (startOfDay - entryTime) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays < daysCount;
  }
};

window.Jalali = Jalali;