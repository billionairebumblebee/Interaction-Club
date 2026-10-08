// Actual Join component event handlers + actual POST handler, with synthetic
// storage/network and a tiny React hook harness. No participant writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
function load(file, deps) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', 'process', 'window', 'fetch', code)(exports, name => deps[name] || require(name), { env: { BLOB_READ_WRITE_TOKEN: 'mock-only' } }, { setTimeout: fn => fn() }, async (_url, options) => post(new Request('https://example.invalid/api/applications', options)));
  return exports;
}
const deps = {};
for (const name of ['availability', 'pilot-week', 'dress-code', 'interest-tags', 'arrival-style', 'personality-quiz', 'school-work', 'locations', 'side-quests', 'photo-consent', 'participation-terms']) {
  const module = load('lib/' + name + '.ts', {});
  deps['@/lib/' + name] = deps['../../lib/' + name] = deps['./' + name] = module;
}
deps['@/lib/signup-availability'] = deps['../../lib/signup-availability'] = load('lib/signup-availability.ts', deps);
const records = [], jobs = [];
const post = load('app/api/applications/route.ts', { ...deps,
  '@vercel/blob': { put: async (_path, body) => records.push(JSON.parse(body)) },
  '@/lib/sheets': { queueSheetRecord: async job => jobs.push(job) },
  '@/lib/matching': { eveningIntents: ['Builder / founder', 'Chill / social', 'Open to either'] },
  '@/lib/referrals': { resolveInviter: async () => null },
  '@/lib/interest-catalog': { publishInterestTags: async () => {} },
}).POST;
let hooks = [], cursor = 0;
const mockReact = { ...React,
  useState: initial => { const i = cursor++; if (!(i in hooks)) hooks[i] = initial; return [hooks[i], value => { hooks[i] = typeof value === 'function' ? value(hooks[i]) : value; }]; },
  useRef: initial => { const i = cursor++; hooks[i] ??= { current: initial }; return hooks[i]; },
  useEffect: () => {}, useLayoutEffect: () => {},
};
const marker = name => Object.assign(() => null, { testName: name });
const widgets = Object.fromEntries(['personality-questions', 'school-work-fields', 'interest-picker', 'availability-calendar', 'side-quest-transport', 'photo-permissions'].map(name => ['./' + name, { default: marker(name) }]));
const Join = load('app/join/page.tsx', { ...deps, ...widgets, react: mockReact,
  'next/link': { default: 'a' }, '../club-brand': { CircleMark: marker('logo'), ClubNavigation: marker('nav'), ClubFooter: marker('footer') },
  '../interaction-experience': { useInteractionExperience: () => ({ play() {} }) }, '../../lib/inviters': { getInviter: () => null },
}).default;
let tree;
function render() { cursor = 0; tree = Join(); }
function all(node) { if (Array.isArray(node)) return node.flatMap(all); if (!node || typeof node !== 'object') return []; return [node, ...all(node.props?.children)]; }
function text(node) { if (Array.isArray(node)) return node.map(text).join(''); if (node === null || node === undefined || typeof node === 'boolean') return ''; if (typeof node === 'object') return text(node.props?.children); return String(node); }
function find(predicate) { const node = all(tree).find(predicate); assert(node, 'Expected UI element'); return node; }
function click(label) { find(n => n.type === 'button' && text(n).startsWith(label)).props.onClick({ preventDefault() {} }); render(); }
function fill(label, value) { const parent = find(n => n.type === 'label' && text(n).trim().startsWith(label)); const input = all(parent).find(n => ['input', 'select'].includes(n.type)); input.props.onChange({ target: { value, checked: value } }); render(); }
function widget(name) { return find(n => n.type?.testName === name); }
function basic(path) {
  hooks = []; render(); click(path);
  fill('Your full name', 'Synthetic UI'); fill('Your email', 'qa@example.invalid'); fill('Where are you based', 'Berkeley');
  find(n => n.props?.['aria-label'] === 'Birth month').props.onChange({ target: { value: '1' } }); render();
  find(n => n.props?.['aria-label'] === 'Birth year').props.onChange({ target: { value: '2006' } }); render();
  fill('I confirm', true); click('continue');
  if (path === 'The little personality quiz') click('continue');
  click('Just hang out'); click('Dinner'); click('Under $15'); click('Inclusive / everyone');
}
async function finish() {
  click('continue'); fill('I accept', true);
  widget('photo-permissions').props.onChange({ capture: false, hackathon: false, publicPosting: false }); render();
  await find(n => n.type === 'form' && n.props.onSubmit).props.onSubmit({ preventDefault() {} }); render();
  assert(text(tree).includes('You’re on our radar!'));
}
(async () => {
  for (const path of ['Quick signup', 'The little personality quiz']) {
    basic(path); click('continue');
    assert(find(n => n.props?.id === 'signup-availability-error'), 'Blank availability has inline error');
    assert.equal(records.length, jobs.length);
    const calendar = widget('availability-calendar');
    calendar.props.onToggle('Thu dinner'); render();
    assert(!all(tree).some(n => n.props?.id === 'signup-availability-error'), 'Error clears once an explicit time is selected');
    click(path === 'Quick signup' ? 'The little personality quiz' : 'Quick signup');
    assert.deepEqual(widget('availability-calendar').props.value, ['Thu dinner'], 'Path switch preserves shared times');
    click('back');
    if (path === 'Quick signup') click('back');
    click('continue'); if (path === 'Quick signup') click('continue');
    assert.deepEqual(widget('availability-calendar').props.value, ['Thu dinner'], 'Back/next preserve selections');
    await finish();
    assert.deepEqual(records.at(-1).availability, ['Thu dinner']);
    assert.deepEqual(jobs.at(-1).record.availability, ['Thu dinner']);
  }
  basic('Quick signup'); fill('Thursday, Oct 8', true); await finish();
  assert.deepEqual(records.at(-1).pilotWeekAvailability.dinnerDates, ['2026-10-08']);
  assert.deepEqual(records.at(-1).availability, [], 'Dated-only signup does not invent recurring availability');
  console.log('PASS: both real component paths block blank times; calendar visible; switching/back preserve choices; dated and recurring final submissions reach mocked storage and Sheet queue unchanged.');
})().catch(error => { console.error(error); process.exitCode = 1; });
