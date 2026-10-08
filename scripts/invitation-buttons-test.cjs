const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file,deps={}) {
  const exports={};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  new Function('exports','require',code)(exports,name=>name.endsWith('.css')?{}:deps[name]||require(name));
  return exports;
}
function buttons(node,out=[]) {
  if(!node||typeof node!=='object')return out;
  if(node.type==='button')out.push(node);
  for(const child of [].concat(node.props?.children||[]).flat(Infinity))buttons(child,out);
  return out;
}
const termsContent=load('app/terms/terms-content.tsx',{'next/link':()=>null,'@/lib/attendance':{cancellationPolicy:'Test cancellation policy'}});
const Terms=load('app/invitation-terms-choice.tsx',{'next/link':()=>null,'./terms/terms-content':termsContent,'@/lib/participation-terms':load('lib/participation-terms.ts')}).default;
assert(termsContent.participationTermsSections.length>=19,'Full terms are embedded, not only linked');
const options=buttons(Terms({value:null,onChange:()=>{}}));
assert.equal(options.length,2);assert(options.every(b=>!b.props.disabled&&b.props.className==='invitation-choice-button'));
for(const answer of [true,false]) {
  let changed='unchanged';
  const selected=buttons(Terms({value:answer,onChange:value=>changed=value}));
  assert(selected.slice(0,2).every(b=>b.props.disabled),'Both answer buttons lock after choosing');
  assert.equal(selected.slice(0,2).filter(b=>b.props['aria-pressed']).length,1);
  selected[2].props.onClick();assert.equal(changed,null,'Explicit change answer unlocks the pair');
}
(async()=>{
  const photo=load('lib/photo-consent.ts'),terms=load('lib/participation-terms.ts');
  const Photos=load('app/join/photo-permissions.tsx').default;
  let savedPhotos;
  const photoButtons=buttons(Photos({value:{capture:null,hackathon:null,publicPosting:null},onChange:value=>savedPhotos=value}));
  assert.equal(photoButtons.length,2,'One Yes/No photo release replaces three questions');
  photoButtons[0].props.onClick();assert.deepEqual(savedPhotos,{capture:true,hackathon:true,publicPosting:true});
  photoButtons[1].props.onClick();assert.deepEqual(savedPhotos,{capture:false,hackathon:false,publicPosting:false});
  assert(photo.cleanPhotoConsent({...savedPhotos,version:photo.PHOTO_CONSENT_VERSION},new Date().toISOString()),'No to all photos is valid');
  assert.equal(photo.cleanPhotoConsent({capture:true,hackathon:false,publicPosting:false,version:photo.PHOTO_CONSENT_VERSION},new Date().toISOString()),null,'Bundled release cannot silently omit a use');
  assert(photo.cleanPhotoConsent({capture:true,hackathon:false,publicPosting:false,version:'2026-10-07-v2'},new Date().toISOString()),'Historical granular permissions preserved');
  const agreement=load('lib/invitation-agreement.ts',{'./photo-consent':photo,'./participation-terms':terms});
  const attendance=load('lib/attendance.ts');
  const member={rsvp:'pending',attendance:'unknown',...agreement.acceptInvitationAgreement({agreement:true,termsVersion:terms.PARTICIPATION_TERMS_VERSION,photoConsent:{capture:false,hackathon:false,publicPosting:false,version:photo.PHOTO_CONSENT_VERSION}},new Date().toISOString())};
  const fakeReact={useState:value=>[typeof value==='function'?value():value,()=>{}],useRef:value=>({current:value}),useEffect:()=>{},useSyncExternalStore:()=>null};
  const soundCues=[];
  const Panel=load('app/table/[token]/attendance-panel.tsx',{'../../interaction-experience':{useInteractionExperience:()=>({play:cue=>soundCues.push(cue)})},'react':fakeReact,'next/font/google':{DynaPuff:()=>({variable:'test-font'})},'./calendar-links':()=>null,'../../invitation-terms-choice':{default:Terms},'../../join/photo-permissions':{default:()=>null},'@/lib/attendance':attendance,'@/lib/photo-consent':photo,'@/lib/participation-terms':terms,'@/lib/invitation-agreement':agreement}).default;
  let calls=0,resolveFetch;const original=global.fetch;
  global.fetch=()=>{calls++;return new Promise(resolve=>resolveFetch=resolve);};
  try {
    const tree=Panel({token:'test-only',endpoint:'/api/dinner/test/session',table:{status:'invited',startsAt:new Date(Date.now()+86400000).toISOString(),cost:15,venueAddress:'Test only',sponsorDisclosure:'No sponsor'},initialMember:member});
    const pair=buttons(tree).filter(b=>b.props.className==='invitation-choice-button');
    assert.equal(pair.length,2);assert(pair.every(b=>!b.props.disabled));
    const first=pair[0].props.onClick();await pair[1].props.onClick();
    assert.equal(calls,1,'Opposite RSVP cannot submit while first request is pending');
    resolveFetch(Response.json({member:{...member,rsvp:'yes'}}));await first;
    assert.deepEqual(soundCues,['celebrate'],'Celebrate only after the RSVP is saved');
    const noTree=Panel({token:'test-only',table:{status:'invited',startsAt:new Date(Date.now()+86400000).toISOString(),cost:15,venueAddress:'Test only',sponsorDisclosure:'No sponsor'},initialMember:member});
    const decline=buttons(noTree).filter(b=>b.props.className==='invitation-choice-button')[1].props.onClick();
    resolveFetch(Response.json({member:{...member,rsvp:'no'}}));await decline;
    assert.deepEqual(soundCues,['celebrate','aw'],'A gentle aw plays after a saved decline');
    const failedTree=Panel({token:'test-only',table:{status:'invited',startsAt:new Date(Date.now()+86400000).toISOString(),cost:15,venueAddress:'Test only',sponsorDisclosure:'No sponsor'},initialMember:member});
    const failed=buttons(failedTree).filter(b=>b.props.className==='invitation-choice-button')[0].props.onClick();
    resolveFetch(Response.json({error:'Test failure'},{status:500}));await failed;
    assert.equal(soundCues.length,2,'No success sound when saving fails');
  } finally {global.fetch=original;}
  console.log('Invitation buttons: visible choice styling, exclusive selection, explicit reset and double-submit guard passed. No live RSVPs changed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
