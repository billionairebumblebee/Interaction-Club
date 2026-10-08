const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const records = new Map();
const result = {};
const source = ts.transpileModule(fs.readFileSync('lib/referrals.ts', 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
new Function('exports', 'require', 'process', source)(result, name => {
  if (name === './inviters') return {getInviter: slug => typeof slug === 'string' && slug.toLowerCase() === 'vivian' ? {slug:'vivian', name:'Vivian'} : null};
  if (name === '@vercel/blob') return {
    get: async path => records.has(path) ? {stream: new Response(records.get(path)).body} : null,
    put: async (path, value, options) => { assert.equal(options.allowOverwrite, false); assert.equal(options.access, 'private'); if(records.has(path)) throw Error('collision'); records.set(path, value); }
  };
  throw Error(name);
}, {env: {BLOB_READ_WRITE_TOKEN: 'mock-only'}});
(async () => {
  assert.equal(result.referralSlug(' ÉMILY Smith '), 'emily-smith');
  for(const slug of ['share', 'admin', 'vivian', '../test', '']) assert.equal(result.validReferralSlug(slug), false);
  assert.deepEqual(await result.resolveInviter('VIVIAN'), {slug:'vivian', name:'Vivian'});
  assert.equal(await result.resolveInviter('missing'), null);
  assert.deepEqual(await result.createReferrer('Emily', 'emily'), {slug:'emily', name:'Emily'});
  assert.deepEqual(await result.resolveInviter('EMILY'), {slug:'emily', name:'Emily'});
  const second = await result.createReferrer('Another Emily', 'emily');
  assert.notEqual(second.slug, 'emily');
  assert.equal((await result.resolveInviter('emily')).name, 'Emily');
  assert.deepEqual(result.referralCounts([{email:'A@test.com',invitedBy:'vivian'}, {email:'a@test.com ',invitedBy:'vivian'}, {email:'b@test.com',invitedBy:'emily'}, {email:'c@test.com'}]), [{slug:'emily',signups:1},{slug:'vivian',signups:1}]);
  console.log('PASS: case-insensitive links, protected routes, durable links, collision protection and unique signup counts. No external writes.');
})().catch(error => {console.error(error); process.exit(1);});
