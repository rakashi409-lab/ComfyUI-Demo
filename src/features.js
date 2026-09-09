/* v2 editor features. Builds into the standalone HTML; no runtime dependencies. */
'use strict';
const original = Object.fromEntries(Object.entries(app).filter(([, value]) => typeof value === 'function'));
const IMAGE_PATTERN = /^data:image\/(?:png|jpeg|webp|gif|bmp|avif);base64,[A-Za-z0-9+/\r\n]+=*$/;
const PALETTE = ['#28779a', '#8055b0', '#b44e63', '#ba9439', '#48875e'];
const NUMBER_RULES = {
    width: [16, 16384, 1], height: [16, 16384, 1], batch_size: [1, 64, 1],
    steps: [1, 1000, 1], cfg: [0, 100, 0.1], color: [0, 16777215, 1],
    noise_seed: [0, Number.MAX_SAFE_INTEGER, 1]
};
const copyNode = n => ({ ...n, inputs: n.inputs.map(p => ({...p})), outputs: n.outputs.map(p => ({...p})),
    widgets: n.widgets.map(w => ({...w, ...(w.options ? {options: [...w.options]} : {})})) });
const finite = (value, fallback, min, max) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
const colorValid = value => /^#[0-9a-f]{6}$/i.test(value);

Object.assign(app, {
    version: '2.0.0', groups: [], nextGroupId: 1, selectedGroup: null,
    workflowName: '未命名工作流', settings: {autoSave: true, speed: 1, groupColor: '#28779a'},
    notifications: [], _initializing: true, _saveRevision: 0, _savedRevision: 0,
    _pendingImages: 0, _imageEpoch: 0, _saveChain: Promise.resolve(),

    async init() {
        document.body.classList.add('is-loading');
        original.init.call(this);
        this.setupEditor();
        try {
            const saved = await this.readSaved();
            if (saved) {
                const state = this.validateDocument(saved);
                this.restoreState(state);
                this.toast('已恢复工作流和图片');
            }
        } catch (error) { this.notify('自动恢复失败：' + error.message + '。可通过 JSON 备份导入。'); }
        this.history = []; this.historyIndex = -1;
        this.commit();
        this._initializing = false;
        document.body.classList.remove('is-loading');
        this.setSaveStatus(this._storageError ? '自动保存不可用，请导出 JSON' : '已就绪');
        this.updateWorkflowTitle();
    },

    setupEditor() {
        const props = {'group-title':'title', 'group-color':'color', 'group-hex':'color',
            'group-opacity':'opacity', 'group-width':'w', 'group-height':'h', 'group-font':'fontSize', 'group-move':'moveNodes'};
        for (const [id, prop] of Object.entries(props)) {
            const input = document.getElementById(id);
            const update = () => {
                const g = this.selectedGroup;
                if (!g || this.isRunning) return;
                let v = input.type === 'checkbox' ? input.checked : input.value;
                if (prop === 'color' && !colorValid(v)) return;
                if (prop === 'w' || prop === 'h') {
                    if (!v || !Number.isFinite(Number(v))) return;
                    v = finite(v, g[prop], prop === 'w' ? 120 : 80, 10000000);
                }
                if (prop === 'opacity') v = finite(v, .16, 0, 1);
                if (prop === 'fontSize') v = finite(v, 20, 12, 64);
                g[prop] = v;
                this.paintGroup(g);
                if (prop === 'color') {
                    document.getElementById('group-color').value = v;
                    document.getElementById('group-hex').value = v;
                }
                this.scheduleSave();
            };
            input.addEventListener('input', update);
            input.addEventListener('change', () => { update(); this.commit(); this.refreshInspector(); });
        }
        const swatches = document.getElementById('group-swatches');
        for (const color of PALETTE) {
            const button = document.createElement('button');
            button.style.setProperty('--swatch', color); button.title = color; button.setAttribute('aria-label', '使用颜色 ' + color);
            button.onclick = () => { if (!this.selectedGroup || this.isRunning) return; this.selectedGroup.color = color; this.paintGroup(this.selectedGroup); this.refreshInspector(); this.commit(); };
            swatches.appendChild(button);
        }
        document.getElementById('workflow-file').addEventListener('change', async e => {
            const file = e.target.files[0]; if (!file) return;
            try {
                if (file.size > 150 * 1024 * 1024) throw Error('JSON 文件超过 150 MB');
                const state = this.validateDocument(JSON.parse(await file.text()));
                if (this.isRunning) throw Error('请先停止执行再导入');
                if (!this.confirmReplace()) return;
                this._imageEpoch++;
                this.restoreState(state); this.commit();
                this.notify('已导入：' + this.workflowName);
            } catch (error) { this.notify('导入失败：' + error.message); }
            finally { e.target.value = ''; }
        });
        document.addEventListener('keydown', e => {
            const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
            const key = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
            if (mod && key === 's') { e.preventDefault(); e.shiftKey ? this.exportWorkflow() : this.saveNow(true); return; }
            if (mod && key === 'enter') { e.preventDefault(); this.isRunning ? this.stopWorkflow() : this.runWorkflow(); return; }
            if (document.getElementById('editor-dialog').open || typing || this.isRunning) return;
            if (mod && key === 'o') { e.preventDefault(); this.openImport(); }
            if (mod && key === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
            if (mod && key === 'y') { e.preventDefault(); this.redo(); }
            if (mod && key === 'd') { e.preventDefault(); this.duplicateSelection(); }
            if (!mod && key === 'g') { e.preventDefault(); this.addGroupAtCenter(); }
            if (!mod && key === 'f') this.fitView();
            if (key === 'delete' || key === 'backspace') { e.preventDefault(); if(this.selectedGroup) this.deleteGroup(); else if(this.selectedNode) this.deleteNode(this.selectedNode.id); }
            if (key === 'escape') { this.selectGroup(null); this.hideSearch(); this.closeComboMenu(); }
        });
        document.getElementById('run-button').addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.isRunning ? this.stopWorkflow() : this.runWorkflow(); }});
        document.addEventListener('visibilitychange', () => { if(document.hidden && this.settings.autoSave) this.saveNow(); });
        window.addEventListener('beforeunload', e => { if(this._saveRevision > this._savedRevision) { e.preventDefault(); e.returnValue = ''; } });
    },

    addNode(type, x, y) { if(!this.isRunning) original.addNode.call(this, type, x, y); },
    deleteNode(id) { if(!this.isRunning) original.deleteNode.call(this, id); },
    selectNode(node) { if(node) this.selectGroup(null); original.selectNode.call(this, node); },
    undo() { if(!this.isRunning) original.undo.call(this); },
    redo() { if(!this.isRunning) original.redo.call(this); },
    updateTransform() { original.updateTransform.call(this); this.scheduleSave(); },
    commit() { if(this._suspendHistory) return; original.commit.call(this); this.scheduleSave(); },

    snapshot() {
        // Immutable strings are shared between snapshots, including image data URLs.
        return {format:'comfyui-demo', schemaVersion:2, appVersion:this.version, name:this.workflowName,
            nodes:this.nodes.map(copyNode), connections:this.connections.map(c=>({...c})), groups:this.groups.map(g=>({...g})),
            nextId:this.nextId, nextGroupId:this.nextGroupId, transform:{...this.transform},
            genImages:[...this.genImages], genCursor:this.genCursor, settings:{...this.settings}};
    },

    restoreState(state) {
        this._imageEpoch++;
        this.nodes = state.nodes.map(copyNode); this.connections = state.connections.map(c=>({...c}));
        this.groups = (state.groups || []).map(g=>({...g}));
        this.nextId = state.nextId; this.nextGroupId = state.nextGroupId || 1;
        this.workflowName = state.name || '未命名工作流'; this.transform = {...state.transform};
        this.genImages = [...(state.genImages || [])]; this.genCursor = state.genCursor || 0;
        this.settings = {...this.settings, ...state.settings};
        this.selectedNode = null; this.selectGroup(null); this.linking = null; this.linkMouse = null;
        this.canvasContent.querySelectorAll('.comfy-node, .comfy-group').forEach(el=>el.remove());
        this.groups.forEach(g=>this.renderGroup(g)); this.nodes.forEach(n=>this.renderNode(n));
        this.updateTransform(); this.updateSlotStates(); this.renderConnections(); this.renderGenList(); this.updateWorkflowTitle();
        this.scheduleSave();
    },

    addGroupAtCenter() {
        if(this.isRunning) return;
        const rect = this.canvas.getBoundingClientRect();
        const p = this.toWorld(rect.left + rect.width/2, rect.top + rect.height/2);
        const g = {id:this.nextGroupId++, title:'新分组', x:p.x-250, y:p.y-180, w:500, h:360,
            color:this.settings.groupColor, opacity:.16, fontSize:20, moveNodes:true};
        this.groups.push(g); this.renderGroup(g); this.selectGroup(g); this.commit();
    },
    groupEl(id) { return this.canvasContent.querySelector(`[data-group-id="${id}"]`); },
    paintGroup(g) {
        const el = this.groupEl(g.id); if(!el) return;
        el.style.left=g.x+'px'; el.style.top=g.y+'px'; el.style.width=g.w+'px'; el.style.height=g.h+'px';
        const rgb = [1,3,5].map(i=>parseInt(g.color.slice(i,i+2),16)).join(',');
        el.style.setProperty('--group-color',g.color);
        el.style.setProperty('--group-header-height',Math.max(36,g.fontSize+12)+'px');
        el.style.setProperty('--group-fill',`rgba(${rgb},${g.opacity})`);
        el.style.setProperty('--group-head',`rgba(${rgb},${Math.max(.4,g.opacity)})`);
        el.querySelector('.group-title').textContent=g.title || '未命名分组';
        el.querySelector('.group-title').style.fontSize=g.fontSize+'px';
    },
    renderGroup(g) {
        const el=document.createElement('div'); el.className='comfy-group'; el.dataset.groupId=g.id;
        el.innerHTML='<div class="group-header"><span class="group-title"></span><button class="group-edit" title="编辑分组" aria-label="编辑分组">✎</button></div><div class="group-resize e" title="调整宽度"></div><div class="group-resize s" title="调整高度"></div><div class="group-resize" title="调整分组尺寸"></div>';
        this.canvasContent.prepend(el); this.paintGroup(g);
        el.querySelector('.group-edit').onclick=e=>{e.stopPropagation();this.selectGroup(g);document.getElementById('group-title').focus();};
        el.querySelector('.group-header').addEventListener('dblclick', e=>{e.stopPropagation();this.selectGroup(g);document.getElementById('group-title').focus();});
        el.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();this.selectGroup(g);});
        el.addEventListener('mousedown', e=>{
            if(e.button!==0 || this.isRunning || e.target.closest('button')) return;
            e.preventDefault(); e.stopPropagation(); this.selectGroup(g);
            const start=this.toWorld(e.clientX,e.clientY), initial={...g};
            const resize=e.target.closest('.group-resize');
            const members = !resize && g.moveNodes && !e.altKey ? this.nodes.filter(n=>{
                const box=this.nodeEl(n.id); return n.x>=g.x && n.y>=g.y && n.x+(box?.offsetWidth||200)<=g.x+g.w && n.y+(box?.offsetHeight||100)<=g.y+g.h;
            }).map(n=>({n,x:n.x,y:n.y})) : [];
            let changed=false;
            const move=ev=>{
                const p=this.toWorld(ev.clientX,ev.clientY), dx=p.x-start.x, dy=p.y-start.y;
                if(resize) { if(!resize.classList.contains('s')) g.w=Math.max(120,initial.w+dx); if(!resize.classList.contains('e')) g.h=Math.max(80,initial.h+dy); }
                else { g.x=initial.x+dx;g.y=initial.y+dy;for(const m of members){m.n.x=m.x+dx;m.n.y=m.y+dy;const ne=this.nodeEl(m.n.id);ne.style.left=m.n.x+'px';ne.style.top=m.n.y+'px';} }
                changed=true; this.paintGroup(g); this.refreshInspector(); this.renderConnections();
            };
            const up=()=>{document.removeEventListener('mousemove',move);document.removeEventListener('mouseup',up);if(changed)this.commit();};
            document.addEventListener('mousemove',move);document.addEventListener('mouseup',up);
        });
    },
    selectGroup(g) {
        this.selectedGroup=g;
        if(g) original.selectNode.call(this,null);
        this.canvasContent?.querySelectorAll('.comfy-group').forEach(el=>el.classList.toggle('selected',!!g && Number(el.dataset.groupId)===g.id));
        document.getElementById('group-inspector').classList.toggle('active',!!g);
        if(g) this.refreshInspector();
    },
    refreshInspector() {
        const g=this.selectedGroup;if(!g)return;
        const values={'group-title':g.title,'group-color':g.color,'group-hex':g.color,'group-opacity':g.opacity,'group-width':Number(g.w.toFixed(2)),'group-height':Number(g.h.toFixed(2)),'group-font':g.fontSize};
        for(const [id,value] of Object.entries(values)) document.getElementById(id).value=value;
        document.getElementById('group-move').checked=g.moveNodes;
    },
    deleteGroup() {
        if(!this.selectedGroup || this.isRunning)return;
        const id=this.selectedGroup.id;this.groupEl(id)?.remove();this.groups=this.groups.filter(g=>g.id!==id);this.selectGroup(null);this.commit();
    },
    duplicateSelection() {
        if(this.isRunning)return;
        if(this.selectedGroup){const g={...this.selectedGroup,id:this.nextGroupId++,x:this.selectedGroup.x+40,y:this.selectedGroup.y+40,title:this.selectedGroup.title+' 副本'};this.groups.push(g);this.renderGroup(g);this.selectGroup(g);this.commit();}
        else if(this.selectedNode){const n=copyNode(this.selectedNode);n.id=this.nextId++;n.x+=40;n.y+=40;delete n.resultImage;this.nodes.push(n);this.renderNode(n);this.selectNode(n);this.commit();}
    },
    fitView() {
        if(!this.nodes.length && !this.groups.length){this.resetView();return;}
        const boxes=[...this.groups,...this.nodes.map(n=>({...n,w:this.nodeEl(n.id)?.offsetWidth||200,h:this.nodeEl(n.id)?.offsetHeight||100}))];
        const x=Math.min(...boxes.map(b=>b.x)),y=Math.min(...boxes.map(b=>b.y));
        const w=Math.max(...boxes.map(b=>b.x+b.w))-x,h=Math.max(...boxes.map(b=>b.y+b.h))-y;
        const rect=this.canvas.getBoundingClientRect();const scale=Math.max(.1,Math.min(1.5,(rect.width-90)/Math.max(w,1),(rect.height-90)/Math.max(h,1)));
        this.transform={x:(rect.width-w*scale)/2-x*scale,y:(rect.height-h*scale)/2-y*scale,scale};this.updateTransform();
    },

    confirmReplace() { return (!this.nodes.length && !this.groups.length && !this.genImages.length) || window.confirm('将替换当前画布。可通过撤销恢复；需要跨设备保留时，请先导出 JSON。继续？'); },
    newWorkflow() {
        if(this.isRunning || !this.confirmReplace())return;
        this._imageEpoch++;
        this.restoreState({nodes:[],connections:[],groups:[],nextId:1,nextGroupId:1,name:'未命名工作流',transform:{x:150,y:90,scale:1},genImages:[],genCursor:0,settings:this.settings});this.commit();
    },
    renameWorkflow() {
        if(this.isRunning)return;const name=window.prompt('工作流名称',this.workflowName);
        if(name!==null){this.workflowName=name.trim().slice(0,120)||'未命名工作流';this.updateWorkflowTitle();this.commit();}
    },
    updateWorkflowTitle(){document.getElementById('workflow-name').textContent=this.workflowName;document.title=this.workflowName+' · ComfyUI Demo';},
    loadPresetWorkflow() {
        if(this.isRunning || !this.confirmReplace())return;
        this._suspendHistory=true;
        this.groups=[];this.canvasContent.querySelectorAll('.comfy-group').forEach(el=>el.remove());this.selectGroup(null);
        try { original.loadPresetWorkflow.call(this); }
        finally { this._suspendHistory=false; }
        this.workflowName='F.2-Klein9b编辑3';
        const layout={LoadImage:[65,130,360],Sage_CubiqImageResize:[65,470,360],VAEEncode:[65,720,330],
            UNETLoader:[550,130,360],VAELoader:[550,310,360],'Anything Everywhere':[550,455,330],
            CLIPLoader:[550,680,360],CLIPTextEncode:[550,870,360],ReferenceLatent:[550,1130,330],
            RandomNoise:[1030,130,330],CFGGuider:[1410,130,350],KSamplerSelect:[1030,325,330],
            EmptyImage:[1030,470,330],'GetImageSize+':[1410,470,340],Flux2Scheduler:[1030,765,330],
            EmptyFlux2LatentImage:[1410,765,340],SamplerCustomAdvanced:[1030,1010,340],VAEDecode:[1880,140,360],SaveImage:[1880,370,360]};
        for(const n of this.nodes){[n.x,n.y,n.w]=layout[n.type];const el=this.nodeEl(n.id);el.style.left=n.x+'px';el.style.top=n.y+'px';el.style.width=n.w+'px';}
        const groups=[['图像输入',40,70,420,880],['加载模型',525,70,420,510],['提示词与参考',525,620,420,700],['扩散与采样',1000,70,800,1250],['解码输出',1850,70,420,1250]];
        this.groups=groups.map(([title,x,y,w,h],i)=>({id:this.nextGroupId++,title,x,y,w,h,color:PALETTE[i],opacity:.16,fontSize:24,moveNodes:true}));
        this.groups.forEach(g=>this.renderGroup(g));this.renderConnections();this.fitView();this.updateWorkflowTitle();this.commit();
    },

    normalizeNumber(type, widget, value) {
        const [min,max,step]=NUMBER_RULES[widget.name] || [-Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER,widget.step||1];
        let number=finite(value,Number(widget.value)||min,min,max);
        if(step>=1)number=Math.round(number);else number=Number((Math.round(number/step)*step).toFixed(4));
        if(number!==Number(value))this.toast(`${widget.label} 已调整为有效值 ${number}（${min}–${max}）`);
        return number;
    },
    fmtNumber(w){return w.step && w.step<1 ? Number(w.value).toFixed(1) : String(Math.round(Number(w.value)||0));},
    renderNode(node){original.renderNode.call(this,node);if(node.resultImage)this.attachDownload(node);this.nodeEl(node.id)?.querySelectorAll('img').forEach(img=>img.addEventListener('load',()=>this.renderConnections()));},
    attachDownload(node){
        const el=this.nodeEl(node.id);if(!el||el.querySelector('.save-download'))return;
        const button=document.createElement('button');button.className='tool save-download';button.textContent='下载图片';
        button.onclick=e=>{e.stopPropagation();this.downloadImage(node.resultImage,node.widgets.find(w=>w.name==='filename_prefix')?.value||'ComfyUI');};
        el.querySelector('.node-body').appendChild(button);
    },
    showResultOnNode(node,src){
        node.resultImage=src;const el=this.nodeEl(node.id);if(!el)return;
        let box=el.querySelector('.save-result');if(!box){box=document.createElement('div');box.className='image-preview save-result';el.querySelector('.node-body').appendChild(box);}
        box.innerHTML=`<img src="${src}" alt="演示结果">`;box.querySelector('img').onload=()=>this.renderConnections();this.attachDownload(node);this.renderConnections();
    },
    cleanFilename(name){return String(name||'ComfyUI').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').slice(0,100)||'ComfyUI';},
    downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=this.cleanFilename(name);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);},
    downloadImage(src,name='ComfyUI'){
        if(!src || !IMAGE_PATTERN.test(src)){this.toast('暂无可下载图片');return;}
        const mime=src.slice(5,src.indexOf(';')),bytes=Uint8Array.from(atob(src.split(',')[1]),c=>c.charCodeAt(0));
        this.downloadBlob(new Blob([bytes],{type:mime}),`${name}.${mime.split('/')[1]==='jpeg'?'jpg':mime.split('/')[1]}`);
    },
    openImport(){if(!this.isRunning)document.getElementById('workflow-file').click();},
    exportWorkflow(){const data=this.snapshot();data.savedAt=new Date().toISOString();this.downloadBlob(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),this.workflowName+'.json');this.notify('JSON 已导出，包含分组、参数、图片和演示进度');},

    async readImage(file){
        if(!/^image\/(png|jpeg|webp|gif|bmp|avif)$/.test(file.type))throw Error('请选择 PNG、JPEG、WebP、GIF、BMP 或 AVIF 图片');
        if(file.size>32*1024*1024)throw Error('单张图片不能超过 32 MB');
        this._pendingImages++;
        try{return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(Error('图片读取失败'));reader.onload=()=>{const image=new Image();image.onload=()=>resolve(reader.result);image.onerror=()=>reject(Error('图片无法解码'));image.src=reader.result;};reader.readAsDataURL(file);});}
        finally{this._pendingImages--;}
    },
    addGenFiles(files){
        if(this.isRunning)return;const selected=Array.from(files),epoch=this._imageEpoch;
        this._imageQueue=(this._imageQueue||Promise.resolve()).then(async()=>{
            for(const file of selected){try{const data=await this.readImage(file);if(epoch!==this._imageEpoch)return;this.genImages.push(data);this.renderGenList();this.commit();}catch(error){this.notify(file.name+'：'+error.message);}}
        });
    },
    resetGenCursor(){if(this.isRunning)return;original.resetGenCursor.call(this);this.canvasContent.querySelectorAll('.save-download').forEach(el=>el.remove());this.commit();},
    stepBackGenCursor(){if(this.isRunning)return;original.stepBackGenCursor.call(this);if(this.genCursor===0)this.canvasContent.querySelectorAll('.save-download').forEach(el=>el.remove());this.commit();},
});

Object.assign(app, {
    validateDocument(data) {
        if(!data || typeof data!=='object' || !Array.isArray(data.nodes))throw Error('工作流必须包含 nodes 数组');
        if(data.format && data.format!=='comfyui-demo')throw Error('无法识别的工作流格式');
        if(data.schemaVersion && data.schemaVersion!==2)throw Error('此工作流版本尚不受支持');
        const native=Array.isArray(data.links) && !Array.isArray(data.connections);
        const array=(v,name,max)=>{if(!Array.isArray(v)||v.length>max)throw Error(name+' 格式无效或数量过多');return v;};
        const geometry=(v,fallback,min=-10000000,max=10000000)=>{if(v===undefined)return fallback;if(!Number.isFinite(Number(v))||Number(v)<min||Number(v)>max)throw Error('坐标或尺寸超出有效范围');return Number(v);};
        const image=src=>{if(!src)return '';if(typeof src!=='string'||src.length>45*1024*1024||!IMAGE_PATTERN.test(src))throw Error('图片必须是工作流内嵌的有效图片数据');return src;};
        const ids=new Set();
        const nodes=array(data.nodes,'节点',1000).map(raw=>{
            if(!raw || !NODES[raw.type])throw Error('不支持的节点：'+String(raw?.type));
            const id=Number(raw.id);if(!Number.isSafeInteger(id)||id<1||ids.has(id))throw Error('节点 ID 重复或无效');ids.add(id);
            const def=NODES[raw.type];
            if(!native && raw.widgets!==undefined && !Array.isArray(raw.widgets))throw Error('节点控件格式无效');
            const widgets=def.widgets.map((w,index)=>{
                const incoming=native ? {value:raw.widgets_values?.[index]} : raw.widgets?.find(x=>x?.name===w.name);
                const v=incoming?.value;
                const next={...w,...(w.options?{options:[...w.options]}:{})};
                if(v!==undefined){
                    if(w.type==='number'){
                        const [min,max,step]=NUMBER_RULES[w.name]||[-Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER,1];
                        if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||(step>=1&&!Number.isSafeInteger(v)))throw Error(`${def.title} 的 ${w.name} 参数无效（${min}–${max}）`);
                        next.value=v;
                    } else if(w.type==='image'){
                        next.value=native && !String(v).startsWith('data:') ? '' : image(v);
                        next.filename=String(incoming?.filename || (native?v:'')).slice(0,255);
                    } else {
                        if(typeof v!=='string' || v.length>200000)throw Error('文本参数格式无效');
                        if(w.type==='combo' && !w.options.includes(v)){
                            if(!['unet_name','clip_name','vae_name'].includes(w.name))throw Error(w.name+' 包含未知选项');
                            next.options.push(v);
                        }
                        next.value=v;
                    }
                }
                return next;
            });
            const n={id,type:raw.type,x:geometry(native?raw.pos?.[0]:raw.x,0),y:geometry(native?raw.pos?.[1]:raw.y,0),
                w:geometry(native?raw.size?.[0]:raw.w,def.width||0,0),h:geometry(native?raw.size?.[1]:raw.h,0,0),
                inputs:def.inputs.map(p=>({...p})),outputs:def.outputs.map(p=>({...p})),widgets};
            if(raw.resultImage)n.resultImage=image(raw.resultImage);
            return n;
        });
        const byId=new Map(nodes.map(n=>[n.id,n])),occupied=new Set();
        const rawLinks=native ? data.links.map(l=>({fromNode:l[1],fromSlot:l[2],toNode:l[3],toSlot:l[4]})) : (data.connections||[]);
        const connections=array(rawLinks,'连线',10000).map(raw=>{
            if(!raw)throw Error('无效连线');
            const c={fromNode:Number(raw.fromNode),fromSlot:Number(raw.fromSlot),toNode:Number(raw.toNode),toSlot:Number(raw.toSlot)};
            const from=byId.get(c.fromNode),to=byId.get(c.toNode),out=from?.outputs[c.fromSlot],input=to?.inputs[c.toSlot];
            if(!Number.isInteger(c.fromSlot)||!Number.isInteger(c.toSlot)||!out||!input||!this.canConnect(out.type,input.type)||c.fromNode===c.toNode)throw Error('连线端口、类型或节点引用无效');
            const key=c.toNode+':'+c.toSlot;if(occupied.has(key))throw Error('一个输入端口不能连接多条线');occupied.add(key);
            return {...c,type:out.type};
        });
        const groupIds=new Set();
        const groups=array(data.groups||[],'分组',500).map((raw,i)=>{
            if(!raw)throw Error('无效分组');const id=native?i+1:Number(raw.id);
            if(!Number.isSafeInteger(id)||id<1||groupIds.has(id))throw Error('分组 ID 重复或无效');groupIds.add(id);
            const color=raw.color||'#28779a';if(!colorValid(color))throw Error('分组颜色应为六位 HEX 色值');
            return {id,title:String(raw.title||'未命名分组').slice(0,200),color,
                x:geometry(native?raw.bounding?.[0]:raw.x,0),y:geometry(native?raw.bounding?.[1]:raw.y,0),
                w:geometry(native?raw.bounding?.[2]:raw.w,500,120),h:geometry(native?raw.bounding?.[3]:raw.h,360,80),
                opacity:geometry(raw.opacity,.16,0,1),fontSize:geometry(raw.fontSize||raw.font_size,20,12,64),moveNodes:raw.moveNodes!==false};
        });
        const genImages=array(data.genImages||[],'演示图片',500).map(image);
        const cursor=geometry(data.genCursor,0,0,genImages.length);if(!Number.isInteger(cursor))throw Error('图片播放位置无效');
        const state={format:'comfyui-demo',schemaVersion:2,name:String(data.name||'导入工作流').slice(0,120),nodes,connections,groups,
            nextId:Math.max(0,...ids)+1,nextGroupId:Math.max(0,...groupIds)+1,genImages,genCursor:cursor,
            transform:{x:geometry(data.transform?.x,150),y:geometry(data.transform?.y,90),scale:geometry(data.transform?.scale,1,.1,4)},
            settings:{autoSave:data.settings?.autoSave!==false,speed:geometry(data.settings?.speed,1,.25,4),groupColor:colorValid(data.settings?.groupColor)?data.settings.groupColor:'#28779a'}};
        const errors=this.graphErrors(nodes,connections);if(errors.length)throw Error(errors.join('；'));
        return state;
    },
    graphErrors(nodes=this.nodes,connections=this.connections){
        const ids=new Set(nodes.map(n=>n.id)),counts=new Map(nodes.map(n=>[n.id,0])),children=new Map(nodes.map(n=>[n.id,[]]));
        for(const c of connections){if(!ids.has(c.fromNode)||!ids.has(c.toNode))return ['存在悬空连接'];counts.set(c.toNode,counts.get(c.toNode)+1);children.get(c.fromNode).push(c.toNode);}
        const ready=[...counts].filter(([,v])=>v===0).map(([id])=>id);let count=0;
        while(ready.length){const id=ready.shift();count++;for(const next of children.get(id)){counts.set(next,counts.get(next)-1);if(counts.get(next)===0)ready.push(next);}}
        return count===nodes.length?[]:['存在循环依赖，请断开形成回路的连线'];
    },
    async openStorage(){
        if(this._db)return this._db;
        this._db=await new Promise((resolve,reject)=>{
            if(!window.indexedDB){reject(Error('此浏览器不支持本地数据库'));return;}
            const request=indexedDB.open('comfyui-demo-v2',1);
            request.onupgradeneeded=()=>request.result.createObjectStore('documents');
            request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('存储被其他页面占用，请关闭旧页面后重试'));
            request.onsuccess=()=>resolve(request.result);
        });
        this._db.onversionchange=()=>{this._db.close();this._db=null;};return this._db;
    },
    async readSaved(){
        try{const db=await this.openStorage();return await new Promise((resolve,reject)=>{const tx=db.transaction('documents','readonly'),r=tx.objectStore('documents').get('current');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}
        catch(error){this._storageError=error.message;throw error;}
    },
    setSaveStatus(text){const el=document.getElementById('save-status');if(el){el.textContent=text;el.title=text;}},
    scheduleSave(){
        if(this._initializing || this._suspendHistory)return;
        this._saveRevision++;this.setSaveStatus(this.settings.autoSave?'待保存…':'未保存（自动保存已关闭）');
        clearTimeout(this._saveTimer);if(this.settings.autoSave)this._saveTimer=setTimeout(()=>this.saveNow(),250);
    },
    saveNow(manual=false){
        if(this._initializing)return Promise.resolve();
        clearTimeout(this._saveTimer);
        if(!manual && !this.settings.autoSave)return Promise.resolve();
        const state=this.snapshot(),revision=this._saveRevision;
        this._saveChain=this._saveChain.catch(()=>{}).then(async()=>{
            this.setSaveStatus('保存中…');
            try{
                const db=await this.openStorage();
                await new Promise((resolve,reject)=>{const tx=db.transaction('documents','readwrite');tx.objectStore('documents').put(state,'current');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('存储空间不足'));tx.onerror=()=>reject(tx.error);});
                this._savedRevision=revision;this._storageError=null;
                this.setSaveStatus(this._saveRevision===revision?'已保存 · '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'待保存…');
                if(manual)this.toast('已保存到当前浏览器，包含图片');
            }catch(error){this._storageError=error.message;this.setSaveStatus('保存失败，请导出 JSON');if(manual||!this._saveWarned){this._saveWarned=true;this.notify('自动保存不可用或空间不足，请导出 JSON 备份。');}}
        });
        return this._saveChain;
    },

    notify(message){this.notifications.unshift({time:new Date().toLocaleTimeString(),message});this.notifications=this.notifications.slice(0,80);this.toast(message);},
    showDialog(title,html){const dialog=document.getElementById('editor-dialog');document.getElementById('dialog-title').textContent=title;document.getElementById('dialog-body').innerHTML=html;if(!dialog.open)dialog.showModal();},
    showNotifications(){this.showDialog('通知与执行记录',this.notifications.length?this.notifications.map(n=>`<div class="log-entry"><time>${esc(n.time)}</time>${esc(n.message)}</div>`).join(''):'暂无记录');},
    showWorkflowInfo(){this.showDialog('工作流',`<p>${esc(this.workflowName)}</p><p>${this.nodes.length} 个节点 · ${this.connections.length} 条连线 · ${this.groups.length} 个分组</p><p>演示图片 ${this.genImages.length} 张，已展示 ${this.genCursor} 张。</p><p class="hint">版本 ${this.version} · 纯前端工作流演示。模型参数用于展示，执行结果来自预上传图片。</p><div class="inline-fields"><button class="tool" onclick="app.exportWorkflow()">导出 JSON</button><button class="tool" onclick="document.getElementById('editor-dialog').close();app.renameWorkflow()">重命名</button></div>`);},
    showSettings(){
        if(this.isRunning){this.toast('请先停止执行再修改设置');return;}
        this.showDialog('设置',`<label class="field"><span><input id="setting-autosave" type="checkbox" ${this.settings.autoSave?'checked':''}> 自动保存工作流和图片</span><small>保存在当前浏览器。跨设备使用或清理浏览器前，请导出 JSON。</small></label><label class="field">演示速度<select id="setting-speed">${[.25,.5,1,2,4].map(n=>`<option value="${n}" ${n===this.settings.speed?'selected':''}>${n}×</option>`).join('')}</select></label><label class="field">新分组默认颜色<input id="setting-color" type="color" value="${this.settings.groupColor}"></label><button class="tool" id="setting-save">立即保存</button>`);
        document.getElementById('setting-autosave').onchange=e=>{this.settings.autoSave=e.target.checked;this.commit();this.saveNow(true);};
        document.getElementById('setting-speed').onchange=e=>{this.settings.speed=Number(e.target.value);this.commit();};
        document.getElementById('setting-color').onchange=e=>{this.settings.groupColor=e.target.value;this.commit();};
        document.getElementById('setting-save').onclick=()=>this.saveNow(true);
    },
    showModels(){
        const models=this.nodes.filter(n=>['UNETLoader','CLIPLoader','VAELoader'].includes(n.type));
        this.showDialog('模型库',`<p class="hint">当前工作流的演示模型名称，可修改显示名称。此程序不加载模型权重。</p>${models.length?models.map(n=>`<label class="field">${esc(NODES[n.type].title)} #${n.id}<input data-model-id="${n.id}" value="${esc(n.widgets[0].value)}" ${this.isRunning?'disabled':''}></label>`).join(''):'请先添加加载器节点，或加载预设工作流。'}`);
        document.querySelectorAll('[data-model-id]').forEach(input=>input.onchange=()=>{
            if(this.isRunning)return;const node=this.nodes.find(n=>n.id===Number(input.dataset.modelId));if(!node)return;
            const value=input.value.trim().slice(0,255);if(!value)return;const widget=node.widgets[0];widget.value=value;if(!widget.options.includes(value))widget.options.push(value);
            this.nodeEl(node.id).remove();this.renderNode(node);this.renderConnections();this.commit();
        });
    },
    showGallery(){
        const images=[];for(const n of this.nodes){for(const w of n.widgets)if(w.type==='image'&&w.value)images.push({src:w.value,name:w.filename||'输入图片'});if(n.resultImage)images.push({src:n.resultImage,name:'输出图片'});}this.genImages.forEach((src,i)=>images.push({src,name:'演示图片 '+(i+1)}));
        this.showDialog('图像',images.length?'<div class="gallery">'+images.map((im,i)=>`<figure><img src="${im.src}" alt="${esc(im.name)}"><figcaption>${esc(im.name)}</figcaption><button class="tool" data-image-download="${i}">下载</button></figure>`).join('')+'</div>':'暂无图片。可在加载图像节点或生成历史面板中上传。');
        document.querySelectorAll('[data-image-download]').forEach(button=>button.onclick=()=>{const im=images[Number(button.dataset.imageDownload)];this.downloadImage(im.src,im.name);});
    },
    showHelp(){this.showDialog('操作帮助',`<ul><li>双击 / 右键空白处添加节点；拖动节点标题移动。</li><li>按 G 或点击「＋ 分组」创建背景框。标题与右下角可拖动，编辑面板支持名称、HEX 颜色、透明度和精确尺寸。</li><li>分组拖动默认携带完整包围的节点；按 Alt 仅移动框。</li><li>Ctrl/Cmd+S 保存，Ctrl/Cmd+Shift+S 导出，Ctrl/Cmd+O 导入。</li><li>Ctrl/Cmd+Z 撤销，Ctrl/Cmd+Shift+Z / Ctrl+Y 重做，Ctrl/Cmd+D 复制选中对象。</li><li>Delete 删除选中节点或分组；删除分组会保留节点。</li><li>F 适应画布；滚轮缩放；空白处左键 / 任意位置中键平移。</li><li>Ctrl/Cmd+Enter 执行 / 停止。输出图从「生成历史」预上传的图片中依次选取。</li></ul><p class="hint">JSON 备份包含图片。支持本程序完整备份，以及节点库中已支持类型的 ComfyUI 画布 JSON；原版工作流引用的外部图片需要重新上传。</p>`);},
});

Object.assign(app, {
    pause(ms,signal){return new Promise((resolve,reject)=>{if(signal.aborted){reject(new DOMException('执行已停止','AbortError'));return;}const abort=()=>{clearTimeout(timer);reject(new DOMException('执行已停止','AbortError'));};const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);signal.addEventListener('abort',abort,{once:true});});},
    samplerSteps(node,nodes=this.nodes,connections=this.connections){
        const link=connections.find(c=>c.toNode===node.id&&node.inputs[c.toSlot]?.name==='sigmas');
        const scheduler=nodes.find(n=>n.id===link?.fromNode);
        return Math.round(finite(scheduler?.widgets.find(w=>w.name==='steps')?.value,4,1,1000));
    },
    async execNode(node,signal,nodes,connections){
        const el=this.nodeEl(node.id);if(!el)throw Error('执行中的节点已不存在');
        el.classList.add('executing');const bar=el.querySelector('.node-progress');
        const duration=this.nodeDuration(node)/this.settings.speed;
        const steps=node.type==='SamplerCustomAdvanced'?this.samplerSteps(node,nodes,connections):1;
        try{for(let s=1;s<=steps;s++){if(bar){bar.style.transition=`width ${duration/steps}ms linear`;bar.style.width=(s/steps*100)+'%';}await this.pause(duration/steps,signal);this._gpAdvance?.(1/steps);}}
        finally{el.classList.remove('executing');if(bar){bar.style.transition='none';bar.style.width='0%';}}
    },
    advanceSeeds(){
        for(const n of this.nodes){if(n.type!=='RandomNoise')continue;
            const seed=n.widgets.find(w=>w.name==='noise_seed'),mode=n.widgets.find(w=>w.name==='control_after_generate')?.value;
            if(mode==='increment')seed.value=seed.value===Number.MAX_SAFE_INTEGER?0:seed.value+1;
            if(mode==='decrement')seed.value=seed.value===0?Number.MAX_SAFE_INTEGER:seed.value-1;
            if(mode==='randomize'){const bytes=new Uint32Array(2);crypto.getRandomValues(bytes);const candidate=(bytes[0]&0x1fffff)*4294967296+bytes[1];seed.value=candidate===seed.value?(candidate+1)%(Number.MAX_SAFE_INTEGER+1):candidate;}
            const index=n.widgets.indexOf(seed),valueEl=this.nodeEl(n.id)?.querySelector(`[data-widget="${index}"] .w-val`);if(valueEl)valueEl.textContent=String(seed.value);
        }
    },
    stopWorkflow(){this._controller?.abort();},
    async runWorkflow(){
        if(this.isRunning)return;
        if(!this.nodes.length){this.toast('画布为空，请先添加节点');return;}
        if(this._pendingImages){this.toast('图片正在读取，请稍后执行');return;}
        try{this.validateDocument(this.snapshot());}catch(error){this.notify('无法执行：'+error.message);return;}
        document.activeElement?.blur();this.hideSearch();this.closeComboMenu();this.selectGroup(null);document.getElementById('editor-dialog').close();
        this.isRunning=true;this._controller=new AbortController();const signal=this._controller.signal;
        const nodes=this.nodes.map(copyNode),connections=this.connections.map(c=>({...c}));
        const hasOutput=nodes.some(n=>n.type==='SaveImage');
        const result=hasOutput&&this.genImages.length?this.genImages[Math.min(this.genCursor,this.genImages.length-1)]:null;
        const button=document.getElementById('run-button'),badge=document.getElementById('queue-badge'),progress=document.getElementById('gp-fill');
        document.getElementById('app').classList.add('is-running');button.classList.add('running');document.getElementById('run-label').textContent='停止';document.getElementById('run-icon').textContent='■';badge.textContent='队列 1';
        document.querySelectorAll('.edit-action').forEach(el=>el.disabled=true);
        const pending=new Map(nodes.map(n=>[n.id,n])),done=new Set(),running=new Map(),tasks=[];let work=0;
        this._gpAdvance=units=>{work+=units;progress.style.width=Math.min(99,100*work/nodes.length)+'%';};
        try{
            while(pending.size || running.size){
                if(signal.aborted)throw new DOMException('执行已停止','AbortError');
                for(const [id,node] of pending){
                    if(!connections.filter(c=>c.toNode===id).every(c=>done.has(c.fromNode)))continue;
                    const heavyActive=[...running.keys()].some(id=>this.isHeavyNode(nodes.find(n=>n.id===id).type));
                    if(running.size && (heavyActive || this.isHeavyNode(node.type) || running.size>=2))continue;
                    pending.delete(id);
                    const task=this.execNode(node,signal,nodes,connections).then(()=>{done.add(id);running.delete(id);});
                    running.set(id,task);tasks.push(task);
                }
                if(!running.size && pending.size)throw Error('依赖无法满足，请检查连线');
                if(running.size)await Promise.race(running.values());
            }
            if(result){for(const n of this.nodes.filter(n=>n.type==='SaveImage'))this.showResultOnNode(n,result);if(this.genCursor<this.genImages.length)this.genCursor++;this.renderGenList();}
            this.advanceSeeds();this.commit();
            this.notify('执行完成'+(!hasOutput?'（没有输出节点，图片进度保持不变）':!result?'（未上传演示图片）':''));
        }catch(error){this._controller.abort();await Promise.allSettled(tasks);this.notify(error.name==='AbortError'?'执行已停止，图片进度和种子保持不变':'执行失败：'+error.message);}
        finally{
            this._gpAdvance=null;progress.style.width='0%';button.classList.remove('running');badge.textContent='队列 0';document.getElementById('run-label').textContent='执行';document.getElementById('run-icon').textContent='▶';document.getElementById('app').classList.remove('is-running');document.querySelectorAll('.edit-action').forEach(el=>el.disabled=false);this.isRunning=false;this._controller=null;
        }
    },
});

document.addEventListener('DOMContentLoaded', () => app.init());
