const db = window.supabase.createClient(
  'https://vnauldcdzgbhwdhsnyub.supabase.co',
  'sb_publishable_2Vn37T_maDEEx2aODezSfA_YxLZQm1z',
  { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } },
);

const byId = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const status = (message) => { byId('status').textContent = message; };

async function login() {
  status('Google 로그인으로 이동 중이에요…');
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: new URL('admin.html', location.href).href },
  });
  if (error) status(`로그인을 시작하지 못했어요: ${error.message}`);
}

function requestReason(title, message, confirmation = null, durationHours = null) {
  const dialog = byId('confirm-dialog');
  const input = byId('confirm-reason');
  const submit = byId('confirm-submit');
  const nameWrap = byId('confirm-name-wrap');
  const nameInput = byId('confirm-name');
  const durationWrap = byId('confirm-duration-wrap');
  const durationInput = byId('confirm-duration');
  byId('confirm-title').textContent = title;
  byId('confirm-message').textContent = message;
  input.value = '';
  nameInput.value = '';
  nameWrap.hidden = !confirmation;
  durationInput.value = durationHours ?? '';
  durationWrap.hidden = durationHours === null;
  submit.disabled = true;
  const onInput = () => {
    submit.disabled = input.value.trim().length < 3 || (confirmation !== null && nameInput.value !== confirmation) || (durationHours !== null && (!Number.isInteger(Number(durationInput.value)) || Number(durationInput.value) < 1 || Number(durationInput.value) > 8760));
  };
  input.addEventListener('input', onInput);
  nameInput.addEventListener('input', onInput);
  durationInput.addEventListener('input', onInput);
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => {
      input.removeEventListener('input', onInput);
      nameInput.removeEventListener('input', onInput);
      durationInput.removeEventListener('input', onInput);
      const valid = dialog.returnValue === 'confirm' && input.value.trim().length >= 3 && (confirmation === null || nameInput.value === confirmation) && (durationHours === null || (Number.isInteger(Number(durationInput.value)) && Number(durationInput.value) >= 1 && Number(durationInput.value) <= 8760));
      resolve(valid ? { reason: input.value.trim(), confirmation: nameInput.value, durationHours: durationHours === null ? null : Number(durationInput.value) } : null);
    }, { once: true });
    dialog.showModal();
    input.focus();
  });
}

async function moderate(id, decision) {
  const result = await requestReason('레시피 상태 변경', `${decision === 'published' ? '게시를 승인' : decision === 'rejected' ? '게시를 반려' : '레시피를 숨김'}합니다. 운영 기록에 남길 사유를 입력해 주세요.`);
  if (!result) return;
  status('처리 중이에요…');
  const { error } = await db.rpc('operator_moderate_community_recipe', {
    p_recipe_id: id,
    p_decision: decision,
    p_reason: result.reason,
  });
  if (error) return status(`처리하지 못했어요: ${error.message}`);
  await loadDashboard();
  status(decision === 'published' ? '게시를 승인했습니다.' : '레시피를 반려했습니다.');
}

async function resolveReport(id, hide) {
  const result = await requestReason('신고 처리', `${hide ? '신고된 콘텐츠를 숨김 처리' : '신고를 기각'}합니다. 처리 사유를 입력해 주세요.`);
  if (!result) return;
  const { error } = await db.rpc('operator_resolve_community_report', {
    p_report_id: id,
    p_outcome: hide ? 'content_hidden' : 'dismissed',
    p_reason: result.reason,
  });
  if (error) return status(`신고를 처리하지 못했어요: ${error.message}`);
  await loadDashboard();
  status('신고를 처리했습니다.');
}

function recipeCard(recipe) {
  return `<article class="review-card">
    <div><span class="status-tag">게시 대기</span><h3>${escapeHtml(recipe.title)}</h3><p>${escapeHtml(recipe.summary)}</p><small>${escapeHtml(recipe.author ?? '한끼유저')} · ${recipe.minutes}분 · ${recipe.servings}인분</small></div>
    <div class="review-actions"><button data-recipe="${recipe.id}" data-decision="published">승인</button><button class="danger-button" data-recipe="${recipe.id}" data-decision="rejected">반려</button></div>
  </article>`;
}

function reportCard(report) {
  const label = report.recipe_id ? '레시피 신고' : '후기 신고';
  return `<article class="review-card"><div><span class="status-tag warning">${label}</span><h3>${escapeHtml(report.reason)}</h3><small>${new Date(report.created_at).toLocaleString('ko-KR')}</small></div><div class="review-actions"><button data-report="${report.id}" data-hide="true">숨김 처리</button><button class="secondary-button" data-report="${report.id}" data-hide="false">기각</button></div></article>`;
}

const dateText = (value) => value ? new Date(value).toLocaleString('ko-KR') : '-';
const metricRows = (items, targets = {}) => items.map(([label, value]) => {
  const target = targets[label];
  return target
    ? `<button class="metric-row" type="button" data-dashboard-target="${escapeHtml(target)}" aria-label="${escapeHtml(label)} ${escapeHtml(value)}건, 해당 목록 보기"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></button>`
    : `<div class="metric-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}).join('');

function navigateAdminPage(pageId) {
  const panel = byId(`page-${pageId}`);
  const buttons = [...document.querySelectorAll('[data-admin-page]')];
  if (!panel || !buttons.some((button) => button.dataset.adminPage === pageId)) return false;
  document.querySelectorAll('[data-page-panel]').forEach((item) => { item.hidden = item !== panel; });
  buttons.forEach((button) => {
    if (button.dataset.adminPage === pageId) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  document.body.classList.remove('admin-menu-open');
  byId('mobile-menu-toggle').setAttribute('aria-expanded', 'false');
  byId('mobile-menu-toggle').setAttribute('aria-label', '운영 메뉴 열기');
  if (pageId === 'community') loadCommunity();
  if (pageId === 'users') loadUsers();
  if (pageId === 'kitchens') loadKitchens();
  if (pageId === 'catalog') loadCatalog();
  if (pageId === 'push') loadPushOperations();
  if (pageId === 'policies') loadPolicies();
  if (pageId === 'operators') loadOperators();
  return true;
}

document.querySelectorAll('[data-admin-page]').forEach((button) => {
  button.addEventListener('click', () => navigateAdminPage(button.dataset.adminPage));
});
byId('mobile-menu-toggle').addEventListener('click', () => {
  const expanded = byId('mobile-menu-toggle').getAttribute('aria-expanded') !== 'true';
  byId('mobile-menu-toggle').setAttribute('aria-expanded', String(expanded));
  byId('mobile-menu-toggle').setAttribute('aria-label', expanded ? '운영 메뉴 닫기' : '운영 메뉴 열기');
  document.body.classList.toggle('admin-menu-open', expanded);
});
byId('denied-logout').addEventListener('click', async () => { await db.auth.signOut(); location.reload(); });

function renderSnapshot(snapshot) {
  byId('total-user-count').textContent = snapshot.total_users ?? '–';
  const community = snapshot.community ?? {};
  byId('community-summary').innerHTML = metricRows([
    ['작성자', community.authors ?? 0], ['초안', community.drafts ?? 0], ['검토 대기', community.pending ?? 0],
    ['공개', community.published ?? 0], ['숨김', community.hidden ?? 0], ['후기', community.reviews ?? 0],
    ['좋아요', community.likes ?? 0], ['팔로우', community.follows ?? 0], ['신고 대기', community.open_reports ?? 0],
  ], { '작성자': 'community:recipe:', '초안': 'community:recipe:draft', '검토 대기': 'community:recipe:pending', '공개': 'community:recipe:published', '숨김': 'community:recipe:hidden', '후기': 'community:review:', '좋아요': 'detail:likes', '팔로우': 'detail:follows', '신고 대기': 'community:report:open' });
  const kitchens = snapshot.kitchens ?? {};
  byId('kitchen-summary').innerHTML = metricRows([
    ['키친', kitchens.total ?? 0], ['멤버', kitchens.members ?? 0], ['활성 초대', kitchens.active_invites ?? 0],
    ['만료 초대', kitchens.expired_invites ?? 0], ['보관 재료', kitchens.inventory_lots ?? 0], ['미완료 장보기', kitchens.shopping_open ?? 0],
  ], { '키친': 'kitchens', '멤버': 'kitchens', '활성 초대': 'kitchens', '만료 초대': 'kitchens', '보관 재료': 'kitchens', '미완료 장보기': 'kitchens' });
  const push = snapshot.push ?? {};
  byId('push-summary').innerHTML = metricRows([
    ['알림 사용', push.enabled_users ?? 0], ['Android 기기', push.active_android ?? 0], ['iOS 기기', push.active_ios ?? 0],
    ['24시간 발송', push.sent_24h ?? 0], ['처리 중', push.pending_claims ?? 0],
  ], { '알림 사용': 'push', 'Android 기기': 'push', 'iOS 기기': 'push', '24시간 발송': 'push', '처리 중': 'push' });
  const ingredients = snapshot.ingredients ?? {};
  byId('ingredient-summary').innerHTML = metricRows([
    ['표준 재료', ingredients.canonical ?? 0], ['식약처 재료명', ingredients.source_names ?? 0],
    ['미연결 재료명', ingredients.unmapped_source_names ?? 0], ['상품', ingredients.products ?? 0],
    ['미연결 상품', ingredients.unmapped_products ?? 0], ['공개 레시피', ingredients.recipes ?? 0],
  ], { '표준 재료': 'catalog:ingredient', '식약처 재료명': 'catalog:source', '미연결 재료명': 'catalog:source', '상품': 'catalog:product', '미연결 상품': 'catalog:product', '공개 레시피': 'catalog:recipe' });
}

function openDashboardTarget(target) {
  const [page, kind, filter] = target.split(':');
  if (page === 'detail') return openMetricDetails(kind, 1);
  if (page === 'community') {
    byId('community-kind').value = kind;
    setCommunityStatuses(false);
    byId('community-status').value = filter || '';
    communityPage = 1;
  } else if (page === 'users') {
    byId('users-provider').value = 'all';
    byId('users-search').value = '';
    userPage = 1;
  } else if (page === 'catalog') {
    byId('catalog-kind').value = kind;
    byId('catalog-search').value = '';
    catalogPage = 1;
  }
  navigateAdminPage(page);
}

async function openMetricDetails(kind, page = 1) {
  const title = { likes: '레시피별 좋아요', follows: '팔로우 관계' }[kind];
  if (!title) return;
  const dialog = byId('metric-dialog');
  byId('metric-title').textContent = title;
  byId('metric-items').innerHTML = '<p class="empty-admin">상세 기록을 불러오는 중이에요…</p>';
  if (!dialog.open) dialog.showModal();
  const { data, error } = await db.rpc('operator_list_community_engagement', { p_kind: kind, p_query: null, p_page: page, p_page_size: 25 });
  if (error) {
    byId('metric-items').innerHTML = `<p class="empty-admin">기록을 불러오지 못했어요: ${escapeHtml(error.message)}</p>`;
    return;
  }
  byId('metric-total').textContent = `${Number(data.total).toLocaleString('ko-KR')}건 · 최신순`;
  byId('metric-items').innerHTML = (data.items ?? []).map((item) => `<article><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.detail)}</span></article>`).join('') || '<p class="empty-admin">표시할 기록이 없습니다.</p>';
  byId('metric-pagination').innerHTML = pageControl('metric', page, Number(data.total) || 0, 25);
  document.querySelectorAll('[data-metric-page]').forEach((button) => button.addEventListener('click', () => openMetricDetails(kind, Number(button.dataset.metricPage))));
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-dashboard-target]');
  if (button) openDashboardTarget(button.dataset.dashboardTarget);
});

const kstDate = () => {
  const values = Object.fromEntries(new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};
const utcDate = (date) => date.toISOString().slice(0, 10);

function getTrendRange(grain, today = kstDate()) {
  const [year, month, day] = today.split('-').map(Number);
  const current = new Date(Date.UTC(year, month - 1, day));
  if (grain === 'day') return { from: utcDate(new Date(Date.UTC(year, month - 1, day - 29))), to: today };
  if (grain === 'week') {
    const mondayOffset = (current.getUTCDay() + 6) % 7;
    const weekStart = new Date(Date.UTC(year, month - 1, day - mondayOffset));
    return { from: utcDate(new Date(weekStart.getTime() - 77 * 86400000)), to: today };
  }
  if (grain === 'month') return { from: utcDate(new Date(Date.UTC(year, month - 12, 1))), to: today };
  return { from: `${year - 4}-01-01`, to: today };
}

function trendTicks(max) {
  const ceilingValue = Math.max(1, Math.ceil(Number(max) || 0));
  const step = Math.max(1, Math.ceil(ceilingValue / 3));
  const ceiling = Math.ceil(ceilingValue / step) * step;
  return [...new Set(Array.from({ length: ceiling / step + 1 }, (_, index) => index * step))];
}

function formatTrendPeriod(period, grain) {
  const [year, month, day] = String(period).slice(0, 10).split('-').map(Number);
  if (!year || !month) return String(period);
  if (grain === 'year') return `${year}년`;
  if (grain === 'month') return `${String(year).slice(-2)}.${month}`;
  return grain === 'week' ? `${month}/${day} 주` : `${month}/${day}`;
}

function trendMarker(shape, x, y, color, label = '') {
  const title = label ? `<title>${escapeHtml(label)}</title>` : '';
  const stroke = 'stroke="#fffdf8" stroke-width="1.5"';
  if (shape === 'square') return `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="${color}" ${stroke}>${title}</rect>`;
  if (shape === 'triangle') return `<path d="M ${x} ${y - 5} L ${x + 5} ${y + 4} L ${x - 5} ${y + 4} Z" fill="${color}" ${stroke}>${title}</path>`;
  return `<circle cx="${x}" cy="${y}" r="4" fill="${color}" ${stroke}>${title}</circle>`;
}

function renderTrendChart(data) {
  const chart = byId('trend-chart');
  const table = byId('trend-table');
  const buckets = data?.buckets ?? [];
  if (!buckets.length) {
    chart.innerHTML = '<p class="empty-admin">표시할 활동 기록이 없습니다.</p>';
    chart.setAttribute('aria-label', '표시할 활동 기록이 없습니다.');
    table.innerHTML = '';
    return;
  }
  const series = [
    { key: 'new_users', label: '신규 가입', color: '#2563EB', dash: '', marker: 'circle' },
    { key: 'review_submissions', label: '검토 요청', color: '#D99A00', dash: '8 4', marker: 'square' },
    { key: 'moderations', label: '처리 완료', color: '#DC2626', dash: '2 3', marker: 'triangle' },
  ];
  const width = 720, height = 250, left = 44, right = 14, top = 16, bottom = 35;
  const values = buckets.flatMap((bucket) => series.map(({ key }) => Number(bucket[key]) || 0));
  const max = Math.max(1, ...values);
  const ticks = trendTicks(max);
  const chartMax = ticks.at(-1) || 1;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const x = (i) => left + (buckets.length === 1 ? plotWidth / 2 : i * plotWidth / (buckets.length - 1));
  const y = (value) => top + plotHeight - (value / chartMax) * plotHeight;
  const grid = [...ticks].reverse().map((value, i) => {
    const pos = top + i * plotHeight / (ticks.length - 1);
    return `<line x1="${left}" y1="${pos}" x2="${width - right}" y2="${pos}" stroke="#d9dfd3"/><text x="${left - 8}" y="${pos + 4}" text-anchor="end">${value}</text>`;
  }).join('');
  const lines = series.map(({ key, color, label, dash, marker }) => {
    const points = buckets.map((bucket, index) => `${x(index)},${y(Number(bucket[key]) || 0)}`).join(' ');
    const markers = buckets.map((bucket, index) => trendMarker(marker, x(index), y(Number(bucket[key]) || 0), color, `${formatTrendPeriod(bucket.period, data.grain)} · ${label}: ${Number(bucket[key]) || 0}`)).join('');
    return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" ${dash ? `stroke-dasharray="${dash}"` : ''}><title>${label}</title></polyline>${markers}`;
  }).join('');
  const labelIndexes = new Set([0, Math.floor((buckets.length - 1) / 2), buckets.length - 1]);
  const xLabels = [...labelIndexes].map((index) => `<text x="${x(index)}" y="${height - 8}" text-anchor="middle">${escapeHtml(formatTrendPeriod(buckets[index].period, data.grain))}</text>`).join('');
  chart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="신규 가입, 검토 요청, 처리 완료의 기간별 추이">${grid}${lines}${xLabels}</svg><div class="trend-legend">${series.map(({ label, color, dash, marker }) => `<span><svg viewBox="0 0 28 14" aria-hidden="true"><line x1="1" y1="7" x2="27" y2="7" stroke="${color}" stroke-width="3" ${dash ? `stroke-dasharray="${dash}"` : ''}/>${trendMarker(marker, 14, 7, color)}</svg>${label}</span>`).join('')}</div>`;
  chart.setAttribute('aria-label', '신규 가입, 검토 요청, 처리 완료의 기간별 추이');
  table.innerHTML = `<table><caption class="sr-only">운영 활동 시계열 데이터</caption><thead><tr><th scope="col">기간</th><th scope="col">신규 가입</th><th scope="col">검토 요청</th><th scope="col">처리 완료</th></tr></thead><tbody>${buckets.map((bucket) => `<tr><th scope="row">${escapeHtml(formatTrendPeriod(bucket.period, data.grain))}</th>${series.map(({ key }) => `<td>${Number(bucket[key]) || 0}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

async function loadTrend() {
  const grain = byId('trend-grain').value;
  const { from, to } = getTrendRange(grain);
  byId('trend-chart').innerHTML = '<p class="empty-admin">추이를 불러오는 중이에요…</p>';
  const { data, error } = await db.rpc('operator_dashboard_timeseries', { p_grain: grain, p_from: from, p_to: to });
  if (error) {
    byId('trend-chart').innerHTML = '<p class="empty-admin">추이를 불러오지 못했어요. 새로고침 후 다시 확인해 주세요.</p>';
    byId('trend-table').innerHTML = '';
    return status(`운영 추이를 불러오지 못했어요: ${error.message}`);
  }
  renderTrendChart(data);
}

let userPage = 1;
let kitchenPage = 1;
let userRows = [];
let kitchenRows = [];
let catalogPage = 1;
let catalogRows = [];
const splitTags = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);
const pageControl = (type, page, total, pageSize) => {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  return `<button class="secondary-button" type="button" data-${type}-page="${Math.max(1, page - 1)}" ${page <= 1 ? 'disabled' : ''}>이전</button><span>${page} / ${lastPage}</span><button class="secondary-button" type="button" data-${type}-page="${Math.min(lastPage, page + 1)}" ${page >= lastPage ? 'disabled' : ''}>다음</button>`;
};

function renderUsers(data) {
  userRows = data.items ?? [];
  byId('users-total').textContent = `${data.total ?? 0}명`;
  const providerLabel = { google: 'Google', kakao: '카카오', email: '이메일' };
  byId('user-list').innerHTML = userRows.map((user) => {
    const providers = (user.providers ?? [user.provider]).map((provider) => providerLabel[provider] || provider).join(' · ');
    return `<tr><td data-label="계정">${escapeHtml(user.email)}</td><td data-label="로그인">${escapeHtml(providers || '이메일')}</td><td data-label="닉네임">${escapeHtml(user.display_name || '닉네임 없음')}</td><td data-label="키친">${escapeHtml(user.kitchen || '없음')}</td><td data-label="최근 로그인">${escapeHtml(dateText(user.last_sign_in_at))}</td><td data-label="가입일">${escapeHtml(dateText(user.created_at))}</td><td data-label="상세"><button class="secondary-button" data-user-open="${escapeHtml(user.id)}" type="button">보기</button></td></tr>`;
  }).join('') || '<tr><td colspan="7">검색 결과가 없습니다.</td></tr>';
  byId('users-pagination').innerHTML = pageControl('user', userPage, Number(data.total) || 0, 25);
  document.querySelectorAll('[data-user-open]').forEach((button) => button.addEventListener('click', () => openUserDetail(button.dataset.userOpen)));
  document.querySelectorAll('[data-user-page]').forEach((button) => button.addEventListener('click', () => { userPage = Number(button.dataset.userPage); loadUsers(); }));
}

async function loadUsers() {
  if (byId('page-users').hidden) return;
  status('사용자 목록을 불러오는 중이에요…');
  const { data, error } = await db.rpc('operator_list_users', { p_query: byId('users-search').value.trim() || null, p_provider: byId('users-provider').value, p_page: userPage, p_page_size: 25 });
  if (error) return status(`사용자 목록을 불러오지 못했어요: ${error.message}`);
  renderUsers(data ?? { total: 0, items: [] });
  status('사용자 목록을 업데이트했습니다.');
}

function userDetailMarkup(user, preview) {
  const kitchens = (user.kitchens ?? []).map((kitchen) => `<li>${escapeHtml(kitchen.name)} · ${escapeHtml(kitchen.role)}${kitchen.archived_at ? ' · 보관됨' : ''}</li>`).join('') || '<li>연결된 키친이 없습니다.</li>';
  const activity = (user.activity ?? []).slice(0, 20).map((item) => `<li><span>${escapeHtml(item.action)}${item.detail ? ` · ${escapeHtml(item.detail)}` : ''}</span><time>${escapeHtml(dateText(item.at))}</time></li>`).join('') || '<li>현재 기록된 활동이 없습니다.</li>';
  const providers = (user.providers ?? [user.provider]).map((provider) => ({ google: 'Google', kakao: '카카오', email: '이메일' }[provider] || provider)).join(' · ');
  const locked = user.is_self || user.is_operator;
  const action = locked ? '<p class="empty-admin">운영자 계정과 현재 로그인 계정은 이용 제한 대상에서 제외됩니다.</p>' : `<button class="${user.is_banned ? 'secondary-button' : 'danger-button'}" data-user-ban="${escapeHtml(user.id)}" data-banned="${user.is_banned ? 'true' : 'false'}" type="button">${user.is_banned ? '이용 제한 해제' : '이용 제한'}</button>`;
  return `<button class="detail-close secondary-button" data-user-close type="button">닫기</button><p class="eyebrow">계정 상세</p><h2>${escapeHtml(user.display_name || '닉네임 없음')}</h2><p>${escapeHtml(user.email)} · ${escapeHtml(providers)}</p><p>가입 ${escapeHtml(dateText(user.created_at))} · 최근 로그인 ${escapeHtml(dateText(user.last_sign_in_at))}</p><p>${user.is_banned ? `이용 제한 중 · ${escapeHtml(dateText(user.banned_until))}` : '이용 가능'}</p><h3>키친</h3><ul>${kitchens}</ul><h3>커뮤니티</h3><p>작성 레시피 ${escapeHtml(user.community?.recipes ?? 0)}건 · 받은 신고 ${escapeHtml(user.community?.reports_received ?? 0)}건</p><h3>사용 기록</h3><ul class="user-activity-list">${activity}</ul><p class="empty-admin">가입·로그인과 핵심 기능 변경만 기록합니다. 입력 내용과 화면 열람은 기록하지 않으며, 로그는 90일 후 삭제합니다.</p><h3>탈퇴 영향 미리보기</h3><p>${escapeHtml(preview.instruction || '계정 탈퇴는 앱에서 진행해야 합니다.')}</p><p>소유 키친 ${escapeHtml(preview.owned_kitchens ?? 0)}개 · 레시피 ${escapeHtml(preview.community_recipes ?? 0)}개 · 사진 ${escapeHtml(preview.community_photos ?? 0)}개</p>${action}`;
}

async function openUserDetail(id) {
  const panel = byId('users-detail');
  panel.hidden = false;
  panel.innerHTML = '<p class="empty-admin">계정 상세를 불러오는 중이에요…</p>';
  const [{ data: user, error }, { data: preview, error: previewError }] = await Promise.all([
    db.rpc('operator_get_user_detail', { p_user_id: id }),
    db.rpc('operator_user_delete_preview', { p_user_id: id }),
  ]);
  if (error || previewError) {
    panel.innerHTML = `<p class="empty-admin">계정 상세를 불러오지 못했어요: ${escapeHtml((error || previewError).message)}</p><button class="secondary-button" data-user-close type="button">닫기</button>`;
  } else panel.innerHTML = userDetailMarkup(user, preview);
  panel.querySelector('[data-user-close]').addEventListener('click', () => { panel.hidden = true; });
  panel.querySelector('[data-user-ban]')?.addEventListener('click', () => changeUserBan(id, panel.querySelector('[data-user-ban]').dataset.banned === 'true'));
}

async function changeUserBan(id, currentlyBanned) {
  const request = await requestReason(currentlyBanned ? '이용 제한 해제' : '사용자 이용 제한', currentlyBanned ? '이용 제한 해제 사유를 기록합니다.' : '계정을 일시 제한합니다. 본인과 다른 운영자 계정은 제한할 수 없습니다.', null, currentlyBanned ? null : 720);
  if (!request) return;
  status('계정 상태를 변경하는 중이에요…');
  const { data, error } = await db.functions.invoke('operator-auth-admin', { body: { action: currentlyBanned ? 'unban' : 'ban', target_user_id: id, reason: request.reason, ...(currentlyBanned ? {} : { duration_hours: request.durationHours }) } });
  if (error || data?.error) return status(`계정 상태를 변경하지 못했어요: ${data?.error || error.message}`);
  await Promise.all([openUserDetail(id), loadUsers()]);
  status(currentlyBanned ? '이용 제한을 해제했습니다.' : '사용자 이용을 제한했습니다.');
}

function kitchenRow(kitchen) {
  return `<button class="admin-record-row" type="button" data-kitchen-open="${escapeHtml(kitchen.id)}"><span><strong>${escapeHtml(kitchen.name)}</strong><small>${kitchen.member_count}명 · 활성 초대 ${kitchen.active_invites}개 · ${escapeHtml(dateText(kitchen.created_at))}</small></span><span class="record-status">${kitchen.archived_at ? '보관됨' : '사용 중'}</span></button>`;
}

function renderKitchens(data) {
  kitchenRows = data.items ?? [];
  byId('kitchens-total').textContent = `${data.total ?? 0}개`;
  byId('kitchens-list').innerHTML = kitchenRows.length ? kitchenRows.map(kitchenRow).join('') : '<p class="empty-admin">검색 결과가 없습니다.</p>';
  byId('kitchens-pagination').innerHTML = pageControl('kitchen', kitchenPage, Number(data.total) || 0, 25);
  document.querySelectorAll('[data-kitchen-open]').forEach((button) => button.addEventListener('click', () => openKitchenDetail(button.dataset.kitchenOpen)));
  document.querySelectorAll('[data-kitchen-page]').forEach((button) => button.addEventListener('click', () => { kitchenPage = Number(button.dataset.kitchenPage); loadKitchens(); }));
}

async function loadKitchens() {
  if (byId('page-kitchens').hidden) return;
  status('키친 목록을 불러오는 중이에요…');
  const { data, error } = await db.rpc('operator_list_kitchens', { p_query: byId('kitchens-search').value.trim() || null, p_page: kitchenPage, p_page_size: 25 });
  if (error) return status(`키친 목록을 불러오지 못했어요: ${error.message}`);
  renderKitchens(data ?? { total: 0, items: [] });
  status('키친 목록을 업데이트했습니다.');
}

function kitchenDetailMarkup(kitchen) {
  const members = (kitchen.members ?? []).map((member) => `<li><strong>${escapeHtml(member.display_name || '닉네임 없음')}</strong> · ${escapeHtml(member.role)} · 가입 ${escapeHtml(dateText(member.joined_at))}${member.role !== 'owner' ? `<label class="inline-control">권한 <select data-member-role="${escapeHtml(member.user_id)}"><option value="editor" ${member.role === 'editor' ? 'selected' : ''}>편집자</option><option value="viewer" ${member.role === 'viewer' ? 'selected' : ''}>조회자</option></select></label><button class="secondary-button" data-role-save="${escapeHtml(member.user_id)}" type="button">권한 저장</button>` : ' · 소유자 보호'}</li>`).join('');
  const invites = (kitchen.invites ?? []).map((invite) => `<li>${escapeHtml(invite.role)} · ${invite.accepted_at ? '수락됨' : invite.revoked_at ? '취소됨' : new Date(invite.expires_at) < new Date() ? '만료됨' : '대기 중'} · 만료 ${escapeHtml(dateText(invite.expires_at))}${!invite.accepted_at && !invite.revoked_at && new Date(invite.expires_at) > new Date() ? `<button class="secondary-button" data-invite-revoke="${escapeHtml(invite.id)}" type="button">초대 취소</button>` : ''}</li>`).join('') || '<li>초대 기록이 없습니다.</li>';
  const archive = kitchen.archived_at ? `<button class="button" data-kitchen-restore="${escapeHtml(kitchen.id)}" type="button">키친 복구</button>` : `<button class="danger-button" data-kitchen-archive="${escapeHtml(kitchen.id)}" data-kitchen-name="${escapeHtml(kitchen.name)}" type="button">키친 보관</button>`;
  return `<button class="detail-close secondary-button" data-kitchen-close type="button">닫기</button><p class="eyebrow">${kitchen.archived_at ? '보관된 키친' : '키친 상세'}</p><h2>${escapeHtml(kitchen.name)}</h2><p>생성 ${escapeHtml(dateText(kitchen.created_at))} · 재고 ${escapeHtml(kitchen.inventory_count)}건 · 미완료 장보기 ${escapeHtml(kitchen.shopping_open)}건</p>${kitchen.archive_reason ? `<p>보관 사유: ${escapeHtml(kitchen.archive_reason)}</p>` : ''}<h3>멤버</h3><ul class="ops-member-list">${members || '<li>멤버가 없습니다.</li>'}</ul><h3>초대 기록</h3><ul>${invites}</ul>${archive}`;
}

async function openKitchenDetail(id) {
  const panel = byId('kitchens-detail');
  panel.hidden = false;
  panel.innerHTML = '<p class="empty-admin">키친 상세를 불러오는 중이에요…</p>';
  const { data, error } = await db.rpc('operator_get_kitchen_detail', { p_kitchen_id: id });
  if (error) panel.innerHTML = `<p class="empty-admin">키친 상세를 불러오지 못했어요: ${escapeHtml(error.message)}</p><button class="secondary-button" data-kitchen-close type="button">닫기</button>`;
  else panel.innerHTML = kitchenDetailMarkup(data);
  panel.querySelector('[data-kitchen-close]').addEventListener('click', () => { panel.hidden = true; });
  panel.querySelectorAll('[data-invite-revoke]').forEach((button) => button.addEventListener('click', async () => {
    const request = await requestReason('초대 취소', '아직 수락되지 않은 키친 초대 링크를 취소합니다.');
    if (!request) return;
    const result = await db.rpc('operator_revoke_invite', { p_invite_id: button.dataset.inviteRevoke, p_reason: request.reason });
    if (result.error) return status(`초대를 취소하지 못했어요: ${result.error.message}`);
    await Promise.all([openKitchenDetail(id), loadKitchens()]);
    status('초대를 취소했습니다.');
  }));
  panel.querySelectorAll('[data-role-save]').forEach((button) => button.addEventListener('click', async () => {
    const role = panel.querySelector(`[data-member-role="${button.dataset.roleSave}"]`).value;
    const request = await requestReason('키친 권한 변경', '편집자 또는 조회자로 바꿉니다. 운영 사유를 입력해 주세요.');
    if (!request) return;
    const result = await db.rpc('operator_set_kitchen_member_role', { p_kitchen_id: id, p_user_id: button.dataset.roleSave, p_role: role, p_reason: request.reason });
    if (result.error) return status(`권한을 변경하지 못했어요: ${result.error.message}`);
    await openKitchenDetail(id);
    status('멤버 권한을 변경했습니다.');
  }));
  panel.querySelector('[data-kitchen-archive]')?.addEventListener('click', async (event) => {
    const { reason, confirmation } = await requestReason('키친 보관', '멤버의 키친 접근을 중지합니다. 되돌릴 수 있습니다. 키친 이름과 사유를 입력해 주세요.', event.currentTarget.dataset.kitchenName) ?? {};
    if (!reason) return;
    const result = await db.rpc('operator_archive_kitchen', { p_kitchen_id: id, p_reason: reason, p_confirmation: confirmation });
    if (result.error) return status(`키친을 보관하지 못했어요: ${result.error.message}`);
    await Promise.all([openKitchenDetail(id), loadKitchens()]);
    status('키친을 보관했습니다.');
  });
  panel.querySelector('[data-kitchen-restore]')?.addEventListener('click', async () => {
    const request = await requestReason('키친 복구', '복구하면 멤버가 다시 키친에 접근할 수 있습니다. 사유를 입력해 주세요.');
    if (!request) return;
    const result = await db.rpc('operator_restore_kitchen', { p_kitchen_id: id, p_reason: request.reason });
    if (result.error) return status(`키친을 복구하지 못했어요: ${result.error.message}`);
    await Promise.all([openKitchenDetail(id), loadKitchens()]);
    status('키친을 복구했습니다.');
  });
}

function catalogRow(item) {
  const detail = item.detail ?? {};
  const kind = { ingredient: '표준 식재료', source: '식약처 원문 재료명', product: '바코드 상품', recipe: detail.published ? '공개 레시피' : '비공개 레시피' }[item.kind];
  const sourceStatus = { candidate: '검토 후보', linked: '연결 완료', approved: '검토 승인' }[detail.review_status] || '상태 확인 필요';
  const description = item.kind === 'ingredient' ? `${detail.category} · 재고 ${detail.inventory_refs} · 레시피 ${detail.recipe_refs}`
    : item.kind === 'source' ? `${sourceStatus} · 언급 ${Number(detail.mention_count || 0).toLocaleString('ko-KR')}회 · ${detail.ingredient_id ? `표준 재료 연결 ${detail.ingredient_name || detail.ingredient_id}` : '표준 재료 미연결'}`
      : item.kind === 'product' ? `바코드 ${item.id} · ${detail.ingredient_id || '미연결'}`
        : `${detail.minutes}분 · ${detail.servings}인분 · 재료 ${detail.ingredient_rows?.length ?? 0}개`;
  return `<button class="admin-record-row" type="button" data-catalog-open="${escapeHtml(item.id)}"><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(kind)} · ${escapeHtml(description)}</small></span><span class="record-status">편집</span></button>`;
}

function ingredientOptions(ingredients, selected) {
  return `<option value="">연결하지 않음</option>${ingredients.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selected ? 'selected' : ''}>${escapeHtml(item.name)} · ${escapeHtml(item.id)}</option>`).join('')}`;
}

function recipeIngredientRow(ingredients, row = {}) {
  return `<div class="catalog-ingredient-row" data-recipe-row><label>식재료<select data-row-ingredient required>${ingredientOptions(ingredients, row.ingredient_id)}</select></label><label>양<input data-row-quantity type="number" min="0.01" step="0.01" value="${escapeHtml(row.quantity ?? '')}" required></label><label>단위<select data-row-unit>${['g','ml','개'].map((unit) => `<option value="${unit}" ${unit === row.unit ? 'selected' : ''}>${unit}</option>`).join('')}</select></label><button class="secondary-button" data-recipe-remove type="button" aria-label="재료 행 삭제">삭제</button></div>`;
}

function catalogDetailMarkup(kind, id, detail = {}, isNew = false, ingredients = []) {
  const input = (label, name, value = '', type = 'text', required = true) => `<label>${label}<input data-field="${name}" type="${type}" value="${escapeHtml(value)}" ${required ? 'required' : ''}></label>`;
  const area = (label, name, value = '', rows = 3, required = false) => `<label>${label}<textarea data-field="${name}" rows="${rows}" ${required ? 'required' : ''}>${escapeHtml(value)}</textarea></label>`;
  let form = '';
  if (kind === 'ingredient') {
    form = `${input('식재료 ID', 'id', id, 'text', true)}${input('표시 이름', 'name', detail.name)}${input('분류', 'category', detail.category)}${input('별칭 · 쉼표로 구분', 'aliases', (detail.aliases ?? []).join(', '), 'text', false)}${input('알레르기 유발 정보 · 쉼표로 구분', 'allergens', (detail.allergens ?? []).join(', '), 'text', false)}<p>재고 ${detail.inventory_refs ?? 0} · 레시피 ${detail.recipe_refs ?? 0} · 상품 ${detail.product_refs ?? 0} 참조</p>`;
  } else if (kind === 'source') {
    const statuses = [['candidate', '검토 후보'], ['linked', '연결 완료'], ['approved', '검토 승인']];
    form = `${input('원천', 'source', detail.source || 'COOKRCP01')}${input('원천 재료명', 'name', detail.name || (isNew ? '' : detail.name))}<label>표준 재료 연결<select data-field="ingredient_id">${ingredientOptions(ingredients, detail.ingredient_id)}</select></label><label>검토 상태<select data-field="review_status">${statuses.map(([value, label]) => `<option value="${value}" ${detail.review_status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><p>원천 언급 수 ${Number(detail.mention_count || 0).toLocaleString('ko-KR')}회</p>`;
  } else if (kind === 'product') {
    form = `${input('바코드', 'barcode', detail.barcode || id, 'text')}${input('상품명', 'name', detail.name)}<label>표준 식재료<select data-field="ingredient_id">${ingredientOptions(ingredients, detail.ingredient_id)}</select></label>${input('원천', 'source', detail.source || 'operator')}<p>재고 참조 ${detail.inventory_refs ?? 0}건</p>`;
  } else {
    const recipeValue = { id: id || '', title: detail.title || '', description: detail.description || '', minutes: detail.minutes || 20, servings: detail.servings || 2, allergens: detail.allergens || [], source: detail.source || 'operator', published: detail.published || false, image_asset: detail.image_asset || '', steps: detail.steps || [] };
    const stepText = (recipeValue.steps ?? []).map((step) => String(step)).join('\n');
    const ingredientRows = detail.ingredient_rows?.length ? detail.ingredient_rows : [{}];
    form = `${input('레시피 ID', 'id', recipeValue.id)}${input('이름', 'title', recipeValue.title)}${area('설명', 'description', recipeValue.description, 3, true)}<div class="catalog-field-row">${input('조리 시간 (분)', 'minutes', recipeValue.minutes, 'number')}${input('인분', 'servings', recipeValue.servings, 'number')}</div>${input('출처', 'source', recipeValue.source)}${input('이미지 경로', 'image_asset', recipeValue.image_asset, 'text', false)}${input('알레르기 정보 · 쉼표로 구분', 'allergens', recipeValue.allergens.join(', '), 'text', false)}<label class="catalog-check"><input data-field="published" type="checkbox" ${recipeValue.published ? 'checked' : ''}>앱에서 공개</label>${area('조리 단계 · 한 줄에 한 단계', 'steps_text', stepText, 7, true)}<fieldset class="catalog-recipe-ingredients"><legend>재료 목록</legend><div data-recipe-ingredients>${ingredientRows.map((row) => recipeIngredientRow(ingredients, row)).join('')}</div><button class="secondary-button" data-recipe-add type="button">재료 추가</button></fieldset>`;
  }
  const refs = kind === 'ingredient' ? (detail.inventory_refs || 0) + (detail.recipe_refs || 0) + (detail.product_refs || 0) : 0;
  return `<button class="detail-close secondary-button" data-catalog-close type="button">닫기</button><p class="eyebrow">${isNew ? '새 항목' : '상세 편집'}</p><h2>${escapeHtml(({ingredient:'표준 식재료',source:'원천 재료명',product:'상품 바코드',recipe:'공식 레시피'})[kind])}</h2><form class="catalog-edit-form" data-catalog-form data-kind="${kind}" data-new="${isNew}">${form}<div class="review-actions"><button class="button" type="submit">저장</button>${kind === 'ingredient' && !isNew ? `<label class="merge-target-label">병합 대상<select data-merge-target>${ingredientOptions(ingredients.filter((item) => item.id !== id), '')}</select></label><button class="secondary-button" data-catalog-merge="${escapeHtml(id)}" type="button">병합</button>${refs === 0 ? `<button class="danger-button" data-catalog-remove="${escapeHtml(id)}" type="button">미사용 재료 삭제</button>` : ''}` : ''}${kind === 'product' && !isNew && !(detail.inventory_refs > 0) ? `<button class="danger-button" data-product-remove="${escapeHtml(id)}" type="button">미사용 상품 삭제</button>` : ''}</div></form>`;
}

async function renderCatalogDetail(item = null, kind = byId('catalog-kind').value) {
  const panel = byId('catalog-detail');
  panel.hidden = false;
  panel.innerHTML = '<p class="empty-admin">상세 편집을 준비하는 중이에요…</p>';
  const [{ data: ingredientData, error }] = await Promise.all([db.rpc('operator_list_catalog', { p_kind: 'ingredient', p_query: null, p_page: 1, p_page_size: 100 })]);
  if (error) return status(`식재료 선택 항목을 불러오지 못했어요: ${error.message}`);
  const ingredients = ingredientData?.items ?? [];
  const detail = item?.detail ?? {};
  panel.innerHTML = catalogDetailMarkup(kind, item?.id || '', detail, !item, ingredients);
  panel.querySelector('[data-catalog-close]').addEventListener('click', () => { panel.hidden = true; });
  panel.querySelector('[data-catalog-form]').addEventListener('submit', (event) => saveCatalog(event, kind, item));
  panel.querySelector('[data-recipe-add]')?.addEventListener('click', () => {
    const list = panel.querySelector('[data-recipe-ingredients]');
    list.insertAdjacentHTML('beforeend', recipeIngredientRow(ingredients));
    bindRecipeRemove(list.lastElementChild);
  });
  panel.querySelectorAll('[data-recipe-remove]').forEach(bindRecipeRemove);
  panel.querySelector('[data-catalog-merge]')?.addEventListener('click', () => mergeCatalogIngredient(item.id, panel.querySelector('[data-merge-target]').value));
  panel.querySelector('[data-catalog-remove]')?.addEventListener('click', () => removeUnusedIngredient(item.id));
  panel.querySelector('[data-product-remove]')?.addEventListener('click', () => removeUnusedProduct(item.id));
}

function bindRecipeRemove(buttonOrRow) {
  const button = buttonOrRow.matches?.('[data-recipe-remove]') ? buttonOrRow : buttonOrRow.querySelector('[data-recipe-remove]');
  button?.addEventListener('click', () => {
    const list = button.closest('[data-recipe-ingredients]');
    if (list.children.length > 1) button.closest('[data-recipe-row]').remove();
  });
}

function catalogValues(panel) {
  return Object.fromEntries([...panel.querySelectorAll('[data-field]')].map((field) => [field.dataset.field, field.type === 'checkbox' ? field.checked : field.value.trim()]));
}

async function saveCatalog(event, kind, original) {
  event.preventDefault();
  const form = event.currentTarget;
  const value = catalogValues(form);
  let rpc, args;
  if (kind === 'ingredient') {
    rpc = 'operator_save_ingredient';
    args = { p_id: value.id, p_name: value.name, p_category: value.category, p_aliases: splitTags(value.aliases), p_allergens: splitTags(value.allergens), p_reason: null };
  } else if (kind === 'source') {
    rpc = 'operator_link_source_ingredient';
    args = { p_source: value.source, p_name: value.name, p_ingredient_id: value.ingredient_id || null, p_review_status: value.review_status, p_reason: null };
  } else if (kind === 'product') {
    rpc = 'operator_save_product';
    args = { p_barcode: value.barcode, p_name: value.name, p_ingredient_id: value.ingredient_id || null, p_source: value.source, p_reason: null };
  } else {
    rpc = 'operator_save_official_recipe';
    const steps = value.steps_text.split('\n').map((step) => step.trim()).filter(Boolean);
    const ingredients = [...form.querySelectorAll('[data-recipe-row]')].map((row) => ({ ingredient_id: row.querySelector('[data-row-ingredient]').value, quantity: Number(row.querySelector('[data-row-quantity]').value), unit: row.querySelector('[data-row-unit]').value }));
    if (!steps.length || ingredients.some((row) => !row.ingredient_id || row.quantity <= 0)) return status('조리 단계를 입력하고 각 재료의 식재료·양을 지정해 주세요.');
    args = { p_recipe: { id: value.id, title: value.title, description: value.description, minutes: Number(value.minutes), servings: Number(value.servings), steps, allergens: splitTags(value.allergens), source: value.source, published: value.published, image_asset: value.image_asset }, p_ingredient_rows: ingredients, p_reason: null };
  }
  const request = await requestReason('카탈로그 변경 사유', '변경 사유를 입력해야 저장할 수 있습니다.');
  if (!request) return;
  args.p_reason = request.reason;
  status('카탈로그 변경을 저장하는 중이에요…');
  const { data, error } = await db.rpc(rpc, args);
  if (error) return status(`저장하지 못했어요: ${error.message}`);
  if (kind === 'source') byId('catalog-search').value = value.name;
  else if (kind === 'product') byId('catalog-search').value = value.name;
  else byId('catalog-search').value = value.name || value.title || value.id;
  catalogPage = 1;
  await loadCatalog();
  const id = kind === 'source' ? `${value.source}:${value.name}` : kind === 'product' ? value.barcode : value.id;
  const saved = catalogRows.find((row) => row.id === id || row.id === data?.id);
  if (saved && (kind !== 'source' || !original)) await renderCatalogDetail(saved);
  status('카탈로그 변경을 저장했습니다.');
}

async function loadCatalog() {
  if (byId('page-catalog').hidden) return;
  status('카탈로그를 불러오는 중이에요…');
  const kind = byId('catalog-kind').value;
  const pageSize = Number(byId('catalog-page-size').value) || 25;
  const { data, error } = await db.rpc('operator_list_catalog', { p_kind: kind, p_query: byId('catalog-search').value.trim() || null, p_page: catalogPage, p_page_size: pageSize });
  if (error) return status(`카탈로그를 불러오지 못했어요: ${error.message}`);
  catalogRows = data?.items ?? [];
  byId('catalog-total').textContent = `${data?.total ?? 0}개`;
  byId('catalog-list').innerHTML = catalogRows.length ? catalogRows.map(catalogRow).join('') : '<p class="empty-admin">검색 결과가 없습니다.</p>';
  const total = Number(data?.total) || 0;
  const first = total ? (catalogPage - 1) * pageSize + 1 : 0;
  const last = Math.min(catalogPage * pageSize, total);
  byId('catalog-range').textContent = `${first.toLocaleString('ko-KR')}–${last.toLocaleString('ko-KR')} / ${total.toLocaleString('ko-KR')}개 · 전체 검색 결과`;
  byId('catalog-pagination').innerHTML = pageControl('catalog', catalogPage, total, pageSize);
  document.querySelectorAll('[data-catalog-open]').forEach((button) => button.addEventListener('click', () => {
    const item = catalogRows.find((row) => row.id === button.dataset.catalogOpen);
    if (item) renderCatalogDetail(item, kind);
  }));
  document.querySelectorAll('[data-catalog-page]').forEach((button) => button.addEventListener('click', () => { catalogPage = Number(button.dataset.catalogPage); loadCatalog(); }));
  status('카탈로그를 업데이트했습니다.');
}

async function mergeCatalogIngredient(sourceId, targetId) {
  if (!targetId) return status('병합할 식재료를 선택해 주세요.');
  const request = await requestReason('식재료 병합', '참조를 선택한 재료로 이동합니다. 한 레시피에 두 재료가 함께 있으면 서버가 병합을 거부합니다.');
  if (!request) return;
  const { error } = await db.rpc('operator_merge_ingredients', { p_source_id: sourceId, p_target_id: targetId, p_reason: request.reason });
  if (error) return status(`병합하지 못했어요: ${error.message}`);
  byId('catalog-search').value = '';
  byId('catalog-detail').hidden = true;
  await loadCatalog();
  status('식재료 참조를 병합했습니다.');
}

async function removeUnusedIngredient(id) {
  const request = await requestReason('미사용 식재료 삭제', '참조되지 않는 식재료만 영구 삭제됩니다. 삭제 사유를 입력해 주세요.');
  if (!request) return;
  const { error } = await db.rpc('operator_remove_unused_ingredient', { p_ingredient_id: id, p_reason: request.reason });
  if (error) return status(`식재료를 삭제하지 못했어요: ${error.message}`);
  byId('catalog-detail').hidden = true;
  await loadCatalog();
  status('미사용 식재료를 삭제했습니다.');
}

async function removeUnusedProduct(barcode) {
  const request = await requestReason('미사용 상품 삭제', '재고에 연결되지 않은 바코드 상품만 삭제됩니다. 사유를 입력해 주세요.');
  if (!request) return;
  const { error } = await db.rpc('operator_remove_unused_product', { p_barcode: barcode, p_reason: request.reason });
  if (error) return status(`상품을 삭제하지 못했어요: ${error.message}`);
  byId('catalog-detail').hidden = true;
  await loadCatalog();
  status('미사용 상품을 삭제했습니다.');
}

let pushPage = 1;
let pushTemplates = [];
let pushRecipients = [];
let pushRecipientTotal = 0;
let pushRecipientPage = 1;
const selectedPushRecipients = new Map();
const pushVariableDefinitions = {
  digest: [
    { token: '{summary}', label: '전체 요약', description: '임박 재료, 만들 수 있는 요리, 남은 장보기 항목을 한 문장으로 묶어요.' },
    { token: '{expiry_items}', label: '임박 재료', description: '재료명과 남은 날짜를 최대 3개까지 표시해요.' },
    { token: '{recipe_titles}', label: '추천 요리', description: '보유 재료로 만들 수 있는 요리명을 최대 3개까지 표시해요.' },
    { token: '{shopping_items}', label: '장보기 목록', description: '아직 체크하지 않은 장보기 재료를 최대 3개까지 표시해요.' },
  ],
  kitchen: [
    { token: '{event_count}', label: '새 소식 수', description: '키친에 도착한 새 소식 개수예요.' },
  ],
};
const pushVariableExamples = {
  '{summary}': '날짜가 가까운 재료: 계란 (3일 남음) · 만들 수 있는 요리: 감자전, 달걀국 · 장보기: 우유, 양파',
  '{expiry_items}': '계란 (3일 남음), 소고기 (오늘), 후추 (1일 남음)',
  '{recipe_titles}': '감자전, 달걀국, 두부조림',
  '{shopping_items}': '우유, 양파, 당근',
  '{event_count}': '2',
};

function renderPushVariableHelp(category) {
  const variables = pushVariableDefinitions[category] ?? [];
  byId('push-variable-buttons').innerHTML = variables.map(({ token, label }) => `<button class="push-variable-chip" type="button" data-push-variable="${token}" title="${escapeHtml(token)} 삽입">${escapeHtml(label)} <code>${escapeHtml(token)}</code></button>`).join('');
  byId('push-template-guide').textContent = variables.map(({ token, description }) => `${token}: ${description}\n치환 예시: ${token} → ${pushVariableExamples[token]}`).join('\n\n')
    + '\n\n변수는 내용에서만 치환되고, 해당 데이터가 없으면 빈 문자열이 됩니다. 최종 내용은 180자까지만 전송됩니다.';
  document.querySelectorAll('[data-push-variable]').forEach((button) => button.addEventListener('click', () => insertPushVariable(button.dataset.pushVariable)));
}

function insertPushVariable(token) {
  const body = byId('push-template-body');
  const start = body.selectionStart ?? body.value.length;
  const end = body.selectionEnd ?? start;
  const next = `${body.value.slice(0, start)}${token}${body.value.slice(end)}`;
  if (next.length > Number(body.maxLength)) return status('변수를 넣으면 문구 입력 한도 180자를 넘어요.');
  body.value = next;
  body.focus();
  body.setSelectionRange(start + token.length, start + token.length);
  updatePushTemplatePreview();
}

function updatePushTemplatePreview() {
  const category = byId('push-template-category').value;
  const variables = pushVariableDefinitions[category] ?? [];
  const supported = new Set(variables.map(({ token }) => token));
  const body = byId('push-template-body').value;
  const unknown = [...body.matchAll(/\{[^{}]+\}/g)].map(([token]) => token).filter((token) => !supported.has(token));
  const expanded = variables.reduce((text, { token }) => text.replaceAll(token, pushVariableExamples[token]), body).trim();
  const clipped = expanded.slice(0, 180);
  byId('push-template-preview').textContent = clipped || '본문에 문구를 입력하면 치환 예시가 여기에 표시돼요.';
  byId('push-template-count').textContent = `${expanded.length}/180자${expanded.length > 180 ? ' · 실제 발송에서는 180자까지만 전송돼요.' : ''}${unknown.length ? ` · 지원하지 않는 변수 ${unknown.join(', ')}는 치환되지 않습니다.` : ''}`;
}

function renderPushTemplate(category) {
  const template = pushTemplates.find((item) => item.category === category);
  if (!template) return;
  byId('push-template-category').value = category;
  byId('push-template-title').value = template.title;
  byId('push-template-body').value = template.body;
  byId('push-template-enabled').checked = template.enabled;
  renderPushVariableHelp(category);
  updatePushTemplatePreview();
}

async function loadPushOperations() {
  if (byId('page-push').hidden) return;
  status('알림 운영 정보를 불러오는 중이에요…');
  const [templateResult, listResult] = await Promise.all([
    db.rpc('operator_list_push_templates'),
    db.rpc('operator_list_push_operations', { p_query: byId('push-history-search').value.trim() || null, p_page: pushPage, p_page_size: 25 }),
  ]);
  if (templateResult.error || listResult.error) return status(`알림 정보를 불러오지 못했어요: ${(templateResult.error || listResult.error).message}`);
  pushTemplates = templateResult.data ?? [];
  byId('push-templates').innerHTML = pushTemplates.map((item) => `<button class="admin-record-row" type="button" data-push-template="${escapeHtml(item.category)}"><span><strong>${escapeHtml(item.title)}</strong><small>${item.enabled ? '사용 중' : '중지됨'} · ${escapeHtml(item.category === 'digest' ? '오늘의 키친 소식' : '키친 이벤트')}</small></span><span class="record-status">편집</span></button>`).join('') || '<p class="empty-admin">저장된 문구가 없습니다.</p>';
  document.querySelectorAll('[data-push-template]').forEach((button) => button.addEventListener('click', () => renderPushTemplate(button.dataset.pushTemplate)));
  if (!pushTemplates.some((item) => item.category === byId('push-template-category').value)) renderPushTemplate(pushTemplates[0]?.category);
  const data = listResult.data ?? { total: 0, items: [] };
  byId('push-total').textContent = `${data.total ?? 0}건`;
  byId('push-operations').innerHTML = (data.items ?? []).map((item) => `<article class="admin-record-row"><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.kind === 'campaign' ? '예약 발송' : '발송 기록')} · ${escapeHtml(item.recipient || '수신자 정보 없음')} · ${escapeHtml(dateText(item.created_at))}${item.kind === 'campaign' ? ` · 대상 ${Number(item.recipient_count ?? 0).toLocaleString('ko-KR')}명` : ''}${item.sent_count ? ` · ${item.sent_count}대 전송` : ''}${item.last_error_code ? ` · ${escapeHtml(item.last_error_code)}` : ''}</small></span><span class="record-status">${escapeHtml(item.status)} ${item.kind === 'campaign' && item.status === 'scheduled' ? `<button class="secondary-button" data-push-cancel="${escapeHtml(item.id)}" type="button">예약 취소</button>` : ''}</span></article>`).join('') || '<p class="empty-admin">예약 또는 발송 기록이 없습니다.</p>';
  byId('push-pagination').innerHTML = pageControl('push', pushPage, Number(data.total) || 0, 25);
  document.querySelectorAll('[data-push-page]').forEach((button) => button.addEventListener('click', () => { pushPage = Number(button.dataset.pushPage); loadPushOperations(); }));
  document.querySelectorAll('[data-push-cancel]').forEach((button) => button.addEventListener('click', () => cancelPushCampaign(button.dataset.pushCancel)));
  status('알림 운영 정보를 업데이트했습니다.');
}

function renderPushRecipients(data) {
  pushRecipients = data?.items ?? [];
  pushRecipientTotal = Number(data?.total ?? pushRecipientTotal);
  byId('push-recipient-results').innerHTML = pushRecipients.map((user) => `<label class="push-recipient"><input type="checkbox" data-push-user="${escapeHtml(user.id)}" ${selectedPushRecipients.has(user.id) ? 'checked' : ''}><span><strong>${escapeHtml(user.display_name || '닉네임 없음')}</strong><small>${escapeHtml(user.email)} · 활성 기기 ${user.device_count}대</small></span></label>`).join('') || '<p class="empty-admin">수신 동의와 활성 기기가 모두 있는 계정을 찾지 못했어요.</p>';
  byId('push-recipient-count').textContent = `${selectedPushRecipients.size}명 선택됨 · 현재 검색 결과 ${pushRecipientTotal.toLocaleString('ko-KR')}명`;
  byId('push-recipient-pagination').innerHTML = pageControl('push-recipient', pushRecipientPage, pushRecipientTotal, 50);
  document.querySelectorAll('[data-push-user]').forEach((input) => input.addEventListener('change', () => {
    const user = pushRecipients.find((row) => row.id === input.dataset.pushUser);
    if (input.checked && user) selectedPushRecipients.set(user.id, user);
    else selectedPushRecipients.delete(input.dataset.pushUser);
    renderPushRecipients(data);
    renderSelectedPushRecipients();
    byId('push-preview-result').textContent = '대상·기기 수 확인을 눌러 발송 가능 대상을 다시 확인해 주세요.';
  }));
  document.querySelectorAll('[data-push-recipient-page]').forEach((button) => button.addEventListener('click', () => {
    pushRecipientPage = Number(button.dataset.pushRecipientPage);
    searchPushRecipients();
  }));
}

function renderSelectedPushRecipients() {
  const all = byId('target-mode-all').checked;
  byId('push-selected-list').hidden = all || selectedPushRecipients.size === 0;
  byId('push-selected-list').innerHTML = all ? '' : [...selectedPushRecipients.values()].map((user) => `<span class="push-selected-chip">${escapeHtml(user.display_name || user.email)} <button type="button" data-push-remove="${escapeHtml(user.id)}" aria-label="${escapeHtml(user.display_name || user.email)} 선택 해제">×</button></span>`).join('');
  document.querySelectorAll('[data-push-remove]').forEach((button) => button.addEventListener('click', () => {
    selectedPushRecipients.delete(button.dataset.pushRemove);
    renderSelectedPushRecipients();
    searchPushRecipients();
  }));
}

async function searchPushRecipients() {
  const { data, error } = await db.rpc('operator_list_push_recipients', { p_query: byId('push-recipient-search').value.trim() || null, p_page: pushRecipientPage, p_page_size: 50 });
  if (error) return status(`수신자를 찾지 못했어요: ${error.message}`);
  renderPushRecipients(data);
  renderSelectedPushRecipients();
}

function pushAudience() {
  return { p_target_user_ids: [...selectedPushRecipients.keys()], p_all_enabled: byId('target-mode-all').checked };
}

async function previewPushRecipient() {
  const audience = pushAudience();
  if (!audience.p_all_enabled && !audience.p_target_user_ids.length) return status('푸시를 받을 사용자를 한 명 이상 선택해 주세요.');
  const { data, error } = await db.rpc('operator_preview_push_audience', audience);
  if (error) return status(`수신 조건을 확인하지 못했어요: ${error.message}`);
  byId('push-preview-result').textContent = data.can_send ? `${Number(data.recipient_count).toLocaleString('ko-KR')}명 · 활성 기기 ${Number(data.device_count).toLocaleString('ko-KR')}대에 예약할 수 있어요.` : '선택 대상 중 수신 동의와 활성 기기를 모두 갖춘 계정이 없어요.';
}

async function savePushTemplate(event) {
  event.preventDefault();
  const request = await requestReason('알림 문구 저장', '다음 발송부터 사용할 문구와 사유를 기록합니다.');
  if (!request) return;
  const { error } = await db.rpc('operator_save_push_template', {
    p_category: byId('push-template-category').value, p_title: byId('push-template-title').value.trim(),
    p_body: byId('push-template-body').value.trim(), p_enabled: byId('push-template-enabled').checked, p_reason: request.reason,
  });
  if (error) return status(`문구를 저장하지 못했어요: ${error.message}`);
  await loadPushOperations();
  status('알림 문구를 저장했습니다.');
}

async function schedulePushCampaign() {
  const audience = pushAudience();
  const scheduledAt = new Date(byId('push-scheduled-at').value);
  if ((!audience.p_all_enabled && !audience.p_target_user_ids.length) || !byId('push-campaign-title').value.trim() || !byId('push-campaign-body').value.trim() || !byId('push-scheduled-at').value || Number.isNaN(scheduledAt.getTime())) return status('받는 사람·제목·내용·예약 시각을 입력해 주세요.');
  const { data: preview, error: previewError } = await db.rpc('operator_preview_push_audience', audience);
  if (previewError || !preview?.can_send) return status(previewError ? `수신 상태를 확인하지 못했어요: ${previewError.message}` : '수신 동의와 활성 기기가 있는 대상이 없습니다.');
  const audienceName = audience.p_all_enabled ? '전체 수신 동의 사용자' : `선택한 ${preview.recipient_count}명`;
  const request = await requestReason('푸시 예약 발송', `${audienceName} 중 활성 기기가 있는 ${preview.recipient_count}명, ${preview.device_count}대에 ${dateText(scheduledAt.toISOString())} 발송합니다. 발송 대상은 예약 시점 기준으로 저장하고, 발송 직전 수신 설정을 다시 확인합니다.`);
  if (!request) return;
  const { error } = await db.rpc('operator_create_push_campaign', {
    p_title: byId('push-campaign-title').value.trim(), p_body: byId('push-campaign-body').value.trim(),
    ...audience, p_scheduled_at: scheduledAt.toISOString(), p_reason: request.reason,
  });
  if (error) return status(`예약하지 못했어요: ${error.message}`);
  selectedPushRecipients.clear();
  renderSelectedPushRecipients();
  await loadPushOperations();
  status('푸시 발송을 예약했습니다.');
}

async function testPushToSelf() {
  const title = byId('push-campaign-title').value.trim();
  const body = byId('push-campaign-body').value.trim();
  if (!title || !body) return status('테스트할 제목과 내용을 입력해 주세요.');
  const request = await requestReason('내 기기에 테스트 발송', '현재 로그인한 운영자 본인의 활성 기기에만 테스트 푸시를 보냅니다.');
  if (!request) return;
  const { data, error } = await db.functions.invoke('operator-push-admin', { body: { action: 'test', title, body } });
  if (error || data?.error) return status(`테스트 발송에 실패했어요: ${data?.error || error.message}`);
  await loadPushOperations();
  status(`내 기기에 테스트를 보냈어요. 성공 ${data.sent}대 · 실패 ${data.failed}대`);
}

async function cancelPushCampaign(id) {
  const request = await requestReason('알림 예약 취소', '아직 전송 대기 중인 예약을 취소합니다.');
  if (!request) return;
  const { error } = await db.rpc('operator_cancel_push_campaign', { p_campaign_id: id, p_reason: request.reason });
  if (error) return status(`예약을 취소하지 못했어요: ${error.message}`);
  await loadPushOperations();
  status('알림 예약을 취소했습니다.');
}

let communityPage = 1;
let communityItems = [];

function setCommunityStatuses(load = true) {
  const kind = byId('community-kind').value;
  byId('community-rating-filter-wrap').hidden = kind !== 'review';
  byId('community-rating-filter').value = '';
  const values = kind === 'recipe'
    ? [['','모든 상태'],['pending','검토 대기'],['published','공개'],['hidden','숨김'],['rejected','반려'],['draft','초안']]
    : kind === 'review' ? [['','모든 상태'],['published','공개'],['hidden','숨김']]
      : [['','모든 상태'],['open','미처리'],['resolved','처리 완료']];
  const select = byId('community-status');
  select.innerHTML = values.map(([value,label]) => `<option value="${value}">${label}</option>`).join('');
  if (kind === 'recipe') select.value = 'pending';
  else select.value = kind === 'report' ? 'open' : 'published';
  communityPage = 1;
  if (load) loadCommunity();
}

function statusBadge(value) {
  const states = {
    pending: ['pending', '◷', '검토 대기'], published: ['published', '✓', '공개'], hidden: ['hidden', '—', '숨김'],
    rejected: ['rejected', '×', '반려'], draft: ['draft', '·', '초안'], open: ['pending', '!', '미처리'],
    resolved: ['resolved', '✓', '처리 완료'],
  };
  const [state, marker, label] = states[value] ?? ['draft', '·', value];
  return `<span class="status-badge status--${state}" aria-label="상태: ${escapeHtml(label)}"><span aria-hidden="true">${marker}</span>${escapeHtml(label)}</span>`;
}

function statusText(value) {
  return ({ draft: '초안', pending: '검토 대기', published: '공개', hidden: '숨김', rejected: '반려', open: '미처리', resolved: '처리 완료' })[value] || value;
}

function providerText(value) {
  const labels = { google: 'Google', kakao: '카카오', email: '일반 이메일' };
  const providers = Array.isArray(value) ? value : value ? [value] : [];
  return providers.map((provider) => labels[provider] || provider).join(' · ') || '로그인 정보 없음';
}

function communityStatusOptions(item) {
  if (item.kind === 'recipe') {
    if (item.status === 'pending') return [['publish', '승인·공개'], ['reject', '반려']];
    if (item.status === 'published') return [['hide', '숨김']];
    if (item.status === 'hidden') return [['restore', '공개 복구']];
    if (item.status === 'rejected') return [['pending', '검토 대기로 이동']];
  }
  if (item.kind === 'review') return item.status === 'published' ? [['hide', '후기 숨김']] : item.status === 'hidden' ? [['restore', '후기 복구']] : [];
  if (item.kind === 'report' && item.status === 'open') return [['content_hidden', '신고 콘텐츠 숨김'], ['dismissed', '신고 기각']];
  return [];
}

function ratingStars(value) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  return `<span class="rating-stars" aria-label="별점 ${rating}점"><span aria-hidden="true">${'★'.repeat(rating)}<span class="rating-stars-empty">${'☆'.repeat(5 - rating)}</span></span><b>${rating}/5</b></span>`;
}

function communityRow(item) {
  const title = item.kind === 'report' ? item.title || item.reason : item.title || item.recipe_title || '제목 없음';
  const author = item.kind === 'report' ? `신고자 ${item.reporter ?? '계정 정보 없음'} · 대상 작성자 ${item.author ?? '계정 정보 없음'}` : item.author ?? '한끼유저';
  const email = item.kind === 'report' ? `${item.reporter_email ?? '이메일 없음'} · 대상 ${item.author_email ?? '이메일 없음'}` : item.author_email ?? '이메일 없음';
  const providers = item.kind === 'report' ? `${providerText(item.reporter_providers)} · 대상 ${providerText(item.author_providers)}` : providerText(item.author_providers);
  const detail = item.kind === 'recipe' ? `${item.minutes}분 · ${item.servings}인분 · 좋아요 ${item.like_count ?? 0} · 후기 ${item.review_count ?? 0} · ${item.average_rating == null ? '별점 없음' : `평균 ★${Number(item.average_rating).toFixed(1)}`} · ${dateText(item.submitted_at || item.created_at)}`
    : item.kind === 'review' ? `${dateText(item.created_at)} · ${ratingStars(item.rating)}` : `${item.recipe_id ? '레시피 신고' : '후기 신고'} · ${dateText(item.created_at)}`;
  const excerpt = item.kind === 'recipe' ? item.summary : item.kind === 'review' ? item.body_preview : item.reason;
  const actions = communityStatusOptions(item);
  const menu = actions.length ? `<div class="community-status-menu" data-community-status-menu="${escapeHtml(item.id)}" hidden>${actions.map(([action, label]) => `<button type="button" data-community-status-action="${escapeHtml(action)}" data-community-id="${escapeHtml(item.id)}">${escapeHtml(label)}</button>`).join('')}</div>` : '';
  return `<article class="admin-record-row community-row"><button class="community-row-main" type="button" data-community-open="${escapeHtml(item.id)}"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(author)} · ${escapeHtml(email)} · ${escapeHtml(providers)} · ${escapeHtml(detail)}</small>${excerpt ? `<span class="community-excerpt">${escapeHtml(excerpt)}</span>` : ''}</button><div class="community-row-actions"><button class="community-status-control" type="button" data-community-status="${escapeHtml(item.id)}" aria-expanded="false" ${actions.length ? '' : 'disabled'}>${statusBadge(item.status)}<span class="sr-only">상태 관리</span></button>${menu}</div></article>`;
}

function renderCommunityPage(data) {
  communityItems = data.items ?? [];
  byId('community-total').textContent = `${data.total ?? 0}건`;
  byId('community-list').innerHTML = communityItems.length ? communityItems.map(communityRow).join('') : '<p class="empty-admin">조건에 맞는 항목이 없습니다.</p>';
  const lastPage = Math.max(1, Math.ceil((data.total ?? 0) / (data.page_size || 25)));
  byId('community-pagination').innerHTML = `<button class="secondary-button" type="button" data-community-page="${Math.max(1, communityPage - 1)}" ${communityPage <= 1 ? 'disabled' : ''}>이전</button><span>${communityPage} / ${lastPage}</span><button class="secondary-button" type="button" data-community-page="${Math.min(lastPage, communityPage + 1)}" ${communityPage >= lastPage ? 'disabled' : ''}>다음</button>`;
  document.querySelectorAll('[data-community-open]').forEach((button) => button.addEventListener('click', () => {
    const selected = communityItems.find((item) => item.id === button.dataset.communityOpen);
    if (selected) openCommunityDetail(selected);
  }));
  document.querySelectorAll('[data-community-page]').forEach((button) => button.addEventListener('click', () => {
    communityPage = Number(button.dataset.communityPage);
    loadCommunity();
  }));
  document.querySelectorAll('[data-community-status]').forEach((button) => button.addEventListener('click', () => {
    const menu = document.querySelector(`[data-community-status-menu="${button.dataset.communityStatus}"]`);
    const opening = menu?.hidden;
    document.querySelectorAll('[data-community-status-menu]').forEach((item) => { item.hidden = true; });
    document.querySelectorAll('[data-community-status]').forEach((item) => item.setAttribute('aria-expanded', 'false'));
    if (menu && opening) {
      menu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
    }
  }));
  document.querySelectorAll('[data-community-status-action]').forEach((button) => button.addEventListener('click', () => {
    const item = communityItems.find((row) => row.id === button.dataset.communityId);
    if (item) moderateCommunityStatus(item, button.dataset.communityStatusAction);
  }));
}

async function loadCommunity() {
  if (byId('page-community').hidden) return;
  status('커뮤니티 항목을 불러오는 중이에요…');
  const { data, error } = await db.rpc('operator_list_community_items', {
    p_kind: byId('community-kind').value,
    p_status: byId('community-status').value || null,
    p_query: byId('community-search').value.trim() || null,
    p_page: communityPage,
    p_page_size: 25,
    p_rating: byId('community-kind').value === 'review' && byId('community-rating-filter').value ? Number(byId('community-rating-filter').value) : null,
  });
  if (error) return status(`커뮤니티 목록을 불러오지 못했어요: ${error.message}`);
  renderCommunityPage(data ?? { total: 0, items: [] });
  status('커뮤니티 목록을 업데이트했습니다.');
}

function actionButtons(item) {
  if (item.kind === 'recipe') {
    if (item.status === 'pending') return '<button class="button" data-community-action="publish">승인</button><button class="danger-button" data-community-action="reject">반려</button>';
    if (item.status === 'published') return '<button class="danger-button" data-community-action="hide">숨김</button>';
    if (item.status === 'hidden') return '<button class="button" data-community-action="restore">복구</button>';
    if (item.status === 'rejected') return '<button class="button" data-community-action="pending">검토 대기로 이동</button>';
  }
  if (item.kind === 'review' && item.status === 'published') return '<button class="danger-button" data-community-action="hide">후기 숨김</button>';
  if (item.kind === 'review' && item.status === 'hidden') return '<button class="button" data-community-action="restore">후기 복구</button>';
  if (item.kind === 'report' && item.status === 'open') return '<button class="danger-button" data-community-action="content_hidden">콘텐츠 숨김 처리</button><button class="secondary-button" data-community-action="dismissed">신고 기각</button>';
  return '';
}

function communityDetailMarkup(item) {
  const title = item.kind === 'report' ? '신고 상세' : item.kind === 'review' ? '후기 상세' : '레시피 상세';
  const userLink = (id, text) => id ? `<button class="community-user-link" data-community-user="${escapeHtml(id)}" type="button">${escapeHtml(text)}</button>` : escapeHtml(text);
  const identity = item.kind === 'report'
    ? `<p class="community-author-detail">신고자 ${userLink(item.reporter_user_id, item.reporter || '계정 정보 없음')} · ${escapeHtml(item.reporter_email || '이메일 없음')} · ${escapeHtml(providerText(item.reporter_providers))}</p><p class="community-author-detail">대상 작성자 ${userLink(item.author_user_id, item.author || '계정 정보 없음')} · ${escapeHtml(item.author_email || '이메일 없음')} · ${escapeHtml(providerText(item.author_providers))}</p>`
    : `<p class="community-author-detail">작성자 ${userLink(item.author_user_id, item.author || '한끼유저')} · ${escapeHtml(item.author_email || '이메일 없음')} · ${escapeHtml(providerText(item.author_providers))}</p>`;
  let content = '';
  if (item.kind === 'recipe') {
    const ingredients = (item.ingredients ?? []).map((row) => `<li>${escapeHtml(row.name)} <span>${escapeHtml(row.amount)}</span></li>`).join('');
    const steps = (item.steps ?? []).map((step, index) => `<li>${escapeHtml(step.text)}${step.photo_path ? `<img class="admin-recipe-photo" data-storage-path="${escapeHtml(step.photo_path)}" alt="${index + 1}단계 사진">` : ''}</li>`).join('');
    content = `<p>${escapeHtml(item.summary)}</p><p class="community-engagement">좋아요 ${escapeHtml(item.like_count ?? 0)} · 후기 ${escapeHtml(item.review_count ?? 0)} · ${item.average_rating == null ? '평가 없음' : `평균 별점 ${escapeHtml(Number(item.average_rating).toFixed(1))}/5`}</p>${item.cover_path ? `<img class="admin-recipe-photo" data-storage-path="${escapeHtml(item.cover_path)}" alt="레시피 대표 사진">` : '<p class="empty-admin">사진 없이 등록된 레시피입니다.</p>'}<h3>재료</h3><ul>${ingredients}</ul><h3>조리 단계</h3><ol>${steps}</ol>`;
  } else if (item.kind === 'review') {
    content = `<p>레시피: ${escapeHtml(item.recipe_title)}</p><p>${ratingStars(item.rating)}</p><blockquote>${escapeHtml(item.body)}</blockquote>`;
  } else {
    content = `<p>신고 사유</p><blockquote>${escapeHtml(item.reason)}</blockquote><p>대상: ${escapeHtml(item.recipe_title || '후기')}</p>${item.review_body ? `<blockquote>${escapeHtml(item.review_body)}</blockquote>` : ''}${item.cover_path ? `<img class="admin-recipe-photo" data-storage-path="${escapeHtml(item.cover_path)}" alt="신고된 레시피 사진">` : ''}${item.steps?.length ? `<ol>${item.steps.map((step,index) => `<li>${escapeHtml(step.text)}${step.photo_path ? `<img class="admin-recipe-photo" data-storage-path="${escapeHtml(step.photo_path)}" alt="${index + 1}단계 사진">` : ''}</li>`).join('')}</ol>` : ''}<p>등록 ${escapeHtml(dateText(item.created_at))}</p>${item.resolution ? `<p>처리: ${escapeHtml(item.resolution)} · ${escapeHtml(item.resolution_note)}</p>` : ''}`;
  }
  return `<button class="detail-close secondary-button" type="button" data-community-close>닫기</button><p class="eyebrow">${escapeHtml(statusText(item.status))}</p><h2>${escapeHtml(item.title || item.reason || item.recipe_title || title)}</h2><p class="detail-kind">${title}</p>${identity}<p class="detail-kind">등록 ${escapeHtml(dateText(item.created_at || item.submitted_at))}</p>${content}<div class="review-actions detail-actions">${actionButtons(item)}</div>`;
}

async function openCommunityDetail(summary) {
  const detail = byId('community-detail');
  detail.innerHTML = '<p class="empty-admin">상세 내용을 불러오는 중이에요…</p>';
  detail.hidden = false;
  const { data, error } = await db.rpc('operator_get_community_item', { p_kind: summary.kind, p_item_id: summary.id });
  if (error) {
    detail.innerHTML = `<p class="empty-admin">상세 내용을 불러오지 못했어요: ${escapeHtml(error.message)}</p><button class="secondary-button" data-community-close type="button">닫기</button>`;
    detail.querySelector('[data-community-close]').addEventListener('click', () => { detail.hidden = true; });
    return;
  }
  const item = data;
  detail.innerHTML = communityDetailMarkup(item);
  detail.querySelector('[data-community-close]').addEventListener('click', () => { detail.hidden = true; });
  detail.querySelectorAll('[data-community-user]').forEach((button) => button.addEventListener('click', () => {
    detail.hidden = true;
    navigateAdminPage('users');
    openUserDetail(button.dataset.communityUser);
  }));
  detail.querySelectorAll('[data-storage-path]').forEach(async (image) => {
    const { data, error } = await db.storage.from('community-recipe-photos').createSignedUrl(image.dataset.storagePath, 900);
    if (error) image.replaceWith(document.createTextNode('사진을 불러오지 못했어요.'));
    else image.src = data.signedUrl;
  });
  detail.querySelectorAll('[data-community-action]').forEach((button) => button.addEventListener('click', () => moderateCommunityStatus(item, button.dataset.communityAction)));
}

async function moderateCommunityStatus(item, action) {
  const label = { publish: '레시피 승인', reject: '레시피 반려', pending: '검토 대기로 이동', hide: '콘텐츠 숨김', restore: '콘텐츠 복구', content_hidden: '신고 콘텐츠 숨김', dismissed: '신고 기각' }[action];
  const nextStatus = { publish: '공개', reject: '반려', pending: '검토 대기', hide: '숨김', restore: '공개', content_hidden: '신고 콘텐츠 숨김', dismissed: '신고 기각' }[action];
  const subject = item.title || item.recipe_title || item.reason || (item.kind === 'review' ? '후기' : '콘텐츠');
  const author = item.author ? `${item.author}${item.author_email ? ` · ${item.author_email}` : ''} · ${providerText(item.author_providers)}` : '계정 정보 없음';
  const reporter = item.reporter ? `${item.reporter}${item.reporter_email ? ` · ${item.reporter_email}` : ''} · ${providerText(item.reporter_providers)}` : '';
  const confirmation = item.kind === 'report' ? `신고자: ${reporter || '계정 정보 없음'}\n대상 작성자: ${author}` : `작성자: ${author}`;
  const request = await requestReason(label, `${subject}\n${confirmation}\n현재 상태: ${statusText(item.status)} → 변경 상태: ${nextStatus}\n정말 변경할까요? 운영 기록에 남길 사유를 입력해 주세요.`);
  if (!request) return;
  const { reason } = request;
  status('변경을 저장하는 중이에요…');
  let result;
  if (item.kind === 'recipe') {
    const decision = action === 'publish' || action === 'restore' ? 'published' : action === 'reject' ? 'rejected' : action === 'pending' ? 'pending' : 'hidden';
    result = await db.rpc('operator_moderate_community_recipe', { p_recipe_id: item.id, p_decision: decision, p_reason: reason });
  } else if (item.kind === 'review') {
    result = await db.rpc('operator_moderate_community_review', { p_review_id: item.id, p_action: action, p_reason: reason });
  } else {
    result = await db.rpc('operator_resolve_community_report', { p_report_id: item.id, p_outcome: action, p_reason: reason });
  }
  if (result.error) return status(`저장하지 못했어요: ${result.error.message}`);
  byId('community-detail').hidden = true;
  await Promise.all([loadCommunity(), loadDashboard()]);
  status(`${label} 처리를 완료했습니다.`);
}

async function loadDashboard() {
  status('운영 데이터를 불러오는 중이에요…');
  const [recipesResult, reportsResult, snapshotResult] = await Promise.all([
    db.rpc('operator_list_community_items', { p_kind: 'recipe', p_status: 'pending', p_page: 1, p_page_size: 5 }),
    db.rpc('operator_list_community_items', { p_kind: 'report', p_status: 'open', p_page: 1, p_page_size: 5 }),
    db.rpc('operator_dashboard_snapshot'),
  ]);
  const error = recipesResult.error || reportsResult.error || snapshotResult.error;
  if (error) return status(`데이터를 불러오지 못했어요: ${error.message}`);
  const pendingPage = recipesResult.data ?? { total: 0, items: [] };
  const reportPage = reportsResult.data ?? { total: 0, items: [] };
  const pending = pendingPage.items ?? [];
  const reports = reportPage.items ?? [];
  const snapshot = snapshotResult.data ?? {};
  renderSnapshot(snapshot);
  byId('pending-count').textContent = pendingPage.total;
  byId('report-count').textContent = reportPage.total;
  byId('published-count').textContent = snapshot.community?.published ?? '–';
  byId('pending-label').textContent = `${pendingPage.total}건`;
  byId('report-label').textContent = `${reportPage.total}건`;
  byId('pending-list').innerHTML = pending.length ? pending.map(recipeCard).join('') : '<p class="empty-admin">검토할 레시피가 없습니다.</p>';
  byId('report-list').innerHTML = reports.length ? reports.map(reportCard).join('') : '<p class="empty-admin">처리할 신고가 없습니다.</p>';
  document.querySelectorAll('[data-recipe]').forEach((button) => button.addEventListener('click', () => moderate(button.dataset.recipe, button.dataset.decision)));
  document.querySelectorAll('[data-report]').forEach((button) => button.addEventListener('click', () => resolveReport(button.dataset.report, button.dataset.hide === 'true')));
  status('최신 운영 상태입니다.');
  await loadTrend();
}

let policyRows = [];
let operatorRows = [];
let operatorCandidates = [];
let auditPage = 1;
let operatorUserId = null;

async function loadPolicies() {
  if (byId('page-policies').hidden) return;
  status('정책 문서를 불러오는 중이에요…');
  const { data, error } = await db.rpc('operator_list_policies');
  if (error) return status(`정책 문서를 불러오지 못했어요: ${error.message}`);
  policyRows = data ?? [];
  byId('policy-list').innerHTML = policyRows.map((policy, index) => `<button class="admin-record-row" type="button" data-policy-index="${index}"><span><strong>${policy.kind === 'privacy' ? '개인정보처리방침' : '이용약관'} · ${escapeHtml(policy.version)}</strong><small>${policy.published_at ? `게시 ${escapeHtml(dateText(policy.published_at))}` : '초안 · 미게시'} · ${policy.body.length}자</small></span><span class="record-status">${policy.published_at ? '게시본' : '편집'}</span></button>`).join('') || '<p class="empty-admin">정책 문서가 없습니다. 새 초안을 만들어 주세요.</p>';
  document.querySelectorAll('[data-policy-index]').forEach((button) => button.addEventListener('click', () => renderPolicyDetail(policyRows[Number(button.dataset.policyIndex)])));
  status('정책 문서를 업데이트했습니다.');
}

function renderPolicyDetail(policy = null) {
  const panel = byId('policy-detail');
  const published = Boolean(policy?.published_at);
  panel.hidden = false;
  panel.innerHTML = `<button class="detail-close secondary-button" data-policy-close type="button">닫기</button><p class="eyebrow">${published ? '게시된 문서 · 읽기 전용' : policy ? '정책 초안' : '새 정책 초안'}</p><h2>${published ? '게시 정책' : '정책 문서 편집'}</h2><form id="policy-form" class="catalog-edit-form"><label>문서 종류 <select id="policy-kind" ${policy ? 'disabled' : ''}><option value="terms" ${policy?.kind !== 'privacy' ? 'selected' : ''}>이용약관</option><option value="privacy" ${policy?.kind === 'privacy' ? 'selected' : ''}>개인정보처리방침</option></select></label><label>버전 <input id="policy-version" maxlength="40" required value="${escapeHtml(policy?.version ?? '')}" ${policy || published ? 'readonly' : ''} placeholder="예: 2026-10"></label><label>내용 <textarea id="policy-body" rows="18" maxlength="50000" required ${published ? 'readonly' : ''}>${escapeHtml(policy?.body ?? '')}</textarea></label><p>${published ? `게시일 ${escapeHtml(dateText(policy.published_at))} · 게시된 문서는 변경하거나 삭제할 수 없습니다.` : '저장된 초안은 이용자에게 공개되지 않습니다.'}</p><div class="review-actions">${published ? '' : `<button class="button" type="submit">초안 저장</button>${policy ? `<button class="secondary-button" data-policy-publish type="button">게시</button><button class="danger-button" data-policy-delete type="button">초안 삭제</button>` : ''}`}</div></form>`;
  panel.querySelector('[data-policy-close]').addEventListener('click', () => { panel.hidden = true; });
  panel.querySelector('#policy-form').addEventListener('submit', savePolicyDraft);
  panel.querySelector('[data-policy-publish]')?.addEventListener('click', publishPolicyDraft);
  panel.querySelector('[data-policy-delete]')?.addEventListener('click', deletePolicyDraft);
  if (!published) panel.querySelector('#policy-kind').disabled = Boolean(policy);
}

async function savePolicyDraft(event) {
  event.preventDefault();
  const kind = byId('policy-kind').value;
  const version = byId('policy-version').value.trim();
  const body = byId('policy-body').value.trim();
  if (!version || !body) return status('문서 종류·버전·내용을 입력해 주세요.');
  const request = await requestReason('정책 초안 저장', '초안을 저장합니다. 게시 전까지는 사용자에게 노출되지 않습니다.');
  if (!request) return;
  const { error } = await db.rpc('operator_save_policy_draft', { p_kind: kind, p_version: version, p_body: body, p_reason: request.reason });
  if (error) return status(`정책 초안을 저장하지 못했어요: ${error.message}`);
  await loadPolicies();
  status('정책 초안을 저장했습니다.');
}

async function publishPolicyDraft() {
  const kind = byId('policy-kind').value;
  const version = byId('policy-version').value;
  const request = await requestReason('정책 게시', `${kind === 'privacy' ? '개인정보처리방침' : '이용약관'} ${version}을 게시합니다. 게시본은 변경하거나 삭제할 수 없습니다.`);
  if (!request) return;
  const { error } = await db.rpc('operator_publish_policy', { p_kind: kind, p_version: version, p_reason: request.reason });
  if (error) return status(`정책을 게시하지 못했어요: ${error.message}`);
  byId('policy-detail').hidden = true;
  await loadPolicies();
  status('정책을 게시했습니다.');
}

async function deletePolicyDraft() {
  const kind = byId('policy-kind').value;
  const version = byId('policy-version').value;
  const request = await requestReason('정책 초안 삭제', `미게시 초안 ${version}을 삭제합니다.`);
  if (!request) return;
  const { error } = await db.rpc('operator_delete_policy_draft', { p_kind: kind, p_version: version, p_reason: request.reason });
  if (error) return status(`정책 초안을 삭제하지 못했어요: ${error.message}`);
  byId('policy-detail').hidden = true;
  await loadPolicies();
  status('정책 초안을 삭제했습니다.');
}

function renderOperators() {
  byId('moderator-list').innerHTML = operatorRows.map((operator) => `<article class="compact-row"><span><strong>${escapeHtml(operator.display_name || operator.email)}</strong><small>${escapeHtml(operator.email)} · ${escapeHtml(providerText(operator.providers))} · 등록 ${escapeHtml(dateText(operator.added_at))}${operator.last_action ? ` · 최근 작업 ${escapeHtml(dateText(operator.last_action))}` : ''}</small></span><button class="danger-button" data-moderator-remove="${escapeHtml(operator.id)}" type="button" ${operator.id === operatorUserId ? 'disabled title="현재 로그인 계정은 여기서 해제할 수 없습니다."' : ''}>권한 해제</button></article>`).join('') || '<p class="empty-admin">등록된 운영자가 없습니다.</p>';
  document.querySelectorAll('[data-moderator-remove]').forEach((button) => button.addEventListener('click', () => changeModerator(button.dataset.moderatorRemove, false)));
}

async function searchOperatorCandidates() {
  const query = byId('operator-search').value.trim();
  status('Google 계정을 찾는 중이에요…');
  const { data, error } = await db.rpc('operator_list_google_accounts', { p_query: query || null, p_page: 1, p_page_size: 50 });
  if (error) return status(`Google 계정을 찾지 못했어요: ${error.message}`);
  operatorCandidates = data?.items ?? [];
  byId('operator-candidate').innerHTML = `<option value="">계정을 선택하세요${data?.total > operatorCandidates.length ? ` · ${operatorCandidates.length}개 표시` : ''}</option>${operatorCandidates.map((account) => `<option value="${escapeHtml(account.id)}" ${account.is_moderator ? 'disabled' : ''}>${escapeHtml(account.display_name || account.email)} · ${escapeHtml(account.email)}${account.is_moderator ? ' · 운영자' : ''}</option>`).join('')}`;
  byId('operator-add').disabled = true;
  status(`${data?.total ?? 0}개의 Google 계정을 찾았습니다.`);
}

async function changeModerator(id, enabled) {
  const account = operatorCandidates.find((item) => item.id === id) ?? operatorRows.find((item) => item.id === id);
  const request = await requestReason(enabled ? '운영자 권한 부여' : '운영자 권한 해제', `${account?.email ?? '선택한 계정'}의 운영 권한을 ${enabled ? '부여' : '해제'}합니다. Google 로그인을 다시 검증합니다.`);
  if (!request) return;
  const { error } = await db.rpc('operator_change_moderator', { p_user_id: id, p_enabled: enabled, p_reason: request.reason });
  if (error) return status(`운영자 권한을 변경하지 못했어요: ${error.message}`);
  await Promise.all([loadOperators(), searchOperatorCandidates()]);
  status(enabled ? '운영자 권한을 부여했습니다.' : '운영자 권한을 해제했습니다.');
}

function renderAudit(data) {
  const rows = data?.items ?? [];
  byId('moderation-log').innerHTML = rows.map((item) => `<article class="audit-row"><strong>${escapeHtml(item.action)}</strong><span>${escapeHtml(item.actor || '탈퇴한 운영자')} · ${escapeHtml(item.target_type)} · ${escapeHtml(dateText(item.created_at))}</span><p>${escapeHtml(item.reason || '사유 없음')} · 대상 ${escapeHtml(item.target_id || '-')}</p>${item.summary && Object.keys(item.summary).length ? `<details><summary>기록 상세</summary><pre>${escapeHtml(JSON.stringify(item.summary, null, 2))}</pre></details>` : ''}</article>`).join('') || '<p class="empty-admin">감사 기록이 없습니다.</p>';
  byId('audit-pagination').innerHTML = pageControl('audit', auditPage, Number(data?.total) || 0, 25);
  document.querySelectorAll('[data-audit-page]').forEach((button) => button.addEventListener('click', () => { auditPage = Number(button.dataset.auditPage); loadAudit(); }));
}

async function loadAudit() {
  const { data, error } = await db.rpc('operator_list_audit', { p_query: byId('audit-search').value.trim() || null, p_action: byId('audit-action').value || null, p_page: auditPage, p_page_size: 25 });
  if (error) return status(`감사 기록을 불러오지 못했어요: ${error.message}`);
  renderAudit(data);
}

async function loadOperators() {
  if (byId('page-operators').hidden) return;
  status('운영 권한과 감사 기록을 불러오는 중이에요…');
  const [moderators, auditResult, health] = await Promise.all([
    db.rpc('operator_list_moderators'),
    db.rpc('operator_list_audit', { p_query: byId('audit-search').value.trim() || null, p_action: byId('audit-action').value || null, p_page: auditPage, p_page_size: 25 }),
    db.rpc('operator_health_snapshot'),
  ]);
  const error = moderators.error || auditResult.error || health.error;
  if (error) return status(`운영 정보를 불러오지 못했어요: ${error.message}`);
  operatorRows = moderators.data ?? [];
  renderOperators();
  renderAudit(auditResult.data ?? { total: 0, items: [] });
  const snapshot = health.data ?? {};
  byId('health-status').innerHTML = metricRows([
    ['데이터베이스', snapshot.database === 'ok' ? '정상 응답' : '확인 필요'],
    ['커뮤니티 사진 저장소', snapshot.community_photo_bucket === 'configured' ? '설정됨' : '없음'],
    ['프로필 사진 저장소', snapshot.profile_photo_bucket === 'configured' ? '설정됨' : '없음'],
    ['푸시 발송', snapshot.push_sender === 'not_checked' ? '실기기 테스트 필요' : snapshot.push_sender],
    ['확인 시각', dateText(snapshot.checked_at)],
  ]);
  status('운영자·감사 정보를 업데이트했습니다.');
}

async function boot() {
  const { data: { session } } = await db.auth.getSession();
  operatorUserId = session?.user?.id ?? null;
  byId('login').hidden = Boolean(session);
  byId('logout').hidden = !session;
  if (!session) return;
  await db.rpc('operator_bootstrap_google_owner');
  const { data: moderator, error } = await db.rpc('community_moderator_status');
  if (error || moderator !== true) {
    byId('denied').hidden = false;
    byId('denied-email').textContent = `${session.user.email ?? '현재 계정'}에는 운영 권한이 없습니다.`;
    return;
  }
  byId('dashboard').hidden = false;
  navigateAdminPage('home');
  await loadDashboard();
}

byId('google-login').addEventListener('click', login);
byId('refresh').addEventListener('click', loadDashboard);
byId('trend-grain').addEventListener('change', loadTrend);
byId('community-kind').addEventListener('change', setCommunityStatuses);
byId('community-status').addEventListener('change', () => { communityPage = 1; loadCommunity(); });
byId('community-rating-filter').addEventListener('change', () => { communityPage = 1; loadCommunity(); });
byId('community-search-button').addEventListener('click', () => { communityPage = 1; loadCommunity(); });
byId('community-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') { communityPage = 1; loadCommunity(); } });
byId('users-search-button').addEventListener('click', () => { userPage = 1; loadUsers(); });
byId('users-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') { userPage = 1; loadUsers(); } });
byId('users-provider').addEventListener('change', () => { userPage = 1; loadUsers(); });
byId('kitchens-search-button').addEventListener('click', () => { kitchenPage = 1; loadKitchens(); });
byId('kitchens-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') { kitchenPage = 1; loadKitchens(); } });
byId('catalog-search-button').addEventListener('click', () => { catalogPage = 1; loadCatalog(); });
byId('catalog-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') { catalogPage = 1; loadCatalog(); } });
byId('catalog-kind').addEventListener('change', () => { catalogPage = 1; byId('catalog-detail').hidden = true; loadCatalog(); });
byId('catalog-page-size').addEventListener('change', () => { catalogPage = 1; loadCatalog(); });
byId('catalog-create').addEventListener('click', () => renderCatalogDetail(null, byId('catalog-kind').value));
byId('push-refresh').addEventListener('click', loadPushOperations);
byId('push-template-form').addEventListener('submit', savePushTemplate);
byId('push-template-category').addEventListener('change', () => renderPushTemplate(byId('push-template-category').value));
byId('push-template-body').addEventListener('input', updatePushTemplatePreview);
byId('push-recipient-search-button').addEventListener('click', () => { pushRecipientPage = 1; searchPushRecipients(); });
byId('push-recipient-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') { pushRecipientPage = 1; searchPushRecipients(); } });
byId('push-recipient-select-page').addEventListener('click', () => {
  if (byId('target-mode-all').checked) return status('전체 발송은 현재 검색 페이지 선택이 필요하지 않아요.');
  const additions = pushRecipients.filter((user) => !selectedPushRecipients.has(user.id));
  if (selectedPushRecipients.size + additions.length > 500) return status('한 번에 선택할 수 있는 최대 인원은 500명입니다. 전체 수신 동의 사용자를 선택해 주세요.');
  for (const user of pushRecipients) selectedPushRecipients.set(user.id, user);
  renderPushRecipients({ items: pushRecipients, total: pushRecipientTotal });
  renderSelectedPushRecipients();
  byId('push-preview-result').textContent = '대상·기기 수 확인을 눌러 발송 가능 대상을 다시 확인해 주세요.';
});
byId('push-recipient-clear').addEventListener('click', () => { selectedPushRecipients.clear(); renderPushRecipients({ items: pushRecipients, total: pushRecipientTotal }); renderSelectedPushRecipients(); });
byId('target-mode-selected').addEventListener('change', renderSelectedPushRecipients);
byId('target-mode-all').addEventListener('change', renderSelectedPushRecipients);
byId('push-preview').addEventListener('click', previewPushRecipient);
byId('push-schedule').addEventListener('click', schedulePushCampaign);
byId('push-test').addEventListener('click', testPushToSelf);
byId('push-history-search-button').addEventListener('click', () => { pushPage = 1; loadPushOperations(); });
byId('push-history-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') { pushPage = 1; loadPushOperations(); } });
byId('policy-new').addEventListener('click', () => renderPolicyDetail());
byId('operator-search-button').addEventListener('click', searchOperatorCandidates);
byId('operator-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') searchOperatorCandidates(); });
byId('operator-candidate').addEventListener('change', () => { byId('operator-add').disabled = !byId('operator-candidate').value; });
byId('operator-add').addEventListener('click', () => { if (byId('operator-candidate').value) changeModerator(byId('operator-candidate').value, true); });
byId('audit-refresh').addEventListener('click', loadOperators);
byId('audit-search-button').addEventListener('click', () => { auditPage = 1; loadAudit(); });
byId('audit-search').addEventListener('keydown', (event) => { if (event.key === 'Enter') { auditPage = 1; loadAudit(); } });
document.querySelectorAll('[data-page-refresh]').forEach((button) => button.addEventListener('click', loadCommunity));
byId('logout').addEventListener('click', async () => { await db.auth.signOut(); location.reload(); });
const earliestPushSchedule = new Date(Date.now() + 5 * 60 * 1000);
earliestPushSchedule.setMinutes(earliestPushSchedule.getMinutes() - earliestPushSchedule.getTimezoneOffset());
byId('push-scheduled-at').min = earliestPushSchedule.toISOString().slice(0, 16);
boot().catch((error) => status(`운영 화면을 열지 못했어요: ${error.message}`));
