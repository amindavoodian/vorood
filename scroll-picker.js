(function () {
  const toPersian = (v) => (window.Jalali && Jalali.toPersianDigits) ? Jalali.toPersianDigits(String(v ?? '')) : String(v ?? '');
  const toLatin = (v) => (window.Jalali && Jalali.toLatinDigits) ? Jalali.toLatinDigits(String(v ?? '')) : String(v ?? '');
  const pad = (n) => String(n).padStart(2, '0');

  const MONTH_NAMES = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  class ScrollPickerEngine {
    constructor() {
      this.activeInput = null;
      this.currentMode = 'DATE'; // 'DATE' | 'TIME'
      this.modalEl = null;
      this.initDOM();
    }

    initDOM() {
      if (document.getElementById('scroll-picker-modal')) {
        this.modalEl = document.getElementById('scroll-picker-modal');
        return;
      }

      const modal = document.createElement('div');
      modal.id = 'scroll-picker-modal';
      modal.className = 'scroll-picker-backdrop hidden';
      modal.innerHTML = `
        <div class="scroll-picker-sheet">
          <div class="sp-header">
            <button type="button" class="sp-btn-cancel" id="sp-btn-cancel">انصراف</button>
            <div class="sp-title" id="sp-title">انتخاب چرخشی</div>
            <button type="button" class="sp-btn-confirm" id="sp-btn-confirm">تأیید</button>
          </div>

          <div class="sp-quick-bar" id="sp-quick-bar"></div>

          <div class="sp-wheels-wrapper">
            <div class="sp-highlight-bar"></div>
            <div class="sp-columns-container" id="sp-columns-container"></div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.modalEl = modal;

      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.close();
      });

      document.getElementById('sp-btn-cancel')?.addEventListener('click', () => this.close());
      document.getElementById('sp-btn-confirm')?.addEventListener('click', () => this.confirmSelection());

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.modalEl.classList.contains('hidden')) {
          this.close();
        }
      });
    }

    attach(inputEl, mode = 'DATE') {
      if (!inputEl) return;
      inputEl.setAttribute('readonly', 'readonly');
      inputEl.style.cursor = 'pointer';
      inputEl.classList.add('sp-interactive-input');

      const openFn = (e) => {
        e.preventDefault();
        inputEl.blur();
        this.open(inputEl, mode);
      };

      inputEl.addEventListener('click', openFn);
      inputEl.addEventListener('focus', openFn);
    }

    open(inputEl, mode) {
      this.activeInput = inputEl;
      this.currentMode = mode;
      const titleEl = document.getElementById('sp-title');
      const quickBar = document.getElementById('sp-quick-bar');

      if (mode === 'DATE') {
        titleEl.textContent = 'انتخاب تاریخ (اسکرول چرخشی)';
        this.renderDateQuickBar(quickBar);
        this.buildDateWheels();
      } else {
        titleEl.textContent = 'انتخاب زمان (اسکرول چرخشی)';
        this.renderTimeQuickBar(quickBar);
        this.buildTimeWheels();
      }

      this.modalEl.classList.remove('hidden');
    }

    close() {
      if (this.modalEl) {
        this.modalEl.classList.add('hidden');
      }
      this.activeInput = null;
    }

    renderDateQuickBar(container) {
      container.innerHTML = `
        <button type="button" class="sp-quick-btn" data-date-preset="today">امروز</button>
        <button type="button" class="sp-quick-btn" data-date-preset="yesterday">دیروز</button>
        <button type="button" class="sp-quick-btn" data-date-preset="tomorrow">فردا</button>
      `;

      container.querySelectorAll('[data-date-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const type = btn.getAttribute('data-date-preset');
          const now = new Date();
          let target = now;
          if (type === 'yesterday') target.setDate(now.getDate() - 1);
          if (type === 'tomorrow') target.setDate(now.getDate() + 1);

          if (window.Jalali) {
            const jStr = Jalali.formatJalaliDate(target);
            this.setDateWheels(jStr);
          }
        });
      });
    }

    renderTimeQuickBar(container) {
      container.innerHTML = `
        <button type="button" class="sp-quick-btn" data-time-preset="now">هم‌اکنون</button>
        <button type="button" class="sp-quick-btn" data-time-preset="plus15">+۱۵ دقیقه</button>
        <button type="button" class="sp-quick-btn" data-time-preset="plus30">+۳۰ دقیقه</button>
        <button type="button" class="sp-quick-btn" data-time-preset="shift-morning">۰۸:۰۰</button>
        <button type="button" class="sp-quick-btn" data-time-preset="shift-evening">۱۴:۰۰</button>
      `;

      container.querySelectorAll('[data-time-preset]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const preset = btn.getAttribute('data-time-preset');
          const now = new Date();
          if (preset === 'now') {
            this.setTimeWheels(now.getHours(), now.getMinutes());
          } else if (preset === 'plus15') {
            now.setMinutes(now.getMinutes() + 15);
            this.setTimeWheels(now.getHours(), now.getMinutes());
          } else if (preset === 'plus30') {
            now.setMinutes(now.getMinutes() + 30);
            this.setTimeWheels(now.getHours(), now.getMinutes());
          } else if (preset === 'shift-morning') {
            this.setTimeWheels(8, 0);
          } else if (preset === 'shift-evening') {
            this.setTimeWheels(14, 0);
          }
        });
      });
    }

    buildDateWheels() {
      const container = document.getElementById('sp-columns-container');
      const val = toLatin(this.activeInput?.value || '');
      let [initY, initM, initD] = val.split(/[\/\-]/).map(Number);

      const now = new Date();
      let currentJalali = [1405, 1, 1];
      if (window.Jalali) {
        currentJalali = Jalali.formatJalaliDate(now).split('/').map(Number);
      }

      const year = initY || currentJalali[0];
      const month = initM || currentJalali[1];
      const day = initD || currentJalali[2];

      container.innerHTML = `
        <div class="sp-col" id="sp-col-day">
          <div class="sp-col-title">روز</div>
          <div class="sp-wheel" id="wheel-day"></div>
        </div>
        <div class="sp-col" id="sp-col-month">
          <div class="sp-col-title">ماه</div>
          <div class="sp-wheel" id="wheel-month"></div>
        </div>
        <div class="sp-col" id="sp-col-year">
          <div class="sp-col-title">سال</div>
          <div class="sp-wheel" id="wheel-year"></div>
        </div>
      `;

      const years = [];
      for (let y = 1400; y <= 1412; y++) years.push(y);
      this.populateWheel('wheel-year', years.map((y) => ({ val: y, label: toPersian(y) })), year);

      const months = MONTH_NAMES.map((name, idx) => ({ val: idx + 1, label: `${toPersian(idx + 1)} - ${name}` }));
      this.populateWheel('wheel-month', months, month);

      this.updateDayWheel(year, month, day);

      const onMonthOrYearChange = () => {
        const curY = this.getSelectedValue('wheel-year');
        const curM = this.getSelectedValue('wheel-month');
        const curD = this.getSelectedValue('wheel-day');
        this.updateDayWheel(curY, curM, curD);
      };

      document.getElementById('wheel-year')?.addEventListener('scroll', () => {
        clearTimeout(this.yTimer);
        this.yTimer = setTimeout(onMonthOrYearChange, 120);
      });
      document.getElementById('wheel-month')?.addEventListener('scroll', () => {
        clearTimeout(this.mTimer);
        this.mTimer = setTimeout(onMonthOrYearChange, 120);
      });
    }

    updateDayWheel(year, month, selectDay = 1) {
      let maxDays = 31;
      if (month > 6 && month <= 11) maxDays = 30;
      else if (month === 12) maxDays = 29;

      const days = [];
      for (let d = 1; d <= maxDays; d++) {
        days.push({ val: d, label: toPersian(pad(d)) });
      }
      this.populateWheel('wheel-day', days, Math.min(selectDay, maxDays));
    }

    buildTimeWheels() {
      const container = document.getElementById('sp-columns-container');
      const val = toLatin(this.activeInput?.value || '');
      let [initH, initM] = val.split(':').map(Number);

      const now = new Date();
      const hour = !isNaN(initH) ? initH : now.getHours();
      const min = !isNaN(initM) ? initM : now.getMinutes();

      container.innerHTML = `
        <div class="sp-col">
          <div class="sp-col-title">دقیقه</div>
          <div class="sp-wheel" id="wheel-minute"></div>
        </div>
        <div class="sp-col-separator">:</div>
        <div class="sp-col">
          <div class="sp-col-title">ساعت</div>
          <div class="sp-wheel" id="wheel-hour"></div>
        </div>
      `;

      const hours = [];
      for (let h = 0; h < 24; h++) hours.push({ val: h, label: toPersian(pad(h)) });
      this.populateWheel('wheel-hour', hours, hour);

      const minutes = [];
      for (let m = 0; m < 60; m++) minutes.push({ val: m, label: toPersian(pad(m)) });
      this.populateWheel('wheel-minute', minutes, min);
    }

    populateWheel(wheelId, items, selectedVal) {
      const wheel = document.getElementById(wheelId);
      if (!wheel) return;

      const itemHeight = 40;
      let html = '<div class="sp-spacer"></div>';
      items.forEach((item) => {
        html += `<div class="sp-item" data-val="${item.val}">${item.label}</div>`;
      });
      html += '<div class="sp-spacer"></div>';
      wheel.innerHTML = html;

      const targetIdx = items.findIndex((i) => i.val === selectedVal);
      if (targetIdx !== -1) {
        setTimeout(() => {
          wheel.scrollTop = targetIdx * itemHeight;
        }, 30);
      }

      wheel.querySelectorAll('.sp-item').forEach((el, index) => {
        el.addEventListener('click', () => {
          wheel.scrollTo({ top: index * itemHeight, behavior: 'smooth' });
        });
      });
    }

    getSelectedValue(wheelId) {
      const wheel = document.getElementById(wheelId);
      if (!wheel) return 0;
      const itemHeight = 40;
      const index = Math.round(wheel.scrollTop / itemHeight);
      const items = wheel.querySelectorAll('.sp-item');
      if (items[index]) {
        return Number(items[index].getAttribute('data-val'));
      }
      return 0;
    }

    setDateWheels(jalaliStr) {
      const parts = toLatin(jalaliStr).split(/[\/\-]/).map(Number);
      if (parts.length === 3) {
        const [y, m, d] = parts;
        const years = [];
        for (let i = 1400; i <= 1412; i++) years.push(i);
        this.populateWheel('wheel-year', years.map((i) => ({ val: i, label: toPersian(i) })), y);
        this.populateWheel('wheel-month', MONTH_NAMES.map((n, i) => ({ val: i + 1, label: `${toPersian(i + 1)} - ${n}` })), m);
        this.updateDayWheel(y, m, d);
      }
    }

    setTimeWheels(h, m) {
      const hours = [];
      for (let i = 0; i < 24; i++) hours.push({ val: i, label: toPersian(pad(i)) });
      const minutes = [];
      for (let i = 0; i < 60; i++) minutes.push({ val: i, label: toPersian(pad(i)) });

      this.populateWheel('wheel-hour', hours, h);
      this.populateWheel('wheel-minute', minutes, m);
    }

    confirmSelection() {
      if (!this.activeInput) return;

      if (this.currentMode === 'DATE') {
        const y = this.getSelectedValue('wheel-year');
        const m = this.getSelectedValue('wheel-month');
        const d = this.getSelectedValue('wheel-day');
        const formatted = `${y}/${pad(m)}/${pad(d)}`;
        this.activeInput.value = toPersian(formatted);
      } else {
        const h = this.getSelectedValue('wheel-hour');
        const m = this.getSelectedValue('wheel-minute');
        const formatted = `${pad(h)}:${pad(m)}`;
        this.activeInput.value = toPersian(formatted);
      }

      this.activeInput.dispatchEvent(new Event('input', { bubbles: true }));
      this.activeInput.dispatchEvent(new Event('change', { bubbles: true }));

      this.close();
    }
  }

  window.ScrollPicker = new ScrollPickerEngine();
})();
