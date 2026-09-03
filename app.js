/* ==========================================================================
   下部温泉旅行 Web旅しおり - Application Logic (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  initTabs();
  initThemeToggle();
  initChecklist();
  fetchLiveWeather();
});

/* 1. Countdown Timer (Target: 2026-09-05 07:00:00 JST) */
function initCountdown() {
  const targetDate = new Date('2026-09-05T07:00:00+09:00').getTime();
  const countdownEl = document.getElementById('countdown-text');

  if (!countdownEl) return;

  function update() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      countdownEl.textContent = '🎉 旅行当日です！楽しんできてください！';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    countdownEl.textContent = `出発まで あと ${days}日 ${hours}時間 ${minutes}分`;
  }

  update();
  setInterval(update, 60000);
}

/* 2. Tab Navigation System */
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.style.display = 'none');

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.style.display = 'block';
      }
    });
  });
}

/* 3. Dark/Light Theme Toggle */
function initThemeToggle() {
  const themeBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('shimobe_theme') || 'light';

  document.documentElement.setAttribute('data-theme', savedTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('shimobe_theme', next);
      showToast(next === 'dark' ? '🌙 ダークモードに切替えました' : '☀️ ライトモードに切替えました');
    });
  }
}

/* 4. Interactive Checklist with LocalStorage */
const DEFAULT_CHECKLIST = [
  { id: 'c1', category: '貴重品・必需品', text: '運転免許証（相手・自分）', checked: false },
  { id: 'c2', category: '貴重品・必需品', text: '現金（宿代 ¥53,100 現地決済用 ＋ 交通費・食費）', checked: false },
  { id: 'c3', category: '貴重品・必需品', text: 'クレジットカード・ETCカード', checked: false },
  { id: 'c4', category: '貴重品・必需品', text: 'スマホ・充電器・モバイルバッテリー', checked: false },
  { id: 'c5', category: '着替え・温泉グッズ', text: '着替え（1泊2日分）', checked: false },
  { id: 'c6', category: '着替え・温泉グッズ', text: 'タオル・手ぬぐい（温泉めぐり用）', checked: false },
  { id: 'c7', category: '着替え・温泉グッズ', text: '洗面用具・スキンケア・常備薬', checked: false },
  { id: 'c8', category: 'ドライブ・アミューズメント', text: '車内用プレイリスト / 音楽アプリ', checked: false },
  { id: 'c9', category: 'ドライブ・アミューズメント', text: '飲み物・車内おやつ', checked: false },
  { id: 'c10', category: 'ドライブ・アミューズメント', text: 'カメラ・車酔い止め薬', checked: false }
];

function initChecklist() {
  const container = document.getElementById('checklist-groups');
  const progressBar = document.getElementById('progress-bar-fill');
  const progressText = document.getElementById('progress-text');
  const addForm = document.getElementById('add-item-form');
  const inputEl = document.getElementById('custom-item-input');

  let items = loadChecklist();

  function saveChecklist() {
    localStorage.setItem('shimobe_checklist', JSON.stringify(items));
    render();
  }

  function loadChecklist() {
    const saved = localStorage.getItem('shimobe_checklist');
    return saved ? JSON.parse(saved) : DEFAULT_CHECKLIST;
  }

  function render() {
    if (!container) return;
    container.innerHTML = '';

    // Group items by category
    const groups = {};
    items.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });

    let total = items.length;
    let checkedCount = items.filter(i => i.checked).length;

    // Update Progress
    const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${checkedCount} / ${total} 完了 (${percent}%)`;

    // Render Groups
    Object.keys(groups).forEach(cat => {
      const groupEl = document.createElement('div');
      groupEl.className = 'checklist-group';

      const catTitle = document.createElement('div');
      catTitle.className = 'checklist-group-title';
      catTitle.innerHTML = `<span>📌</span> ${cat}`;
      groupEl.appendChild(catTitle);

      groups[cat].forEach(item => {
        const itemEl = document.createElement('label');
        itemEl.className = `checklist-item ${item.checked ? 'checked' : ''}`;
        
        itemEl.innerHTML = `
          <input type="checkbox" class="checklist-checkbox" ${item.checked ? 'checked' : ''} data-id="${item.id}">
          <span class="checklist-label">${escapeHtml(item.text)}</span>
        `;

        const checkbox = itemEl.querySelector('input');
        checkbox.addEventListener('change', (e) => {
          item.checked = e.target.checked;
          saveChecklist();
          if (item.checked) showToast(`✅ "${item.text}" をチェックしました`);
        });

        groupEl.appendChild(itemEl);
      });

      container.appendChild(groupEl);
    });
  }

  if (addForm && inputEl) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = inputEl.value.trim();
      if (!val) return;

      const newItem = {
        id: 'c_' + Date.now(),
        category: 'カスタム持ち物',
        text: val,
        checked: false
      };

      items.push(newItem);
      inputEl.value = '';
      saveChecklist();
      showToast(`➕ "${val}" を追加しました`);
    });
  }

  render();
}

/* 5. Utility Toast Notification */
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

/* 6. Live Weather API Fetcher (Open-Meteo API) */
async function fetchLiveWeather() {
  try {
    // 身延町 (下部温泉): 35.361, 138.455 / 富士河口湖町: 35.498, 138.756
    const resShimobe = await fetch('https://api.open-meteo.com/v1/forecast?latitude=35.361&longitude=138.455&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo');
    const resFuji = await fetch('https://api.open-meteo.com/v1/forecast?latitude=35.498&longitude=138.756&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo');

    if (resShimobe.ok && resFuji.ok) {
      const dataShimobe = await resShimobe.json();
      const dataFuji = await resFuji.json();

      updateWeatherGrid('weather-shimobe-grid', dataShimobe.daily);
      updateWeatherGrid('weather-fuji-grid', dataFuji.daily);
    }
  } catch (e) {
    console.log('Weather API offline or using fallback defaults:', e);
  }
}

function updateWeatherGrid(gridId, dailyData) {
  const grid = document.getElementById(gridId);
  if (!grid || !dailyData || !dailyData.time) return;

  // Find index for 2026-09-05 & 2026-09-06 if present, else first 2 available forecast days
  const idxDay1 = dailyData.time.findIndex(t => t.includes('2026-09-05'));
  const idxDay2 = dailyData.time.findIndex(t => t.includes('2026-09-06'));

  const i1 = idxDay1 !== -1 ? idxDay1 : 0;
  const i2 = idxDay2 !== -1 ? idxDay2 : 1;

  if (dailyData.temperature_2m_max[i1] !== undefined) {
    grid.innerHTML = `
      <div class="weather-day-box">
        <div class="weather-date-label">9/5 (土) DAY 1</div>
        <div class="weather-icon-temp">
          <span class="weather-icon-img">${getWeatherIcon(dailyData.weathercode[i1])}</span>
          <div class="weather-temp-range">
            <span class="temp-max">${Math.round(dailyData.temperature_2m_max[i1])}℃</span> / <span class="temp-min">${Math.round(dailyData.temperature_2m_min[i1])}℃</span>
          </div>
        </div>
        <div class="weather-desc-text">${getWeatherDesc(dailyData.weathercode[i1])}</div>
      </div>

      <div class="weather-day-box">
        <div class="weather-date-label">9/6 (日) DAY 2</div>
        <div class="weather-icon-temp">
          <span class="weather-icon-img">${getWeatherIcon(dailyData.weathercode[i2])}</span>
          <div class="weather-temp-range">
            <span class="temp-max">${Math.round(dailyData.temperature_2m_max[i2])}℃</span> / <span class="temp-min">${Math.round(dailyData.temperature_2m_min[i2])}℃</span>
          </div>
        </div>
        <div class="weather-desc-text">${getWeatherDesc(dailyData.weathercode[i2])}</div>
      </div>
    `;
  }
}

function getWeatherIcon(code) {
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95) return '🌩️';
  return '⛅';
}

function getWeatherDesc(code) {
  if (code === 0) return '快晴';
  if (code === 1 || code === 2) return '晴れ時々曇り';
  if (code === 3) return '曇り';
  if (code >= 51 && code <= 67) return '雨';
  if (code >= 80 && code <= 82) return 'にわか雨';
  if (code >= 95) return '雷雨';
  return '晴れ/曇り';
}
