
        // ===================== 节点定义（来自 F.2-Klein9b编辑3 工作流） =====================
        const NODES = {
            "UNETLoader": {
                title: "UNET加载器",
                category: "loaders",
                inputs: [],
                outputs: [{ name: "MODEL", type: "MODEL", label: "模型" }],
                widgets: [
                    { name: "unet_name", type: "combo", label: "unet_name", value: "Flux-2-klein-9b-fp8_V1", options: ["Flux-2-klein-9b-fp8_V1"] },
                    { name: "weight_dtype", type: "combo", label: "weight_dtype", value: "default", options: ["default", "fp8_e4m3fn", "fp8_e5m2"] }
                ]
            },
            "CLIPLoader": {
                title: "CLIP加载器",
                category: "loaders",
                inputs: [],
                outputs: [{ name: "CLIP", type: "CLIP", label: "CLIP" }],
                widgets: [
                    { name: "clip_name", type: "combo", label: "clip_name", value: "qwen_3_8b_fp8mixed.safetensors", options: ["qwen_3_8b_fp8mixed.safetensors"] },
                    { name: "type", type: "combo", label: "type", value: "flux2", options: ["flux2", "stable_diffusion", "sdxl"] }
                ]
            },
            "VAELoader": {
                title: "VAE加载器",
                category: "loaders",
                inputs: [],
                outputs: [{ name: "VAE", type: "VAE", label: "VAE" }],
                widgets: [
                    { name: "vae_name", type: "combo", label: "vae_name", value: "flux2-vae.safetensors", options: ["flux2-vae.safetensors"] }
                ]
            },
            "LoadImage": {
                title: "加载图像",
                category: "image",
                width: 230,
                inputs: [],
                outputs: [
                    { name: "IMAGE", type: "IMAGE", label: "图像" },
                    { name: "MASK", type: "MASK", label: "遮罩" }
                ],
                widgets: [
                    { name: "image", type: "image", label: "image", value: "", filename: "" }
                ]
            },
            "SaveImage": {
                title: "保存图像",
                category: "image",
                width: 230,
                inputs: [{ name: "images", type: "IMAGE", label: "图像" }],
                outputs: [],
                widgets: [
                    { name: "filename_prefix", type: "string", label: "filename_prefix", value: "ComfyUI" }
                ]
            },
            "EmptyImage": {
                title: "空图像",
                category: "image",
                inputs: [],
                outputs: [{ name: "IMAGE", type: "IMAGE", label: "图像" }],
                widgets: [
                    { name: "width", type: "number", label: "width", value: 512 },
                    { name: "height", type: "number", label: "height", value: 512 },
                    { name: "batch_size", type: "number", label: "batch_size", value: 1 },
                    { name: "color", type: "number", label: "color", value: 0 }
                ]
            },
            "GetImageSize+": {
                title: "获取图像尺寸 🔧",
                category: "image",
                inputs: [{ name: "image", type: "IMAGE", label: "图像" }],
                outputs: [
                    { name: "width", type: "INT", label: "宽度" },
                    { name: "height", type: "INT", label: "高度" },
                    { name: "count", type: "INT", label: "数量" }
                ],
                widgets: []
            },
            "Sage_CubiqImageResize": {
                title: "图像缩放",
                category: "image",
                inputs: [{ name: "image", type: "IMAGE", label: "图像" }],
                outputs: [
                    { name: "IMAGE", type: "IMAGE", label: "图像" },
                    { name: "width", type: "INT", label: "宽度" },
                    { name: "height", type: "INT", label: "高度" }
                ],
                widgets: [
                    { name: "width", type: "number", label: "width", value: 640 },
                    { name: "height", type: "number", label: "height", value: 640 },
                    { name: "interpolation", type: "combo", label: "interpolation", value: "nearest", options: ["nearest", "bilinear", "bicubic", "area", "lanczos"] }
                ]
            },
            "CLIPTextEncode": {
                title: "CLIP文本编码",
                category: "conditioning",
                width: 290,
                inputs: [{ name: "clip", type: "CLIP", label: "CLIP" }],
                outputs: [{ name: "CONDITIONING", type: "CONDITIONING", label: "条件" }],
                widgets: [
                    { name: "text", type: "text", label: "text", value: "" }
                ]
            },
            "ReferenceLatent": {
                title: "参考Latent",
                category: "conditioning",
                inputs: [
                    { name: "conditioning", type: "CONDITIONING", label: "条件" },
                    { name: "latent", type: "LATENT", label: "Latent" }
                ],
                outputs: [{ name: "CONDITIONING", type: "CONDITIONING", label: "条件" }],
                widgets: []
            },
            "VAEEncode": {
                title: "VAE编码",
                category: "latent",
                inputs: [
                    { name: "pixels", type: "IMAGE", label: "像素" },
                    { name: "vae", type: "VAE", label: "VAE" }
                ],
                outputs: [{ name: "LATENT", type: "LATENT", label: "Latent" }],
                widgets: []
            },
            "VAEDecode": {
                title: "VAE解码",
                category: "latent",
                inputs: [
                    { name: "samples", type: "LATENT", label: "Latent" },
                    { name: "vae", type: "VAE", label: "VAE" }
                ],
                outputs: [{ name: "IMAGE", type: "IMAGE", label: "图像" }],
                widgets: []
            },
            "EmptyFlux2LatentImage": {
                title: "空Flux2 Latent图像",
                category: "latent",
                inputs: [
                    { name: "width", type: "INT", label: "宽度" },
                    { name: "height", type: "INT", label: "高度" }
                ],
                outputs: [{ name: "LATENT", type: "LATENT", label: "Latent" }],
                widgets: [
                    { name: "batch_size", type: "number", label: "batch_size", value: 1 }
                ]
            },
            "CFGGuider": {
                title: "CFG引导器",
                category: "sampling",
                inputs: [
                    { name: "model", type: "MODEL", label: "模型" },
                    { name: "positive", type: "CONDITIONING", label: "正面条件" },
                    { name: "negative", type: "CONDITIONING", label: "负面条件" }
                ],
                outputs: [{ name: "GUIDER", type: "GUIDER", label: "引导" }],
                widgets: [
                    { name: "cfg", type: "number", label: "cfg", value: 1.0, step: 0.1 }
                ]
            },
            "KSamplerSelect": {
                title: "K采样器选择",
                category: "sampling",
                inputs: [],
                outputs: [{ name: "SAMPLER", type: "SAMPLER", label: "采样器" }],
                widgets: [
                    { name: "sampler_name", type: "combo", label: "sampler_name", value: "euler_ancestral", options: ["euler", "euler_ancestral", "heun", "dpm_2", "dpmpp_2m", "dpmpp_2m_sde", "ddim", "uni_pc"] }
                ]
            },
            "RandomNoise": {
                title: "随机噪波",
                category: "sampling",
                inputs: [],
                outputs: [{ name: "NOISE", type: "NOISE", label: "噪波" }],
                widgets: [
                    { name: "noise_seed", type: "number", label: "noise_seed", value: 719684872541341 },
                    { name: "control_after_generate", type: "combo", label: "运行后操作", value: "randomize", options: ["fixed", "increment", "decrement", "randomize"] }
                ]
            },
            "Flux2Scheduler": {
                title: "Flux2调度器",
                category: "sampling",
                inputs: [
                    { name: "width", type: "INT", label: "宽度" },
                    { name: "height", type: "INT", label: "高度" }
                ],
                outputs: [{ name: "SIGMAS", type: "SIGMAS", label: "Sigmas" }],
                widgets: [
                    { name: "steps", type: "number", label: "steps", value: 4 }
                ]
            },
            "SamplerCustomAdvanced": {
                title: "自定义采样器（高级）",
                category: "sampling",
                width: 240,
                inputs: [
                    { name: "noise", type: "NOISE", label: "噪波" },
                    { name: "guider", type: "GUIDER", label: "引导" },
                    { name: "sampler", type: "SAMPLER", label: "采样器" },
                    { name: "sigmas", type: "SIGMAS", label: "Sigmas" },
                    { name: "latent_image", type: "LATENT", label: "Latent图像" }
                ],
                outputs: [
                    { name: "output", type: "LATENT", label: "输出" },
                    { name: "denoised_output", type: "LATENT", label: "降噪输出" }
                ],
                widgets: []
            },
            "Anything Everywhere": {
                title: "Anything Everywhere",
                category: "utils",
                inputs: [{ name: "anything", type: "*", label: "anything" }],
                outputs: [],
                widgets: []
            }
        };

        const CATEGORIES = {
            "loaders": "加载器",
            "conditioning": "条件",
            "latent": "Latent",
            "image": "图像",
            "sampling": "采样",
            "utils": "工具"
        };

        const TYPE_COLORS = {
            'MODEL': '#B39DDB', 'CLIP': '#FFD500', 'VAE': '#FF6E6E',
            'IMAGE': '#64B5F6', 'LATENT': '#FF9CF9', 'CONDITIONING': '#FFA931',
            'MASK': '#81C784', 'SAMPLER': '#ECB4B4', 'SIGMAS': '#CDFFCD',
            'NOISE': '#B0B0B0', 'GUIDER': '#66D9EF', 'INT': '#5b8db8',
            'STRING': '#77FF77', '*': '#9ca3af'
        };

        function esc(s) {
            return String(s == null ? '' : s)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;')
                .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        // ===================== 主应用 =====================
        const app = {
            nodes: [],
            connections: [],
            nextId: 1,
            transform: { x: 150, y: 90, scale: 1 },
            canvas: null,
            canvasArea: null,
            canvasContent: null,
            svg: null,
            selectedNode: null,
            linking: null,          // { nodeId, idx, dtype } 始终为输出端
            linkMouse: null,        // 拖线时鼠标的世界坐标
            isPanning: false,
            panStart: { x: 0, y: 0 },
            searchPos: { x: 0, y: 0 },
            history: [],
            historyIndex: -1,
            maxHistory: 60,
            isRunning: false,
            _zTop: 10,
            genImages: [],      // 生成历史：预上传的成品图（dataURL 列表）
            genCursor: 0,       // 下一次"生成"要展示第几张

            init() {
                this.canvas = document.getElementById('canvas');
                this.canvasArea = document.getElementById('canvas-area');
                this.canvasContent = document.getElementById('canvas-content');
                this.svg = document.getElementById('connections-svg');

                this.setupEvents();
                this.setupGenHistory();
                this.setupNodeLib();
                this.updateTransform();
                this.commit(); // 记录初始空状态，保证第一步操作可撤销
            },

            // 屏幕坐标 → 世界坐标
            toWorld(clientX, clientY) {
                const rect = this.canvas.getBoundingClientRect();
                return {
                    x: (clientX - rect.left - this.transform.x) / this.transform.scale,
                    y: (clientY - rect.top - this.transform.y) / this.transform.scale
                };
            },

            setupEvents() {
                // 双击空白画布 → 节点搜索
                this.canvas.addEventListener('dblclick', (e) => {
                    if (this.isCanvasTarget(e.target)) {
                        this.searchPos = this.toWorld(e.clientX, e.clientY);
                        this.showSearch(e.clientX, e.clientY);
                    }
                });

                // 右键空白画布 → 节点搜索（模仿真实 ComfyUI 的添加节点菜单）
                this.canvasArea.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    if (this.isCanvasTarget(e.target)) {
                        this.searchPos = this.toWorld(e.clientX, e.clientY);
                        this.showSearch(e.clientX, e.clientY);
                    }
                });

                // 画布平移（左键拖空白处；中键在任意位置包括节点上都可平移）
                this.canvas.addEventListener('mousedown', (e) => {
                    const blankTarget = this.isCanvasTarget(e.target);
                    if (e.button === 1 || (e.button === 0 && blankTarget)) {
                        this.isPanning = true;
                        this.panStart = { x: e.clientX - this.transform.x, y: e.clientY - this.transform.y };
                        if (blankTarget) this.selectNode(null);
                        e.preventDefault();
                    }
                });

                document.addEventListener('mousemove', (e) => {
                    if (this.isPanning) {
                        this.transform.x = e.clientX - this.panStart.x;
                        this.transform.y = e.clientY - this.panStart.y;
                        this.updateTransform();
                    }
                    if (this.linking) {
                        this.linkMouse = this.toWorld(e.clientX, e.clientY);
                        this.renderConnections();
                    }
                });

                document.addEventListener('mouseup', () => {
                    this.isPanning = false;
                    if (this.linking) {
                        // 拖线落空：若是断开的旧连接则记录历史
                        const wasDetach = this.linking.detached;
                        this.linking = null;
                        this.linkMouse = null;
                        this.updateSlotStates();
                        this.renderConnections();
                        if (wasDetach) this.commit();
                    }
                });

                // 滚轮缩放
                this.canvasArea.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
                    this.zoomAt(factor, e.clientX, e.clientY);
                }, { passive: false });

                // 搜索框
                const input = document.getElementById('search-input');
                input.addEventListener('input', (e) => this.renderSearch(e.target.value));
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') { this.hideSearch(); }
                    else if (e.key === 'Enter') {
                        const sel = document.querySelector('.result-item.selected');
                        if (sel) sel.click();
                    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        this.navigateSearch(e.key === 'ArrowDown' ? 1 : -1);
                    }
                });

                document.addEventListener('mousedown', (e) => {
                    const modal = document.getElementById('search-modal');
                    if (modal.classList.contains('active') && !modal.contains(e.target)) this.hideSearch();
                    const menu = document.getElementById('combo-menu');
                    if (menu.classList.contains('active') && !menu.contains(e.target)) this.closeComboMenu();
                });

            },

            isCanvasTarget(t) {
                return t === this.canvas || t === this.svg || t === this.canvasContent || t === this.canvasArea;
            },

            // ===================== 视图变换 =====================
            updateTransform() {
                const { x, y, scale } = this.transform;
                // 只在容器上做一次变换，节点不再单独缩放（修复双重缩放导致的连线偏移）
                this.canvasContent.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
                // 网格跟随平移缩放
                this.canvasArea.style.backgroundPosition = `${x}px ${y}px`;
                this.canvasArea.style.backgroundSize = `${24 * scale}px ${24 * scale}px`;
                this.updateZoomDisplay();
            },

            zoomAt(factor, clientX, clientY) {
                const newScale = Math.max(0.1, Math.min(4, this.transform.scale * factor));
                const rect = this.canvas.getBoundingClientRect();
                const mx = clientX - rect.left;
                const my = clientY - rect.top;
                this.transform.x = mx - (mx - this.transform.x) * (newScale / this.transform.scale);
                this.transform.y = my - (my - this.transform.y) * (newScale / this.transform.scale);
                this.transform.scale = newScale;
                this.updateTransform();
            },

            zoomStep(factor) {
                const rect = this.canvas.getBoundingClientRect();
                this.zoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
            },

            updateZoomDisplay() {
                document.getElementById('zoom-display').textContent = Math.round(this.transform.scale * 100) + '%';
            },

            resetView() {
                this.transform = { x: 150, y: 90, scale: 1 };
                this.updateTransform();
            },

            fitView() {
                if (this.nodes.length === 0) { this.resetView(); return; }
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                this.nodes.forEach(n => {
                    const el = this.nodeEl(n.id);
                    const w = el ? el.offsetWidth : 200;
                    const h = el ? el.offsetHeight : 100;
                    minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
                    maxX = Math.max(maxX, n.x + w); maxY = Math.max(maxY, n.y + h);
                });
                const rect = this.canvas.getBoundingClientRect();
                const pad = 60;
                const scale = Math.max(0.1, Math.min(1.5,
                    Math.min((rect.width - pad * 2) / (maxX - minX), (rect.height - pad * 2) / (maxY - minY))));
                this.transform.scale = scale;
                this.transform.x = (rect.width - (maxX - minX) * scale) / 2 - minX * scale;
                this.transform.y = (rect.height - (maxY - minY) * scale) / 2 - minY * scale;
                this.updateTransform();
            },

            // ===================== 节点搜索 =====================
            showSearch(x, y) {
                const modal = document.getElementById('search-modal');
                const input = document.getElementById('search-input');
                modal.classList.add('active');
                // 防止超出屏幕
                const mw = modal.offsetWidth, mh = Math.min(modal.offsetHeight, 560);
                modal.style.left = Math.min(x, window.innerWidth - mw - 16) + 'px';
                modal.style.top = Math.min(y, window.innerHeight - mh - 16) + 'px';
                input.value = '';
                this.renderSearch('');
                setTimeout(() => input.focus(), 0);
            },

            hideSearch() {
                document.getElementById('search-modal').classList.remove('active');
            },

            renderSearch(filter) {
                const results = document.getElementById('search-results');
                const f = (filter || '').toLowerCase();
                let html = '';
                let first = true;

                Object.keys(CATEGORIES).forEach(cat => {
                    const list = Object.entries(NODES)
                        .filter(([type, def]) => def.category === cat)
                        .filter(([type, def]) => !f ||
                            def.title.toLowerCase().includes(f) || type.toLowerCase().includes(f));
                    if (list.length === 0) return;

                    html += `<div class="category-title">${CATEGORIES[cat]}</div>`;
                    list.forEach(([type, def]) => {
                        html += `<div class="result-item ${first ? 'selected' : ''}" data-type="${esc(type)}">
                            <span>${esc(def.title)}</span><span class="r-type">${esc(type)}</span></div>`;
                        first = false;
                    });
                });

                results.innerHTML = html || '<div style="padding:16px;color:#666;font-size:12px;text-align:center;">未找到节点</div>';

                results.querySelectorAll('.result-item').forEach(item => {
                    item.addEventListener('click', () => {
                        this.addNode(item.dataset.type, this.searchPos.x, this.searchPos.y);
                        this.hideSearch();
                    });
                    item.addEventListener('mouseenter', () => {
                        results.querySelectorAll('.result-item').forEach(i => i.classList.remove('selected'));
                        item.classList.add('selected');
                    });
                });
            },

            navigateSearch(dir) {
                const items = Array.from(document.querySelectorAll('.result-item'));
                if (!items.length) return;
                const idx = items.findIndex(i => i.classList.contains('selected'));
                let ni = idx + dir;
                if (ni < 0) ni = items.length - 1;
                if (ni >= items.length) ni = 0;
                items.forEach(i => i.classList.remove('selected'));
                items[ni].classList.add('selected');
                items[ni].scrollIntoView({ block: 'nearest' });
            },

            // ===================== 节点管理 =====================
            addNode(type, x, y) {
                const def = NODES[type];
                if (!def) return;
                const node = {
                    id: this.nextId++,
                    type, x, y,
                    w: def.width || 0,   // 0 = 自动宽度
                    h: 0,                // 0 = 自动高度
                    inputs: def.inputs.map(i => ({ ...i })),
                    outputs: def.outputs.map(o => ({ ...o })),
                    widgets: def.widgets.map(w => ({ ...w }))
                };
                this.nodes.push(node);
                this.renderNode(node);
                this.renderConnections();
                this.commit();
            },

            deleteNode(nodeId) {
                const idx = this.nodes.findIndex(n => n.id === nodeId);
                if (idx === -1) return;
                this.nodes.splice(idx, 1);
                this.connections = this.connections.filter(c => c.fromNode !== nodeId && c.toNode !== nodeId);
                const el = this.nodeEl(nodeId);
                if (el) el.remove();
                if (this.selectedNode && this.selectedNode.id === nodeId) this.selectedNode = null;
                this.updateSlotStates();
                this.renderConnections();
                this.commit();
            },

            nodeEl(id) {
                return this.canvasContent.querySelector(`[data-node-id="${id}"]`);
            },

            selectNode(node) {
                this.selectedNode = node;
                this.canvasContent.querySelectorAll('.comfy-node').forEach(el => {
                    el.classList.toggle('selected', !!node && parseInt(el.dataset.nodeId) === node.id);
                });
            },

            // ===================== 节点渲染 =====================
            renderNode(node) {
                const def = NODES[node.type] || {};
                const el = document.createElement('div');
                el.className = 'comfy-node';
                el.dataset.nodeId = node.id;
                el.style.left = node.x + 'px';
                el.style.top = node.y + 'px';
                if (node.w) el.style.width = node.w + 'px';
                else if (def.width) el.style.width = def.width + 'px';
                if (node.h) el.style.height = node.h + 'px';

                let html = `
                    <div class="node-header">
                        <span class="title-dot"></span>
                        <span class="node-title">${esc(def.title || node.type)}</span>
                        <div class="node-progress"></div>
                    </div>
                    <div class="node-body">`;

                // 输入端口
                node.inputs.forEach((inp, i) => {
                    const tc = `type-${inp.type === '*' ? 'STAR' : inp.type}`;
                    html += `<div class="node-row input">
                        <div class="node-slot ${tc}" data-node="${node.id}" data-kind="input" data-idx="${i}" data-dtype="${esc(inp.type)}"></div>
                        <span class="slot-label">${esc(inp.label)}</span>
                    </div>`;
                });

                // 输出端口
                node.outputs.forEach((out, i) => {
                    const tc = `type-${out.type === '*' ? 'STAR' : out.type}`;
                    html += `<div class="node-row output">
                        <span class="slot-label">${esc(out.label)}</span>
                        <div class="node-slot ${tc}" data-node="${node.id}" data-kind="output" data-idx="${i}" data-dtype="${esc(out.type)}"></div>
                    </div>`;
                });

                // 控件
                node.widgets.forEach((w, i) => {
                    html += this.widgetHTML(w, i);
                });

                // 生成结果展示区（SaveImage 执行后显示）
                if (node.resultImage) {
                    html += `<div class="image-preview save-result"><img src="${node.resultImage}" alt=""></div>`;
                }

                html += `</div><div class="node-resize" title="拖动调整大小"></div>`;
                el.innerHTML = html;
                this.canvasContent.appendChild(el);
                this.setupNodeEvents(el, node);
            },

            fmtNumber(w) {
                const v = Number(w.value) || 0;
                if (w.step && w.step < 1) return v.toFixed(1);
                return String(Math.round(v));
            },

            widgetHTML(w, i) {
                if (w.type === 'combo') {
                    return `<div class="widget w-combo" data-widget="${i}">
                        <span class="w-arrow" data-dir="-1">◂</span>
                        <span class="w-name">${esc(w.label)}</span>
                        <span class="w-val">${esc(w.value)}</span>
                        <span class="w-arrow" data-dir="1">▸</span>
                    </div>`;
                }
                if (w.type === 'number') {
                    return `<div class="widget w-number" data-widget="${i}">
                        <span class="w-arrow" data-dir="-1">◂</span>
                        <span class="w-name">${esc(w.label)}</span>
                        <span class="w-val">${esc(this.fmtNumber(w))}</span>
                        <span class="w-arrow" data-dir="1">▸</span>
                    </div>`;
                }
                if (w.type === 'string') {
                    return `<div class="widget w-string" data-widget="${i}">
                        <span class="w-name">${esc(w.label)}</span>
                        <span class="w-val">${esc(w.value)}</span>
                    </div>`;
                }
                if (w.type === 'text') {
                    return `<textarea class="widget-text" data-widget="${i}" rows="4" placeholder="文本提示词" spellcheck="false">${esc(w.value)}</textarea>`;
                }
                if (w.type === 'image') {
                    return `<div class="widget w-combo w-image-name" data-widget="${i}">
                            <span class="w-name">image</span>
                            <span class="w-val">${esc(w.filename || '未选择')}</span>
                        </div>
                        <div class="widget w-btn w-upload" data-widget="${i}">选择文件上传</div>
                        <div class="image-preview" data-widget="${i}">${
                            w.value && w.value.startsWith('data:')
                                ? `<img src="${w.value}" alt="">`
                                : `<div class="image-placeholder">暂无图像</div>`
                        }</div>
                        <input type="file" class="image-upload-input" data-widget="${i}" accept="image/*" style="display:none;">`;
                }
                return '';
            },

            // ===================== 节点交互 =====================
            setupNodeEvents(el, node) {
                // 选中 + 拖动（从头部或空白区域拖动，控件区域除外）
                el.addEventListener('mousedown', (e) => {
                    if (e.button !== 0) return;
                    this.selectNode(node);
                    // 提到最上层（用 z-index，避免重插 DOM 打断子元素的 click 事件）
                    el.style.zIndex = ++this._zTop;

                    if (e.target.closest('.node-slot, .node-resize, .widget, .widget-text, .image-preview, input, textarea')) return;

                    e.preventDefault();
                    e.stopPropagation();

                    const start = this.toWorld(e.clientX, e.clientY);
                    const offX = start.x - node.x;
                    const offY = start.y - node.y;
                    let moved = false;

                    const onMove = (ev) => {
                        const p = this.toWorld(ev.clientX, ev.clientY);
                        node.x = p.x - offX;
                        node.y = p.y - offY;
                        el.style.left = node.x + 'px';
                        el.style.top = node.y + 'px';
                        moved = true;
                        this.renderConnections();
                    };
                    const onUp = () => {
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                        if (moved) this.commit();
                    };
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                });

                // 右下角拖拽调整大小
                const resizeHandle = el.querySelector('.node-resize');
                resizeHandle.addEventListener('mousedown', (e) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    e.stopPropagation();
                    this.selectNode(node);

                    const start = this.toWorld(e.clientX, e.clientY);
                    const startW = el.offsetWidth;
                    const startH = el.offsetHeight;
                    // 最小尺寸 = 内容自然尺寸（不能缩到内容被裁掉）
                    const prevW = el.style.width, prevH = el.style.height;
                    el.style.width = '';
                    el.style.height = '';
                    const minW = Math.max(140, el.offsetWidth);
                    const minH = Math.max(60, el.offsetHeight);
                    el.style.width = prevW;
                    el.style.height = prevH;
                    let resized = false;

                    const onMove = (ev) => {
                        const p = this.toWorld(ev.clientX, ev.clientY);
                        node.w = Math.max(minW, Math.round(startW + (p.x - start.x)));
                        node.h = Math.max(minH, Math.round(startH + (p.y - start.y)));
                        el.style.width = node.w + 'px';
                        el.style.height = node.h + 'px';
                        resized = true;
                        this.renderConnections();
                    };
                    const onUp = () => {
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                        if (resized) this.commit();
                    };
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                });

                // 端口连线
                el.querySelectorAll('.node-slot').forEach(slot => {
                    slot.addEventListener('mousedown', (e) => {
                        if (e.button !== 0) return; // 中键交给画布平移
                        e.stopPropagation();
                        e.preventDefault();
                        const nodeId = parseInt(slot.dataset.node);
                        const kind = slot.dataset.kind;
                        const idx = parseInt(slot.dataset.idx);
                        const dtype = slot.dataset.dtype;

                        if (kind === 'output') {
                            this.linking = { nodeId, idx, dtype, detached: false };
                        } else {
                            // 从已连接的输入端拖动 = 断开并接管这根线（真实 ComfyUI 行为）
                            const existing = this.connections.find(c => c.toNode === nodeId && c.toSlot === idx);
                            if (existing) {
                                this.connections = this.connections.filter(c => c !== existing);
                                this.linking = { nodeId: existing.fromNode, idx: existing.fromSlot, dtype: existing.type, detached: true };
                                this.updateSlotStates();
                                this.renderConnections();
                            }
                        }
                        this.linkMouse = this.toWorld(e.clientX, e.clientY);
                    });

                    slot.addEventListener('mouseup', (e) => {
                        if (!this.linking) return;
                        e.stopPropagation();
                        e.preventDefault();

                        const nodeId = parseInt(slot.dataset.node);
                        const kind = slot.dataset.kind;
                        const idx = parseInt(slot.dataset.idx);
                        const dtype = slot.dataset.dtype;

                        if (kind === 'input' && nodeId !== this.linking.nodeId &&
                            this.canConnect(this.linking.dtype, dtype)) {
                            // 输入端只允许一根线
                            this.connections = this.connections.filter(c => !(c.toNode === nodeId && c.toSlot === idx));
                            this.connections.push({
                                fromNode: this.linking.nodeId,
                                fromSlot: this.linking.idx,
                                toNode: nodeId,
                                toSlot: idx,
                                type: this.linking.dtype
                            });
                            this.linking = null;
                            this.linkMouse = null;
                            this.updateSlotStates();
                            this.renderConnections();
                            this.commit();
                        }
                    });
                });

                this.bindWidgets(el, node);
                this.updateSlotStates();
            },

            canConnect(from, to) {
                return from === '*' || to === '*' || from === to;
            },

            // ===================== 控件交互 =====================
            bindWidgets(el, node) {
                // combo：左右箭头切换 + 点击弹出选项
                el.querySelectorAll('.w-combo:not(.w-image-name)').forEach(wEl => {
                    const idx = parseInt(wEl.dataset.widget);
                    const w = node.widgets[idx];
                    if (!w || !w.options) return;
                    const valEl = wEl.querySelector('.w-val');

                    wEl.querySelectorAll('.w-arrow').forEach(a => {
                        a.addEventListener('mousedown', e => { if (e.button === 0) e.stopPropagation(); });
                        a.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const dir = parseInt(a.dataset.dir);
                            let ci = w.options.indexOf(w.value) + dir;
                            if (ci < 0) ci = w.options.length - 1;
                            if (ci >= w.options.length) ci = 0;
                            w.value = w.options[ci];
                            valEl.textContent = w.value;
                            this.commit();
                        });
                    });

                    wEl.addEventListener('click', (e) => {
                        if (e.target.classList.contains('w-arrow')) return;
                        e.stopPropagation();
                        this.openComboMenu(wEl, w.options, w.value, (v) => {
                            w.value = v;
                            valEl.textContent = v;
                            this.commit();
                        });
                    });
                });

                // number：箭头增减 + 点击输入
                el.querySelectorAll('.w-number').forEach(wEl => {
                    const idx = parseInt(wEl.dataset.widget);
                    const w = node.widgets[idx];
                    if (!w) return;
                    const valEl = wEl.querySelector('.w-val');
                    const step = w.step || 1;

                    wEl.querySelectorAll('.w-arrow').forEach(a => {
                        a.addEventListener('mousedown', e => { if (e.button === 0) e.stopPropagation(); });
                        a.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const dir = parseInt(a.dataset.dir);
                            w.value = this.normalizeNumber(node.type, w, Number(w.value) + dir * step);
                            if (step < 1) w.value = Number(w.value.toFixed(4));
                            valEl.textContent = this.fmtNumber(w);
                            this.commit();
                        });
                    });

                    wEl.addEventListener('click', (e) => {
                        if (e.target.classList.contains('w-arrow') || valEl.querySelector('input')) return;
                        e.stopPropagation();
                        this.inlineEdit(valEl, String(w.value), (v) => {
                            const num = parseFloat(v);
                            w.value = this.normalizeNumber(node.type, w, num);
                            valEl.textContent = this.fmtNumber(w);
                            this.commit();
                        });
                    });
                });

                // string：点击输入
                el.querySelectorAll('.w-string').forEach(wEl => {
                    const idx = parseInt(wEl.dataset.widget);
                    const w = node.widgets[idx];
                    if (!w) return;
                    const valEl = wEl.querySelector('.w-val');
                    wEl.addEventListener('click', (e) => {
                        if (valEl.querySelector('input')) return;
                        e.stopPropagation();
                        this.inlineEdit(valEl, w.value, (v) => {
                            w.value = v;
                            valEl.textContent = v;
                            this.commit();
                        });
                    });
                });

                // 多行文本：实时存值，失焦记录历史
                el.querySelectorAll('.widget-text').forEach(ta => {
                    const idx = parseInt(ta.dataset.widget);
                    const w = node.widgets[idx];
                    if (!w) return;
                    ta.addEventListener('mousedown', e => { if (e.button === 0) e.stopPropagation(); });
                    ta.addEventListener('input', () => { w.value = ta.value; this.scheduleSave(); });
                    ta.addEventListener('change', () => this.commit());
                });

                // 图片上传
                const fileInput = el.querySelector('.image-upload-input');
                if (fileInput) {
                    const idx = parseInt(fileInput.dataset.widget);
                    const w = node.widgets[idx];
                    const preview = el.querySelector('.image-preview');
                    const nameVal = el.querySelector('.w-image-name .w-val');
                    const trigger = () => fileInput.click();

                    el.querySelector('.w-upload').addEventListener('click', (e) => { e.stopPropagation(); trigger(); });
                    preview.addEventListener('click', (e) => { e.stopPropagation(); trigger(); });

                    fileInput.addEventListener('change', async (e) => {
                        const file = e.target.files[0];
                        if (!file || this.isRunning) return;
                        try {
                            const image = await this.readImage(file);
                            if (!this.nodes.includes(node)) return;
                            w.value = image;
                            w.filename = file.name;
                            preview.innerHTML = `<img src="${image}" alt="">`;
                            preview.querySelector('img').onload = () => this.renderConnections();
                            if (nameVal) nameVal.textContent = file.name;
                            this.commit();
                        } catch (error) { this.toast(error.message); }
                        fileInput.value = '';
                    });
                }
            },

            inlineEdit(valEl, current, onCommit) {
                const old = current;
                valEl.innerHTML = `<input type="text" value="${esc(current)}" spellcheck="false">`;
                const input = valEl.querySelector('input');
                input.focus();
                input.select();
                input.addEventListener('mousedown', e => { if (e.button === 0) e.stopPropagation(); });
                input.addEventListener('click', e => e.stopPropagation());

                let done = false;
                const finish = (commit) => {
                    if (done) return;
                    done = true;
                    const v = input.value;
                    if (commit) onCommit(v);
                    else valEl.textContent = old;
                };
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') { finish(true); }
                    if (e.key === 'Escape') { finish(false); }
                    e.stopPropagation();
                });
                input.addEventListener('blur', () => finish(true));
            },

            openComboMenu(anchorEl, options, current, onPick) {
                const menu = document.getElementById('combo-menu');
                menu.innerHTML = options.map(o =>
                    `<div class="combo-item ${o === current ? 'current' : ''}">${esc(o)}</div>`).join('');
                menu.classList.add('active');

                const rect = anchorEl.getBoundingClientRect();
                menu.style.left = Math.min(rect.left, window.innerWidth - menu.offsetWidth - 12) + 'px';
                menu.style.top = Math.min(rect.bottom + 3, window.innerHeight - menu.offsetHeight - 12) + 'px';

                menu.querySelectorAll('.combo-item').forEach((item, i) => {
                    item.addEventListener('click', () => {
                        onPick(options[i]);
                        this.closeComboMenu();
                    });
                });
            },

            closeComboMenu() {
                document.getElementById('combo-menu').classList.remove('active');
            },

            // ===================== 连线渲染 =====================
            // 端口的世界坐标（相对画布内容层，SVG 与节点同层变换，缩放平移时连线永不偏移）
            getSlotWorldPos(nodeId, idx, kind) {
                const el = this.nodeEl(nodeId);
                if (!el) return null;
                const slot = el.querySelector(`.node-slot[data-kind="${kind}"][data-idx="${idx}"]`);
                if (!slot) return null;
                const r = slot.getBoundingClientRect();
                const c = this.canvasContent.getBoundingClientRect();
                const s = this.transform.scale;
                return {
                    x: (r.left + r.width / 2 - c.left) / s,
                    y: (r.top + r.height / 2 - c.top) / s
                };
            },

            renderConnections() {
                let paths = '';

                this.connections.forEach(conn => {
                    const from = this.getSlotWorldPos(conn.fromNode, conn.fromSlot, 'output');
                    const to = this.getSlotWorldPos(conn.toNode, conn.toSlot, 'input');
                    if (from && to) {
                        paths += this.makePath(from.x, from.y, to.x, to.y, TYPE_COLORS[conn.type] || '#888', false);
                    }
                });

                if (this.linking && this.linkMouse) {
                    const from = this.getSlotWorldPos(this.linking.nodeId, this.linking.idx, 'output');
                    if (from) {
                        paths += this.makePath(from.x, from.y, this.linkMouse.x, this.linkMouse.y,
                            TYPE_COLORS[this.linking.dtype] || '#999', true);
                    }
                }

                this.svg.innerHTML = paths;
            },

            makePath(x1, y1, x2, y2, color, isTemp) {
                const dist = Math.abs(x2 - x1);
                const offset = Math.max(40, Math.min(dist * 0.5, 120));
                const d = `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`;
                return `<path d="${d}" class="connection${isTemp ? ' temp' : ''}" stroke="${color}"/>`;
            },

            updateSlotStates() {
                this.canvasContent.querySelectorAll('.node-slot').forEach(s => s.classList.remove('connected'));
                this.connections.forEach(c => {
                    const fromEl = this.nodeEl(c.fromNode);
                    const toEl = this.nodeEl(c.toNode);
                    if (fromEl) {
                        const s = fromEl.querySelector(`.node-slot[data-kind="output"][data-idx="${c.fromSlot}"]`);
                        if (s) s.classList.add('connected');
                    }
                    if (toEl) {
                        const s = toEl.querySelector(`.node-slot[data-kind="input"][data-idx="${c.toSlot}"]`);
                        if (s) s.classList.add('connected');
                    }
                });
            },

            // ===================== 历史记录 =====================
            snapshot() {
                return {
                    nodes: JSON.parse(JSON.stringify(this.nodes)),
                    connections: JSON.parse(JSON.stringify(this.connections)),
                    nextId: this.nextId
                };
            },

            commit() {
                // 丢弃重做分支
                if (this.historyIndex < this.history.length - 1) {
                    this.history = this.history.slice(0, this.historyIndex + 1);
                }
                this.history.push(this.snapshot());
                if (this.history.length > this.maxHistory) this.history.shift();
                this.historyIndex = this.history.length - 1;
                this.updateHistoryButtons();
            },

            undo() {
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.restoreState(this.history[this.historyIndex]);
                }
                this.updateHistoryButtons();
            },

            redo() {
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.restoreState(this.history[this.historyIndex]);
                }
                this.updateHistoryButtons();
            },

            updateHistoryButtons() {
                document.getElementById('btn-undo').classList.toggle('disabled', this.historyIndex <= 0);
                document.getElementById('btn-redo').classList.toggle('disabled', this.historyIndex >= this.history.length - 1);
            },

            restoreState(state) {
                this.nodes = JSON.parse(JSON.stringify(state.nodes));
                this.connections = JSON.parse(JSON.stringify(state.connections));
                this.nextId = state.nextId;
                this.selectedNode = null;

                this.canvasContent.querySelectorAll('.comfy-node').forEach(el => el.remove());
                this.nodes.forEach(n => this.renderNode(n));
                this.updateSlotStates();
                this.renderConnections();
            },

            // ===================== 模拟执行 =====================
            // 各类节点的真实耗时特征（毫秒区间）
            nodeDuration(node) {
                const T = {
                    // 加载器：模型读盘，首次较慢
                    'UNETLoader':            [700, 1300],
                    'CLIPLoader':            [450, 900],
                    'VAELoader':             [200, 450],
                    // 轻量节点：几乎瞬时
                    'LoadImage':             [40, 100],
                    'GetImageSize+':         [20, 50],
                    'KSamplerSelect':        [15, 40],
                    'RandomNoise':           [15, 40],
                    'Flux2Scheduler':        [30, 70],
                    'EmptyFlux2LatentImage': [20, 60],
                    'EmptyImage':            [20, 60],
                    'ReferenceLatent':       [30, 70],
                    'CFGGuider':             [30, 80],
                    'Anything Everywhere':   [15, 35],
                    // 编解码/缩放：中等
                    'CLIPTextEncode':        [180, 380],
                    'VAEEncode':             [220, 450],
                    'VAEDecode':             [300, 600],
                    'Sage_CubiqImageResize': [80, 180],
                    'SaveImage':             [100, 220],
                    // 采样器：大头，真正"生成"的时间
                    'SamplerCustomAdvanced': [1600, 2600]
                };
                const [lo, hi] = T[node.type] || [100, 260];
                return lo + Math.random() * (hi - lo);
            },

            // 重型节点独占执行（加载器/采样/编解码），轻量节点可以搭伙并行
            isHeavyNode(type) {
                return ['UNETLoader', 'CLIPLoader', 'SamplerCustomAdvanced',
                        'VAEDecode', 'VAEEncode', 'CLIPTextEncode'].includes(type);
            },

            // ===================== 生成历史（演示暗门） =====================
            setupGenHistory() {
                const upload = document.getElementById('gh-upload');
                const fileInput = document.getElementById('gh-file-input');

                upload.addEventListener('click', () => fileInput.click());

                upload.addEventListener('dragover', (e) => { e.preventDefault(); upload.classList.add('dragover'); });
                upload.addEventListener('dragleave', () => upload.classList.remove('dragover'));
                upload.addEventListener('drop', (e) => {
                    e.preventDefault();
                    upload.classList.remove('dragover');
                    this.addGenFiles(e.dataTransfer.files);
                });

                fileInput.addEventListener('change', (e) => {
                    this.addGenFiles(e.target.files);
                    fileInput.value = '';
                });

                // 快捷键 Ctrl+Shift+H 也可打开面板（顶栏隐形按钮在设置图标右侧）
                document.addEventListener('keydown', (e) => {
                    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') {
                        e.preventDefault();
                        this.toggleGenHistory();
                    }
                });

                this.renderGenList();
            },

            renderGenList() {
                const listEl = document.getElementById('gh-list');
                listEl.innerHTML = this.genImages.map((src, i) => {
                    const used = i < this.genCursor;
                    const next = i === this.genCursor;
                    return `<div class="gh-item ${used ? 'used' : ''} ${next ? 'next' : ''}">
                        <img src="${src}" alt="">
                        <div class="gh-info">
                            <div class="gh-idx">第 ${i + 1} 次生成</div>
                            <div class="gh-tag">${used ? '已展示' : next ? '▸ 下一次执行展示' : '等待中'}</div>
                        </div>
                        <span class="gh-del" data-idx="${i}">×</span>
                    </div>`;
                }).join('');

                listEl.querySelectorAll('.gh-del').forEach(del => {
                    del.addEventListener('click', () => {
                        if (this.isRunning) return;
                        const i = parseInt(del.dataset.idx);
                        this.genImages.splice(i, 1);
                        if (this.genCursor > i) this.genCursor--;
                        this.renderGenList();
                        this.commit();
                    });
                });

                document.getElementById('gh-status').textContent =
                    `已生成 ${Math.min(this.genCursor, this.genImages.length)} / ${this.genImages.length}`;

                const backBtn = document.getElementById('gh-back');
                backBtn.style.opacity = this.genCursor > 0 ? '1' : '0.4';
                backBtn.style.pointerEvents = this.genCursor > 0 ? 'auto' : 'none';
            },

            toggleGenHistory() {
                const panel = document.getElementById('gen-history-panel');
                panel.classList.toggle('active');
                document.getElementById('gen-history-toggle').classList.toggle('active', panel.classList.contains('active'));
            },

            // ===================== 节点库 =====================
            setupNodeLib() {
                this.renderNodeLib('');
                document.getElementById('nl-search').addEventListener('input', (e) => {
                    this.renderNodeLib(e.target.value);
                });

                // 支持从节点库拖拽到画布
                this.canvasArea.addEventListener('dragover', (e) => e.preventDefault());
                this.canvasArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const type = e.dataTransfer.getData('node-type');
                    if (type && NODES[type]) {
                        const p = this.toWorld(e.clientX, e.clientY);
                        this.addNode(type, p.x, p.y);
                    }
                });
            },

            renderNodeLib(filter) {
                const listEl = document.getElementById('nl-list');
                const f = (filter || '').toLowerCase();
                let html = '';

                Object.keys(CATEGORIES).forEach(cat => {
                    const list = Object.entries(NODES)
                        .filter(([type, def]) => def.category === cat)
                        .filter(([type, def]) => !f ||
                            def.title.toLowerCase().includes(f) || type.toLowerCase().includes(f));
                    if (!list.length) return;
                    html += `<div class="category-title">${CATEGORIES[cat]}</div>`;
                    list.forEach(([type, def]) => {
                        html += `<div class="nl-item" draggable="true" data-type="${esc(type)}" title="点击添加到画布中央，或拖拽到指定位置">
                            <span>${esc(def.title)}</span><span class="r-type">${esc(type)}</span></div>`;
                    });
                });

                listEl.innerHTML = html || '<div style="padding:16px;color:#666;font-size:12px;text-align:center;">未找到节点</div>';

                listEl.querySelectorAll('.nl-item').forEach(item => {
                    item.addEventListener('click', () => {
                        // 添加到当前视图中央
                        const rect = this.canvas.getBoundingClientRect();
                        const p = this.toWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
                        this.addNode(item.dataset.type, p.x - 100, p.y - 60);
                    });
                    item.addEventListener('dragstart', (e) => {
                        if (this.isRunning) { e.preventDefault(); return; }
                        e.dataTransfer.setData('node-type', item.dataset.type);
                    });
                });
            },

            toggleNodeLib() {
                const panel = document.getElementById('node-lib-panel');
                panel.classList.toggle('active');
                document.getElementById('node-lib-toggle').classList.toggle('active', panel.classList.contains('active'));
            },

            // ===================== 预设工作流（F.2-Klein9b编辑3，按真实 JSON 还原） =====================
            loadPresetWorkflow() {
                // [ref, type, x, y, w, widgetOverrides]（坐标来自真实工作流 JSON）
                const P = [
                    [11, 'LoadImage',             -1174, -446, 320, {}],
                    [54, 'Sage_CubiqImageResize',  -607, -437, 378, { width: 640, height: 640, interpolation: 'nearest' }],
                    [13, 'VAEEncode',              -158, -477, 210, {}],
                    [22, 'CLIPTextEncode',         -185, -177, 347, { text: '保持车辆一致性，生成写实工业设计风格三视图（正视、侧视、45度）' }],
                    [44, 'CLIPLoader',             -169,   30, 297, { clip_name: 'qwen_3_8b_fp8mixed.safetensors', type: 'flux2' }],
                    [43, 'UNETLoader',              143, -548, 312, { unet_name: 'Flux-2-klein-9b-fp8_V1', weight_dtype: 'default' }],
                    [21, 'ReferenceLatent',         140, -367, 212, {}],
                    [41, 'EmptyImage',              176,   18, 300, { width: 512, height: 512, batch_size: 1, color: 0 }],
                    [40, 'RandomNoise',             504, -544, 268, { noise_seed: 347235219084478, control_after_generate: 'randomize' }],
                    [36, 'CFGGuider',               502, -416, 269, { cfg: 1.0 }],
                    [37, 'KSamplerSelect',          501, -261, 270, { sampler_name: 'euler_ancestral' }],
                    [42, 'GetImageSize+',           624,   39, 210, {}],
                    [38, 'Flux2Scheduler',          871, -160, 269, { steps: 4 }],
                    [39, 'EmptyFlux2LatentImage',   915,   37, 269, { batch_size: 1 }],
                    [35, 'SamplerCustomAdvanced',  1190, -495, 239, {}],
                    [15, 'VAELoader',              1444, -280, 307, { vae_name: 'flux2-vae.safetensors' }],
                    [51, 'Anything Everywhere',    1504, -376, 210, {}],
                    [34, 'VAEDecode',              1552, -479, 180, {}],
                    [29, 'SaveImage',              1790, -290, 300, { filename_prefix: 'ComfyUI' }]
                ];
                // [fromRef, fromSlot, toRef, toSlot, type]（来自真实 JSON links，已去重）
                const L = [
                    [11, 0, 54, 0, 'IMAGE'],
                    [54, 0, 13, 0, 'IMAGE'],
                    [13, 0, 21, 1, 'LATENT'],
                    [22, 0, 21, 0, 'CONDITIONING'],
                    [44, 0, 22, 0, 'CLIP'],
                    [43, 0, 36, 0, 'MODEL'],
                    [21, 0, 36, 1, 'CONDITIONING'],
                    [40, 0, 35, 0, 'NOISE'],
                    [36, 0, 35, 1, 'GUIDER'],
                    [37, 0, 35, 2, 'SAMPLER'],
                    [38, 0, 35, 3, 'SIGMAS'],
                    [39, 0, 35, 4, 'LATENT'],
                    [41, 0, 42, 0, 'IMAGE'],
                    [42, 0, 38, 0, 'INT'],
                    [42, 1, 38, 1, 'INT'],
                    [42, 0, 39, 0, 'INT'],
                    [42, 1, 39, 1, 'INT'],
                    [35, 0, 34, 0, 'LATENT'],
                    [15, 0, 34, 1, 'VAE'],
                    [15, 0, 13, 1, 'VAE'],
                    [15, 0, 51, 0, 'VAE'],
                    [34, 0, 29, 0, 'IMAGE']
                ];

                // 清空画布
                this.canvasContent.querySelectorAll('.comfy-node').forEach(el => el.remove());
                this.nodes = [];
                this.connections = [];
                this.selectedNode = null;

                // 坐标平移到正区域
                const OX = 1250, OY = 620;
                const refMap = {};
                P.forEach(([ref, type, x, y, w, overrides]) => {
                    const def = NODES[type];
                    if (!def) return;
                    const node = {
                        id: this.nextId++,
                        type,
                        x: x + OX, y: y + OY,
                        w: w || 0, h: 0,
                        inputs: def.inputs.map(i => ({ ...i })),
                        outputs: def.outputs.map(o => ({ ...o })),
                        widgets: def.widgets.map(wd => {
                            const nw = { ...wd };
                            if (overrides[nw.name] !== undefined) nw.value = overrides[nw.name];
                            return nw;
                        })
                    };
                    refMap[ref] = node.id;
                    this.nodes.push(node);
                    this.renderNode(node);
                });

                L.forEach(([fr, fs, tr, ts, type]) => {
                    if (refMap[fr] === undefined || refMap[tr] === undefined) return;
                    this.connections.push({
                        fromNode: refMap[fr], fromSlot: fs,
                        toNode: refMap[tr], toSlot: ts, type
                    });
                });

                this.updateSlotStates();
                this.renderConnections();
                this.fitView();
                this.commit();
                this.toggleNodeLib();
                this.toast('已加载工作流：F.2-Klein9b编辑3');
            },

            resetGenCursor() {
                this.genCursor = 0;
                // 清掉画布上已显示的结果
                this.nodes.forEach(n => { delete n.resultImage; });
                this.canvasContent.querySelectorAll('.save-result').forEach(b => b.remove());
                this.renderGenList();
                this.renderConnections();
                this.toast('生成进度已重置');
            },

            stepBackGenCursor() {
                if (this.genCursor <= 0) { this.toast('已经是第一步了'); return; }
                this.genCursor--;
                if (this.genCursor === 0) {
                    // 回到还未生成过的状态：清空结果图
                    this.nodes.forEach(n => { delete n.resultImage; });
                    this.canvasContent.querySelectorAll('.save-result').forEach(b => b.remove());
                    this.renderConnections();
                } else {
                    // 保存图像节点回显上一张
                    const prevImg = this.genImages[this.genCursor - 1];
                    this.nodes.filter(n => n.type === 'SaveImage' && n.resultImage)
                        .forEach(n => this.showResultOnNode(n, prevImg));
                }
                this.renderGenList();
                this.toast(`已回退，下一次执行展示第 ${this.genCursor + 1} 张`);
            },

            toast(msg) {
                const t = document.getElementById('toast');
                t.textContent = msg;
                t.classList.add('show');
                clearTimeout(this._toastTimer);
                this._toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
            }
        };

        
    