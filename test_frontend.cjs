const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {test}=require('node:test');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const source=fs.readFileSync(__dirname+'/app.js','utf8').replace('  init();','  globalThis.app = {init,state,generatePrompt,changed,selectStyle,copyPrompt,removeRef,restoreDefaults,referencePrompt,chooseFiles,uploadFiles};');
function harness(failCopy=false){
  const element=()=>({click(){},querySelector(){return this.children[0];},value:'',hidden:false,disabled:false,children:[],attrs:{},events:{},selectedOptions:[{textContent:'1920x1080px (Web/Horizontal)'}],setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){this.events[k]=fn;},append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;},focus(){this.focused=true;},select(){this.selected=true;}});
  const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],element()]));elements.format.value='1920x1080';elements.proposals.value='1';
  let copied;
  const context={window:{},URL:{createObjectURL(file){return 'blob:'+file.name;},revokeObjectURL(){}},Image:class {set src(v){Promise.resolve().then(()=>this.onload());}},document:{getElementById(id){assert.ok(elements[id],id);return elements[id];},createElement:element,querySelectorAll(){return elements.styles.children;}},navigator:{clipboard:{async writeText(value){if(failCopy)throw Error('Denied');copied=value;}}},setTimeout(){return 1;},clearTimeout(){}};
  vm.createContext(context);
  for(const name of ['assets.js','styles-data.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+name,'utf8'),context);
  vm.runInContext(source,context);context.app.init();return {app:context.app,e:elements,copied:()=>copied};
}
test('headline required, prompt complete, long context preserved',()=>{
  const {app,e}=harness();assert.equal(app.generatePrompt(),false);assert.equal(e.headlineError.hidden,false);
  e.headline.value='Sequía en la ciudad';e.description.value='Contexto '.repeat(6000);assert.equal(app.generatePrompt(),true);assert.ok(e.prompt.value.includes(e.description.value.trim()));assert.match(e.prompt.value,/Sequía en la ciudad/);assert.doesNotMatch(e.prompt.value,/Referencia visual 1/);
});
test('each style and format updates the unedited prompt and next headline replaces the old one',()=>{
  const {app,e}=harness();e.headline.value='Noticia antigua';app.generatePrompt();
  for(let i=0;i<4;i++){app.selectStyle(i);assert.ok(e.prompt.value.includes(['Surrealismo pictórico','Poesía visual','Minimalismo conceptual','Infografía de pictogramas'][i]));}
  e.headline.value='Noticia nueva';e.format.value='1080x1920';e.format.selectedOptions=[{textContent:'1080x1920px (Story/Vertical)'}];app.changed();assert.match(e.prompt.value,/Noticia nueva/);assert.doesNotMatch(e.prompt.value,/Noticia antigua/);assert.match(e.prompt.value,/1080 × 1920/);
});
test('manual editing is kept and stale copying blocked until regeneration',async()=>{
  const {app,e,copied}=harness();e.headline.value='Primera';app.generatePrompt();e.prompt.value+=' Mi edición';e.headline.value='Segunda';app.changed();assert.match(e.prompt.value,/Mi edición/);assert.equal(e.copyBtn.disabled,true);await app.copyPrompt();assert.equal(copied(),undefined);app.generatePrompt();assert.equal(e.copyBtn.disabled,false);await app.copyPrompt();assert.equal(copied(),e.prompt.value);
});
test('clipboard refusal provides manual selection',async()=>{
  const {app,e}=harness(true);e.headline.value='Una noticia';app.generatePrompt();await app.copyPrompt();assert.equal(e.prompt.selected,true);assert.match(e.toast.textContent,/Ctrl\+C/);
});
test('browser has no API calls or credential controls',()=>{
  assert.doesNotMatch(source,/fetch\s*\(|XMLHttpRequest|\/api\//);assert.doesNotMatch(html,/id="(?:apiKey|connectionBtn|launchBtn|upscaleBtn|versionBtn)"/);
});

test('reference deletion and restoration never mutate defaults; styles isolated',()=>{
  const {app}=harness();const original=app.state.configs[0].refs[0].url;
  app.removeRef('refs',app.state.configs[0].refs[0].id);assert.equal(app.state.configs[0].refs.length,0);assert.equal(app.state.configs[1].refs.length,3);
  app.restoreDefaults();assert.equal(app.state.configs[0].refs[0].url,original);assert.equal(app.state.configs[0].refs[0].fidelity,50);
});
test('subject toggle, fidelity, notes and number of proposals affect prompt',()=>{
  const {app,e}=harness();e.headline.value='Una noticia';e.proposals.value='7';const cfg=app.state.configs[0];
  cfg.subjects.push({id:99,url:'local',name:'persona.png',fidelity:100,notes:'Conservar el gesto de la mano',local:false});cfg.subjectEnabled=true;app.generatePrompt();
  assert.match(e.prompt.value,/exactamente 7 imágenes independientes/);assert.match(e.prompt.value,/Extrema \(100\/100\)/);assert.match(e.prompt.value,/SUJETO-1-persona.png/);assert.match(e.prompt.value,/Conservar el gesto de la mano/);assert.match(e.prompt.value,/ÚNICAMENTE/);
  cfg.subjectEnabled=false;app.changed();assert.doesNotMatch(e.prompt.value,/SUJETO-1-persona.png/);
});
test('clear empties only prompt; subsequent generate uses current brief',()=>{
  const {app,e}=harness();e.headline.value='Actual';app.generatePrompt();e.clearPromptBtn.events.click();assert.equal(e.prompt.value,'');assert.equal(e.copyBtn.disabled,true);assert.equal(e.headline.value,'Actual');assert.equal(app.state.configs[0].refs.length,1);app.generatePrompt();assert.match(e.prompt.value,/Actual/);
});

test('uploads append, replace preserving fidelity, and reject invalid files atomically',async()=>{
  const {app,e}=harness();app.chooseFiles('refs');await app.uploadFiles([{name:'nuevo.png',type:'image/png',size:100}]);
  const refs=app.state.configs[0].refs;assert.equal(refs.length,2);assert.equal(refs[1].name,'nuevo.png');refs[0].fidelity=90;
  app.chooseFiles('refs',refs[0].id);await app.uploadFiles([{name:'sustituto.jpg',type:'image/jpeg',size:100}]);assert.equal(refs.length,2);assert.equal(refs[0].name,'sustituto.jpg');assert.equal(refs[0].fidelity,90);
  app.chooseFiles('refs');await app.uploadFiles([{name:'ok.png',type:'image/png',size:100},{name:'bad.svg',type:'image/svg+xml',size:100}]);assert.equal(refs.length,2);assert.equal(e.uploadError.hidden,false);assert.equal(app.state.uploading,false);
});
