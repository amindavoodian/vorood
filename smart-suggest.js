/**
 * smart-suggest.js
 * موتور هوشمند پیش‌بینی، حدس و تکمیل خودکار فیلدهای تردد بر اساس سوابق پیشین
 * پشتیبانی کامل از خودرو، موتورسیکلت و عابر پیاده
 */

(function () {
  const toLatin = (v) => (window.Jalali && Jalali.toLatinDigits) ? Jalali.toLatinDigits(String(v ?? '')) : String(v ?? '');
  const toPersian = (v) => (window.Jalali && Jalali.toPersianDigits) ? Jalali.toPersianDigits(String(v ?? '')) : String(v ?? '');

  const cleanNormalize = (str) => {
    return toLatin(str || '')
      .toLowerCase()
      .replace(/[\u064A\u0649]/g, 'ی') // تبدیل ي عربی به ی فارسی
      .replace(/\u0643/g, 'ک')         // تبدیل ك عربی به ک فارسی
      .replace(/\s+/g, ' ')
      .trim();
  };

  const SmartSuggest = {
    activePopupEl: null,
    currentMatches: [],
    lastAppliedBackup: null,

    /**
     * استخراج و تجمیع کلیه مراجعین یکتا از تاریخچه ترددها و بانک پروفایل‌ها
     */
    async collectHistoryCandidates() {
      const candidatesMap = new Map();
      const DB = window.DB;
      if (!DB) return [];

      let records = [];
      try {
        records = await DB.getRecords();
      } catch {
        records = DB.getLocalRecords ? DB.getLocalRecords() : [];
      }

      const profiles = DB.getLocalProfiles ? DB.getLocalProfiles() : {};

      // ۱. ثبت سوابق از رکوردهای تردد ثبت‌شده
      records.forEach((r) => {
        const isPed = r.traffic_type === 'PEDESTRIAN';
        const isMotor = r.traffic_type === 'MOTORCYCLE' || r.vehicle_category === 'موتورسیکلت';

        let key = '';
        if (isPed) {
          key = `PED_${cleanNormalize(r.person_name)}`;
        } else if (isMotor) {
          key = `MTR_${toLatin(r.plate_part1)}_${toLatin(r.plate_part2)}`;
        } else {
          key = `VEH_${toLatin(r.plate_part1)}_${r.plate_letter}_${toLatin(r.plate_part2)}_${toLatin(r.plate_city)}`;
        }

        if (!candidatesMap.has(key)) {
          candidatesMap.set(key, {
            key,
            trafficType: isPed ? 'PEDESTRIAN' : (isMotor ? 'MOTORCYCLE' : 'VEHICLE'),
            personName: r.person_name || '',
            personCategory: r.person_category || 'GUEST',
            platePart1: r.plate_part1 || '',
            plateLetter: r.plate_letter || 'ب',
            platePart2: r.plate_part2 || '',
            plateCity: r.plate_city || '',
            plateFull: r.plate_full || '',
            vehicleCategory: r.vehicle_category || (isMotor ? 'موتورسیکلت' : 'سواری'),
            vehicleModel: r.vehicle_model || '',
            notes: r.notes || '',
            lastDate: r.entry_jalali_date || '',
            lastTime: r.entry_time_display || '',
            timestamp: r.created_at ? new Date(r.created_at).getTime() : (r.id || 0)
          });
        }
      });

      // ۲. ترکیب با بانک پروفایل‌های ذخیره‌شده
      Object.values(profiles).forEach((p) => {
        const isPed = p.trafficType === 'PEDESTRIAN';
        const isMotor = p.trafficType === 'MOTORCYCLE' || p.vehicleCategory === 'موتورسیکلت';

        let key = '';
        if (isPed) {
          key = `PED_${cleanNormalize(p.personName)}`;
        } else if (isMotor) {
          key = `MTR_${toLatin(p.platePart1)}_${toLatin(p.platePart2)}`;
        } else {
          key = `VEH_${toLatin(p.platePart1)}_${p.plateLetter}_${toLatin(p.platePart2)}_${toLatin(p.plateCity)}`;
        }

        if (!candidatesMap.has(key)) {
          candidatesMap.set(key, {
            key,
            trafficType: isPed ? 'PEDESTRIAN' : (isMotor ? 'MOTORCYCLE' : 'VEHICLE'),
            personName: p.personName || '',
            personCategory: p.personCategory || 'GUEST',
            platePart1: p.platePart1 || '',
            plateLetter: p.plateLetter || 'ب',
            platePart2: p.platePart2 || '',
            plateCity: p.plateCity || '',
            plateFull: p.plateFull || '',
            vehicleCategory: p.vehicleCategory || (isMotor ? 'موتورسیکلت' : 'سواری'),
            vehicleModel: p.vehicleModel || '',
            notes: p.defaultNotes || '',
            lastDate: '',
            lastTime: '',
            timestamp: 0
          });
        }
      });

      return Array.from(candidatesMap.values());
    },

    /**
     * جستجوی هوشمند در کاندیداها بر اساس ورودی‌های نام یا پلاک
     */
    async searchCandidates(params) {
      const candidates = await this.collectHistoryCandidates();
      const { type, nameQuery, p1, ltr, p2, city } = params;

      // جستجو با نام
      if (type === 'NAME') {
        const q = cleanNormalize(nameQuery);
        if (!q || q.length < 2) return [];

        return candidates
          .filter((c) => cleanNormalize(c.personName).includes(q))
          .sort((a, b) => {
            const aName = cleanNormalize(a.personName);
            const bName = cleanNormalize(b.personName);
            if (aName.startsWith(q) && !bName.startsWith(q)) return -1;
            if (!aName.startsWith(q) && bName.startsWith(q)) return 1;
            return b.timestamp - a.timestamp;
          })
          .slice(0, 4);
      }

      // جستجوی پلاک موتورسیکلت
      if (type === 'MOTORCYCLE') {
        const topDigits = toLatin(p1 || '').trim();
        const bottomDigits = toLatin(p2 || '').trim();

        if (!topDigits && !bottomDigits) return [];

        const scored = [];
        candidates.forEach((c) => {
          if (c.trafficType !== 'MOTORCYCLE' && c.vehicleCategory !== 'موتورسیکلت') return;

          const itemTop = toLatin(c.platePart1 || '');
          const itemBottom = toLatin(c.platePart2 || '');

          let score = 0;
          let match = false;

          if (topDigits) {
            if (itemTop === topDigits) { score += 40; match = true; }
            else if (itemTop.startsWith(topDigits)) { score += 20; match = true; }
            else return;
          }

          if (bottomDigits) {
            if (itemBottom === bottomDigits) { score += 50; match = true; }
            else if (itemBottom.includes(bottomDigits)) { score += 25; match = true; }
            else if (!topDigits) return;
          }

          if (match) {
            scored.push({ item: c, score: score + (c.timestamp ? 5 : 0) });
          }
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.map((s) => s.item).slice(0, 4);
      }

      // جستجوی پلاک خودرو
      if (type === 'PLATE') {
        const cP1 = toLatin(p1 || '').trim();
        const cP2 = toLatin(p2 || '').trim();
        const cCity = toLatin(city || '').trim();
        const cLtr = ltr && ltr !== 'ALL' ? ltr.trim() : '';

        const hasAnyInput = cP1.length > 0 || cP2.length > 0 || cCity.length > 0;
        if (!hasAnyInput) return [];

        const scored = [];
        candidates.forEach((c) => {
          if (c.trafficType === 'PEDESTRIAN' || c.trafficType === 'MOTORCYCLE') return;

          const itemP1 = toLatin(c.platePart1);
          const itemP2 = toLatin(c.platePart2);
          const itemCity = toLatin(c.plateCity);
          const itemLtr = c.plateLetter;

          let score = 0;
          let matchCount = 0;

          if (cP1) {
            if (itemP1 === cP1) { score += 40; matchCount++; }
            else if (itemP1.startsWith(cP1)) { score += 20; matchCount++; }
            else return;
          }

          if (cP2) {
            if (itemP2 === cP2) { score += 40; matchCount++; }
            else if (itemP2.includes(cP2)) { score += 25; matchCount++; }
            else if (cP1.length === 0) { score += 10; matchCount++; }
            else return;
          }

          if (cCity) {
            if (itemCity === cCity) { score += 20; matchCount++; }
            else if (itemCity.startsWith(cCity)) { score += 10; matchCount++; }
            else if (cP1.length === 0 && cP2.length === 0) { score += 5; matchCount++; }
            else return;
          }

          if (cLtr && itemLtr === cLtr) {
            score += 15;
          }

          if (matchCount > 0) {
            scored.push({ item: c, score: score + (c.timestamp ? 5 : 0) });
          }
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.map((s) => s.item).slice(0, 4);
      }

      return [];
    },

    /**
     * نمایش پنجره شناور پیشنهادها
     */
    showSuggestionBox(matches, anchorEl, onSelect) {
      this.hideSuggestionBox();
      if (!matches || matches.length === 0 || !anchorEl) return;

      this.currentMatches = matches;
      const box = document.createElement('div');
      box.className = 'smart-suggest-popup';
      box.id = 'smart-suggest-popup';

      let itemsHtml = matches.map((m, idx) => {
        const isPed = m.trafficType === 'PEDESTRIAN';
        const plateBadge = window.PlateUtils ? PlateUtils.renderTrafficBadge(m) : '';
        const catBadge = window.PlateUtils ? PlateUtils.renderPersonCategoryBadge(m.personCategory) : '';
        const vehInfo = isPed ? '' : `${m.vehicleCategory || 'سواری'} ${m.vehicleModel ? `(${m.vehicleModel})` : ''}`;
        const lastSeen = m.lastDate ? `آخرین تردد: ${toPersian(m.lastDate)} ساعت ${toPersian(m.lastTime)}` : 'شناخته‌شده در سیستم';

        return `
          <div class="suggest-item ${idx === 0 ? 'is-selected' : ''}" data-idx="${idx}">
            <div class="suggest-item-top">
              <div class="suggest-item-name-group">
                <span class="suggest-item-name">${m.personName}</span>
                ${catBadge}
              </div>
              <div class="suggest-item-plate">${plateBadge}</div>
            </div>
            <div class="suggest-item-middle">
              ${vehInfo ? `<span class="suggest-item-veh">${vehInfo}</span>` : ''}
              ${m.notes ? `<span class="suggest-item-notes">علت پیشین: ${m.notes}</span>` : ''}
            </div>
            <div class="suggest-item-footer">
              <span class="suggest-item-lastseen">${lastSeen}</span>
              <button type="button" class="btn-apply-suggestion" data-btn-idx="${idx}">
                <span>تکمیل خودکار</span>
                <kbd>↵</kbd>
              </button>
            </div>
          </div>
        `;
      }).join('');

      box.innerHTML = `
        <div class="suggest-box-header">
          <div class="suggest-box-title">
            <svg class="svg-icon" style="color:var(--primary);" viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            <span>پیشنهاد هوشمند (سوابق پیشین)</span>
          </div>
          <button type="button" class="suggest-box-close" id="btn-close-suggest" title="رد پیشنهاد (Esc)">&times;</button>
        </div>
        <div class="suggest-items-container">${itemsHtml}</div>
      `;

      const parentFormGroup = anchorEl.closest('.form-group') || anchorEl.parentElement;
      parentFormGroup.style.position = 'relative';
      parentFormGroup.appendChild(box);
      this.activePopupEl = box;

      box.querySelector('#btn-close-suggest')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideSuggestionBox();
      });

      box.querySelectorAll('.suggest-item').forEach((el) => {
        el.addEventListener('click', () => {
          const idx = Number(el.getAttribute('data-idx'));
          if (matches[idx]) onSelect(matches[idx]);
          this.hideSuggestionBox();
        });
      });
    },

    hideSuggestionBox() {
      if (this.activePopupEl) {
        this.activePopupEl.remove();
        this.activePopupEl = null;
      }
      this.currentMatches = [];
    }
  };

  window.SmartSuggest = SmartSuggest;
})();
