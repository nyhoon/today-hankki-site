const months = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
];
const seasons = [
  '겨울', '겨울', '봄', '봄', '봄', '여름',
  '여름', '여름', '가을', '가을', '가을', '겨울',
];
const pageMonth = new URLSearchParams(location.search).get('month');
let selectedMonth = Number(pageMonth) >= 1 && Number(pageMonth) <= 12
  ? Number(pageMonth)
  : new Date().getMonth() + 1;
let selectedCategory = 'all';
let searchTerm = '';
let seasonalData = [];

const monthNav = document.getElementById('seasonal-months');
const cards = document.getElementById('seasonal-cards');
const status = document.getElementById('seasonal-count');
const error = document.getElementById('seasonal-error');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function renderMonthNavigation() {
  monthNav.innerHTML = months.map((label, index) => {
    const month = index + 1;
    return `<button type="button" data-month="${month}" aria-pressed="${month === selectedMonth}">${label}</button>`;
  }).join('');
  monthNav.querySelector(`[data-month="${selectedMonth}"]`)?.scrollIntoView({
    block: 'nearest', inline: 'center', behavior: 'auto',
  });
}

function renderCurrentMonth() {
  const current = seasonalData[selectedMonth - 1];
  document.getElementById('seasonal-year').textContent = 'MONTHLY GUIDE';
  document.getElementById('seasonal-season').textContent = seasons[selectedMonth - 1];
  document.getElementById('seasonal-month-number').textContent = String(selectedMonth).padStart(2, '0');
  document.getElementById('seasonal-month-label').textContent = `${selectedMonth}월 · ${seasons[selectedMonth - 1]}`;
  document.getElementById('seasonal-month-title').textContent = current.title;
  document.getElementById('seasonal-month-lead').textContent = current.lead;
  document.getElementById('seasonal-heading').textContent = `${selectedMonth}월 제철 재료`;
  document.getElementById('seasonal-sources-list').innerHTML = current.sources.map((source) => `
    <li><span>${escapeHtml(source.label)} · ${escapeHtml(source.date)}</span>
      <a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.title)} <span aria-hidden="true">↗</span></a>
    </li>`).join('');
  renderMonthNavigation();
  renderCards();
  history.replaceState(null, '', `${location.pathname}?month=${selectedMonth}`);
}

function renderCards() {
  const current = seasonalData[selectedMonth - 1];
  const visibleItems = current.items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = !searchTerm || `${item.name} ${item.note} ${item.use}`.toLocaleLowerCase('ko').includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  status.textContent = `${visibleItems.length}개 재료`;
  cards.setAttribute('aria-busy', 'false');
  cards.innerHTML = visibleItems.length
    ? visibleItems.map((item, index) => {
      const source = current.sources[item.sourceIndex];
      const kind = item.category === 'produce' ? '농산물' : '수산물';
      return `<article class="seasonal-card seasonal-card-${item.category}">
        <div class="seasonal-card-top"><span>${kind}</span><span>${String(index + 1).padStart(2, '0')}</span></div>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.note)}</p>
        <div class="seasonal-use"><span>이렇게 활용해요</span><strong>${escapeHtml(item.use)}</strong></div>
        <a class="seasonal-card-source" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label)} 자료 보기 <span aria-hidden="true">↗</span></a>
      </article>`;
    }).join('')
    : '<p class="seasonal-status seasonal-empty">검색한 재료가 없어요. 다른 이름으로 찾아보세요.</p>';
}

function selectMonth(month) {
  selectedMonth = month < 1 ? 12 : month > 12 ? 1 : month;
  renderCurrentMonth();
}

async function start() {
  try {
    const response = await fetch('seasonal-data.json');
    if (!response.ok) throw new Error('seasonal data unavailable');
    seasonalData = await response.json();
    if (!Array.isArray(seasonalData) || seasonalData.length !== 12) throw new Error('invalid seasonal data');
    renderCurrentMonth();
    error.hidden = true;
  } catch {
    cards.innerHTML = '';
    cards.setAttribute('aria-busy', 'false');
    error.hidden = false;
  }
}

monthNav.addEventListener('click', (event) => {
  const button = event.target.closest('[data-month]');
  if (button) selectMonth(Number(button.dataset.month));
});
document.getElementById('previous-month').addEventListener('click', () => selectMonth(selectedMonth - 1));
document.getElementById('next-month').addEventListener('click', () => selectMonth(selectedMonth + 1));
document.querySelector('.seasonal-filters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  selectedCategory = button.dataset.category;
  document.querySelectorAll('.seasonal-filters [data-category]').forEach((item) => {
    item.setAttribute('aria-pressed', String(item === button));
  });
  renderCards();
});
document.getElementById('seasonal-search').addEventListener('input', (event) => {
  searchTerm = event.target.value.trim().toLocaleLowerCase('ko');
  renderCards();
});

start();
