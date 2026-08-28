<div align="center">

# 🛡️ سامانه جامع ثبت و کنترل هوشمند تردد پردیس
### CampusGuard Traffic & Access Control System

*سامانه‌ای سبک، مستقل (Zero-Dependency) و ابری جهت ثبت، پایش و مدیریت ورود و خروج در پردیس‌های دانشگاهی*

<br/>

[![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla%20ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Database](https://img.shields.io/badge/Database-Turso%20%2F%20LibSQL-059669?style=flat-square&logo=sqlite&logoColor=white)](https://turso.tech)
[![Calendar](https://img.shields.io/badge/Calendar-Native%20Jalali-d97706?style=flat-square)](jalali.js)
[![UI](https://img.shields.io/badge/Design-Responsive%20Adaptive-2563eb?style=flat-square)](styles.css)
[![License](https://img.shields.io/badge/License-MIT-0f172a?style=flat-square)](LICENSE)

</div>

---

<div dir="rtl">

## 🌟 درباره سامانه

نرم‌افزار **CampusGuard** سامانه‌ای مدرن، سریع و بهینه‌سازی‌شده برای گیت‌های حراست و انتظامات دانشگاه‌ها و سازمان‌ها است. 

این سیستم با رابط کاربری اختصاصی برای ثبت انواع **پلاک‌های ملی ایران** و تردد **عابرین پیاده** پیاده‌سازی شده و با معماری داده دوگانه (**دیتابیس ابری Turso + حافظه محلی مرورگر**)، عملکردی پایدار و بدون وقفه را حتی در زمان قطعی کامل اینترنت تضمین می‌کند.

---

## ✨ قابلیت‌های کلیدی سامانه

* 🚗 **پلاک استاندارد ملی با تم‌های هوشمند:** تغییر لحظه‌ای رنگ و استایل پلاک بر اساس نوع خودرو (پلاک شخصی، عمومی/تاکسی، نظامی، دولتی، ارتش، دیپلماتیک و معلولین).
* ⚡ **دیتابیس ابری هیبریدی (Turso / LibSQL):** ارتباط فوق‌العاده سریع از طریق Pipeline HTTP بدون نیاز به هیچ کتابخانه یا SDK سنگین جانبی.
* 📴 **پایداری کامل در حالت آفلاین:** ذخیره خودکار داده‌ها در `localStorage` در صورت قطع شبکه و همگام‌سازی پس از اتصال مجدد.
* 🧠 **تکمیل خودکار هوشمند (Auto-Fill):** فراخوانی سریع مشخصات مراجعین دائمی تنها با وارد کردن پلاک یا نام شخص.
* 📅 **موتور محاسباتی تقویم جلالی:** تبدیل سریع و دقیق تاریخ‌های شمسی و میلادی بدون وابستگی به کتابخانه‌های سنگین خارجی.
* ⏱️ **فیلترهای پیشرفته بر اساس شیفت:** شیفت صبح (`۰۶:۰۰` تا `۱۴:۰۰`)، عصر (`۱۴:۰۰` تا `۲۲:۰۰`)، شب (`۲۲:۰۰` تا `۰۶:۰۰`) و بازه زمانی سفارشی.
* 📱 **رابط کاربری واکنش‌گرا و دوگانه:** جدول تجمیعی برای دسکتاپ و ساختار کارتی لمسی (Card View) به همراه دکمه شناور (FAB) برای موبایل و تبلت.
* 👮 **مدیریت شیفت و ماموران انتظامات:** امکان تعریف لیست نگهبانان و انتساب خودکار به ترددها.

---

## 📐 ساختار فایل‌ها

</div>

```text
campus-guard/
├── index.html       # رابط کاربری اصلی و فرم‌های ثبت/ویرایش
├── styles.css       # سیستم استایل واکنش‌گرا، متغیرها و تم‌های پلاک
├── jalali.js        # هسته محاسباتی تقویم هجری شمسی و ارقام فارسی
├── db.js            # لایه داده هیبریدی (Turso LibSQL + LocalStorage)
└── app.js           # منطق کنترلر، رویدادها، تکمیل خودکار و رندر UI
<div dir="rtl">
🚀 راهنمای نصب و راه‌اندازی
این پروژه بدون نیاز به بیلد یا پکیج‌منیجر اجرا می‌شود:
۱. دریافت فایل‌های پروژه
code
Bash
git clone https://github.com/your-username/campus-guard.git
cd campus-guard
۲. اجرا در مرورگر
کافی است فایل index.html را با هر مرورگری باز کنید، یا با وب‌سرورهای سبک اجرا نمایید:
code
Bash
# با پایتون
python3 -m http.server 8080

# یا با Node.js
npx serve .
۳. اتصال به دیتابیس ابری Turso (اختیاری)
در سایت Turso.tech یک دیتابیس رایگان بسازید.
در منوی برنامه، دکمه تنظیمات را باز کرده و به تب دیتابیس ابری بروید.
مقادیر Database URL و Auth Token را وارد کرده و ذخیره نمایید.
🗄️ ساختار پایگاه داده (SQL Schema)
</div>
code
SQL
-- جدول ثبت ترددها
CREATE TABLE IF NOT EXISTS campus_records (
  id INTEGER PRIMARY KEY,
  traffic_type TEXT,            -- 'VEHICLE' | 'PEDESTRIAN'
  person_category TEXT,         -- 'STAFF' | 'FACULTY' | 'STUDENT' | 'GUEST' | 'CONTRACTOR'
  person_name TEXT,
  plate_part1 TEXT,
  plate_letter TEXT,
  plate_part2 TEXT,
  plate_city TEXT,
  plate_full TEXT,
  vehicle_category TEXT,
  vehicle_model TEXT,
  status TEXT,                  -- 'ACTIVE' | 'EXITED'
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

-- جدول ماموران حراست
CREATE TABLE IF NOT EXISTS campus_guards (
  id INTEGER PRIMARY KEY,
  name TEXT,
  shift_name TEXT,
  shift_hours TEXT
);

-- جدول مراجعین دائمی (حافظه تکمیل خودکار)
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
<div dir="rtl">
🎨 راهنمای تم‌های پلاک ملی ایران
نوع پلاک	کلاس CSS	حروف تحت پوشش	مشخصه ظاهری
شخصی	plate-theme-white	ب تا ی	پس‌زمینه سفید، حروف و ارقام مشکی
تاکسی و عمومی	plate-theme-yellow	ت, ع, ک	پس‌زمینه زرد، حروف و ارقام مشکی
پلیس و نیروهای مسلح	plate-theme-green	پ, ث, ز, ف	پس‌زمینه سبز، حروف و ارقام سفید
دولتی و تشریفات	plate-theme-red	الف, تشریفات	پس‌زمینه قرمز، حروف و ارقام سفید
ارتش	plate-theme-navy	ش	پس‌زمینه سرمه‌ای، حروف و ارقام سفید
سفارت و دیپلماتیک	plate-theme-lightblue	D, S	پس‌زمینه آبی روشن، حروف و ارقام سفید
معلولین و جانبازان	plate-theme-white	♿	پس‌زمینه سفید به همراه نشان ویلچر
🛡️ مجوز (License)
این پروژه تحت مجوز MIT License منتشر شده است. استفاده و توسعه آن برای مقاصد دانشگاهی، سازمانی و شخصی کاملاً آزاد است.
</div>
