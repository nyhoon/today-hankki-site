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
const affiliateAnalyticsMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261004120000_saved_recipes_and_affiliate_search_metrics.sql', import.meta.url), 'utf8').catch(() => '');
const affiliatePrivacyMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261004130000_publish_affiliate_search_privacy.sql', import.meta.url), 'utf8').catch(() => '');
const affiliateAggregationMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261005100000_reliable_affiliate_handoff_aggregation.sql', import.meta.url), 'utf8').catch(() => '');
const affiliateSearchTermsMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261005150000_affiliate_search_terms.sql', import.meta.url), 'utf8').catch(() => '');
const affiliateTermDetailsMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261005170000_affiliate_search_term_details.sql', import.meta.url), 'utf8').catch(() => '');
const ingredientCatalogExpansionMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261005180000_expand_ingredient_catalog.sql', import.meta.url), 'utf8').catch(() => '');
const ingredientVariantExpansionMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261005190000_expand_recipe_ingredient_variants.sql', import.meta.url), 'utf8').catch(() => '');
const affiliateDetailMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261005160000_affiliate_metric_details.sql', import.meta.url), 'utf8').catch(() => '');
const lifecycleMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261005120000_app_lifecycle_tracking.sql', import.meta.url), 'utf8').catch(() => '');
const boundedActivityMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261005130000_privacy_bounded_activity_and_affiliate_counts.sql', import.meta.url), 'utf8').catch(() => '');
const userInsightsMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261004150000_user_search_insights.sql', import.meta.url), 'utf8').catch(() => '');
const pushAdminFunction = await readFile(new URL('../today-hankki/supabase/functions/operator-push-admin/index.ts', import.meta.url), 'utf8').catch(() => '');
const dispatchPushFunction = await readFile(new URL('../today-hankki/supabase/functions/dispatch-pushes/index.ts', import.meta.url), 'utf8').catch(() => '');
const fcmShared = await readFile(new URL('../today-hankki/supabase/functions/_shared/fcm.ts', import.meta.url), 'utf8').catch(() => '');
const authAdminFunction = await readFile(new URL('../today-hankki/supabase/functions/operator-auth-admin/index.ts', import.meta.url), 'utf8').catch(() => '');
const destinations = ['home', 'community', 'users', 'kitchens', 'catalog', 'push', 'policies', 'operators', 'affiliate', 'lifecycle'];

function activityRenderer() {
  const startMarker = '/* USER_ACTIVITY_RENDERER_START */';
  const endMarker = '/* USER_ACTIVITY_RENDERER_END */';
  const start = script.indexOf(startMarker);
  const end = script.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0 && end > start, 'user activity renderer is isolated for safe testing');
  const source = script.slice(start + startMarker.length, end);
  return new Function('escapeHtml', 'dateText', `${source}; return renderUserActivityMarkup;`)(
    (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]),
    (value) => String(value ?? '—'),
  );
}

test('operator dashboard exposes ten unique destinations and guarded states', () => {
  for (const id of destinations) {
    assert.match(html, new RegExp(`data-admin-page="${id}"`), `${id} navigation exists`);
    assert.match(html, new RegExp(`id="page-${id}"`), `${id} panel exists`);
  }
  assert.match(html, /id="login"/);
  assert.match(html, /id="denied"/);
  assert.match(html, /id="dashboard"/);
  assert.match(html, /styles\.css\?v=20261005-affiliate-catalog-4/);
  assert.match(html, /admin-v3\.js\?v=20261005-affiliate-catalog-4/);
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

test('push campaigns choose a purpose, preview their destination, and preserve it through confirmation and APIs', () => {
  const categories = ['expiry', 'recipes', 'shopping', 'kitchen', 'operator'];
  for (const category of categories) assert.match(html, new RegExp(`<option value="${category}"`));
  assert.match(html, /id="push-campaign-destination"/);
  assert.match(script, /const pushCampaignCategories = \{/);
  assert.match(script, /byId\('push-campaign-category'\)/);
  assert.match(script, /destination/);
  const sendFlow = script.match(/async function schedulePushCampaign\(\) \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(sendFlow, /p_category: category/);
  assert.match(sendFlow, /목적: \$\{purpose\.label\}[\s\S]*?\$\{purpose\.destination\}/);
  const selfTest = script.match(/async function testPushToSelf\(\) \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(selfTest, /category, title, body/);
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
  assert.match(script, /RECENT ACTIVITY/);
  assert.match(script, /바코드, 레시피·후기·신고 본문과 사진은 상세 로그에 넣지 않으며/);
  assert.match(script, /90일 후 정리합니다/);
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
  assert.match(privacyPage, /2026-10-05-v8/);
  assert.match(privacyPage, /가입·로그인/);
  assert.match(privacyPage, /최근 90일/);
  assert.match(privacyPage, /화면 열람 기록은 활동 상세에 복사하지 않습니다/);
  assert.match(privacyPage, /변경 전·후 값/);
  assert.match(termsPage, /이메일 주소의 소유 여부를 확인하지 않으므로/);
  assert.match(termsPage, /자동 연결하지 않습니다/);
});

test('privacy v7 activity detail is allowlisted, moderator-only, and retained for 90 days', () => {
  assert.match(boundedActivityMigration, /add column details jsonb not null default '\{\}'::jsonb/i);
  assert.match(boundedActivityMigration, /build_user_activity_details/);
  assert.match(boundedActivityMigration, /name','quantity','unit','location','date_kind','label_date','opened_at','confirmed/);
  assert.match(boundedActivityMigration, /array\['name','quantity','unit','location','checked'\]/);
  assert.match(boundedActivityMigration, /interval '90 days'/);
  assert.match(boundedActivityMigration, /details',events\.details/);
  assert.match(boundedActivityMigration, /Moderator only/);
  assert.match(privacyPage, /2026-10-05-v8/);
  assert.match(privacyPage, /바코드, 레시피·후기·신고 본문, 사진/);
  assert.match(privacyPage, /최신 이용약관·개인정보처리방침 동의를 확인한 뒤/);
  assert.match(privacyPage, /최신 개인정보처리방침에 동의한 경우에만 기록하고 Firebase 분석 동의와는 별개입니다/);
});

test('affiliate ingredient click totals are visible to operators and disclosed', () => {
  assert.match(html, /id="affiliate-top"/);
  assert.match(html, /최근 30일 외부 열기/);
  assert.match(html, /파트너스 실적 리포트/);
  assert.match(script, /operator_top_affiliate_ingredients/);
  assert.match(affiliateAnalyticsMigration, /create table private\.affiliate_search_daily/);
  assert.match(affiliateAnalyticsMigration, /ingredient_id text/);
  assert.match(affiliateAnalyticsMigration, /not exists\s*\(\s*select 1 from public\.ingredients/i);
  assert.match(privacyPage, /한국 날짜·진입 경로별 횟수/);
  assert.match(privacyPage, /앱이 쿠팡 링크에 넣어 전달한 검색어는/);
  assert.match(affiliateAnalyticsMigration, /private\.has_current_policies/);
  assert.match(affiliateAnalyticsMigration, /Asia\/Seoul/);
  assert.match(affiliateAnalyticsMigration, /cleanup_affiliate_search_daily/);
  assert.match(affiliateAnalyticsMigration, /cron\.schedule/);
  assert.match(affiliatePrivacyMigration, /매일 오전 1시\(한국 시간\)/);
  assert.match(affiliatePrivacyMigration, /2026-10-04-v3/);
  assert.match(affiliateAggregationMigration, /2026-10-05-v5/);
});

test('outbound Coupang search terms are anonymous, bounded, disclosed, and visible to operators', () => {
  assert.match(html, /id="affiliate-terms"/);
  assert.match(html, /모든 쿠팡 검색어/);
  assert.match(html, /표준 미연결 포함/);
  assert.match(html, /id="affiliate-terms-pagination"/);
  assert.match(script, /operator_list_affiliate_search_terms/);
  assert.match(script, /affiliateTermPage/);
  assert.match(script, /pageControl\('affiliate-term'/);
  assert.match(script, /renderAffiliateManagement\(dailyRows, ingredientRows, termRows/);
  assert.match(script, /표준 재료 연결/);
  assert.match(affiliateSearchTermsMigration, /affiliate_search_term_daily/);
  assert.match(affiliateSearchTermsMigration, /p_search_term/);
  assert.match(affiliateSearchTermsMigration, /date - 89/);
  assert.match(affiliateSearchTermsMigration, /length\(regexp_replace\(normalized_term, '\[\^0-9\]'/);
  assert.match(affiliateSearchTermsMigration, /operator_top_affiliate_search_terms/);
  assert.match(affiliateTermDetailsMigration, /operator_list_affiliate_search_terms/);
  assert.match(affiliateTermDetailsMigration, /left join lateral/i);
  assert.match(affiliateTermDetailsMigration, /ingredient_id/);
  assert.match(affiliateTermDetailsMigration, /p_page_size\s*>\s*100/);
  assert.match(affiliateSearchTermsMigration, /Current policy acceptance required/);
  assert.match(privacyPage, /2026-10-05-v8/);
  assert.match(privacyPage, /앱이 쿠팡 링크에 넣어 전달한 검색어/);
  assert.match(privacyPage, /전화번호처럼 보이는 값은 검색어 통계에서 제외/);
  assert.match(privacyPage, /90일/);
  assert.match(privacyPage, /쿠팡 화면이 열린 뒤 이용자가 그곳에서 직접 입력하거나 바꾼 검색어는 앱에서 읽거나 집계하지 않습니다/);
});

test('ingredient catalog expands from curated recipe ingredients and maps exact names only', () => {
  assert.match(ingredientCatalogExpansionMigration, /insert into public\.ingredients/i);
  assert.match(ingredientCatalogExpansionMigration, /돼지고기 삼겹살/);
  assert.match(ingredientCatalogExpansionMigration, /삼겹살/);
  assert.match(ingredientCatalogExpansionMigration, /source_ingredient_names/);
  assert.match(ingredientCatalogExpansionMigration, /review_status\s*=\s*'linked'/);
  assert.match(ingredientCatalogExpansionMigration, /s\.ingredient_id is null/);
  assert.match(ingredientCatalogExpansionMigration, /having count\(distinct ingredient\.id\) = 1/i);
  assert.doesNotMatch(ingredientCatalogExpansionMigration, /'\['/);
  const inserts = ingredientCatalogExpansionMigration.match(/\('(?:[a-z0-9_-]+)',\s*'[^']+',\s*'[^']+'/g) ?? [];
  assert.ok(inserts.length >= 100, `expected at least 100 curated catalog rows, got ${inserts.length}`);
  assert.match(ingredientVariantExpansionMigration, /청고추/);
  assert.match(ingredientVariantExpansionMigration, /맛간장/);
  assert.match(ingredientVariantExpansionMigration, /발사믹소스/);
  assert.match(ingredientVariantExpansionMigration, /review_status = 'candidate'/);
  assert.match(ingredientVariantExpansionMigration, /having count\(distinct ingredient\.id\) = 1/i);
  const variantRows = ingredientVariantExpansionMigration.match(/\('(?:[a-z0-9_-]+)',\s*'[^']+',\s*'[^']+'/g) ?? [];
  assert.ok(variantRows.length >= 40, `expected at least 40 additional curated variants, got ${variantRows.length}`);
});

test('account withdrawals and invalid FCM tokens are shown only as anonymous lifecycle aggregates', () => {
  assert.match(html, /data-admin-page="lifecycle"/);
  assert.match(html, /id="page-lifecycle"/);
  assert.match(html, /확정 탈퇴/);
  assert.match(html, /삭제 추정 신호/);
  assert.match(html, /Android.*Firebase Analytics/s);
  assert.match(html, /앱 삭제는 개인별로 추적하지 않습니다/);
  assert.match(script, /operator_app_lifecycle_daily/);
  assert.match(dispatchPushFunction, /rpc\/record_invalid_push_device/);
  assert.doesNotMatch(dispatchPushFunction, /markDeviceInactive/);
  assert.match(script, /invalid_fcm_token/);
  assert.match(lifecycleMigration, /create table private\.app_lifecycle_daily/i);
  assert.match(lifecycleMigration, /account_withdrawal/);
  assert.match(lifecycleMigration, /invalid_fcm_token/);
  assert.match(lifecycleMigration, /delete from auth\.users where id = auth\.uid\(\)/i);
  assert.match(lifecycleMigration, /operator_app_lifecycle_daily/);
  assert.match(lifecycleMigration, /grant execute on function public\.record_invalid_push_device\(uuid\) to service_role/i);
  assert.match(privacyPage, /탈퇴 완료 건수와 무효 FCM 토큰 건수는 개인 식별자·토큰 없이/);
  assert.match(privacyPage, /FCM 토큰 무효화는 앱 삭제 확정이 아닙니다/);
  assert.match(privacyPage, /Android에서 Firebase Analytics를 허용한 경우/);
});

test('Coupang management separates browser handoffs from Coupang sales reports', () => {
  assert.match(html, /data-admin-page="affiliate"/);
  assert.match(html, /id="page-affiliate"/);
  for (const id of ['affiliate-total', 'affiliate-known', 'affiliate-unmapped', 'affiliate-sources', 'affiliate-daily', 'affiliate-top']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(script, /operator_affiliate_search_daily/);
  assert.match(script, /operator_top_affiliate_ingredients/);
  assert.match(script, /function renderAffiliateManagement\(/);
  assert.match(html, /COUPANG PARTNERS/);
  assert.match(html, /구매와 수수료는 쿠팡 파트너스 실적 리포트에서 확인/);
  assert.match(affiliateAggregationMigration, /affiliate_search_daily_totals/);
  assert.match(affiliateAggregationMigration, /operator_affiliate_search_daily/);
  assert.match(html, /AF9512210/);
  assert.match(html, /TodayHankki/);
});

test('Coupang management shows last successful refresh and keeps empty, loading, and error states distinct', () => {
  assert.match(html, /id="affiliate-last-refresh"/);
  assert.match(html, /마지막 조회: 아직 없음/);
  assert.match(script, /function setAffiliateRefreshState\(/);
  assert.match(script, /dataset\.lastSuccess/);
  assert.match(script, /일부 조회 실패/);
  assert.match(script, /최근 30일 외부 브라우저 열기 기록이 없습니다\./);
  assert.match(script, /집계를 불러오지 못했어요:/);
  assert.match(script, /마지막 성공 조회/);
});

test('Coupang dashboard counts open privacy-safe aggregated detail', () => {
  assert.match(html, /data-affiliate-summary="total"/);
  assert.match(html, /data-affiliate-summary="known"/);
  assert.match(html, /data-affiliate-summary="unmapped"/);
  assert.match(script, /function openAffiliateMetricDetail\(/);
  assert.match(script, /data-affiliate-detail-column/);
  assert.match(script, /operator_affiliate_ingredient_daily/);
  assert.match(script, /operator_affiliate_search_term_daily/);
  assert.match(script, /날짜·화면별 익명 합계 \(개별 이용자 내역 없음\)/);
  assert.match(affiliateDetailMigration, /operator_affiliate_ingredient_daily/);
  assert.match(affiliateDetailMigration, /operator_affiliate_search_term_daily/);
  assert.match(affiliateDetailMigration, /private\.is_community_moderator\(\)/);
  assert.match(affiliateDetailMigration, /Moderator only/);
  assert.match(affiliateDetailMigration, /p_to - p_from > 90/);
});

test('user detail is a single responsive workspace with consented ingredient history', () => {
  assert.match(html, /사용자 프로필 한 화면에서 이어서 볼 수 있습니다/);
  assert.match(script, /classList\.add\('user-profile-detail'\)/);
  for (const section of ['user-profile-summary', 'user-profile-kitchens', 'user-profile-community', 'user-profile-privacy', 'user-profile-searches', 'user-profile-activity', 'user-profile-actions']) {
    assert.ok(script.includes(section), `${section} is present in the one-page user profile`);
  }
  assert.match(script, /const locked = preview\.is_self \|\| preview\.is_operator/);
  assert.match(script, /user\.search_events/);
  assert.match(script, /user\.analytics_consent/);
  assert.match(script, /자유 입력 원문과 수량은 저장하지 않습니다/);
  assert.match(css, /\.user-profile-detail\s*\{/);
  assert.match(css, /\.user-profile-grid\s*\{/);
});

test('user activity shows create, update, and delete field diffs with legacy fallback', () => {
  const renderer = activityRenderer();
  const created = renderer({ action: '재료 등록', at: '2026-10-05T01:00:00Z', details: {
    entity: 'inventory', operation: 'created', item_name: '달걀',
    changes: [{ field: 'quantity', before: null, after: 5 }],
  } });
  const updated = renderer({ action: '재료 정보 변경', at: '2026-10-05T02:00:00Z', details: {
    entity: 'inventory', operation: 'updated', item_name: '달걀',
    changes: [{ field: 'quantity', before: 5, after: 3 }],
  } });
  const deleted = renderer({ action: '재료 삭제', at: '2026-10-05T03:00:00Z', details: {
    entity: 'inventory', operation: 'deleted', item_name: '달걀',
    changes: [{ field: 'quantity', before: 3, after: null }],
  } });
  assert.match(created, /추가/);
  assert.match(created, /5/);
  assert.match(updated, /수정/);
  assert.match(updated, /5/);
  assert.match(updated, /3/);
  assert.match(deleted, /삭제/);
  assert.match(deleted, /없음/);
  const legacy = renderer({ action: '로그인', at: '2026-10-05T04:00:00Z', details: {} });
  assert.match(legacy, /로그인/);
  assert.doesNotMatch(legacy, /<details/);
});

test('user activity escapes server values and stays readable on narrow screens', () => {
  const renderer = activityRenderer();
  const markup = renderer({ action: '<img src=x onerror=alert(1)>', at: '2026-10-05T01:00:00Z', details: {
    entity: 'shopping', operation: 'updated', item_name: '<script>재료</script>',
    changes: [{ field: 'name', before: '<b>old</b>', after: '새 이름' }],
  } });
  assert.match(markup, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(markup, /&lt;script&gt;재료&lt;\/script&gt;/);
  assert.match(markup, /&lt;b&gt;old&lt;\/b&gt;/);
  assert.doesNotMatch(markup, /<script>|<img|<b>/);
  assert.match(css, /\.user-activity-details/);
  assert.match(css, /@media\(max-width:420px\)[\s\S]*?user-activity/);
});

test('account-linked ingredient searches are optional, canonical-only, and expire after 90 days', () => {
  for (const fragment of [
    'private.user_ingredient_search_consent',
    'private.user_ingredient_search_events',
    'public.get_my_ingredient_search_consent',
    'public.set_my_ingredient_search_consent',
    'public.record_my_ingredient_search',
    'private.cleanup_user_ingredient_search_events',
    "interval '90 days'",
    "'2026-10-04-v4'",
  ]) assert.ok(userInsightsMigration.includes(fragment), `${fragment} is installed`);
  assert.match(userInsightsMigration, /delete from private\.user_ingredient_search_events where user_id=current_user_id/i);
  assert.match(userInsightsMigration, /not exists\s*\(\s*select 1 from public\.ingredients/i);
  assert.match(userInsightsMigration, /'search_events'/);
  assert.match(userInsightsMigration, /'analytics_consent'/);
  assert.match(userInsightsMigration, /'is_self'/);
  assert.match(userInsightsMigration, /'is_operator'/);
  const detailRpc = userInsightsMigration.match(/create or replace function public\.operator_get_user_detail[\s\S]*?revoke all on function public\.operator_get_user_detail/)?.[0] ?? '';
  assert.match(detailRpc, /language plpgsql stable security definer/i);
  assert.doesNotMatch(detailRpc, /delete\s+from/i, 'read-only detail RPC does not delete expired rows');
  assert.match(privacyPage, /2026-10-05-v8/);
  assert.match(privacyPage, /계정별 재료 검색 이력/);
  assert.match(privacyPage, /계정별 재료 검색 이력을 끄면 해당 계정 검색 이력을 바로 삭제/);
  assert.match(privacyPage, /자유 입력 원문, 일부 입력, 수량, 키 입력 과정은 저장하지 않습니다/);
});
