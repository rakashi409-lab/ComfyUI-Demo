const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { parseHTML } = require('linkedom');
const { IDBFactory } = require('fake-indexeddb');

const html = fs.readFileSync('ComfyUI.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jMioAAAAASUVORK5CYII=';
const plain = value => JSON.parse(JSON.stringify(value));

async function editor(database = new IDBFactory()) {
    const { document, HTMLElement, Event } = parseHTML(html);
    HTMLElement.prototype.getBoundingClientRect = function () {
        return {left:0, top:0, width:1600, height:1000, right:1600, bottom:1000};
    };
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {configurable:true,get(){return parseFloat(this.style.width) || 230;}});
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {configurable:true,get(){return parseFloat(this.style.height) || 140;}});
    const dialog = document.getElementById('editor-dialog');
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; };
    const timers = new Set();
    const sandbox = {document, indexedDB:database, crypto:webcrypto, Blob, URL, DOMException, AbortController,
        Uint32Array, Uint8Array, atob, console, clearTimeout,
        setTimeout(fn,ms){const timer=setTimeout(()=>{timers.delete(timer);fn();},Math.min(ms,5));timers.add(timer);return timer;},
        window:{indexedDB:database, innerWidth:1600,innerHeight:1000, addEventListener(){}, confirm(){return true;}, prompt(){return null;}}};
    const context = vm.createContext(sandbox);
    vm.runInContext(script + '\nthis.testApp = app;', context);
    const a = context.testApp;
    await a.init();
    const fire = (el,type,values={}) => {const event = new Event(type,{bubbles:true});Object.assign(event,values);el.dispatchEvent(event);};
    return {a,document,fire,close(){timers.forEach(clearTimeout);a._db?.close();}};
}

test('standalone entrypoints match and initialization wires all main controls', async () => {
    assert.equal(fs.readFileSync('index.html','utf8'),html);
    const f=await editor();
    assert.equal(f.document.getElementById('save-status').textContent,'已就绪');
    assert.equal(f.document.querySelectorAll('#group-swatches button').length,5);
    assert.equal(f.document.querySelectorAll('.nl-item').length,19);
    assert.equal(f.document.body.classList.contains('is-loading'),false);f.close();
});

test('preset has five colored groups, 19 nodes and valid 22-link dependency graph', async () => {
    const f=await editor();f.a.loadPresetWorkflow();
    assert.equal(f.document.querySelectorAll('.comfy-group').length,5);
    assert.equal(f.document.querySelectorAll('.comfy-node').length,19);
    assert.equal(f.a.connections.length,22);
    assert.equal(new Set(f.a.groups.map(g=>g.color)).size,5);
    assert.equal(f.a.validateDocument(f.a.snapshot()).nodes.length,19);
    assert.equal(f.a.graphErrors().length,0);f.close();
});

test('group inputs support arbitrary color, title, fractional dimensions, undo and redo', async () => {
    const f=await editor();f.a.addGroupAtCenter();
    for(const [id,value] of [['group-title','自定义背景'],['group-hex','#123abc'],['group-width','728.5'],['group-height','510.25'],['group-opacity','0.33']]){
        const input=f.document.getElementById(id);input.value=value;f.fire(input,'input');f.fire(input,'change');
    }
    assert.equal(f.a.groups[0].color,'#123abc');assert.equal(f.a.groups[0].w,728.5);assert.equal(f.a.groups[0].h,510.25);
    assert.equal(f.document.querySelector('.group-title').textContent,'自定义背景');
    assert.match(f.document.querySelector('.comfy-group').style.getPropertyValue('--group-fill'),/0.33/);
    f.a.undo();assert.equal(f.a.groups[0].opacity,.16);f.a.redo();assert.equal(f.a.groups[0].opacity,.33);
    f.a.selectGroup(f.a.groups[0]);f.a.deleteGroup();assert.equal(f.a.groups.length,0);f.a.undo();assert.equal(f.a.groups.length,1);f.close();
});

test('group dragging moves fully enclosed nodes and Alt moves only the backdrop',async()=>{
    const f=await editor();f.a.transform={x:0,y:0,scale:1};f.a.addNode('LoadImage',600,430);f.a.addGroupAtCenter();
    const g=f.a.groups[0],n=f.a.nodes[0],start={x:n.x,y:n.y,gx:g.x,gy:g.y};
    f.fire(f.document.querySelector('.group-header'),'mousedown',{button:0,clientX:600,clientY:330});
    f.fire(f.document,'mousemove',{clientX:670,clientY:380});f.fire(f.document,'mouseup');
    assert.equal(g.x,start.gx+70);assert.equal(n.x,start.x+70);assert.equal(n.y,start.y+50);
    f.fire(f.document.querySelector('.group-header'),'mousedown',{button:0,clientX:670,clientY:380,altKey:true});
    f.fire(f.document,'mousemove',{clientX:700,clientY:400});f.fire(f.document,'mouseup');
    assert.equal(n.x,start.x+70);assert.equal(g.x,start.gx+100);f.close();
});

test('complete JSON round trip restores node images, groups, viewport, settings and cursor',async()=>{
    const f=await editor();f.a.loadPresetWorkflow();
    f.a.genImages=[PNG,PNG];f.a.genCursor=1;f.a.nodes[0].widgets[0].value=PNG;f.a.nodes[0].widgets[0].filename='输入.png';
    f.a.showResultOnNode(f.a.nodes.find(n=>n.type==='SaveImage'),PNG);f.a.settings.speed=2;
    const state=f.a.validateDocument(JSON.parse(JSON.stringify(f.a.snapshot())));
    const other=await editor();other.a.restoreState(state);
    assert.deepEqual(plain(other.a.snapshot()),plain({...f.a.snapshot(),nextId:20,nextGroupId:6}));
    assert.equal(other.document.querySelectorAll('.save-download').length,1);
    assert.equal(other.document.querySelector('.save-result img').getAttribute('src'),PNG);f.close();other.close();
});

test('import rejects invalid references, duplicate IDs, remote images and invalid parameters atomically',async()=>{
    const f=await editor();f.a.loadPresetWorkflow();const initial=JSON.stringify(f.a.snapshot());
    const mutations=[s=>s.nodes.push(s.nodes[0]),s=>s.nodes[0].type='UnknownNode',s=>s.nodes[0].widgets[0].value='https://example.com/a.png',s=>s.connections[0].fromNode=99999,s=>s.nodes.find(n=>n.type==='Flux2Scheduler').widgets[0].value=-1,s=>s.groups[0].color='red',s=>s.groups[0].w=NaN,s=>s.schemaVersion=999];
    for(const change of mutations){const state=JSON.parse(initial);change(state);assert.throws(()=>f.a.validateDocument(state));assert.equal(JSON.stringify(f.a.snapshot()),initial);}
    f.close();
});

test('imports supported ComfyUI canvas JSON including group bounds',async()=>{
    const f=await editor();const state=f.a.validateDocument({version:.4,nodes:[{id:9,type:'RandomNoise',pos:[10,20],size:[250,170],widgets_values:[123,'increment']}],links:[],groups:[{title:'测试',bounding:[0,0,500,300],color:'#336699',font_size:24}]});
    assert.equal(state.nodes[0].widgets[0].value,123);assert.equal(state.groups[0].fontSize,24);assert.equal(state.nextId,10);f.close();
});

test('IndexedDB transaction persists and a fresh editor restores all images and group state',async()=>{
    const db=new IDBFactory(),f=await editor(db);f.a.loadPresetWorkflow();f.a.genImages=[PNG];f.a.genCursor=1;f.a.showResultOnNode(f.a.nodes.find(n=>n.type==='SaveImage'),PNG);f.a.commit();await f.a.saveNow(true);
    const other=await editor(db);assert.equal(other.a.groups.length,5);assert.equal(other.a.genCursor,1);assert.equal(other.a.genImages[0],PNG);assert.equal(other.document.querySelector('.save-result img').getAttribute('src'),PNG);
    f.close();other.close();
});

test('sampler animation takes the connected scheduler step count',async()=>{
    const f=await editor();f.a.loadPresetWorkflow();f.a.nodes.find(n=>n.type==='Flux2Scheduler').widgets[0].value=12;
    let ticks=0;f.a.pause=async()=>{ticks++;};await f.a.execNode(f.a.nodes.find(n=>n.type==='SamplerCustomAdvanced'),new AbortController().signal,f.a.nodes,f.a.connections);
    assert.equal(ticks,12);f.close();
});

test('successful execution respects dependencies, advances one picture and applies seed modes',async()=>{
    const f=await editor();f.a.loadPresetWorkflow();f.a.genImages=[PNG,PNG];const noise=f.a.nodes.find(n=>n.type==='RandomNoise');noise.widgets[0].value=123;noise.widgets[1].value='increment';
    const seen=new Set();f.a.execNode=async node=>{assert(f.a.connections.filter(c=>c.toNode===node.id).every(c=>seen.has(c.fromNode)));seen.add(node.id);};
    await f.a.runWorkflow();assert.equal(seen.size,19);assert.equal(f.a.genCursor,1);assert.equal(noise.widgets[0].value,124);assert.equal(f.a.isRunning,false);assert.equal(f.document.querySelectorAll('.save-download').length,1);
    noise.widgets[1].value='decrement';f.a.advanceSeeds();assert.equal(noise.widgets[0].value,123);
    noise.widgets[1].value='fixed';f.a.advanceSeeds();assert.equal(noise.widgets[0].value,123);
    noise.widgets[1].value='randomize';f.a.advanceSeeds();assert(Number.isSafeInteger(noise.widgets[0].value));assert.notEqual(noise.widgets[0].value,123);f.close();
});

test('no output does not consume a picture; cycles are rejected before execution',async()=>{
    const f=await editor();f.a.addNode('RandomNoise',0,0);f.a.genImages=[PNG];f.a.execNode=async()=>{};await f.a.runWorkflow();assert.equal(f.a.genCursor,0);
    f.a.addNode('ReferenceLatent',200,200);f.a.addNode('ReferenceLatent',400,200);
    const [a,b]=f.a.nodes.slice(1);f.a.connections=[{fromNode:a.id,fromSlot:0,toNode:b.id,toSlot:0,type:'CONDITIONING'},{fromNode:b.id,fromSlot:0,toNode:a.id,toSlot:0,type:'CONDITIONING'}];
    let calls=0;f.a.execNode=async()=>{calls++;};await f.a.runWorkflow();assert.equal(calls,0);assert.match(f.a.notifications[0].message,/循环/);f.close();
});

test('stop and execution error restore controls without consuming output or updating seeds',async()=>{
    for(const mode of ['stop','failure']){
        const f=await editor();f.a.loadPresetWorkflow();f.a.genImages=[PNG];const noise=f.a.nodes.find(n=>n.type==='RandomNoise'),seed=noise.widgets[0].value;
        f.a.execNode=mode==='failure'?async()=>{throw Error('fixture failure');}:async(node,signal)=>f.a.pause(1000,signal);
        const run=f.a.runWorkflow();if(mode==='stop')f.a.stopWorkflow();await run;
        assert.equal(f.a.isRunning,false);assert.equal(f.a.genCursor,0);assert.equal(noise.widgets[0].value,seed);assert.equal(f.document.getElementById('run-label').textContent,'执行');assert.equal(f.document.querySelector('.edit-action').disabled,false);f.close();
    }
});

test('numeric normalization rejects nonfinite values and bounds widths, batches and seeds',async()=>{
    const f=await editor();assert.equal(f.a.normalizeNumber('',{name:'width',value:512},-1),16);assert.equal(f.a.normalizeNumber('',{name:'batch_size',value:1},100),64);assert.equal(f.a.normalizeNumber('',{name:'noise_seed',value:22},Infinity),22);assert.equal(f.a.normalizeNumber('',{name:'steps',value:4},9.8),10);f.close();
});

test('JSON export and image download produce usable original data',async()=>{
    const f=await editor();f.a.addGroupAtCenter();let downloaded;
    f.a.downloadBlob=(blob,name)=>{downloaded={blob,name};};f.a.exportWorkflow();const state=JSON.parse(await downloaded.blob.text());assert.equal(state.groups.length,1);assert.match(downloaded.name,/\.json$/);
    f.a.downloadImage(PNG,'测试图片');assert.equal(downloaded.name,'测试图片.png');assert.equal(downloaded.blob.type,'image/png');assert.deepEqual(Buffer.from(await downloaded.blob.arrayBuffer()),Buffer.from(PNG.split(',')[1],'base64'));f.close();
});
