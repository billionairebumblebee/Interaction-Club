const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, mockRequire = () => { throw Error('Unexpected dependency'); }, env = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', 'process', code)(exports, mockRequire, { env });
  return exports;
}
const tags = load('lib/interest-tags.ts');
for (const input of ['AI AGENTS', 'ai agents', 'Ai Agents', 'aI aGeNtS']) {
  assert.equal(tags.cleanTag(input), 'AI agents');
  assert.deepEqual(tags.suggestInterests(input), tags.suggestInterests('AI agents'));
}
assert.equal(tags.cleanInterests(['POTTERY', 'pottery', 'Pottery']).length, 1, 'Custom tags ignore capitalization too');
assert.deepEqual(tags.cleanInterests([' ai   agents ', 'AI AGENTS', 'Makeup']), ['AI agents', 'Makeup']);
assert.equal(tags.cleanInterests(tags.starterInterests).length, 5);
for (const bad of ['https://example.com', 'person@example.com', '5551234567', 'A'.repeat(41), '<script>', '../private', '']) assert.equal(tags.cleanTag(bad), '');
for (const good of ['C++', 'C#', '3D printing', 'K-pop', '艺术', 'Makeup']) assert(tags.cleanTag(good));
assert(tags.suggestInterests('vibe').includes('Vibe coding'));
assert(tags.suggestInterests('engineering').includes('Mechanical engineering'));
assert(!tags.suggestInterests('AI', [], ['AI agents']).includes('AI agents'));
assert(tags.suggestInterests('').length <= 8);
assert(tags.suggestInterests('pot', ['Pottery']).includes('Pottery'));

(async () => {
  const writes = [];
  let requestedPrefix;
  const catalog = load('lib/interest-catalog.ts', name => {
    if (name === './interest-tags') return tags;
    if (name === '@vercel/blob') return {
      put: async (path, body, options) => { writes.push({ path, body, options }); },
      list: async options => { requestedPrefix = options.prefix; assert.equal(options.limit, 16); return { blobs: [{ pathname: 'interest-tags/pottery.json' }, { pathname: 'interest-tags/%E0%A4%A.json' }] }; },
    };
    throw Error(name);
  }, { BLOB_READ_WRITE_TOKEN: 'stub-only' });
  await catalog.publishInterestTags(['Pottery', 'POTTERY', 'AI agents']);
  assert.equal(writes.length, 2);
  assert.deepEqual(writes.map(w => w.path), ['interest-tags/pottery.json', 'interest-tags/ai%20agents.json']);
  assert(writes.every(w => w.body === '{}' && w.options.access === 'private' && w.options.allowOverwrite), 'No profile data or raw counters stored');
  assert.deepEqual(await catalog.findCommunityTags('pot'), ['pottery']);
  assert.equal(requestedPrefix, 'interest-tags/pot');
  assert.deepEqual(await catalog.findCommunityTags('p'), []);
  const route = load('app/api/interests/route.ts', name => {
    if (name === '@/lib/interest-tags') return tags;
    if (name === '@/lib/interest-catalog') return { findCommunityTags: async () => ['Pottery'] };
    throw Error(name);
  });
  assert.deepEqual(await (await route.GET(new Request('https://test/api/interests?q=pot'))).json(), { tags: ['Pottery'] });
  const fallback = load('app/api/interests/route.ts', name => name === '@/lib/interest-tags' ? tags : { findCommunityTags: async () => { throw Error('offline'); } });
  assert((await (await fallback.GET(new Request('https://test/api/interests?q=AI'))).json()).tags.includes('AI agents'));
  console.log('PASS: individual seeds, case-insensitive deduplication, limits, input filtering, suggestions, label-only index, bounded search and offline fallback. All storage mocked.');
})().catch(error => { console.error(error); process.exit(1); });
