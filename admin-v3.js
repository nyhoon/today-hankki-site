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

async function moderate(id, decision) {
  const note = decision === 'rejected' ? prompt('반려 사유를 입력해주세요.') : '';
  if (decision === 'rejected' && (!note || note.trim().length < 5)) return;
  status('처리 중이에요…');
  const { error } = await db.rpc('moderate_community_recipe', {
    target: id,
    decision,
    note: note?.trim() || null,
  });
  if (error) return status(`처리하지 못했어요: ${error.message}`);
  await loadDashboard();
  status(decision === 'published' ? '게시를 승인했습니다.' : '레시피를 반려했습니다.');
}

async function resolveReport(id, hide) {
  const { error } = await db.rpc('moderate_community_report', {
    target: id,
    hide_content: hide,
    note: null,
  });
  if (error) return status(`신고를 처리하지 못했어요: ${error.message}`);
  await loadDashboard();
  status('신고를 처리했습니다.');
}

function recipeCard(recipe, authors) {
  const author = authors.get(recipe.author_id) ?? '한끼유저';
  return `<article class="review-card">
    <div><span class="status-tag">게시 대기</span><h3>${escapeHtml(recipe.title)}</h3><p>${escapeHtml(recipe.summary)}</p><small>${escapeHtml(author)} · ${recipe.minutes}분 · ${recipe.servings}인분</small></div>
    <div class="review-actions"><button data-recipe="${recipe.id}" data-decision="published">승인</button><button class="danger-button" data-recipe="${recipe.id}" data-decision="rejected">반려</button></div>
  </article>`;
}

function reportCard(report) {
  const label = report.recipe_id ? '레시피 신고' : '후기 신고';
  return `<article class="review-card"><div><span class="status-tag warning">${label}</span><h3>${escapeHtml(report.reason)}</h3><small>${new Date(report.created_at).toLocaleString('ko-KR')}</small></div><div class="review-actions"><button data-report="${report.id}" data-hide="true">숨김 처리</button><button class="secondary-button" data-report="${report.id}" data-hide="false">기각</button></div></article>`;
}

const dateText = (value) => value ? new Date(value).toLocaleString('ko-KR') : '-';
const metricRows = (items) => items.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('');

function renderSnapshot(snapshot) {
  const users = snapshot.users ?? [];
  byId('user-label').textContent = `${users.length}명`;
  byId('user-list').innerHTML = users.length ? users.map((user) => `<tr>
    <td><strong>${escapeHtml(user.email ?? '이메일 없음')}</strong><small>${escapeHtml(user.id)}</small></td>
    <td>${escapeHtml(user.provider)}</td><td>${escapeHtml(user.display_name ?? '-')}</td><td>${escapeHtml(user.kitchen ?? '-')}</td>
    <td>${escapeHtml(user.published_recipes)}</td><td>${escapeHtml(user.reports_received)}</td><td>${escapeHtml(dateText(user.last_sign_in_at))}</td>
  </tr>`).join('') : '<tr><td colspan="7">가입 사용자가 없습니다.</td></tr>';
  const community = snapshot.community ?? {};
  byId('community-summary').innerHTML = metricRows([
    ['작성자', community.authors ?? 0], ['초안', community.drafts ?? 0], ['검토 대기', community.pending ?? 0],
    ['공개', community.published ?? 0], ['숨김', community.hidden ?? 0], ['후기', community.reviews ?? 0],
    ['좋아요', community.likes ?? 0], ['팔로우', community.follows ?? 0], ['신고 대기', community.open_reports ?? 0],
  ]);
  const kitchens = snapshot.kitchens ?? {};
  byId('kitchen-summary').innerHTML = metricRows([
    ['키친', kitchens.total ?? 0], ['멤버', kitchens.members ?? 0], ['활성 초대', kitchens.active_invites ?? 0],
    ['만료 초대', kitchens.expired_invites ?? 0], ['보관 재료', kitchens.inventory_lots ?? 0], ['미완료 장보기', kitchens.shopping_open ?? 0],
  ]);
  const push = snapshot.push ?? {};
  byId('push-summary').innerHTML = metricRows([
    ['알림 사용', push.enabled_users ?? 0], ['Android 기기', push.active_android ?? 0], ['iOS 기기', push.active_ios ?? 0],
    ['24시간 발송', push.sent_24h ?? 0], ['처리 중', push.pending_claims ?? 0],
  ]);
  const ingredients = snapshot.ingredients ?? {};
  byId('ingredient-summary').innerHTML = metricRows([
    ['표준 재료', ingredients.canonical ?? 0], ['식약처 재료명', ingredients.source_names ?? 0],
    ['미연결 재료명', ingredients.unmapped_source_names ?? 0], ['상품', ingredients.products ?? 0],
    ['미연결 상품', ingredients.unmapped_products ?? 0], ['공개 레시피', ingredients.recipes ?? 0],
  ]);
  byId('policy-list').innerHTML = (snapshot.policies ?? []).map((policy) => `<div class="compact-row"><strong>${policy.kind === 'privacy' ? '개인정보처리방침' : '이용약관'} ${escapeHtml(policy.version)}</strong><span>${escapeHtml(dateText(policy.published_at))}</span></div>`).join('') || '<p class="empty-admin">등록된 정책이 없습니다.</p>';
  byId('moderator-list').innerHTML = (snapshot.moderators ?? []).map((moderator) => `<div class="compact-row"><strong>${escapeHtml(moderator.email)}</strong><span>${escapeHtml(dateText(moderator.added_at))}</span></div>`).join('');
  byId('moderation-log').innerHTML = (snapshot.moderation_log ?? []).map((log) => `<div class="audit-row"><strong>${escapeHtml(log.action)}</strong><span>${escapeHtml(log.actor_email ?? '탈퇴한 운영자')} · ${escapeHtml(dateText(log.created_at))}</span><p>${escapeHtml(log.reason ?? '사유 없음')}</p></div>`).join('') || '<p class="empty-admin">운영 기록이 없습니다.</p>';
}

async function loadDashboard() {
  status('운영 데이터를 불러오는 중이에요…');
  const [recipesResult, reportsResult, authorsResult, snapshotResult] = await Promise.all([
    db.from('community_recipes').select('id,author_id,status,title,summary,minutes,servings,submitted_at').order('submitted_at', { ascending: true }),
    db.from('community_reports').select('id,recipe_id,review_id,reason,status,created_at').eq('status', 'open').order('created_at', { ascending: true }),
    db.from('community_authors').select('id,nickname'),
    db.rpc('operator_dashboard_snapshot'),
  ]);
  const error = recipesResult.error || reportsResult.error || authorsResult.error || snapshotResult.error;
  if (error) return status(`데이터를 불러오지 못했어요: ${error.message}`);
  const recipes = recipesResult.data ?? [];
  const pending = recipes.filter((recipe) => recipe.status === 'pending');
  const published = recipes.filter((recipe) => recipe.status === 'published');
  const reports = reportsResult.data ?? [];
  const authors = new Map((authorsResult.data ?? []).map((author) => [author.id, author.nickname]));
  renderSnapshot(snapshotResult.data ?? {});
  byId('pending-count').textContent = pending.length;
  byId('report-count').textContent = reports.length;
  byId('published-count').textContent = published.length;
  byId('pending-label').textContent = `${pending.length}건`;
  byId('report-label').textContent = `${reports.length}건`;
  byId('pending-list').innerHTML = pending.length ? pending.map((item) => recipeCard(item, authors)).join('') : '<p class="empty-admin">검토할 레시피가 없습니다.</p>';
  byId('report-list').innerHTML = reports.length ? reports.map(reportCard).join('') : '<p class="empty-admin">처리할 신고가 없습니다.</p>';
  document.querySelectorAll('[data-recipe]').forEach((button) => button.addEventListener('click', () => moderate(button.dataset.recipe, button.dataset.decision)));
  document.querySelectorAll('[data-report]').forEach((button) => button.addEventListener('click', () => resolveReport(button.dataset.report, button.dataset.hide === 'true')));
  status('최신 운영 상태입니다.');
}

async function boot() {
  const { data: { session } } = await db.auth.getSession();
  byId('login').hidden = Boolean(session);
  byId('logout').hidden = !session;
  if (!session) return;
  const { data: moderator, error } = await db.rpc('community_moderator_status');
  if (error || moderator !== true) {
    byId('denied').hidden = false;
    byId('denied-email').textContent = `${session.user.email ?? '현재 계정'}에는 운영 권한이 없습니다.`;
    return;
  }
  byId('dashboard').hidden = false;
  await loadDashboard();
}

byId('google-login').addEventListener('click', login);
byId('refresh').addEventListener('click', loadDashboard);
byId('logout').addEventListener('click', async () => { await db.auth.signOut(); location.reload(); });
boot().catch((error) => status(`운영 화면을 열지 못했어요: ${error.message}`));
