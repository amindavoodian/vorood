/**
 * sticky-notes.js
 * ماژول مدیریت یادداشت‌های چسبان، یادآور صوتی و پنجره هشدار تمام صفحه (Blur Alert)
 */

(function () {
  const toPersian = (v) => (window.Jalali && Jalali.toPersianDigits) ? Jalali.toPersianDigits(String(v ?? '')) : String(v ?? '');
  const toLatin = (v) => (window.Jalali && Jalali.toLatinDigits) ? Jalali.toLatinDigits(String(v ?? '')) : String(v ?? '');

  const StickyNotes = {
    notes: [],
    activeAlertNote: null,
    alertCheckInterval: null,
    isMobileDrawerOpen: false,

    colorThemes: {
      yellow: { name: 'کهربایی ملایم', bgClass: 'sn-color-yellow' },
      green: { name: 'سبز پاستلی', bgClass: 'sn-color-green' },
      blue: { name: 'آبی آسمانی', bgClass: 'sn-color-blue' },
      rose: { name: 'رز روشن', bgClass: 'sn-color-rose' },
      purple: { name: 'یاسی محو', bgClass: 'sn-color-purple' },
      slate: { name: 'طوسی آرام', bgClass: 'sn-color-slate' }
    },

    async init() {
      this.bindDOM();
      await this.loadNotes();
      this.startReminderChecker();
    },

    bindDOM() {
      // عناصر دسکتاپ و موبایل
      this.desktopContainer = document.getElementById('sticky-notes-list-desktop');
      this.mobileContainer = document.getElementById('sticky-notes-list-mobile');
      this.notesCountBadges = document.querySelectorAll('.sn-count-badge');

      // دکمه‌های افزودن
      document.getElementById('btn-add-note-desktop')?.addEventListener('click', () => this.openNoteFormModal());
      document.getElementById('btn-add-note-mobile')?.addEventListener('click', () => this.openNoteFormModal());

      // دکمه باز و بسته کردن کشوی موبایل
      document.getElementById('btn-open-notes-mobile')?.addEventListener('click', () => this.toggleMobileDrawer(true));
      document.getElementById('btn-close-notes-mobile')?.addEventListener('click', () => this.toggleMobileDrawer(false));

      // فرم ایجاد/ویرایش یادداشت
      this.formModal = document.getElementById('modal-sticky-note-form');
      this.noteForm = document.getElementById('form-sticky-note');
      this.noteIdInput = document.getElementById('sn-form-id');
      this.authorInput = document.getElementById('sn-form-author');
      this.contentInput = document.getElementById('sn-form-content');
      this.colorRadios = document.querySelectorAll('input[name="sn-color"]');
      this.enableReminderCheck = document.getElementById('sn-enable-reminder');
      this.reminderFieldsContainer = document.getElementById('sn-reminder-fields');
      this.reminderDateInput = document.getElementById('sn-reminder-date');
      this.reminderTimeInput = document.getElementById('sn-reminder-time');

      this.enableReminderCheck?.addEventListener('change', (e) => {
        this.reminderFieldsContainer?.classList.toggle('hidden', !e.target.checked);
        if (e.target.checked && !this.reminderDateInput.value) {
          const now = new Date();
          now.setMinutes(now.getMinutes() + 30);
          if (window.Jalali) {
            this.reminderDateInput.value = Jalali.formatJalaliDate(now);
            this.reminderTimeInput.value = Jalali.formatTime(now);
          }
        }
      });

      this.noteForm?.addEventListener('submit', (e) => this.handleSaveNote(e));

      // پنجره هشدار یادآور (Blur Modal)
      this.alertModal = document.getElementById('modal-note-alert');
      this.alertAuthorEl = document.getElementById('alert-note-author');
      this.alertContentEl = document.getElementById('alert-note-content');
      this.alertTimeEl = document.getElementById('alert-note-time');

      document.getElementById('btn-alert-snooze-5')?.addEventListener('click', () => this.handleSnooze(5));
      document.getElementById('btn-alert-snooze-15')?.addEventListener('click', () => this.handleSnooze(15));
      document.getElementById('btn-alert-dismiss')?.addEventListener('click', () => this.handleDismiss());
    },

    toggleMobileDrawer(open) {
      this.isMobileDrawerOpen = open;
      const drawer = document.getElementById('mobile-notes-drawer');
      if (drawer) {
        drawer.classList.toggle('hidden', !open);
      }
    },

    async loadNotes() {
      try {
        this.notes = window.DB ? (await window.DB.getStickyNotes()) : [];
      } catch (err) {
        this.notes = window.DB ? window.DB.getLocalNotes() : [];
      }
      this.render();
    },

    render() {
      const activeCount = this.notes.length;
      this.notesCountBadges.forEach(b => {
        b.textContent = toPersian(activeCount);
        b.classList.toggle('hidden', activeCount === 0);
      });

      const renderHtml = this.notes.map(note => this.generateNoteCardHtml(note)).join('');
      const emptyHtml = `
        <div class="sn-empty-placeholder">
          <svg class="svg-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <span>هیچ یادداشت یا پیام هماهنگی ثبت نشده است.</span>
        </div>
      `;

      if (this.desktopContainer) {
        this.desktopContainer.innerHTML = activeCount > 0 ? renderHtml : emptyHtml;
      }
      if (this.mobileContainer) {
        this.mobileContainer.innerHTML = activeCount > 0 ? renderHtml : emptyHtml;
      }

      this.attachNoteActionListeners();
    },

    generateNoteCardHtml(note) {
      const colorCls = this.colorThemes[note.color]?.bgClass || 'sn-color-yellow';
      const hasReminder = !!note.reminderDatetime && !note.isDismissed;
      const reminderDisplay = note.reminderJalali ? toPersian(note.reminderJalali) : '';

      return `
        <div class="sticky-note-card ${colorCls}" data-note-id="${note.id}">
          <div class="sn-card-header">
            <div class="sn-author-info">
              <svg class="svg-icon sn-pin-icon" viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
              <span class="sn-author-name">${note.authorName || 'مامور شیفت'}</span>
            </div>
            <div class="sn-card-actions">
              <button type="button" class="btn-sn-action" data-edit="${note.id}" title="ویرایش">
                <svg class="svg-icon" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button type="button" class="btn-sn-action btn-sn-delete" data-delete="${note.id}" title="حذف">
                <svg class="svg-icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
          <div class="sn-card-body">
            <p class="sn-content-text">${this.escapeHtml(note.content)}</p>
          </div>
          <div class="sn-card-footer">
            ${hasReminder ? `
              <div class="sn-reminder-badge" title="یادآوری فعال">
                <svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>${reminderDisplay}</span>
              </div>
            ` : '<span class="sn-date-tag">' + toPersian(window.Jalali ? Jalali.getHumanReadable(note.createdAt ? note.createdAt.slice(0, 10) : '') : '') + '</span>'}
          </div>
        </div>
      `;
    },

    attachNoteActionListeners() {
      document.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = e.currentTarget.getAttribute('data-edit');
          this.openNoteFormModal(id);
        });
      });

      document.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = e.currentTarget.getAttribute('data-delete');
          if (confirm('آیا از حذف این یادداشت اطمینان دارید؟')) {
            await window.DB.deleteStickyNote(id);
            await this.loadNotes();
          }
        });
      });
    },

    openNoteFormModal(noteId = null) {
      const activeUser = window.DB ? window.DB.getCurrentUser() : null;
      document.getElementById('sn-form-error')?.classList.add('hidden');

      if (noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;
        this.noteIdInput.value = note.id;
        this.authorInput.value = note.authorName || '';
        this.contentInput.value = note.content || '';
        
        const radio = document.querySelector(`input[name="sn-color"][value="${note.color}"]`);
        if (radio) radio.checked = true;

        if (note.reminderDatetime && !note.isDismissed) {
          this.enableReminderCheck.checked = true;
          this.reminderFieldsContainer.classList.remove('hidden');
          const [datePart, timePart] = (note.reminderJalali || '').split(' ');
          this.reminderDateInput.value = datePart || '';
          this.reminderTimeInput.value = timePart || '';
        } else {
          this.enableReminderCheck.checked = false;
          this.reminderFieldsContainer.classList.add('hidden');
        }
        document.getElementById('sn-modal-title').textContent = 'ویرایش یادداشت';
      } else {
        this.noteIdInput.value = '';
        this.authorInput.value = activeUser ? activeUser.name : 'مامور انتظامات';
        this.contentInput.value = '';
        document.querySelector('input[name="sn-color"][value="yellow"]').checked = true;
        this.enableReminderCheck.checked = false;
        this.reminderFieldsContainer.classList.add('hidden');
        this.reminderDateInput.value = '';
        this.reminderTimeInput.value = '';
        document.getElementById('sn-modal-title').textContent = 'ثبت یادداشت چسبان جدید';
      }

      this.formModal.classList.remove('hidden');
      setTimeout(() => this.contentInput.focus(), 150);
    },

    async handleSaveNote(e) {
      e.preventDefault();
      const content = this.contentInput.value.trim();
      const author = this.authorInput.value.trim() || 'مامور شیفت';
      const id = this.noteIdInput.value;
      const selectedColor = document.querySelector('input[name="sn-color"]:checked')?.value || 'yellow';
      const isReminderEnabled = this.enableReminderCheck.checked;

      if (!content) {
        const err = document.getElementById('sn-form-error');
        err.textContent = 'لطفاً متن یادداشت را وارد فرمایید.';
        err.classList.remove('hidden');
        return;
      }

      let reminderIso = null;
      let reminderJalaliStr = null;

      if (isReminderEnabled) {
        const rDate = toLatin(this.reminderDateInput.value.trim());
        const rTime = toLatin(this.reminderTimeInput.value.trim());
        if (!rDate || !rTime) {
          const err = document.getElementById('sn-form-error');
          err.textContent = 'جهت فعال‌سازی هشدار، وارد کردن تاریخ و ساعت الزامی است.';
          err.classList.remove('hidden');
          return;
        }

        reminderJalaliStr = `${rDate} ${rTime}`;
        if (window.Jalali && Jalali.toGregorian) {
          const [jy, jm, jd] = rDate.split('/').map(Number);
          const [gY, gM, gD] = Jalali.toGregorian(jy, jm, jd);
          const [hour, min] = rTime.split(':').map(Number);
          const dt = new Date(gY, gM - 1, gD, hour, min, 0);
          reminderIso = dt.toISOString();
        }
      }

      await window.DB.saveStickyNote({
        id: id || undefined,
        authorName: author,
        content: content,
        color: selectedColor,
        reminderDatetime: reminderIso,
        reminderJalali: reminderJalaliStr,
        isDismissed: false,
        snoozedUntil: null
      });

      this.formModal.classList.add('hidden');
      await this.loadNotes();
    },

    startReminderChecker() {
      if (this.alertCheckInterval) clearInterval(this.alertCheckInterval);
      // بررسی دوره‌ای هشدارها هر ۱۰ ثانیه
      this.alertCheckInterval = setInterval(() => this.checkPendingReminders(), 10000);
      this.checkPendingReminders();
    },

    checkPendingReminders() {
      if (this.activeAlertNote) return; // هشداری روی صفحه باز است
      const now = new Date();

      for (const note of this.notes) {
        if (!note.reminderDatetime || note.isDismissed) continue;

        const reminderTime = new Date(note.reminderDatetime);
        const snoozedTime = note.snoozedUntil ? new Date(note.snoozedUntil) : null;

        const isDue = reminderTime <= now;
        const isSnoozeExpired = !snoozedTime || snoozedTime <= now;

        if (isDue && isSnoozeExpired) {
          this.triggerAlert(note);
          break;
        }
      }
    },

    triggerAlert(note) {
      this.activeAlertNote = note;
      this.alertAuthorEl.textContent = note.authorName || 'مامور انتظامات';
      this.alertContentEl.textContent = note.content;
      this.alertTimeEl.textContent = note.reminderJalali ? toPersian(note.reminderJalali) : 'هم‌اکنون';

      this.playChimeSound();
      this.alertModal.classList.remove('hidden');
    },

    playChimeSound() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // نغمه C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 0.38);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 0.42);
        });
      } catch (e) {}
    },

    async handleSnooze(minutes) {
      if (!this.activeAlertNote) return;
      const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      await window.DB.updateNoteAlertStatus(this.activeAlertNote.id, {
        isDismissed: false,
        snoozedUntil: snoozeUntil
      });

      this.alertModal.classList.add('hidden');
      this.activeAlertNote = null;
      await this.loadNotes();
    },

    async handleDismiss() {
      if (!this.activeAlertNote) return;
      await window.DB.updateNoteAlertStatus(this.activeAlertNote.id, {
        isDismissed: true,
        snoozedUntil: null
      });

      this.alertModal.classList.add('hidden');
      this.activeAlertNote = null;
      await this.loadNotes();
    },

    escapeHtml(str) {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
    }
  };

  window.StickyNotes = StickyNotes;
})();
