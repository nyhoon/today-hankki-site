import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('./admin.html', import.meta.url), 'utf8');
const privacyPage = await readFile(new URL('./privacy.html', import.meta.url), 'utf8');
const termsPage = await readFile(new URL('./terms.html', import.meta.url), 'utf8');
const script = await readFile(new URL('./admin-v3.js', import.meta.url), 'utf8');
const css = await readFile(new URL('./styles.css', import.meta.url), 'utf8');
const timeseriesMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002100000_operator_dashboard_timeseries.sql', import.meta.url), 'utf8').catch(() => '');
const communityMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002120000_operator_community.sql', import.meta.url), 'utf8').catch(() => '');
const communityAdminMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002220000_operator_community_admin_details.sql', import.meta.url), 'utf8').catch(() => '');
const auditMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002110000_operator_audit_log.sql', import.meta.url), 'utf8').catch(() => '');
const usersKitchensMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002130000_operator_users_kitchens.sql', import.meta.url), 'utf8').catch(() => '');
const catalogMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002140000_operator_catalog.sql', import.meta.url), 'utf8').catch(() => '');
const catalogSourceLabelsMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002240000_operator_catalog_source_labels.sql', import.meta.url), 'utf8').catch(() => '');
const pushAdminMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002150000_operator_push_admin.sql', import.meta.url), 'utf8').catch(() => '');
const policyMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002160000_operator_policy_access.sql', import.meta.url), 'utf8').catch(() => '');
const policyBaseMigration = await readFile(new URL('../today-hankki/supabase/migrations/20260925170000_account_receipt_p0.sql', import.meta.url), 'utf8').catch(() => '');
const policyAccessTest = await readFile(new URL('../today-hankki/supabase/tests/operator_policy_access.test.sql', import.meta.url), 'utf8').catch(() => '');
const operatorBootstrapMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002170000_operator_bootstrap_google_moderators.sql', import.meta.url), 'utf8').catch(() => '');
const dashboardEnhancementsMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002180000_operator_dashboard_enhancements.sql', import.meta.url), 'utf8').catch(() => '');
const userActivityMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002190000_user_activity_logging.sql', import.meta.url), 'utf8').catch(() => '');
const userActivityConsentMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002210000_require_policy_consent_for_activity_logs.sql', import.meta.url), 'utf8').catch(() => '');
const pushAdminFunction = await readFile(new URL('../today-hankki/supabase/functions/operator-push-admin/index.ts', import.meta.url), 'utf8').catch(() => '');
const dispatchPushFunction = await readFile(new URL('../today-hankki/supabase/functions/dispatch-pushes/index.ts', import.meta.url), 'utf8').catch(() => '');
const fcmShared = await readFile(new URL('../today-hankki/supabase/functions/_shared/fcm.ts', import.meta.url), 'utf8').catch(() => '');
const authAdminFunction = await readFile(new URL('../today-hankki/supabase/functions/operator-auth-admin/index.ts', import.meta.url), 'utf8').catch(() => '');
const destinations = ['home', 'community', 'users', 'kitchens', 'catalog', 'push', 'policies', 'operators'];

test('operator dashboard exposes eight unique destinations and guarded states', () => {
  for (const id of destinations) {
    assert.match(html, new RegExp(`data-admin-page="${id}"`), `${id} navigation exists`);
    assert.match(html, new RegExp(`id="page-${id}"`), `${id} panel exists`);
  }
  assert.match(html, /id="login"/);
  assert.match(html, /id="denied"/);
  assert.match(html, /id="dashboard"/);
  assert.match(html, /styles\.css\?v=20261002-chart-hover-1/);
  assert.match(html, /admin-v3\.js\?v=20261002-chart-hover-1/);
  assert.match(script, /function navigateAdminPage\(pageId\)/);
});

test('dashboard navigation and mobile accessibility are implemented', () => {
  assert.match(html, /aria-label="운영 메뉴"/);
  assert.match(html, /aria-expanded=/);
  assert.match(html, /aria-current="page"/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /\.admin-nav-button:focus-visible/);
  assert.match(css, /\.admin-table-cards/);
});

test('operator forms use unique control IDs and cap notification templates at the sender limit', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'HTML control IDs are unique');
  assert.match(html, /id="push-template-body"[^>]*maxlength="180"/);
  assert.match(html, /변수는 제목에서 치환되지 않습니다/);
  assert.match(script, /id="policy-body"/);
  assert.match(html, /id="operator-search"/);
  assert.doesNotMatch(html, /id="kakao-login"|id="operator-email-login"/);
  assert.match(html, /id="audit-action"/);
  assert.match(html, /id="push-variable-buttons"/);
  assert.match(html, /id="push-template-preview"/);
  assert.match(script, /function insertPushVariable\(/);
  assert.match(script, /function updatePushTemplatePreview\(/);
  assert.match(script, /치환 예시: \$\{token\} → \$\{pushVariableExamples\[token\]\}/);
  assert.match(script, /body\.selectionStart/);
  assert.match(script, /body\.selectionEnd/);
  assert.match(script, /실제 발송에서는 180자까지만/);
});

test('home chart uses a manual KST series query with an accessible data table', () => {
  assert.match(html, /id="trend-grain"/);
  assert.match(html, /id="trend-table"/);
  assert.match(script, /operator_dashboard_timeseries/);
  assert.match(script, /function renderTrendChart\(/);
  assert.match(script, /function getTrendRange\(/);
  assert.match(script, /function formatTrendPeriod\(/);
  assert.match(script, /#2563EB/);
  assert.match(script, /#D99A00/);
  assert.match(script, /#DC2626/);
  assert.match(script, /function trendTicks\(/);
  assert.match(script, /marker: 'circle'/);
  assert.match(script, /marker: 'square'/);
  assert.match(script, /marker: 'triangle'/);
  assert.match(script, /function trendMarker\(/);
  assert.doesNotMatch(script, /dash: ['"](?:8 4|2 3)['"]/, 'all activity series use solid lines');
  assert.match(script, /function fullTrendPeriod\(/);
  assert.match(script, /function showTrendTooltip\(/);
  assert.match(script, /class="trend-tooltip" role="tooltip" hidden/);
  assert.match(script, /data-trend-index=/);
  assert.match(script, /addEventListener\('pointermove'/);
  assert.match(script, /addEventListener\('focusin'/);
  assert.match(css, /\.trend-tooltip\[hidden\]\s*\{[^}]*display:\s*none/s);
  const tickFunction = script.match(/function trendTicks\(max\) \{[\s\S]*?\n\}/)?.[0];
  assert.ok(tickFunction, 'tick calculation is present');
  const trendTicks = new Function(`${tickFunction}; return trendTicks;`)();
  for (const max of [0, 1, 2, 3, 4, 5, 10, 99, 1000]) {
    const ticks = trendTicks(max);
    assert.equal(new Set(ticks).size, ticks.length, `ticks are unique for max ${max}`);
    assert.equal(ticks[0], 0);
    assert.ok(ticks.at(-1) >= max);
    assert.ok(ticks.length >= 2);
  }
  assert.match(timeseriesMigration, /operator_dashboard_timeseries/);
  for (const grain of ['day', 'week', 'month', 'year']) assert.match(timeseriesMigration, new RegExp(`'${grain}'`));
  assert.match(timeseriesMigration, /Asia\/Seoul/);
  assert.doesNotMatch(script, /setInterval\(/, 'dashboard uses manual refresh only');
});

test('community screen uses paged operator RPCs and keeps recipe photos optional', () => {
  const communitySubmit = communityMigration.split('create or replace function public.submit_community_recipe')[1] ?? '';
  for (const rpc of ['operator_list_community_items', 'operator_get_community_item', 'operator_moderate_community_recipe', 'operator_moderate_community_review', 'operator_resolve_community_report']) {
    assert.ok(communityMigration.includes(rpc), `${rpc} is installed server-side`);
  }
  assert.match(script, /operator_list_community_items/);
  assert.match(script, /operator_get_community_item/);
  assert.match(script, /openCommunityDetail/);
  assert.match(script, /data-community-status/);
  assert.match(script, /function communityStatusOptions\(/);
  assert.match(script, /function moderateCommunityStatus\(/);
  assert.match(communityAdminMigration, /author_email/);
  assert.match(communityAdminMigration, /author_provider/);
  assert.match(communityAdminMigration, /'body',v\.body/);
  assert.match(communityAdminMigration, /'recipe_title',r\.title/);
  assert.match(communityAdminMigration, /'body_preview',left\(v\.body,220\)/);
  assert.match(communityAdminMigration, /and \(p_rating is null or rating=p_rating\)/);
  assert.match(script, /p_rating:/);
  assert.match(script, /item\.body_preview/);
  assert.match(script, /item\.kind === 'review' && item\.status === 'hidden'.*후기 복구/s);
  assert.match(communityAdminMigration, /'reporter_email'/);
  assert.match(communityMigration, /r\.cover_path is not null/);
  assert.match(communitySubmit, /not \(select private\.has_current_policies\(\)\)/);
  assert.match(communityMigration, /record_operator_audit/);
  assert.match(auditMigration, /operator_audit_log/);
});

test('users and kitchens are paged, audited, and archived without exposing invite secrets', () => {
  for (const rpc of ['operator_list_users', 'operator_get_user_detail', 'operator_user_delete_preview', 'operator_list_kitchens', 'operator_get_kitchen_detail', 'operator_revoke_invite', 'operator_set_kitchen_member_role', 'operator_archive_kitchen', 'operator_restore_kitchen']) {
    assert.ok(usersKitchensMigration.includes(rpc), `${rpc} is installed`);
  }
  assert.match(usersKitchensMigration, /archived_at is null/);
  assert.doesNotMatch(usersKitchensMigration, /'token_hash'/);
  assert.match(authAdminFunction, /community_moderator_status/);
  assert.match(authAdminFunction, /updateUserById/);
  assert.doesNotMatch(authAdminFunction, /deleteUser/);
});

test('user and kitchen pages load paged data and expose reasoned operator actions', () => {
  for (const fragment of ['async function loadUsers()', 'async function loadKitchens()', 'operator_list_users', 'operator_list_kitchens', 'operator_user_delete_preview', 'operator_archive_kitchen', 'operator_restore_kitchen', 'operator_revoke_invite', 'operator_set_kitchen_member_role']) {
    assert.ok(script.includes(fragment), `${fragment} is connected to the dashboard`);
  }
  assert.match(script, /operator-auth-admin/);
  assert.match(script, /confirm-name/);
  assert.match(script, /requestReason\([^)]*confirmation/);
});

test('catalog edits run through audited RPCs and reject unsafe data deletion or merging', () => {
  for (const rpc of ['operator_list_catalog', 'operator_save_ingredient', 'operator_link_source_ingredient', 'operator_save_product', 'operator_save_official_recipe', 'operator_merge_ingredients', 'operator_remove_unused_ingredient', 'operator_remove_unused_product']) {
    assert.ok(catalogMigration.includes(rpc), `${rpc} is implemented`);
  }
  assert.match(script, /async function loadCatalog\(/);
  assert.match(script, /operator_save_official_recipe/);
  assert.match(script, /operator_merge_ingredients/);
  assert.match(catalogMigration, /record_operator_audit/);
  assert.match(script, /function catalogRow\(/);
  assert.match(script, /검토 후보/);
  assert.match(script, /표준 재료 연결 \$\{detail\.ingredient_name \|\| detail\.ingredient_id\}/);
  assert.match(catalogSourceLabelsMigration, /'ingredient_name',i\.name/);
  assert.doesNotMatch(catalogSourceLabelsMigration, /\b(update|insert|delete)\s+public\.source_ingredient_names\b/i);
  const sourceRow = script.match(/function catalogRow\(item\) \{[\s\S]*?\n\}/)?.[0] || '';
  assert.equal((sourceRow.match(/escapeHtml\(item\.name\)/g) ?? []).length, 1, 'source name appears once in each catalog row');
  assert.doesNotMatch(script, /\$\{kind\} · \$\{escapeHtml\(description\)\}/);
});

test('push sending is presented as a plain three-step flow with template tools out of the way', () => {
  assert.match(html, /id="push-step-1"[\s\S]*?누구에게 보낼까요\?/);
  assert.match(html, /id="push-step-2"[\s\S]*?어떤 알림을 보낼까요\?/);
  assert.match(html, /id="push-step-3"[\s\S]*?언제 보낼까요\?/);
  assert.match(html, /id="push-template-manager"[\s\S]*?<summary>자동 알림 문구 관리<\/summary>/);
  assert.match(html, /id="push-schedule"[^>]*>예약 발송</);
  assert.match(html, /10분 뒤로 정하기/);
  assert.match(css, /\.admin-title>\.secondary-button\{flex:none;white-space:nowrap\}/);
  assert.match(script, /function setPushScheduleMinutes\(/);
  assert.match(script, /function updatePushAudienceControls\(/);
  assert.match(html, /모든 알림 동의 사용자/);
  assert.match(html, /최근 활성 기기가 있는 사용자/);
  const sendFlow = script.match(/async function schedulePushCampaign\(\) \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(sendFlow, /byId\('push-campaign-title'\)\.value\.trim\(\)/);
  assert.match(sendFlow, /byId\('push-campaign-body'\)\.value\.trim\(\)/);
  assert.match(sendFlow, /requestReason\('푸시 예약 발송'/);
  assert.match(sendFlow, /운영자 수동 알림 예약/);
  assert.match(script, /function requestReason\(title, message, confirmation = null, durationHours = null, reasonDefault = ''\)/);
});

test('push operations keep tokens server-side and support reviewed multi-recipient audiences', () => {
  for (const rpc of ['operator_save_push_template', 'operator_list_push_operations', 'operator_preview_push', 'operator_create_push_campaign', 'operator_cancel_push_campaign', 'operator_claim_due_push_campaigns']) assert.ok(pushAdminMigration.includes(rpc), `${rpc} exists`);
  assert.match(pushAdminFunction, /community_moderator_status/);
  assert.match(pushAdminFunction, /authData\.user\.id/);
  assert.match(pushAdminFunction, /register_push_device|push_devices/);
  assert.match(fcmShared, /fcm\.googleapis\.com\/v1\/projects/);
  assert.match(dashboardEnhancementsMigration, /operator_push_campaign_recipients/);
  assert.match(dashboardEnhancementsMigration, /operator_preview_push_audience/);
  assert.match(dashboardEnhancementsMigration, /operator_create_push_campaign\(p_title text,p_body text,p_target_user_ids uuid\[\],p_all_enabled boolean/);
  assert.match(script, /target-mode-all/);
  assert.match(script, /target-mode-selected/);
  assert.match(script, /operator_preview_push_audience/);
  assert.match(dispatchPushFunction, /operator_claim_due_push_campaigns/);
  assert.match(dispatchPushFunction, /operator_complete_push_campaign_recipient/);
  assert.match(dispatchPushFunction, /Maximum recipient batch/);
  assert.match(script, /async function loadPushOperations\(/);
  assert.match(script, /operator_create_push_campaign/);
});

test('account rows do not repeat mobile labels on desktop and provider search includes email, Kakao, and Google', () => {
  assert.match(html, /id="users-provider"/);
  assert.match(script, /p_provider:/);
  assert.match(dashboardEnhancementsMigration, /raw_app_meta_data->'providers'/);
  assert.match(dashboardEnhancementsMigration, /p_provider text/);
  assert.match(css, /\.admin-table-cards td::before\{content:attr\(data-label\)/);
  assert.doesNotMatch(css, /\n\.admin-table-cards td::before\{/);
});

test('operator login and grant flow remain Google-only', () => {
  assert.match(html, /등록된 Google 운영자 계정만/);
  assert.match(html, /Google 계정 검색/);
  assert.match(script, /operator_list_google_accounts/);
  assert.match(script, /provider: 'google'/);
  assert.doesNotMatch(script, /operator_list_moderator_accounts/);
  const moderatorFlow = script.match(/async function changeModerator\([\s\S]*?\n\}/)?.[0] || '';
  assert.match(moderatorFlow, /operator_change_moderator/);
  assert.doesNotMatch(moderatorFlow, /p_confirmation/);
  assert.doesNotMatch(html, /Google·카카오·이메일 로그인 계정/);
});

test('catalog paging exposes real result ranges and configurable page sizes for the complete filtered count', () => {
  assert.match(html, /id="catalog-page-size"/);
  assert.match(html, /id="catalog-range"/);
  assert.match(script, /p_page_size: pageSize/);
  assert.match(script, /catalog-range/);
  assert.match(catalogMigration, /'total',\(select count\(\*\) from rows\)/);
});

test('community statuses use explicit labels and high-contrast non-color cues', () => {
  assert.match(script, /function statusBadge\(/);
  for (const state of ['pending', 'published', 'hidden', 'rejected', 'resolved']) assert.match(css, new RegExp(`status--${state}`));
  assert.match(css, /\.status-badge/);
  assert.match(script, /검토 대기/);
  assert.match(script, /처리 완료/);
});

test('dashboard headline metrics open their matching records and user details show retained core-action logs', () => {
  assert.match(html, /data-dashboard-target=/);
  assert.match(script, /data-dashboard-target/);
  assert.match(script, /function openDashboardTarget\(/);
  assert.match(script, /user\.activity/);
  assert.match(dashboardEnhancementsMigration, /'activity'/);
  assert.match(dashboardEnhancementsMigration, /operator_list_community_engagement/);
  assert.match(userActivityMigration, /interval '90 days'/);
  assert.match(userActivityMigration, /user_activity_events/);
  assert.match(userActivityConsentMigration, /user_has_current_policies/);
  const activityTable = userActivityMigration.match(/create table private\.user_activity_events \(([\s\S]*?)\);/);
  assert.ok(activityTable, 'activity table is defined');
  assert.doesNotMatch(activityTable[1], /detail|value|name|title|ingredient|quantity/i);
  assert.match(script, /사용 기록/);
  assert.match(script, /화면 열람은 기록하지 않으며/);
  assert.match(script, /90일 후 삭제/);
});

test('policy, operator, audit, and health screens use immutable or append-only server routes', () => {
  for (const rpc of ['operator_save_policy_draft', 'operator_publish_policy', 'operator_list_policies', 'operator_change_moderator', 'operator_list_moderators', 'operator_list_google_accounts', 'operator_list_audit', 'operator_health_snapshot']) assert.ok(policyMigration.includes(rpc), `${rpc} exists`);
  assert.match(policyMigration, /i\.provider\s*=\s*'google'/);
  assert.match(policyMigration, /identity_data->>'email_verified'='true'/);
  assert.match(policyMigration, /lower\(identity_data->>'email'\)=lower\(target_email\)/);
  assert.match(policyMigration, /last operator|last moderator/i);
  assert.match(policyBaseMigration, /policy_documents_immutable/);
  assert.match(policyAccessTest, /non-operator cannot read policy drafts/);
  assert.match(policyAccessTest, /published policy cannot be overwritten/);
  assert.match(operatorBootstrapMigration, /getgnsml@gmail\.com/);
  assert.match(operatorBootstrapMigration, /neuralagent\.dev@gmail\.com/);
  assert.match(operatorBootstrapMigration, /i\.provider='google'/);
  assert.match(operatorBootstrapMigration, /i\.identity_data->>'email_verified'='true'/);
  assert.match(html, /id="policy-detail"/);
  assert.match(html, /id="operator-candidate"/);
  assert.match(html, /id="audit-action"/);
  assert.match(script, /async function loadPolicies\(/);
  assert.match(script, /async function savePolicyDraft\(/);
  assert.match(script, /operator_bootstrap_google_owner/);
  assert.match(script, /async function loadAudit\(/);
  assert.match(script, /operator_health_snapshot/);
  assert.match(script, /async function loadOperators\(/);
  assert.match(script, /operator_change_moderator/);
  assert.match(script, /operator_publish_policy/);
});

test('public policy pages explain the new 90-day activity log and non-verified email signup', () => {
  assert.match(privacyPage, /2026-10-02/);
  assert.match(privacyPage, /가입·로그인/);
  assert.match(privacyPage, /90일 후 삭제/);
  assert.match(privacyPage, /화면 열람 기록을 복사하지 않으며/);
  assert.match(termsPage, /이메일 주소의 소유 여부를 확인하지 않으므로/);
  assert.match(termsPage, /자동 연결하지 않습니다/);
});
