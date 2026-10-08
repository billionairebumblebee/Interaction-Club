const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const source = fs.readFileSync('app/(club)/partner-invitation.tsx', 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
function render(kind, stage, name = '') {
  let state = 0;
  const exports = {};
  new Function('exports', 'require', code)(exports, path => {
    if (path === 'react') return { useState: () => [state++ === 0 ? stage : name, () => {}], useRef: () => ({current:null}), useEffect: () => {} };
    if (path === '../club-brand') return { CircleMark: () => React.createElement('span', null, 'Circle logo') };
    if (path === '../interaction-experience') return { useInteractionExperience: () => ({play: () => {}}) };
    return require(path);
  });
  return renderToStaticMarkup(React.createElement(exports.default, {kind}));
}
for (const kind of ['sponsor','invest']) {
  const front = render(kind, 'front');
  assert.match(front, /Your name here/);
  assert.match(front, /Turn it over/);
  assert.doesNotMatch(front, /required=/);
  assert.match(render(kind, 'back'), /Open the letter/);
  const letter = render(kind, 'letter', '<Avery & Co>');
  assert.match(letter, /Dear &lt;Avery &amp; Co&gt;/, 'Personalized text is escaped');
  assert.match(letter, /mailto:vivian_yang@berkeley.edu/);
  assert.match(letter, /https:\/\/calendly.com\/vivian_yang-berkeley\/30min/);
  assert.doesNotMatch(letter, /<form/, 'No partner intake gate');
  assert.match(render(kind, 'letter'), /Dear future (partner|backer)/);
}
assert.doesNotMatch(source, /fetch\(|localStorage|sessionStorage/, 'Partner names remain ephemeral, not submitted or stored');
for (const role of ['sponsors','investors']) {
  const page = fs.readFileSync(`app/(club)/${role}/page.tsx`, 'utf8');
  assert.match(page, /PartnerInvitation/);
  assert.match(page, /CommunityMarketSignals/);
  assert.match(page, /PartnerFounder/);
  assert.match(page, /ic-partner-invite/);
}
console.log('PASS: sponsor/investor front, flip, personalized letter, safe name handling, no form gate, direct contact and preserved page content.');
