const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const exportsObject={};
const code=ts.transpileModule(fs.readFileSync('lib/loading-fetch.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
new Function('exports',code)(exportsObject);
(async()=>{
  const pending=[],resolvers=[];
  const calls=[];
  const tracked=exportsObject.trackWebsiteFetch((input,init)=>{calls.push({input,init});return new Promise((resolve,reject)=>resolvers.push({resolve,reject}));},count=>pending.push(count),'https://interaction.club/dinner-001');
  const options={method:'POST',headers:{'content-type':'application/json'},body:'{"test":true}'};
  const a=tracked('/api/dinner/dinner-001/session',options),b=tracked(new Request('https://interaction.club/api/table/test'));
  assert.deepEqual(pending,[1,2]);assert.equal(calls[0].init,options,'Request options unchanged');
  const response=Response.json({ok:true});resolvers[0].resolve(response);assert.equal(await a,response,'Return original response');
  assert.deepEqual(pending,[1,2,1]);resolvers[1].reject(new DOMException('Aborted','AbortError'));await assert.rejects(b,{name:'AbortError'});
  assert.deepEqual(pending,[1,2,1,0],'Errors and aborts clear the loader');
  for(const url of ['https://example.invalid/api/test','/balloon-wordmark-lowercase.png','/join?_rsc=test']) {
    const before=pending.length,c=tracked(url);resolvers.at(-1).resolve(Response.json({}));await c;assert.equal(pending.length,before,'Ignore external calls, assets and route prefetch');
  }
  const css=fs.readFileSync('app/website-loading.css','utf8');assert(css.includes('position:fixed;inset:0'));assert(css.includes('place-items:center'));assert(css.includes('prefers-reduced-motion:reduce'));
  const ui=fs.readFileSync('app/loading-seal.tsx','utf8');assert(ui.includes('role="status"'));assert(ui.includes('aria-live="polite"'));assert(ui.includes('<CircleMark/>'));
  console.log('Website loader: concurrent requests, unchanged fetch behavior, errors, aborts, center positioning and accessible/reduced-motion markup passed. No live data changed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
