import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('./admin.html', import.meta.url), 'utf8');
const script = await readFile(new URL('./admin-v3.js', import.meta.url), 'utf8');
const css = await readFile(new URL('./styles.css', import.meta.url), 'utf8');
const timeseriesMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002100000_operator_dashboard_timeseries.sql', import.meta.url), 'utf8').catch(() => '');
const communityMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002120000_operator_community.sql', import.meta.url), 'utf8').catch(() => '');
const auditMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002110000_operator_audit_log.sql', import.meta.url), 'utf8').catch(() => '');
const usersKitchensMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002130000_operator_users_kitchens.sql', import.meta.url), 'utf8').catch(() => '');
const catalogMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002140000_operator_catalog.sql', import.meta.url), 'utf8').catch(() => '');
const pushAdminMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002150000_operator_push_admin.sql', import.meta.url), 'utf8').catch(() => '');
const policyMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002160000_operator_policy_access.sql', import.meta.url), 'utf8').catch(() => '');
const policyBaseMigration = await readFile(new URL('../today-hankki/supabase/migrations/20260925170000_account_receipt_p0.sql', import.meta.url), 'utf8').catch(() => '');
const policyAccessTest = await readFile(new URL('../today-hankki/supabase/tests/operator_policy_access.test.sql', import.meta.url), 'utf8').catch(() => '');
const operatorBootstrapMigration = await readFile(new URL('../today-hankki/supabase/migrations/20261002170000_operator_bootstrap_google_moderators.sql', import.meta.url), 'utf8').catch(() => '');
const pushAdminFunction = await readFile(new URL('../today-hankki/supabase/functions/operator-push-admin/index.ts', import.meta.url), 'utf8').catch(() => '');
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
  assert.match(html, /styles\.css\?v=20261002-crud/);
  assert.match(html, /admin-v3\.js\?v=20261002-crud/);
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
  assert.match(script, /id="policy-body"/);
  assert.match(html, /id="operator-search"/);
  assert.match(html, /id="audit-action"/);
});

test('home chart uses a manual KST series query with an accessible data table', () => {
  assert.match(html, /id="trend-grain"/);
  assert.match(html, /id="trend-table"/);
  assert.match(script, /operator_dashboard_timeseries/);
  assert.match(script, /function renderTrendChart\(/);
  assert.match(script, /function getTrendRange\(/);
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
});

test('push operations keep tokens server-side and restrict sends to one opted-in recipient', () => {
  for (const rpc of ['operator_save_push_template', 'operator_list_push_operations', 'operator_preview_push', 'operator_create_push_campaign', 'operator_cancel_push_campaign', 'operator_claim_due_push_campaigns']) assert.ok(pushAdminMigration.includes(rpc), `${rpc} exists`);
  assert.match(pushAdminFunction, /community_moderator_status/);
  assert.match(pushAdminFunction, /authData\.user\.id/);
  assert.match(pushAdminFunction, /register_push_device|push_devices/);
  assert.match(fcmShared, /fcm\.googleapis\.com\/v1\/projects/);
  assert.doesNotMatch(pushAdminFunction, /target_kind: ['"]all|broadcast/i);
  assert.match(script, /async function loadPushOperations\(/);
  assert.match(script, /operator_create_push_campaign/);
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
