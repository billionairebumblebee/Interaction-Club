const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const {renderToStaticMarkup} = require('react-dom/server');
const exportsObject = {};
const code = ts.transpileModule(fs.readFileSync('app/join/photo-permissions.tsx','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
new Function('exports','require',code)(exportsObject,name=>name.endsWith('.css')?{}:require(name));
const disclosure = 'Most dinners will include photography for Interaction Club’s social media and marketing. Prefer no photos? We’ll match you into a photo-free dinner, but availability is limited, so your invitation may take longer.';
for (const answer of [null,false,true]) {
  const value = {capture:answer,hackathon:answer,publicPosting:answer};
  const html = renderToStaticMarkup(require('react').createElement(exportsObject.default,{value,onChange:()=>{}}));
  assert(html.includes(disclosure));
  assert(html.indexOf(disclosure)<html.indexOf('aria-label="Photo and video release"'),'Disclosure precedes the choice');
  assert(html.includes('Change or withdraw permission'));
  if (answer !== null) assert(html.includes('Change my answer'));
  assert.deepEqual(value,{capture:answer,hackathon:answer,publicPosting:answer},'Rendering does not change consent');
}
const signup = fs.readFileSync('app/join/page.tsx','utf8');
assert(signup.includes('step === 2 && <section className="step-content"><PhotoPermissions'),'Both paths use the same consent screen');
console.log('PASS: exact disclosure before photo choice, shared signup component, explicit answers and prospective preference changes.');
