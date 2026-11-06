import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('./admin-v3.js', import.meta.url), 'utf8');
const code = source.split('/* KITCHEN_INVENTORY_RENDERER_START */')[1].split('/* KITCHEN_INVENTORY_RENDERER_END */')[0];
const context = vm.createContext({ escapeHtml: (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])), dateText: v => v || '-' });
vm.runInContext(code, context);
const output = context.kitchenInventoryMarkup({total:3,items:[
 {name:'<img src=x onerror=alert(1)>',quantity:1,quantity_state:'present',unit:'개',location:'냉장',date_kind:'unknown'},
 {name:'우유',quantity:1,quantity_state:'low',unit:'개',location:'냉장',date_kind:'consume_by',label_date:'2026-11-10',date_verified:false},
 {name:'바나나',quantity:50,quantity_state:'exact',unit:'g',location:'실온',date_kind:'unknown'}
]});
assert(!output.includes('<img'));
for (const text of ['&lt;img','있어요','조금 남음','50 g','소비기한 2026-11-10 · 확인 필요','읽기 전용','조회 기록']) assert(output.includes(text),text);
assert(context.kitchenInventoryMarkup({total:0,items:[]}).includes('보관 중인 재료가 없습니다'));
assert(!output.includes('data-role-save'));
console.log('Inventory renderer: escaping, quantity states, dates, empty state, read-only passed.');
