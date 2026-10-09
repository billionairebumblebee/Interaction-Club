const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const blobs = new Map(); let serial = 0;
const blob = {
  get: async key => { const item = blobs.get(key); return item ? { stream: new Response(item.value).body, blob: { etag: item.etag } } : null; },
  put: async (key, value, options) => { const old = blobs.get(key); if (options.ifMatch && options.ifMatch !== old?.etag || options.allowOverwrite === false && old) { const error = new Error('Precondition failed'); error.name = 'BlobPreconditionFailedError'; throw error; } blobs.set(key, { value, etag: String(++serial) }); },
  list: async ({prefix}) => ({blobs:[...blobs.keys()].filter(key=>key.startsWith(prefix)).map(pathname=>({pathname})),hasMore:false}),
};
const cache = new Map();
function load(file) {
  file = path.resolve(file); if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('exports','require','process',code)(exports, name => {
    if(name==='@vercel/blob') return blob;
    if(name==='@/lib/sheets') return {queueSheetRecord:async()=>{}};
    if(name.startsWith('@/')) return load(name.slice(2)+'.ts');
    if(name.startsWith('.')) return load(path.resolve(path.dirname(file),name+'.ts'));
    return require(name);
  }, {env:{BLOB_READ_WRITE_TOKEN:'synthetic',INTERACTION_ADMIN_KEY:'synthetic-admin'}});
  return exports;
}
const store=load('lib/concierge.ts'), arrival=load('lib/dinner-arrival.ts'), attendance=load('lib/attendance.ts'), reminders=load('lib/dinner-reminders.ts');
const api=load('app/api/table/[token]/route.ts'), host=load('app/api/host/arrival/route.ts'), access=load('app/api/admin/arrival-access/route.ts');
const terms=load('lib/participation-terms.ts'), photo=load('lib/photo-consent.ts');
const now=Date.now(), hour=3600000, iso=n=>new Date(n).toISOString();
const guest={applicationId:'synthetic-guest',token:'synthetic-private-token-0000001',rsvp:'yes',attendance:'unknown',expiresAt:iso(now+24*hour),invitationSentAt:iso(now-24*hour),termsAcceptance:{version:terms.PARTICIPATION_TERMS_VERSION,acceptedAt:iso(now-hour)},photoConsent:{version:photo.PHOTO_CONSENT_VERSION,capture:false,hackathon:false,publicPosting:false,recordedAt:iso(now-hour)}};
const table={id:'synthetic-table',dinnerId:'dinner-99',status:'invited',activity:'Dinner',hostName:'Synthetic Host',createdAt:iso(now-hour),startsAt:iso(now+10*60000),endsAt:iso(now+70*60000),responseDeadline:iso(now-hour),venueName:'Synthetic venue',venueAddress:'Example only',members:[guest,{...guest,applicationId:'other-guest',token:'other-private-token-0000002'}]};
const ctx={params:Promise.resolve({token:guest.token})};
const request=(url,body,headers={})=>new Request(url,{method:body?'POST':'GET',headers:{'origin':'https://example.invalid','content-type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{})});
const patch=body=>api.PATCH(new Request('https://example.invalid',{method:'PATCH',body:JSON.stringify(body)}),ctx);
(async()=>{
  await store.saveTable(table);
  await store.writeRecord('applications/synthetic-guest.json',{id:guest.applicationId,fullName:'Synthetic Guest',email:'qa@example.invalid',dietaryOther:'PRIVATE INTAKE',interests:['PRIVATE INTEREST']});
  await store.writeRecord('applications/other-guest.json',{id:'other-guest',fullName:'Other Person',email:'other@example.invalid'});
  for(const value of ['on-my-way','running-late','here']) { assert.equal((await patch({action:'arrival',value,etaMinutes:12})).status,200); const live=(await store.getTable(table.id)).members[0]; assert.equal(live.arrival.status,value); assert.equal(live.rsvp,'yes'); assert.equal(live.attendance,'unknown'); }
  assert.equal((await patch({action:'arrival',value:'running-late',etaMinutes:-1})).status,400);
  assert.equal((await patch({action:'arrival',value:'help'})).status,200);
  const help=(await store.getTable(table.id)).members[0].arrivalHelp;
  assert.equal((await patch({action:'arrival',value:'help'})).status,200);
  assert.equal((await store.getTable(table.id)).members[0].arrivalHelp.id,help.id,'Pending help deduplicated');
  const guestText=await (await api.GET(request('https://example.invalid'),ctx)).text();
  for(const secret of ['other-guest', 'other-private-token', 'qa@example.invalid', 'PRIVATE INTAKE','PRIVATE INTEREST']) assert(!guestText.includes(secret));
  assert.equal((await host.GET(request('https://example.invalid/api/host/arrival?tableId=synthetic-table'))).status,401);
  const provision=await access.POST(request('https://example.invalid/api/admin/arrival-access',{tableId:table.id,action:'provision',confirmAssignedHost:true},{'x-interaction-admin-key':'synthetic-admin'}));
  assert.equal(provision.status,200); const {hostKey}=await provision.json(); const auth={'x-interaction-host-key':hostKey};
  const view=await host.GET(request('https://example.invalid/api/host/arrival?tableId=synthetic-table',null,auth)); assert.equal(view.status,200);
  const viewText=await view.text(); for(const secret of ['qa@example.invalid','other@example.invalid',guest.token,'PRIVATE INTAKE','PRIVATE INTEREST','termsAcceptance','photoConsent']) assert(!viewText.includes(secret));
  assert.equal((await host.GET(request('https://example.invalid/api/host/arrival?tableId=other-table',null,auth))).status,401,'Host key scoped to one event');
  assert.equal((await host.POST(request('https://example.invalid/api/host/arrival',{tableId:table.id,action:'respond',applicationId:guest.applicationId,requestId:'stale',response:'Pink sign'},auth))).status,400);
  assert.equal((await host.POST(request('https://example.invalid/api/host/arrival',{tableId:table.id,action:'respond',applicationId:guest.applicationId,requestId:help.id,response:'By the window, pink sign'},auth))).status,200);
  assert.equal((await (await api.GET(request('https://example.invalid'),ctx)).json()).member.arrivalHelp.response,'By the window, pink sign');
  const cancel={action:'rsvp',value:'no',declineReason:'The time doesn’t work',confirmLateCancellation:true};
  await Promise.allSettled([patch(cancel),patch({action:'arrival',value:'on-my-way'})]);
  assert.equal((await store.getTable(table.id)).members[0].rsvp,'no');
  assert.equal((await patch({action:'arrival',value:'here'})).status,400,'Cancellation cannot revive seat');
  assert.equal((await host.POST(request('https://example.invalid/api/host/arrival',{tableId:table.id,action:'respond',applicationId:guest.applicationId,requestId:help.id,response:'Pink sign'},auth))).status,400);
  assert.equal(arrival.arrivalEligible({...table,status:'cancelled'},guest,now),false);
  assert.equal(arrival.arrivalEligible(table,{...guest,expiresAt:iso(now-1)},now),false);
  assert.equal(arrival.arrivalEligible(table,{...guest,seatReleasedAt:iso(now)},now),false);
  assert.equal(arrival.arrivalEligible({...table,endsAt:iso(now-1)},guest,now),false);
  assert.equal(attendance.attendanceAction(table,guest,{action:'check-in'},now).attendance,'unknown','Legacy guest check-in is self-report only');
  const future={...table,startsAt:iso(now+2*hour),endsAt:iso(now+3*hour),responseDeadline:iso(now+hour)};
  assert.equal(reminders.reminderEligible(future,guest,'arrival-1h',now+hour),true);
  assert.equal(reminders.reminderEligible(future,guest,'arrival-1h',now+hour+16*60000),false,'No retroactive dispatch');
  assert.equal(reminders.reminderEligible(future,{...guest,rsvp:'no'},'arrival-1h',now+hour),false);
  const job=await reminders.queueReminder(future,guest,'arrival-1h'); assert.equal(job.id,(await reminders.queueReminder(future,guest,'arrival-1h')).id);
  await assert.rejects(reminders.queueReminder({...table,id:'past-due-test'},guest,'arrival-1h'),/retroactive/);
  assert(reminders.reminderDraft(future,guest,{fullName:'Synthetic',email:'qa@example.invalid'},'arrival-1h').button.href.includes('/invitation/dinner-99?token='));
  const proposal=load('lib/rsvp-deadline-proposal.ts'); assert.equal(proposal.proposeRsvpDeadline(iso(now+36*hour),iso(now)).hours,12); assert.equal(proposal.proposeRsvpDeadline(iso(now+72*hour),iso(now)).hours,24); assert.equal(proposal.proposeRsvpDeadline(iso(now+10*24*hour),iso(now)).hours,48);
  assert.equal(proposal.proposeRsvpDeadline('2026-10-11T01:00:00Z','2026-10-09T04:00:00Z').deadline,'2026-10-09T19:00:00.000Z','Night invite includes three daytime response hours');
  await access.POST(request('https://example.invalid/api/admin/arrival-access',{tableId:table.id,action:'revoke'},{'x-interaction-admin-key':'synthetic-admin'}));
  assert.equal((await host.GET(request('https://example.invalid/api/host/arrival?tableId=synthetic-table',null,auth))).status,401,'Revoked key cannot access');
  console.log('PASS: durable self-reported arrival, ETA validation, private guest/host views, scoped/revocable host access, help acknowledgment, stale help rejection, cancellation races, expiry, one-hour reminder deduplication and no retroactive sends. Synthetic storage only; no messages or permissions changed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
